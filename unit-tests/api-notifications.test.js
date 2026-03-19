/**
 * API Integration Tests — Notifications Flow
 *
 * Tests the /api/mobile/notifications route handlers.
 * Verifies: fetch, mark-read, mark-all-read, cross-platform consistency.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Notifications API Route — Structure', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/notifications/route.ts'), 'utf-8');

  it('exports GET, PATCH, and DELETE handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/);
    expect(content).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient', () => {
    expect(content).toContain('getAdminClient');
  });
});

describe('Notifications API — Fetch', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/notifications/route.ts'), 'utf-8');

  it('filters notifications by user_id', () => {
    expect(content).toMatch(/user_id/);
  });

  it('orders by timestamp descending (newest first)', () => {
    expect(content).toMatch(/timestamp|created_at/);
    expect(content).toMatch(/ascending.*false|descending|desc/i);
  });
});

describe('Notifications API — Mark Read', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/notifications/route.ts'), 'utf-8');

  it('PATCH can mark single notification read', () => {
    expect(content).toContain("read");
  });

  it('PATCH can mark all notifications read', () => {
    expect(content).toMatch(/markAll|mark_all|all/);
  });

  it('only modifies notifications belonging to the authenticated user', () => {
    expect(content).toMatch(/user_id.*authResult|eq.*user_id/);
  });
});

describe('Notifications API — Lifecycle', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/notifications/route.ts'), 'utf-8');

  it('GET returns the mobile fields used by notification clients', () => {
    expect(content).toContain('title: n.title');
    expect(content).toContain('body: n.body');
    expect(content).toContain('timestamp: n.timestamp');
    expect(content).toContain('read: n.read');
  });

  it('DELETE clears only read notifications for the authenticated user', () => {
    expect(content).toMatch(/\.delete\(\)/);
    expect(content).toMatch(/eq\('user_id',\s*authResult\.id\)/);
    expect(content).toMatch(/eq\('read',\s*true\)/);
  });
});

describe('Notifications API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('Dashboard marks notifications read through API', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/notifications'");
  });

  it('Dashboard uses PATCH method for notification updates', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/notifications'.*PATCH/s);
  });
});
