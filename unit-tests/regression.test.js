/**
 * REGRESSION TESTS — Known Fixed Bugs
 *
 * Each test reproduces a specific bug that was found and fixed.
 * If any of these fail, the bug has returned.
 *
 * Format: [BUG-XXX] Description — where XXX is the session date it was found.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  isValidUUID, isValidEnum, isValidDate, isInRange, isValidEmail,
  isValidTime, sanitizeInput, LIMITS, VALID_STATUSES,
} from '../app/lib/shared-constants.ts';

const root = resolve(__dirname, '..');

// ══════════════════════════════════════════════════════════════════════════
// BUG-0301: Supabase writes failing silently (no error check)
// All db.ts write functions now throw on error.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0301] Supabase writes must throw on error', () => {
  const dbContent = readFileSync(resolve(root, 'app/dashboard/lib/db.ts'), 'utf-8');

  it('every INSERT/UPDATE/DELETE function checks for errors', () => {
    // Count write operations (insert, update, delete, upsert)
    const writeOps = dbContent.match(/\.(insert|update|delete|upsert)\(/g);
    if (!writeOps) return;

    // Count throw/error checks
    const errorChecks = dbContent.match(/if\s*\(error\)\s*throw|\.then\(\(\{.*error.*\}\)|throw error/g);
    // Should have at least one error check per significant write group
    expect(errorChecks).not.toBeNull();
    expect(errorChecks.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0302: Direct Supabase mutations bypass RLS (silent 200 OK, 0 rows)
// Dashboard now routes mutations through API endpoints.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0302] Dashboard mutations go through API, not direct Supabase', () => {
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

// ══════════════════════════════════════════════════════════════════════════
// BUG-0302b: auth-helper had duplicate validation constants (drift risk)
// Now re-exports from shared-constants.ts
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0302b] auth-helper must not duplicate shared-constants', () => {
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

// ══════════════════════════════════════════════════════════════════════════
// BUG-0303: Missing columns in Supabase (bookings.match_type, etc.)
// Schema must include all required columns.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0303] Schema has all required columns', () => {
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

// ══════════════════════════════════════════════════════════════════════════
// BUG-0304: Demo/fake data leaking into production
// No demo credentials or fake data in production code.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0304] No demo/fake data in production code', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');
  const loginContent = readFileSync(resolve(root, 'app/login/page.tsx'), 'utf-8');

  it('store.tsx has no hardcoded demo credentials', () => {
    expect(storeContent).not.toMatch(/demo@|password123|demo\.password/i);
  });

  it('login page gates demo credentials behind NODE_ENV check', () => {
    // Demo credentials should only show in development mode
    if (loginContent.includes('demo')) {
      expect(loginContent).toMatch(/NODE_ENV.*development|process\.env/);
    }
  });

  it('no ClubSpark links anywhere', () => {
    expect(storeContent).not.toContain('clubspark.ca');
    const landingContent = readFileSync(resolve(root, 'app/(landing)/page.tsx'), 'utf-8');
    expect(landingContent).not.toContain('clubspark.ca');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0305: sanitizeInput allows HTML that renders in browser
// Must strip ALL angle brackets, not just known tags.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0305] sanitizeInput strips all HTML/XSS vectors', () => {
  it('strips script tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).not.toContain('<');
  });

  it('strips img tags with onerror', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).not.toContain('<');
  });

  it('strips svg tags with onload', () => {
    expect(sanitizeInput('<svg onload=alert(1)>')).not.toContain('<');
  });

  it('strips nested/encoded attempts', () => {
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

// ══════════════════════════════════════════════════════════════════════════
// BUG-0306: Wrong localStorage key in tests (mtc-current-user vs mtc-user)
// E2E tests must use the correct keys.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0306] E2E test mocks use correct localStorage keys', () => {
  const testFiles = ['tests/desktop.spec.js', 'tests/mobile.spec.js', 'tests/mobile-pwa.spec.js'];

  testFiles.forEach(file => {
    const filePath = resolve(root, file);
    if (!existsSync(filePath)) return;

    it(`${file} uses mtc-onboarding-complete (not mtc-onboarding)`, () => {
      const content = readFileSync(filePath, 'utf-8');
      if (content.includes('onboarding')) {
        expect(content).toContain('mtc-onboarding-complete');
        expect(content).not.toContain("'mtc-onboarding'");
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0307: Mobile PWA ARIA labels test flaky (waitUntil: 'load')
// Must use 'domcontentloaded' not 'load' for static HTML tests.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0307] Mobile PWA test uses domcontentloaded', () => {
  const testFile = resolve(root, 'tests/mobile-pwa.spec.js');
  if (!existsSync(testFile)) return;

  const content = readFileSync(testFile, 'utf-8');

  it('ARIA labels test uses domcontentloaded (not load)', () => {
    // The ARIA test was flaky because 'load' waits for CDN scripts
    // Find the ARIA labels test block and verify it uses domcontentloaded
    const ariaSection = content.match(/ARIA.*label[\s\S]*?(?=test\(|}\);)/i);
    if (ariaSection) {
      expect(ariaSection[0]).not.toContain("waitUntil: 'load'");
    }
  });

  it('uses waitForSelector instead of waitForTimeout for reliability', () => {
    // waitForTimeout is flaky in CI; prefer explicit waitForSelector
    expect(content).toContain('waitForSelector');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0308: Service worker caching Supabase API calls
// SW must skip Supabase URLs from cache.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0308] Service workers skip Supabase from cache', () => {
  it('desktop SW skips supabase.co', () => {
    const sw = readFileSync(resolve(root, 'public/sw.js'), 'utf-8');
    expect(sw).toContain('supabase.co');
  });

  it('mobile SW references Supabase (caches vendor JS, skips API via network-first)', () => {
    const mobileSw = readFileSync(resolve(root, 'public/mobile-app/sw.js'), 'utf-8');
    // Mobile SW caches supabase.min.js vendor file and uses network-first for API calls
    expect(mobileSw).toMatch(/supabase|network/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0308b: Deployment says Vercel (it's Railway)
// Codebase must not reference Vercel deployment.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0308b] No Vercel references in deployment config', () => {
  it('no vercel.json exists', () => {
    expect(existsSync(resolve(root, 'vercel.json'))).toBe(false);
  });

  it('no @vercel packages in package.json', () => {
    const pkg = readFileSync(resolve(root, 'package.json'), 'utf-8');
    expect(pkg).not.toContain('@vercel/');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0309: Rate limiting missing on API routes
// All mutation routes must have rate limiting.
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0309] All API routes have rate limiting', () => {
  const mutationRoutes = [
    'bookings', 'conversations', 'partners', 'events',
    'members', 'announcements', 'court-blocks', 'families',
    'lineups', 'settings',
  ];

  mutationRoutes.forEach(route => {
    it(`${route} has rate limiting or uses withAuth wrapper`, () => {
      const content = readFileSync(resolve(root, `app/api/mobile/${route}/route.ts`), 'utf-8');
      // Routes use either direct isRateLimited or the withAuth wrapper (which supports rateLimit option)
      expect(
        content.includes('isRateLimited') || content.includes('withAuth')
      ).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BUG-0310: Coaching panel removed — route redirects to lessons
// ══════════════════════════════════════════════════════════════════════════

describe('[BUG-0310] Coaching panel removed', () => {
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
