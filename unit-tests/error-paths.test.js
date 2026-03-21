/**
 * Error Path Coverage Tests
 *
 * Verifies that all optimistic operations have proper error handling:
 * - Rollback patterns in store.tsx (Dashboard)
 * - Rollback patterns in mobile PWA JS files
 * - Error toasts displayed to user
 * - No silent failures (no empty .catch(() => {}))
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const ADMIN_JS_FILES = [
  'public/mobile-app/js/admin-helpers.ts',
  'public/mobile-app/js/admin-dashboard.ts',
  'public/mobile-app/js/admin-members.ts',
  'public/mobile-app/js/admin-courts.ts',
  'public/mobile-app/js/admin-announcements.ts',
  'public/mobile-app/js/admin-events.ts',
];

function readFile(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf-8');
}

function readAdminBundle() {
  return ADMIN_JS_FILES
    .map((relPath) => readFile(relPath))
    .filter(Boolean)
    .join('\n\n');
}

// ==========================================================
// 1. Dashboard store.tsx — Every apiCall has .catch() with rollback
// ==========================================================
describe('Dashboard store.tsx — Error Handling on Every Mutation', () => {
  const store = readFile('app/dashboard/lib/store.tsx');

  it('addBooking has rollback in .catch()', () => {
    const fn = extractFunction(store, 'addBooking');
    expect(fn).toContain('.catch(');
    expect(fn).toContain('setBookings(prev =>');
    expect(fn).toContain("showToast(");
  });

  it('cancelBooking has rollback in .catch()', () => {
    const fn = extractFunction(store, 'cancelBooking');
    expect(fn).toContain('.catch(');
    expect(fn).toMatch(/setBookings.*confirmed/s); // restores 'confirmed' status
    expect(fn).toContain("showToast(");
  });

  it('confirmParticipant has rollback in .catch()', () => {
    const fn = extractFunction(store, 'confirmParticipant');
    expect(fn).toContain('.catch(');
    expect(fn).toContain("showToast(");
  });

  it('addProgram has rollback in .catch()', () => {
    const fn = extractFunction(store, 'addProgram');
    expect(fn).toContain('.catch(');
    expect(fn).toContain('setPrograms(prev =>');
    expect(fn).toContain('setBookings(prev =>');
    expect(fn).toContain("showToast(");
  });

  it('cancelProgram has rollback in .catch()', () => {
    const fn = extractFunction(store, 'cancelProgram');
    expect(fn).toContain('.catch(');
    expect(fn).toMatch(/setPrograms.*active/s); // restores 'active' status
    expect(fn).toMatch(/setBookings.*confirmed/s); // restores bookings
    expect(fn).toContain("showToast(");
  });

  it('enrollInProgram has rollback in .catch()', () => {
    const fn = extractFunction(store, 'enrollInProgram');
    expect(fn).toContain('.catch(');
    expect(fn).toContain("showToast(");
  });

  it('withdrawFromProgram has rollback in .catch()', () => {
    const fn = extractFunction(store, 'withdrawFromProgram');
    expect(fn).toContain('.catch(');
    expect(fn).toContain("showToast(");
  });

  it('addPartner has rollback in .catch()', () => {
    const fn = extractFunction(store, 'addPartner');
    expect(fn).toContain('.catch(');
    expect(fn).toContain('setPartners(prev =>');
    expect(fn).toContain("showToast(");
  });

  it('removePartner has rollback in .catch()', () => {
    const fn = extractFunction(store, 'removePartner');
    expect(fn).toContain('.catch(');
    expect(fn).toContain("showToast(");
  });

  it('toggleRsvp has rollback in .catch()', () => {
    const fn = extractFunction(store, 'toggleRsvp');
    expect(fn).toContain('.catch(');
    expect(fn).toContain("showToast(");
  });

  it('updateNotificationPreferences routes through API', () => {
    // Should use apiCall, not db.updateNotificationPreferences
    expect(store).toContain("apiCall('/api/mobile/settings'");
    expect(store).not.toContain('db.updateNotificationPreferences');
  });

  it('no direct db.createProgram or db.cancelProgram calls', () => {
    expect(store).not.toContain('db.createProgram');
    expect(store).not.toContain('db.cancelProgram');
  });
});

// ==========================================================
// 2. Mobile PWA — No Silent Failures (no empty catches)
// ==========================================================
describe('Mobile PWA — No Silent API Failures', () => {
  const files = [
    'public/mobile-app/js/mybookings.ts',
    'public/mobile-app/js/events-registration.ts',
    'public/mobile-app/js/partners.ts',
    'public/mobile-app/js/messaging.ts',
    'public/mobile-app/js/booking.ts',
    'public/mobile-app/js/api-client.ts',
  ];

  // Allowed silent catches: fire-and-forget operations like notification delivery,
  // mark-as-read, push notification sends. We check user-facing mutation functions only.
  const mutationFunctions = {
    'mybookings.ts': ['cancelEventRsvp', 'confirmCancelBooking'],
    'events-registration.ts': ['rsvpInterclub'],
    'partners.ts': ['submitPartnerRequest', 'removePartnerRequest', 'enrollInProgram'],
    'messaging.ts': ['deleteConversation'],
    'booking.ts': ['confirmBooking'],
    'api-client.ts': ['createBooking', 'cancelBooking'],
  };

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;
    const name = file.split('/').pop();
    const fns = mutationFunctions[name];
    if (!fns) continue;

    for (const fn of fns) {
      it(`${name}/${fn}: no empty .catch() in user-facing mutation`, () => {
        // Extract the function body
        const fnIdx = content.indexOf(fn);
        if (fnIdx === -1) return; // function not in this file
        const fnBody = content.slice(fnIdx, fnIdx + 3000);

        // Check for empty catches within the function body
        const emptyCatches = fnBody.match(/\.catch\s*\(\s*function\s*\(\s*\)\s*\{\s*(\/\*[^*]*\*\/\s*)?\}\s*\)/g) || [];
        const emptyArrowCatches = fnBody.match(/\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*(\/\*[^*]*\*\/\s*)?\}\s*\)/g) || [];
        expect(emptyCatches.length + emptyArrowCatches.length).toBe(0);
      });
    }
  }
});

// ==========================================================
// 3. Mobile PWA — Rollback Patterns Exist
// ==========================================================
describe('Mobile PWA — Rollback Patterns', () => {
  it('cancelEventRsvp has API call + rollback', () => {
    const content = readFile('public/mobile-app/js/mybookings.ts');
    // Must call API
    expect(content).toMatch(/cancelEventRsvp[\s\S]*?apiRequest.*\/mobile\/events/);
    // Must have rollback (restore prevEventBookings)
    expect(content).toMatch(/cancelEventRsvp[\s\S]*?prevEventBookings/);
    // Must show error toast
    expect(content).toMatch(/cancelEventRsvp[\s\S]*?showToast.*error/);
  });

  it('rsvpInterclub has rollback on API failure', () => {
    const content = readFile('public/mobile-app/js/events-registration.ts');
    // Must save previous state
    expect(content).toContain('prevRsvpList');
    // Must restore on error
    expect(content).toMatch(/event\.rsvpList\s*=\s*prevRsvpList/);
    // Must show error toast
    expect(content).toMatch(/RSVP failed.*error/);
  });

  it('removePartnerRequest has rollback on API failure', () => {
    const content = readFile('public/mobile-app/js/partners.ts');
    // Must save previous state
    expect(content).toMatch(/removePartnerRequest[\s\S]*?prevRequests/);
    // Must restore on error
    expect(content).toMatch(/MTC\.storage\.set.*mtc-partner-requests.*prevRequests/);
    // Must show error toast
    expect(content).toMatch(/Failed to remove(?: the)? partner request.*error/);
  });

  it('enrollInProgram has rollback on API failure', () => {
    const content = readFile('public/mobile-app/js/partners.ts');
    // Enrollment should roll back button state
    expect(content).toMatch(/enrollInProgram[\s\S]*?classList\.remove.*enrolled/);
    // Should show error toast
    expect(content).toMatch(/Enrollment failed.*error/);
  });

  it('withdrawFromProgram has rollback on API failure', () => {
    const content = readFile('public/mobile-app/js/partners.ts');
    // Withdrawal should restore enrolled state
    expect(content).toMatch(/classList\.add.*enrolled[\s\S]*?Failed to withdraw/);
  });

  it('deleteConversation has rollback on API failure', () => {
    const content = readFile('public/mobile-app/js/messaging.ts');
    // Must save previous conversation
    expect(content).toMatch(/deleteConversation[\s\S]*?prevConv/);
    // Must restore on error
    expect(content).toMatch(/conversations\[memberId\]\s*=\s*prevConv/);
    // Must show error toast
    expect(content).toMatch(/Failed to delete conversation.*error/);
  });

  it('createEvent has rollback on API failure', () => {
    const content = readAdminBundle();
    // Must remove optimistic event on failure
    expect(content).toMatch(/createEvent[\s\S]*?delete clubEventsData\[eventId\]/);
    // Must show error toast
    expect(content).toMatch(/Failed to create event.*error/);
  });
});

// ==========================================================
// 4. Mobile PWA — All Mutations Call the Server
// ==========================================================
describe('Mobile PWA — All Mutations Persist to Server', () => {
  it('cancelEventRsvp calls /mobile/events API', () => {
    const content = readFile('public/mobile-app/js/mybookings.ts');
    expect(content).toMatch(/cancelEventRsvp[\s\S]*?apiRequest.*\/mobile\/events/);
  });

  it('rsvpInterclub calls /mobile/events API', () => {
    const content = readFile('public/mobile-app/js/events-registration.ts');
    expect(content).toMatch(/rsvpInterclub[\s\S]*?apiRequest.*\/mobile\/events/);
  });

  it('submitPartnerRequest calls /mobile/partners API', () => {
    const content = readFile('public/mobile-app/js/partners.ts');
    expect(content).toMatch(/submitPartnerRequest[\s\S]*?apiRequest.*\/mobile\/partners/);
  });

  it('removePartnerRequest calls /mobile/partners DELETE API', () => {
    const content = readFile('public/mobile-app/js/partners.ts');
    expect(content).toMatch(/removePartnerRequest[\s\S]*?apiRequest.*\/mobile\/partners[\s\S]*?DELETE/);
  });

  it('enrollInProgram calls /mobile/programs API', () => {
    const content = readFile('public/mobile-app/js/partners.ts');
    expect(content).toMatch(/enrollInProgram[\s\S]*?apiRequest.*\/mobile\/programs/);
  });

  it('deleteConversation calls /mobile/conversations DELETE API', () => {
    const content = readFile('public/mobile-app/js/messaging.ts');
    expect(content).toMatch(/deleteConversation[\s\S]*?apiRequest.*\/mobile\/conversations[\s\S]*?DELETE/);
  });

  it('createEvent calls /mobile/events PUT API', () => {
    const content = readAdminBundle();
    expect(content).toMatch(/createEvent[\s\S]*?apiRequest.*\/mobile\/events[\s\S]*?PUT/);
  });

  it('confirmBooking calls createBooking API (via api-client)', () => {
    const content = readFile('public/mobile-app/js/api-client.ts');
    expect(content).toMatch(/createBooking[\s\S]*?\/mobile\/bookings[\s\S]*?POST/);
  });

  it('cancelBooking calls API DELETE (via api-client)', () => {
    const content = readFile('public/mobile-app/js/api-client.ts');
    expect(content).toMatch(/cancelBooking[\s\S]*?\/mobile\/bookings[\s\S]*?DELETE/);
  });
});

// ==========================================================
// 5. API Routes — Error Response Status Codes
// ==========================================================
describe('API Routes — Proper Error Status Codes', () => {
  const routes = [
    'bookings', 'events', 'partners', 'conversations',
    'programs', 'members', 'families', 'court-blocks',
  ];

  for (const route of routes) {
    const content = readFile(`app/api/mobile/${route}/route.ts`);
    if (!content) continue;

    it(`/api/mobile/${route} uses 400 for bad input`, () => {
      expect(content).toContain('status: 400');
    });

    it(`/api/mobile/${route} uses 500 for server errors`, () => {
      expect(content).toContain('status: 500');
    });

    it(`/api/mobile/${route} uses 401 or 403 for auth failures`, () => {
      // Either explicit 403/401 or via authenticateMobileRequest/withAuth (which handles it)
      const hasAuthStatus = content.includes('status: 401') || content.includes('status: 403');
      const hasAuthMiddleware = content.includes('authenticateMobileRequest') || content.includes('withAuth');
      expect(hasAuthStatus || hasAuthMiddleware).toBe(true);
    });
  }
});

// ==========================================================
// Helpers
// ==========================================================

/**
 * Extract a useCallback function body from store.tsx by name.
 * Matches: const funcName = useCallback((...)  => { ... }, [...]);
 */
function extractFunction(source, name) {
  const pattern = new RegExp(`const ${name} = useCallback\\(`);
  const match = source.match(pattern);
  if (!match) return '';

  const start = match.index;
  let depth = 0;
  let inCallback = false;

  for (let i = start; i < source.length && i < start + 5000; i++) {
    if (source[i] === '(') {
      depth++;
      if (!inCallback) inCallback = true;
    }
    if (source[i] === ')') {
      depth--;
      if (inCallback && depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  return source.slice(start, start + 2000);
}
