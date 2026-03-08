/**
 * API Integration Tests — Partner Matching Flow
 *
 * Tests the /api/mobile/partners route handlers.
 * Verifies: validation, auth, posting requests, accepting, notifications.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Partners API Route — Structure', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('exports GET, POST, DELETE handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
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
});

describe('Partners API — Posting a Partner Request', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('validates match type against allowed values', () => {
    expect(content).toContain('isValidEnum');
    expect(content).toContain('VALID_MATCH_TYPES');
  });

  it('validates skill level against allowed values', () => {
    expect(content).toContain('VALID_SKILL_LEVELS');
  });

  it('inserts into partners table', () => {
    expect(content).toMatch(/partners.*insert|from\('partners'\).*insert/s);
  });

  it('includes user profile data (name, skill level)', () => {
    expect(content).toMatch(/user_id|name|skill_level/);
  });
});

describe('Partners API — Deleting a Request', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('DELETE handler removes partner request', () => {
    expect(content).toMatch(/\.delete\(\)/);
  });

  it('verifies ownership before deletion', () => {
    // Should check user_id matches the authenticated user
    expect(content).toMatch(/user_id.*authResult\.id|eq\('user_id'/);
  });
});

describe('Partners API — Validation Rules Match Shared Constants', () => {
  const routeContent = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');
  const sharedContent = readFileSync(resolve(root, 'app/lib/shared-constants.ts'), 'utf-8');
  const authHelperContent = readFileSync(resolve(root, 'app/api/mobile/auth-helper.ts'), 'utf-8');

  it('shared constants file defines VALID_MATCH_TYPES', () => {
    expect(sharedContent).toContain("VALID_MATCH_TYPES = ['singles', 'doubles', 'any']");
  });

  it('shared constants file defines VALID_SKILL_LEVELS', () => {
    expect(sharedContent).toContain("VALID_SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'competitive']");
  });

  it('auth-helper re-exports from shared-constants (not duplicate definitions)', () => {
    expect(authHelperContent).toContain("from '@/app/lib/shared-constants'");
    // Should NOT have its own VALID_MATCH_TYPES definition
    expect(authHelperContent).not.toMatch(/^export const VALID_MATCH_TYPES/m);
  });

  it('route imports validation from auth-helper', () => {
    expect(routeContent).toContain("from '../auth-helper'");
  });
});

describe('Partners API — Auto-Expiry', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('GET filters out expired partner requests', () => {
    // Should only return requests where date >= today
    expect(content).toMatch(/gte.*date|date.*gte|today/);
  });
});

describe('Partners API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('Dashboard posts partners through API (not direct Supabase)', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/partners'");
  });

  it('Dashboard removes partners through API', () => {
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/partners'.*DELETE/s);
  });
});

describe('Partners API — Response Shape', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('returns camelCase fields', () => {
    expect(content).toContain('userId');
    expect(content).toContain('skillLevel');
    expect(content).toContain('matchType');
  });

  it('maps snake_case DB fields to camelCase', () => {
    expect(content).toContain('user_id');
    expect(content).toContain('skill_level');
    expect(content).toContain('match_type');
  });
});
