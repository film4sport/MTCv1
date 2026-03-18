/**
 * Shared Constants — Validation & Cross-Platform Consistency Tests
 *
 * Ensures the shared-constants.ts file is the single source of truth
 * and that auth-helper.ts re-exports (not duplicates) from it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const sharedContent = readFileSync(resolve(root, 'app/lib/shared-constants.ts'), 'utf-8');
const authHelperContent = readFileSync(resolve(root, 'app/api/mobile/auth-helper.ts'), 'utf-8');

describe('Shared Constants — Exports', () => {
  it('exports LIMITS object with all required fields', () => {
    expect(sharedContent).toContain('MESSAGE_TEXT:');
    expect(sharedContent).toContain('MESSAGE_PREVIEW:');
    expect(sharedContent).toContain('PARTNER_MESSAGE:');
    expect(sharedContent).toContain('PARTNER_AVAILABILITY:');
    expect(sharedContent).toContain('GUEST_NAME:');
    expect(sharedContent).toContain('ANNOUNCEMENT_BODY:');
    expect(sharedContent).toContain('EVENT_DESCRIPTION:');
    expect(sharedContent).toContain('DEFAULT_INPUT:');
    expect(sharedContent).toContain('MAX_PARTICIPANTS:');
    expect(sharedContent).toContain('MAX_NOTIFICATIONS:');
    expect(sharedContent).toContain('MAX_CONVERSATIONS:');
    expect(sharedContent).toContain('DURATION_SLOTS:');
    expect(sharedContent).toContain('NAME:');
    expect(sharedContent).toContain('EMAIL:');
  });

  it('exports BOOKING_RULES with required fields', () => {
    expect(sharedContent).toContain('CANCEL_HOURS:');
    expect(sharedContent).toContain('GUEST_FEE:');
    expect(sharedContent).toContain('GUEST_FEE_EMAIL:');
    expect(sharedContent).toContain('MAX_ADVANCE_DAYS:');
    expect(sharedContent).toContain('COURT_COUNT:');
    expect(sharedContent).toContain('FIRST_SLOT_HOUR:');
    expect(sharedContent).toContain('LAST_SLOT_HOUR:');
    expect(sharedContent).toContain('SLOT_DURATION_MINUTES:');
  });

  it('exports all VALID_* enum arrays', () => {
    const expectedEnums = [
      'VALID_STATUSES', 'VALID_MEMBERSHIP_TYPES', 'VALID_SKILL_LEVELS',
      'VALID_MATCH_TYPES', 'VALID_EXTENDED_MATCH_TYPES', 'VALID_EVENT_TYPES',
      'VALID_ANNOUNCEMENT_TYPES', 'VALID_COURT_STATUSES', 'VALID_BLOCK_REASONS',
      'VALID_AUDIENCES', 'VALID_FAMILY_TYPES', 'VALID_INTERCLUB_TEAMS',
      'VALID_BOOKING_MATCH_TYPES', 'SETTINGS_KEY_WHITELIST',
    ];
    for (const name of expectedEnums) {
      expect(sharedContent).toContain(`export const ${name}`);
    }
  });

  it('exports NOTIFICATION_TYPES', () => {
    expect(sharedContent).toContain('NOTIFICATION_TYPES');
    expect(sharedContent).toContain("'booking'");
    expect(sharedContent).toContain("'message'");
    expect(sharedContent).toContain("'partner'");
    expect(sharedContent).toContain("'event'");
  });

  it('exports validation functions', () => {
    expect(sharedContent).toMatch(/export\s+function\s+isValidUUID/);
    expect(sharedContent).toMatch(/export\s+function\s+isValidEnum/);
    expect(sharedContent).toMatch(/export\s+function\s+isValidDate/);
    expect(sharedContent).toMatch(/export\s+function\s+isInRange/);
    expect(sharedContent).toMatch(/export\s+function\s+isValidEmail/);
    expect(sharedContent).toMatch(/export\s+function\s+isValidTime/);
    expect(sharedContent).toMatch(/export\s+function\s+sanitizeInput/);
  });
});

describe('Shared Constants — No Duplicates in auth-helper', () => {
  it('auth-helper imports from shared-constants', () => {
    expect(authHelperContent).toContain("from '@/app/lib/shared-constants'");
  });

  it('auth-helper does NOT define its own VALID_* constants', () => {
    // Should only have re-exports, not local definitions
    const localConstDefs = authHelperContent.match(/^export const VALID_/gm);
    expect(localConstDefs).toBeNull();
  });

  it('auth-helper does NOT define its own validation functions', () => {
    // Should not have local isValidUUID, isValidEnum, etc.
    expect(authHelperContent).not.toMatch(/^export function isValidUUID/m);
    expect(authHelperContent).not.toMatch(/^export function isValidEnum/m);
    expect(authHelperContent).not.toMatch(/^export function isValidDate/m);
    expect(authHelperContent).not.toMatch(/^export function isValidEmail/m);
    expect(authHelperContent).not.toMatch(/^export function isValidTime/m);
    expect(authHelperContent).not.toMatch(/^export function isInRange/m);
  });

  it('auth-helper does NOT define its own sanitizeInput', () => {
    expect(authHelperContent).not.toMatch(/^export function sanitizeInput/m);
  });

  it('auth-helper keeps validationError (Next.js-specific, not shared)', () => {
    expect(authHelperContent).toMatch(/export function validationError/);
  });
});

describe('Shared Constants — Isomorphic (No Next.js Dependencies)', () => {
  it('does not import from next/server or next/headers', () => {
    expect(sharedContent).not.toContain("from 'next/");
    expect(sharedContent).not.toContain('NextResponse');
    expect(sharedContent).not.toContain('NextRequest');
  });

  it('does not import from @supabase', () => {
    expect(sharedContent).not.toContain('@supabase');
  });

  it('has no external dependencies (pure functions)', () => {
    // Should not have any import statements at all
    expect(sharedContent).not.toMatch(/^import\s/m);
  });
});

describe('Shared Constants — Value Correctness', () => {
  it('LIMITS.EMAIL matches RFC 5321 max (254)', () => {
    expect(sharedContent).toContain('EMAIL: 254');
  });

  it('BOOKING_RULES.CANCEL_HOURS is 24', () => {
    expect(sharedContent).toContain('CANCEL_HOURS: 24');
  });

  it('BOOKING_RULES.GUEST_FEE is 10', () => {
    expect(sharedContent).toContain('GUEST_FEE: 10');
  });

  it('BOOKING_RULES.COURT_COUNT is 4', () => {
    expect(sharedContent).toContain('COURT_COUNT: 4');
  });

  it('BOOKING_RULES.SLOT_DURATION_MINUTES is 30', () => {
    expect(sharedContent).toContain('SLOT_DURATION_MINUTES: 30');
  });

  it('VALID_STATUSES includes active, paused, inactive', () => {
    expect(sharedContent).toMatch(/VALID_STATUSES.*active.*paused.*inactive/);
  });

  it('VALID_SKILL_LEVELS has 4 levels', () => {
    expect(sharedContent).toMatch(/VALID_SKILL_LEVELS.*beginner.*intermediate.*advanced.*competitive/);
  });
});
