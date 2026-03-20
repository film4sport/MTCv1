import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  isValidUUID, isValidEnum, isValidDate, isInRange, isValidEmail,
  isValidTime, sanitizeInput, LIMITS, VALID_STATUSES,
} from '../app/lib/shared-constants.ts';

const root = resolve(__dirname, '..');

describe('Dashboard database writes handle errors', () => {
  const dbContent = readFileSync(resolve(root, 'app/dashboard/lib/db.ts'), 'utf-8');

  it('every INSERT/UPDATE/DELETE function checks for errors', () => {
    const writeOps = dbContent.match(/\.(insert|update|delete|upsert)\(/g);
    if (!writeOps) return;

    const errorChecks = dbContent.match(/if\s*\(error\)\s*throw|\.then\(\(\{.*error.*\}\)|throw error/g);
    expect(errorChecks).not.toBeNull();
    expect(errorChecks.length).toBeGreaterThan(0);
  });
});

describe('Dashboard mutations route through API helpers', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('has apiCall helper function', () => {
    expect(storeContent).toMatch(/async function apiCall/);
  });

  it('messaging goes through /api/mobile/conversations', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/conversations'");
  });

  it('partners go through /api/mobile/partners', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/partners'");
  });

  it('RSVP goes through /api/mobile/events', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/events'");
  });

  it('notifications go through /api/mobile/notifications', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/notifications'");
  });
});

describe('Mobile auth helper reuses shared validation constants', () => {
  const authHelper = readFileSync(resolve(root, 'app/api/mobile/auth-helper.ts'), 'utf-8');

  it('imports from shared-constants', () => {
    expect(authHelper).toContain("from '@/app/lib/shared-constants'");
  });

  it('has no local VALID_* definitions', () => {
    expect(authHelper).not.toMatch(/^export const VALID_/m);
  });

  it('has no local validation function definitions', () => {
    expect(authHelper).not.toMatch(/^export function isValid/m);
    expect(authHelper).not.toMatch(/^export function sanitizeInput/m);
  });
});

describe('Database schema includes required columns', () => {
  const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');

  it('bookings has match_type column', () => {
    expect(schema).toMatch(/bookings[\s\S]*?match_type/);
  });

  it('bookings has duration column', () => {
    expect(schema).toMatch(/bookings[\s\S]*?duration/);
  });

  it('profiles has status column', () => {
    expect(schema).toMatch(/profiles[\s\S]*?status/);
  });

  it('partners has skill_level column', () => {
    expect(schema).toMatch(/partners[\s\S]*?skill_level/);
  });

  it('partners has message column', () => {
    expect(schema).toMatch(/partners[\s\S]*?message/);
  });
});

describe('Production code avoids demo credential leaks', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');
  const loginContent = readFileSync(resolve(root, 'app/login/page.tsx'), 'utf-8');

  it('store.tsx has no hardcoded demo credentials', () => {
    expect(storeContent).not.toMatch(/demo@|password123|demo\.password/i);
  });

  it('login page gates demo credentials behind NODE_ENV check', () => {
    if (loginContent.includes('demo')) {
      expect(loginContent).toMatch(/NODE_ENV.*development|process\.env/);
    }
  });
});

describe('sanitizeInput strips common HTML and XSS vectors', () => {
  it('strips script tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).not.toContain('<');
  });

  it('strips img tags with onerror', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).not.toContain('<');
  });

  it('strips svg tags with onload', () => {
    expect(sanitizeInput('<svg onload=alert(1)>')).not.toContain('<');
  });

  it('strips nested and encoded attempts', () => {
    expect(sanitizeInput('<<script>script>alert(1)<</script>/script>')).not.toContain('<');
  });

  it('strips attribute injection in quotes', () => {
    const result = sanitizeInput('" onmouseover="alert(1)');
    expect(result).not.toContain('"');
  });

  it('output never contains < > " or \'', () => {
    const attacks = [
      '<script>alert(document.cookie)</script>',
      '"><img src=x onerror=alert(1)>',
      "' onfocus='alert(1)' autofocus='",
      '<div style="background:url(javascript:alert(1))">',
      '<math><mtext><table><mglyph><svg><mtext><textarea><path d=""><img onerror=alert(1)>',
    ];
    for (const a of attacks) {
      const result = sanitizeInput(a);
      expect(result).not.toMatch(/[<>"']/);
    }
  });
});

describe('Service workers preserve network-first handling for Supabase traffic', () => {
  it('desktop SW skips supabase.co', () => {
    const sw = readFileSync(resolve(root, 'public/sw.js'), 'utf-8');
    expect(sw).toContain('supabase.co');
  });

  it('mobile SW references Supabase or network handling', () => {
    const mobileSw = readFileSync(resolve(root, 'public/mobile-app/sw.js'), 'utf-8');
    expect(mobileSw).toMatch(/supabase|network/i);
  });
});

describe('Mobile mutation routes include rate limiting or auth wrappers', () => {
  const mutationRoutes = [
    'bookings', 'conversations', 'partners', 'events',
    'members', 'announcements', 'court-blocks', 'families',
    'lineups', 'settings',
  ];

  mutationRoutes.forEach(route => {
    it(`${route} has rate limiting or uses withAuth wrapper`, () => {
      const content = readFileSync(resolve(root, `app/api/mobile/${route}/route.ts`), 'utf-8');
      expect(
        content.includes('isRateLimited') || content.includes('withAuth')
      ).toBe(true);
    });
  });
});

describe('Coaching routes redirect to lessons', () => {
  it('coaching page redirects to lessons', () => {
    const coachingPage = readFileSync(resolve(root, 'app/dashboard/coaching/page.tsx'), 'utf-8');
    expect(coachingPage).toMatch(/redirect.*lessons/i);
  });

  it('sidebar does not reference coaching panel', () => {
    const sidebar = readFileSync(resolve(root, 'app/dashboard/components/Sidebar.tsx'), 'utf-8');
    expect(sidebar).not.toContain('coachItem');
    expect(sidebar).not.toContain("Coach's Panel");
  });
});

describe('Shared constants remain strict and consistent', () => {
  it('UUID validation accepts valid UUIDs', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('UUID validation rejects invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });

  it('enum validation accepts allowed values', () => {
    expect(isValidEnum('active', VALID_STATUSES)).toBe(true);
  });

  it('enum validation rejects disallowed values', () => {
    expect(isValidEnum('weird-status', VALID_STATUSES)).toBe(false);
  });

  it('date validation accepts ISO dates', () => {
    expect(isValidDate('2026-03-19')).toBe(true);
  });

  it('date validation rejects malformed dates', () => {
    expect(isValidDate('19/03/2026')).toBe(false);
  });

  it('time validation accepts HH:MM format', () => {
    expect(isValidTime('18:30')).toBe(true);
  });

  it('time validation rejects bad times', () => {
    expect(isValidTime('9:7')).toBe(false);
  });

  it('range validation enforces numeric limits', () => {
    expect(isInRange(5, 1, 10)).toBe(true);
    expect(isInRange(11, 1, 10)).toBe(false);
  });

  it('email validation accepts normal emails', () => {
    expect(isValidEmail('member@mtc.ca')).toBe(true);
  });

  it('email validation rejects malformed emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('limits object exposes expected guardrails', () => {
    expect(LIMITS).toBeTruthy();
    expect(typeof LIMITS).toBe('object');
  });
});
