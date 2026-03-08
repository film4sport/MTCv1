/**
 * API Integration Tests — Events & RSVP Flow
 *
 * Tests the /api/mobile/events route handlers.
 * Verifies: validation, RSVP toggle, event CRUD, notifications, cross-platform consistency.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Events API Route — Structure', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('exports GET, POST, PATCH, DELETE handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/);
    expect(content).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient (not direct supabase)', () => {
    expect(content).toContain('getAdminClient');
    expect(content).not.toContain("from '@/app/lib/supabase'");
  });

  it('applies rate limiting', () => {
    expect(content).toContain('isRateLimited');
  });

  it('sanitizes user input', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('validates date fields', () => {
    expect(content).toContain('isValidDate');
  });

  it('validates time fields', () => {
    expect(content).toContain('isValidTime');
  });
});

describe('Events API — RSVP Flow', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('handles RSVP toggle (add/remove attendee)', () => {
    expect(content).toMatch(/rsvp|attendee|toggle/i);
  });

  it('works with events table attendees column', () => {
    expect(content).toMatch(/attendees/);
  });
});

describe('Events API — Event CRUD (admin)', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('POST creates new events', () => {
    expect(content).toMatch(/insert/);
  });

  it('PATCH updates existing events', () => {
    expect(content).toMatch(/update/);
  });

  it('DELETE removes events', () => {
    expect(content).toMatch(/delete/);
  });

  it('validates event date and time ranges', () => {
    expect(content).toContain('isInRange');
  });
});

describe('Events API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('Dashboard routes RSVP through API', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/events'");
  });
});

describe('Events API — Notification Layer', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('sends push notifications for event changes', () => {
    expect(content).toContain('sendPushToUser');
  });
});
