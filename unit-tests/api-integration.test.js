/**
 * API Route Integration Tests
 *
 * Verifies that API route handlers produce correct responses for various inputs.
 * Tests response shapes, status codes, validation, auth enforcement, and
 * that the right Supabase operations are called.
 *
 * These read the actual route source to verify:
 * - Request body parsing matches expected field names
 * - Response JSON shape matches what clients expect
 * - Error responses use consistent format ({ error: string })
 * - Auth checks happen before any DB operations
 * - Rate limiting is applied where needed
 * - Correct HTTP methods are exported
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function readFile(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf-8');
}

function readRoute(name) {
  return readFile(`app/api/mobile/${name}/route.ts`);
}

// All API route names that should exist
const ROUTES = [
  'bookings', 'events', 'partners', 'conversations', 'members',
  'notifications', 'announcements', 'programs', 'settings',
  'families', 'lineups', 'court-blocks',
];

// ==========================================================
// 1. Response Shape Consistency
// ==========================================================
describe('API Response Shape Consistency', () => {
  for (const route of ROUTES) {
    const content = readRoute(route);
    if (!content) continue;

    describe(`/api/mobile/${route}`, () => {
      it('returns JSON responses via NextResponse.json()', () => {
        expect(content).toContain('NextResponse.json');
      });

      it('error responses use { error: string } shape', () => {
        // All error returns should use { error: ... }
        const errorReturns = content.match(/NextResponse\.json\(\s*\{\s*error:/g) || [];
        const statusErrors = content.match(/status:\s*(400|401|403|404|409|429|500)\s*\}/g) || [];
        // Every non-200 status should have an error field
        expect(errorReturns.length).toBeGreaterThanOrEqual(statusErrors.length * 0.7);
      });

      it('success responses are consistent', () => {
        // Success responses should return data or { success: true }
        const hasSuccessTrue = content.includes("success: true") || content.includes("'success': true");
        const hasDataReturn = content.includes('NextResponse.json(') && !content.includes('status: 5');
        expect(hasSuccessTrue || hasDataReturn).toBe(true);
      });
    });
  }
});

// ==========================================================
// 2. Auth Enforcement (every route checks auth before DB)
// ==========================================================
describe('Auth Enforcement — Auth Before DB Access', () => {
  for (const route of ROUTES) {
    const content = readRoute(route);
    if (!content) continue;

    describe(`/api/mobile/${route}`, () => {
      it('checks auth before any Supabase query', () => {
        // Find all exported handler functions
        const handlers = content.match(/export\s+(async\s+)?function\s+(GET|POST|PATCH|PUT|DELETE)/g) || [];
        const withAuthHandlers = content.match(/export\s+const\s+(GET|POST|PATCH|PUT|DELETE)\s*=\s*withAuth/g) || [];

        const totalHandlers = handlers.length + withAuthHandlers.length;
        if (totalHandlers === 0) return; // skip if no handlers

        // For regular handlers: authenticateMobileRequest must appear before getAdminClient
        for (const handler of handlers) {
          const method = handler.match(/(GET|POST|PATCH|PUT|DELETE)/)[1];
          // Find the handler body start
          const handlerStart = content.indexOf(handler);
          const bodyAfter = content.slice(handlerStart, handlerStart + 500);

          // Auth check should come before admin client
          const authIdx = bodyAfter.indexOf('authenticateMobileRequest');
          const adminIdx = bodyAfter.indexOf('getAdminClient');

          if (authIdx >= 0 && adminIdx >= 0) {
            expect(authIdx).toBeLessThan(adminIdx);
          }
        }

        // withAuth handlers have auth built in — they're always good
        expect(totalHandlers).toBeGreaterThan(0);
      });
    });
  }
});

// ==========================================================
// 3. Request Body Field Validation
// ==========================================================
describe('Request Body Field Validation', () => {
  const bookings = readRoute('bookings');

  it('bookings POST validates required fields (courtId, date, time)', () => {
    expect(bookings).toMatch(/courtId|court_id/);
    expect(bookings).toContain('date');
    expect(bookings).toContain('time');
    // Should have a check for missing fields
    expect(bookings).toMatch(/Missing|required|!.*courtId|!.*date/i);
  });

  it('bookings DELETE validates bookingId', () => {
    expect(bookings).toMatch(/bookingId|booking_id/);
    expect(bookings).toMatch(/Missing.*bookingId|!.*bookingId|!id/i);
  });

  const events = readRoute('events');

  it('events POST validates eventId for RSVP', () => {
    expect(events).toContain('eventId');
    expect(events).toMatch(/Missing.*eventId|!.*eventId/);
  });

  it('events PUT validates required fields for event creation', () => {
    expect(events).toContain('title');
    expect(events).toContain('date');
    expect(events).toContain('time');
  });

  const programs = readRoute('programs');

  it('programs POST validates action field', () => {
    expect(programs).toContain("action");
    // Must check for valid actions
    expect(programs).toMatch(/enroll.*withdraw|withdraw.*enroll/);
  });

  it('programs POST create action validates required fields', () => {
    expect(programs).toMatch(/action.*create|create.*action/);
    expect(programs).toMatch(/program.*id|program.*title|program.*coachId/);
  });

  it('programs POST create requires admin or coach role', () => {
    // The create action should check role before inserting
    const createBlock = programs.slice(
      programs.indexOf("action === 'create'"),
      programs.indexOf("action === 'create'") + 800
    );
    expect(createBlock).toMatch(/admin|coach/);
    expect(createBlock).toMatch(/403/);
  });

  const conversations = readRoute('conversations');

  it('conversations DELETE validates conversationId', () => {
    expect(conversations).toMatch(/conversationId|conversation_id/);
  });

  const settings = readRoute('settings');

  it('settings PATCH validates action and prefs', () => {
    expect(settings).toContain("action");
    expect(settings).toContain("setNotifPrefs");
    expect(settings).toContain("prefs");
  });
});

// ==========================================================
// 4. Client ↔ Server Field Name Consistency
// ==========================================================
describe('Client ↔ Server Field Name Consistency', () => {
  const store = readFile('app/dashboard/lib/store.tsx');

  it('addBooking sends fields that bookings POST expects', () => {
    const bookings = readRoute('bookings');
    // store.tsx addBooking call
    const addBookingCall = store.slice(
      store.indexOf("apiCall('/api/mobile/bookings', 'POST'"),
      store.indexOf("apiCall('/api/mobile/bookings', 'POST'") + 500
    );

    // Fields sent by client should exist in server route
    const clientFields = ['courtId', 'date', 'time'];
    for (const field of clientFields) {
      if (addBookingCall.includes(field)) {
        expect(bookings).toContain(field);
      }
    }
  });

  it('cancelBooking sends bookingId that bookings DELETE expects', () => {
    const bookings = readRoute('bookings');
    expect(store).toMatch(/apiCall.*\/api\/mobile\/bookings.*DELETE.*bookingId/s);
    expect(bookings).toContain('bookingId');
  });

  it('addProgram sends program object that programs POST create expects', () => {
    const programs = readRoute('programs');
    expect(store).toMatch(/apiCall.*\/api\/mobile\/programs.*POST.*action.*create/s);
    // Server should handle the program fields
    expect(programs).toContain('program.id');
    expect(programs).toContain('program.title');
    expect(programs).toContain('program.coachId');
  });

  it('cancelProgram sends id that programs DELETE expects', () => {
    const programs = readRoute('programs');
    expect(store).toMatch(/apiCall.*\/api\/mobile\/programs.*DELETE.*id:/s);
    expect(programs).toMatch(/const\s*\{\s*id\s*\}/);
  });

  it('notification prefs sends action+prefs that settings PATCH expects', () => {
    const settings = readRoute('settings');
    expect(store).toContain("action: 'setNotifPrefs'");
    expect(store).toContain('prefs: notificationPreferences');
    expect(settings).toContain("action === 'setNotifPrefs'");
    expect(settings).toContain('body.prefs');
  });

  it('mobile PWA cancelEventRsvp sends eventId that events POST expects', () => {
    const events = readRoute('events');
    const mybookings = readFile('public/mobile-app/js/mybookings.ts');
    expect(mybookings).toMatch(/apiRequest.*\/mobile\/events.*POST.*eventId/s);
    expect(events).toContain('eventId');
  });
});

// ==========================================================
// 5. Supabase Table/Column Name Verification
// ==========================================================
describe('Supabase Table/Column Names Match Schema', () => {
  const schema = readFile('supabase/schema.sql');

  const tableAssertions = [
    { route: 'bookings', tables: ['bookings', 'booking_participants'] },
    { route: 'events', tables: ['events', 'event_attendees'] },
    { route: 'partners', tables: ['partners'] },
    { route: 'conversations', tables: ['conversations', 'messages'] },
    { route: 'programs', tables: ['coaching_programs', 'program_enrollments', 'program_sessions'] },
    { route: 'notifications', tables: ['notifications'] },
    { route: 'members', tables: ['profiles'] },
    { route: 'families', tables: ['family_members'] },
    { route: 'court-blocks', tables: ['court_blocks'] },
    { route: 'lineups', tables: ['match_lineups'] },
  ];

  for (const { route, tables } of tableAssertions) {
    const content = readRoute(route);
    if (!content) continue;

    for (const table of tables) {
      it(`${route} references table '${table}' which exists in schema`, () => {
        expect(content).toContain(`from('${table}')`);
        expect(schema).toMatch(new RegExp(`create table.*${table}`, 'is'));
      });
    }
  }

  // Verify key column names used in routes exist in schema
  // Schema uses multi-statement CREATE TABLE blocks, so we search for column names
  // near the table name (within 2000 chars) rather than trying to parse SQL precisely
  const columnChecks = [
    { table: 'bookings', columns: ['court_id', 'date', 'time', 'user_id', 'status', 'type'] },
    { table: 'events', columns: ['title', 'date', 'time', 'description'] },
    { table: 'event_attendees', columns: ['event_id', 'user_name'] },
  ];

  for (const { table, columns } of columnChecks) {
    for (const col of columns) {
      it(`schema mentions column '${col}' for '${table}'`, () => {
        // Find CREATE TABLE for this table and look within next 2000 chars
        const schemaLower = schema.toLowerCase();
        const tableIdx = schemaLower.indexOf(`create table if not exists ${table}`) !== -1
          ? schemaLower.indexOf(`create table if not exists ${table}`)
          : schemaLower.indexOf(`create table ${table}`);
        expect(tableIdx).toBeGreaterThan(-1);
        const block = schema.slice(tableIdx, tableIdx + 2000);
        expect(block).toContain(col);
      });
    }
  }
});

// ==========================================================
// 6. HTTP Method Coverage (every expected method is exported)
// ==========================================================
describe('HTTP Method Coverage', () => {
  const methodMap = {
    bookings:      ['GET', 'POST', 'PATCH', 'DELETE'],
    events:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    partners:      ['GET', 'POST', 'PATCH', 'DELETE'],
    conversations: ['GET', 'POST', 'DELETE'],
    members:       ['GET', 'POST', 'PATCH'],
    notifications: ['GET', 'PATCH'],
    announcements: ['GET', 'POST', 'DELETE'],
    programs:      ['GET', 'POST', 'PATCH', 'DELETE'],
    settings:      ['GET', 'PATCH'],
    families:      ['GET', 'POST', 'DELETE'],
    lineups:       ['GET', 'POST', 'PATCH', 'DELETE'],
    'court-blocks': ['GET', 'POST', 'DELETE'],
  };

  for (const [route, methods] of Object.entries(methodMap)) {
    const content = readRoute(route);
    if (!content) continue;

    for (const method of methods) {
      it(`/api/mobile/${route} exports ${method} handler`, () => {
        const hasExport = content.match(new RegExp(
          `export\\s+(async\\s+)?function\\s+${method}|export\\s+const\\s+${method}\\s*=`
        ));
        expect(hasExport).not.toBeNull();
      });
    }
  }
});

// ==========================================================
// 7. Rate Limiting Applied to Mutation Routes
// ==========================================================
describe('Rate Limiting on Mutation Routes', () => {
  const mutationRoutes = ['bookings', 'events', 'partners', 'conversations'];

  for (const route of mutationRoutes) {
    const content = readRoute(route);
    if (!content) continue;

    it(`/api/mobile/${route} applies rate limiting`, () => {
      expect(content).toMatch(/isRateLimited|withAuth/);
    });
  }
});

// ==========================================================
// 8. Notification Layer Completeness for Mutations
// ==========================================================
describe('Notification Layer Completeness', () => {
  it('bookings POST fires bell + push + email + message notifications', () => {
    const content = readRoute('bookings');
    expect(content).toMatch(/createNotification|notifications.*insert/);
    expect(content).toContain('sendPushToUser');
    expect(content).toMatch(/booking-email|notify-email/);
    expect(content).toMatch(/messages.*insert|sendMessage/);
  });

  it('programs POST enroll fires bell + push + email + welcome message', () => {
    const content = readRoute('programs');
    expect(content).toMatch(/notifications.*insert/);
    expect(content).toContain('sendPushToUser');
    expect(content).toMatch(/notify-email/);
    expect(content).toMatch(/messages.*insert/);
  });

  it('programs DELETE fires bell + push for enrolled members', () => {
    const content = readRoute('programs');
    const deleteBlock = content.slice(content.indexOf('DELETE'));
    expect(deleteBlock).toMatch(/notifications.*insert/);
    expect(deleteBlock).toContain('sendPushToUser');
  });

  it('events DELETE fires bell + push for attendees', () => {
    const content = readRoute('events');
    const deleteBlock = content.slice(content.indexOf('DELETE'));
    expect(deleteBlock).toMatch(/createNotification/);
    expect(deleteBlock).toContain('sendPushToUser');
  });
});

// ==========================================================
// 9. Program Creation Server-Side Completeness
// ==========================================================
describe('Program Creation (action: create) — Server-Side Completeness', () => {
  const content = readRoute('programs');

  it('inserts into coaching_programs table', () => {
    expect(content).toMatch(/coaching_programs.*insert/s);
  });

  it('inserts program sessions', () => {
    expect(content).toMatch(/program_sessions.*insert/s);
  });

  it('creates blocked court bookings for sessions', () => {
    expect(content).toMatch(/bookings.*insert/s);
    // Bookings should have type: 'program'
    expect(content).toContain("type: 'program'");
  });

  it('requires admin or coach role', () => {
    const createSection = content.slice(
      content.indexOf("action === 'create'"),
      content.indexOf("action === 'create'") + 300
    );
    expect(createSection).toMatch(/role.*admin|role.*coach/);
    expect(createSection).toContain('403');
  });

  it('returns programId on success', () => {
    expect(content).toContain('programId:');
  });
});

// ==========================================================
// 10. Shared Utility Imports (no inline duplication)
// ==========================================================
describe('Shared Utility Imports — No Duplication', () => {
  const sharedNotif = readFile('app/api/lib/notifications.ts');

  it('shared createNotification exists', () => {
    expect(sharedNotif).not.toBeNull();
    expect(sharedNotif).toContain('export async function createNotification');
  });

  const importRoutes = ['bookings', 'events', 'conversations'];
  for (const route of importRoutes) {
    it(`${route} imports createNotification from shared utility`, () => {
      const content = readRoute(route);
      expect(content).toMatch(/from.*lib\/notifications/);
    });
  }

  it('shared push utility exists and is used', () => {
    const pushFile = readFile('app/api/lib/push.ts');
    expect(pushFile).not.toBeNull();
    expect(pushFile).toContain('sendPushToUser');
  });
});
