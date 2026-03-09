/**
 * API Consolidation Tests
 *
 * Verifies: single booking route, shared notification helper, no dashboard route duplication.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

describe('Booking Route Consolidation', () => {
  it('dashboard bookings route no longer exists', () => {
    expect(existsSync(resolve(root, 'app/api/dashboard/bookings/route.ts'))).toBe(false);
  });

  it('/api/dashboard/ directory does not exist', () => {
    expect(existsSync(resolve(root, 'app/api/dashboard'))).toBe(false);
  });

  it('store.tsx uses /api/mobile/bookings for all booking operations', () => {
    expect(storeContent).toContain('/api/mobile/bookings');
    expect(storeContent).not.toContain('/api/dashboard/bookings');
  });

  it('store.tsx addBooking routes through /api/mobile/bookings POST', () => {
    // addBooking should call apiCall('/api/mobile/bookings', 'POST', ...)
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/bookings',\s*'POST'/);
  });

  it('store.tsx cancelBooking routes through /api/mobile/bookings DELETE', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/bookings',\s*'DELETE'/);
  });

  it('store.tsx confirmParticipant routes through /api/mobile/bookings PATCH', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/bookings',\s*'PATCH'/);
  });
});

describe('Shared Notification Helper', () => {
  it('app/api/lib/notifications.ts exists', () => {
    expect(existsSync(resolve(root, 'app/api/lib/notifications.ts'))).toBe(true);
  });

  it('exports createNotification function', () => {
    const content = readFileSync(resolve(root, 'app/api/lib/notifications.ts'), 'utf-8');
    expect(content).toMatch(/export\s+(async\s+)?function\s+createNotification/);
  });

  it('bookings route imports from shared notifications', () => {
    const content = readFileSync(resolve(root, 'app/api/mobile/bookings/route.ts'), 'utf-8');
    expect(content).toContain("from '../../lib/notifications'");
    // Should NOT have a local createNotification definition
    expect(content).not.toMatch(/^async function createNotification/m);
  });

  it('events route imports from shared notifications', () => {
    const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');
    expect(content).toContain("from '../../lib/notifications'");
    expect(content).not.toMatch(/^async function createNotification/m);
  });

  it('conversations route imports from shared notifications', () => {
    const content = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');
    expect(content).toContain("from '../../lib/notifications'");
    expect(content).not.toMatch(/^async function createNotification/m);
  });
});

describe('Cache Policy Consistency', () => {
  it('auth-helper documents cache tiers', () => {
    const content = readFileSync(resolve(root, 'app/api/mobile/auth-helper.ts'), 'utf-8');
    expect(content).toContain('Cache policy tiers');
  });

  it('announcements uses semi-static cache (60s)', () => {
    const content = readFileSync(resolve(root, 'app/api/mobile/announcements/route.ts'), 'utf-8');
    expect(content).toMatch(/cachedJson\(result,\s*60/);
  });
});

describe('Typed apiCall', () => {
  it('apiCall returns parsed JSON (not raw Response)', () => {
    // Should parse JSON inside apiCall, not return Response
    expect(storeContent).toMatch(/return res\.json\(\)/);
  });

  it('apiCall has generic type parameter', () => {
    expect(storeContent).toMatch(/async function apiCall<T/);
  });

  it('addBooking .then() receives parsed data directly (no res.json())', () => {
    // Should be .then((data: ...) => ...) not .then(async (res) => { await res.json() })
    expect(storeContent).not.toMatch(/then\(async \(res\)/);
  });
});
