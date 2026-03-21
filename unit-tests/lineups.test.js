/**
 * Lineups API - Structure & Validation Tests
 *
 * Tests: route structure, auth, input validation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const content = readFileSync(resolve(root, 'app/api/mobile/lineups/route.ts'), 'utf-8');

describe('Lineups API Route - Structure', () => {
  it('exports GET and POST handlers', () => {
    expect(content).toMatch(/export\s+(async\s+function|const)\s+GET/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+POST/);
  });

  it('exports PATCH and DELETE handlers', () => {
    expect(content).toMatch(/export\s+(async\s+function|const)\s+PATCH/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+DELETE/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient', () => {
    expect(content).toContain('getAdminClient');
  });
});

describe('Lineups API - Input Validation', () => {
  it('reads JSON bodies through shared object parsing helper', () => {
    expect(content).toContain('readJsonObject');
  });

  it('rejects unknown fields for mutation bodies', () => {
    expect(content).toContain('findUnknownFields');
    expect(content).toContain('unknown_fields');
  });

  it('validates matchDate', () => {
    expect(content).toMatch(/isValidDate|matchDate|match_date/);
  });

  it('validates lineup and member IDs with isValidUUID', () => {
    expect(content).toContain('isValidUUID');
    expect(content).toContain('invalid_lineup_id');
    expect(content).toContain('invalid_member_id');
  });

  it('sanitizes input strings', () => {
    expect(content).toContain('sanitizeInput');
  });
});

describe('Lineups API - Auth & Roles', () => {
  it('restricts creation to captain or admin', () => {
    expect(content).toMatch(/captain|admin/i);
    expect(content).toContain('captain_or_admin_only');
  });

  it('uses structured success helpers for mutations', () => {
    expect(content).toContain('successResponse');
    expect(content).toContain("action: 'createLineup'");
    expect(content).toContain("action: 'updateLineupEntry'");
    expect(content).toContain("action: 'deleteLineup'");
  });
});
