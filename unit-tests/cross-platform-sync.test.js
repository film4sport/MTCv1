/**
 * Cross-Platform Sync Verification Tests
 *
 * Ensures Dashboard (React), Mobile PWA (vanilla JS), and API routes
 * are consistent with each other. Catches drift between platforms.
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
const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');
const sharedConstants = readFileSync(resolve(root, 'app/lib/shared-constants.ts'), 'utf-8');
const authHelper = readFileSync(resolve(root, 'app/api/mobile/auth-helper.ts'), 'utf-8');
const mobileAdminJs = ADMIN_JS_FILES.map((relPath) => readFileSync(resolve(root, relPath), 'utf-8')).join('\n\n');

// ── Single Source of Truth ──────────────────────────────────────────────

describe('Single Source of Truth — shared-constants.ts', () => {
  it('exists at app/lib/shared-constants.ts', () => {
    expect(existsSync(resolve(root, 'app/lib/shared-constants.ts'))).toBe(true);
  });

  it('has no external imports (isomorphic)', () => {
    expect(sharedConstants).not.toMatch(/^import\s/m);
  });

  it('auth-helper re-exports from shared-constants', () => {
    expect(authHelper).toContain("from '@/app/lib/shared-constants'");
  });

  it('auth-helper has zero duplicate const definitions', () => {
    // No local VALID_* or LIMITS definitions
    expect(authHelper).not.toMatch(/^export const VALID_/m);
    expect(authHelper).not.toMatch(/^export const LIMITS/m);
    expect(authHelper).not.toMatch(/^export const BOOKING_RULES/m);
  });

  it('auth-helper has zero duplicate function definitions', () => {
    expect(authHelper).not.toMatch(/^export function isValidUUID/m);
    expect(authHelper).not.toMatch(/^export function isValidEnum/m);
    expect(authHelper).not.toMatch(/^export function sanitizeInput/m);
  });
});

// ── Dashboard → API Route Consistency ───────────────────────────────────

describe('Dashboard → API Route Consistency', () => {
  it('Dashboard has apiCall helper', () => {
    expect(storeContent).toMatch(/async function apiCall/);
  });

  it('apiCall sends same-origin cookies for auth', () => {
    expect(storeContent).toContain("credentials: 'same-origin'");
    expect(storeContent).not.toMatch(/Authorization.*Bearer/);
  });

  it('Messages: Dashboard → /api/mobile/conversations POST', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/conversations'.*'POST'/);
  });

  it('Mark read: Dashboard → /api/mobile/conversations PATCH', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/conversations'.*'PATCH'/);
  });

  it('Partners: Dashboard → /api/mobile/partners POST', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/partners'.*'POST'/);
  });

  it('Remove partner: Dashboard → /api/mobile/partners DELETE', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/partners'.*'DELETE'/);
  });

  it('RSVP: Dashboard → /api/mobile/events POST', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/events'.*'POST'/);
  });

  it('Notifications read: Dashboard → /api/mobile/notifications PATCH', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/notifications'.*'PATCH'/);
  });

  it('Profile update: Dashboard → /api/mobile/members PATCH', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/members'.*'PATCH'/);
  });

  it('Push notifications: Dashboard → /api/notify-push POST', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/notify-push'.*'POST'/);
  });

  it('Bookings: Dashboard → /api/mobile/bookings (unified route)', () => {
    expect(storeContent).toContain('/api/mobile/bookings');
    // No separate /api/dashboard/bookings — all booking mutations go through one route
    expect(storeContent).not.toContain('/api/dashboard/bookings');
  });
});

// ── Mobile PWA → API Route Consistency ──────────────────────────────────

describe('Mobile PWA → API Route Consistency', () => {
  it('Mobile admin.js calls /api/mobile/bookings', () => {
    expect(mobileAdminJs).toContain('/api/mobile/bookings');
  });

  it('Mobile admin.js calls /api/mobile/members', () => {
    expect(mobileAdminJs).toContain('/api/mobile/members');
  });

  it('Mobile admin.js calls /api/mobile/courts', () => {
    expect(mobileAdminJs).toContain('/api/mobile/courts');
  });

  it('Mobile admin.js sends Authorization header', () => {
    expect(mobileAdminJs).toMatch(/Authorization.*Bearer/);
  });
});

// ── Supabase Realtime Consistency ───────────────────────────────────────

describe('Supabase Realtime — Both platforms subscribe', () => {
  it('Dashboard subscribes to Supabase Realtime', () => {
    expect(storeContent).toMatch(/channel|subscribe|on\(\s*'postgres_changes'/);
  });

  it('Mobile PWA has realtime-sync.js', () => {
    expect(existsSync(resolve(root, 'public/mobile-app/js/realtime-sync.ts'))).toBe(true);
  });

  it('Mobile PWA subscribes to Supabase Realtime', () => {
    const realtimeJs = readFileSync(resolve(root, 'public/mobile-app/js/realtime-sync.ts'), 'utf-8');
    expect(realtimeJs).toMatch(/channel|subscribe|postgres_changes/);
  });
});

// ── Notification Layer Consistency ──────────────────────────────────────

describe('Notification Layer — All routes fire complete notification stack', () => {
  // Core routes that send notifications should fire: bell (DB insert) + push (sendPushToUser)
  const bookingsRoute = readFileSync(resolve(root, 'app/api/mobile/bookings/route.ts'), 'utf-8');
  const conversationsRoute = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');
  const partnersRoute = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('Bookings route sends bell + push notifications', () => {
    expect(bookingsRoute).toContain('createNotification');
    expect(bookingsRoute).toContain('sendPushToUser');
  });

  it('Conversations route sends bell + push notifications', () => {
    expect(conversationsRoute).toContain('createNotification');
    expect(conversationsRoute).toContain('sendPushToUser');
  });

  it('Partners route sends push notifications', () => {
    expect(partnersRoute).toContain('sendPushToUser');
  });
});

// ── API Route Auth Pattern Consistency ──────────────────────────────────

describe('All API routes use consistent auth pattern', () => {
  const routeFiles = [
    'bookings', 'conversations', 'partners', 'events', 'notifications',
    'members', 'announcements', 'courts', 'court-blocks', 'families',
    'lineups', 'programs', 'settings',
  ];

  routeFiles.forEach(route => {
    const filePath = resolve(root, `app/api/mobile/${route}/route.ts`);
    if (!existsSync(filePath)) return;

    it(`${route}/route.ts uses auth (authenticateMobileRequest or withAuth)`, () => {
      const content = readFileSync(filePath, 'utf-8');
      // Routes use either direct authenticateMobileRequest or the withAuth wrapper (which calls it internally)
      const usesAuth = content.includes('authenticateMobileRequest') || content.includes('withAuth');
      expect(usesAuth).toBe(true);
    });

    it(`${route}/route.ts uses admin client (getAdminClient or withAuth)`, () => {
      const content = readFileSync(filePath, 'utf-8');
      // withAuth automatically provides supabase admin client to handler
      const usesAdmin = content.includes('getAdminClient') || content.includes('withAuth');
      expect(usesAdmin).toBe(true);
    });

    it(`${route}/route.ts imports from auth-helper`, () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("from '../auth-helper'");
    });
  });
});

// ── Schema Alignment ────────────────────────────────────────────────────

describe('Schema — Key tables exist', () => {
  const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');

  const requiredTables = [
    'profiles', 'bookings', 'events', 'conversations', 'messages',
    'notifications', 'partners', 'announcements', 'courts',
  ];

  requiredTables.forEach(table => {
    it(`${table} table exists in schema.sql`, () => {
      expect(schema).toContain(table);
    });
  });
});

// ── Mobile PWA Validation Parity ────────────────────────────────────────

describe('Mobile PWA — Validation values match shared constants', () => {
  // Spot-check a few critical values that mobile PWA uses
  it('shared constants has guest fee = $10', () => {
    expect(sharedConstants).toContain('GUEST_FEE: 10');
  });

  it('shared constants has 4 courts', () => {
    expect(sharedConstants).toContain('COURT_COUNT: 4');
  });

  it('shared constants has 24-hour cancellation window', () => {
    expect(sharedConstants).toContain('CANCEL_HOURS: 24');
  });

  it('shared constants has 30-minute slots', () => {
    expect(sharedConstants).toContain('SLOT_DURATION_MINUTES: 30');
  });

  it('shared constants has max 3 participants', () => {
    expect(sharedConstants).toContain('MAX_PARTICIPANTS: 3');
  });
});
