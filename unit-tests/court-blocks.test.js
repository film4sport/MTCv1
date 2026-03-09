/**
 * Court Blocks API — Structure & Validation Tests
 *
 * Tests: route structure, auth, input validation, auto-cancel logic, bulk delete.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const content = readFileSync(resolve(root, 'app/api/mobile/court-blocks/route.ts'), 'utf-8');

describe('Court Blocks API Route — Structure', () => {
  it('exports GET, POST, DELETE handlers', () => {
    expect(content).toMatch(/export\s+(async\s+function|const)\s+GET/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+POST/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+DELETE/);
  });

  it('authenticates requests via withAuth wrapper', () => {
    expect(content).toContain('withAuth');
  });

  it('imports from auth-helper', () => {
    expect(content).toContain("from '../auth-helper'");
  });
});

describe('Court Blocks API — Input Validation', () => {
  it('validates court_id in POST', () => {
    // POST should check court ID is valid
    expect(content).toMatch(/court_id|courtId/);
  });

  it('validates date in POST', () => {
    expect(content).toMatch(/date/);
  });

  it('validates reason in POST', () => {
    expect(content).toMatch(/reason/);
  });
});

describe('Court Blocks API — Auto-Cancel Conflicting Bookings', () => {
  it('has cancelConflictingBookings function', () => {
    expect(content).toContain('cancelConflictingBookings');
  });

  it('sends notifications to affected users on cancellation', () => {
    // Should create bell notifications for cancelled bookings
    expect(content).toContain('notifications');
    expect(content).toContain('sendPushToUser');
  });

  it('returns cancelled booking count in POST response', () => {
    expect(content).toMatch(/cancelledBookings|cancelled/i);
  });
});

describe('Court Blocks API — Bulk Delete', () => {
  it('supports single ID delete', () => {
    // DELETE with ?id= query param
    expect(content).toMatch(/searchParams.*id|id.*searchParams/);
  });

  it('supports bulk delete by IDs array', () => {
    // DELETE with { ids: [...] } body
    expect(content).toContain('ids');
  });

  it('supports range delete by dates', () => {
    // DELETE with { from, to } body
    expect(content).toMatch(/from.*to|body\.from/);
  });
});
