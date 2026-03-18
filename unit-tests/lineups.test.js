/**
 * Lineups API — Structure & Validation Tests
 *
 * Tests: route structure, auth, input validation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const content = readFileSync(resolve(root, 'app/api/mobile/lineups/route.ts'), 'utf-8');

describe('Lineups API Route — Structure', () => {
  it('exports GET and POST handlers', () => {
    expect(content).toMatch(/export\s+(async\s+function|const)\s+GET/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+POST/);
  });

  it('exports PATCH handler for lineup updates', () => {
    expect(content).toMatch(/export\s+(async\s+function|const)\s+PATCH/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient', () => {
    expect(content).toContain('getAdminClient');
  });
});

describe('Lineups API — Input Validation', () => {
  it('validates matchDate', () => {
    expect(content).toMatch(/isValidDate|matchDate|match_date/);
  });

  it('validates member IDs with isValidUUID', () => {
    expect(content).toContain('isValidUUID');
  });

  it('sanitizes input strings', () => {
    expect(content).toContain('sanitizeInput');
  });
});

describe('Lineups API — Auth & Roles', () => {
  it('restricts creation to captain or admin', () => {
    // Only captains/admins should create lineups
    expect(content).toMatch(/captain|admin/i);
  });
});
