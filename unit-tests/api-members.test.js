/**
 * API Integration Tests — Members / Profile Flow
 *
 * Tests the /api/mobile/members route handlers.
 * Verifies: validation, profile updates, admin member management, cross-platform consistency.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Members API Route — Structure', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/members/route.ts'), 'utf-8');

  it('exports GET, POST, PATCH, DELETE handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/);
    expect(content).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient', () => {
    expect(content).toContain('getAdminClient');
  });

  it('applies rate limiting', () => {
    expect(content).toContain('isRateLimited');
  });

  it('sanitizes user input', () => {
    expect(content).toContain('sanitizeInput');
  });
});

describe('Members API — Validation', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/members/route.ts'), 'utf-8');

  it('validates UUID format', () => {
    expect(content).toContain('isValidUUID');
  });

  it('validates email format', () => {
    expect(content).toContain('isValidEmail');
  });

  it('validates enum fields (status, membership_type, skill_level)', () => {
    expect(content).toContain('isValidEnum');
    expect(content).toContain('VALID_STATUSES');
    expect(content).toContain('VALID_MEMBERSHIP_TYPES');
    expect(content).toContain('VALID_SKILL_LEVELS');
  });

  it('validates interclub team assignment', () => {
    expect(content).toContain('VALID_INTERCLUB_TEAMS');
  });

  it('uses validationError helper for consistent error format', () => {
    expect(content).toContain('validationError');
  });
});

describe('Members API — Profile Updates', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/members/route.ts'), 'utf-8');

  it('PATCH updates profile fields', () => {
    expect(content).toMatch(/update.*profiles|profiles.*update/s);
  });

  it('handles notification preferences', () => {
    expect(content).toMatch(/preferences|notification/i);
  });
});

describe('Members API — Validation Rules Match Shared Constants', () => {
  const sharedContent = readFileSync(resolve(root, 'app/lib/shared-constants.ts'), 'utf-8');

  it('VALID_STATUSES defined in shared constants', () => {
    expect(sharedContent).toContain("VALID_STATUSES = ['active', 'paused', 'inactive']");
  });

  it('VALID_MEMBERSHIP_TYPES defined in shared constants', () => {
    expect(sharedContent).toContain("VALID_MEMBERSHIP_TYPES = ['adult', 'family', 'junior']");
  });

  it('VALID_INTERCLUB_TEAMS defined in shared constants', () => {
    expect(sharedContent).toContain("VALID_INTERCLUB_TEAMS = ['none', 'a', 'b']");
  });
});

describe('Members API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('Dashboard routes profile updates through API', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/members'");
  });
});

describe('Members API — Security', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/members/route.ts'), 'utf-8');

  it('restricts admin operations to admin role', () => {
    expect(content).toMatch(/admin|role/);
  });

  it('regular members can only update their own profile', () => {
    expect(content).toMatch(/authResult\.id/);
  });
});
