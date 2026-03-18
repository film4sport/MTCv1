const { defineConfig, devices } = require('@playwright/test');

// Tests requiring Supabase auth — only run locally (no env vars in CI)
const AUTH_TESTS = [
  'qa-full-flow.spec.js',
  'dashboard.spec.js',
];

// Tests that manage their own viewports — run desktop only (no auth needed)
const DESKTOP_ONLY_TESTS = [
  'responsive.spec.js',      // already loops through 3 viewports internally
  'mobile.spec.js',          // already sets its own viewport (390x812)
  'mobile-pwa.spec.js',      // mobile PWA tests (390x844 viewport)
  'mobile-pwa-flows.spec.js',   // authenticated flow tests (mocked auth, 390x844)
  'mobile-pwa-offline.spec.js', // offline resilience tests (mocked network, 390x844)
  'mobile-pwa-rollback.spec.js', // rollback behavior tests (mocked API failures, 390x844)
  'visual-regression.spec.js',    // screenshot comparison tests
];

// All other tests run on all 3 Chromium viewports for responsive coverage
const RESPONSIVE_TESTS = [
  'chromium-compat.spec.js',
  'landing.spec.js',
  'landing-gallery.spec.js',
  'signup.spec.js',
  'verify-fixes.spec.js',
  'footer-gap.spec.js',
  'hero-closeup.spec.js',
  'hero-check.spec.js',
  'login-badge.spec.js',
];

// Tests that matter on WebKit (Safari) — mobile PWA + signup only
// Landing page doesn't need WebKit: it looks fine and rarely changes.
// Focus WebKit budget on the mobile PWA (iPhone/iPad) where Safari bugs actually bite.
const WEBKIT_RESPONSIVE_TESTS = [
  'apple-compat.spec.js',
  'signup.spec.js',
  'verify-fixes.spec.js',
];

const isCI = !!process.env.CI;
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT || '3000');
const playwrightBaseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${playwrightPort}`;
const shouldReuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === 'true'
  ? true
  : process.env.PLAYWRIGHT_REUSE_SERVER === 'false'
    ? false
    : !isCI;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  workers: isCI ? 4 : 2,
  retries: isCI ? 0 : 1,
  reporter: 'list',
  use: {
    baseURL: playwrightBaseURL,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    // ── CHROMIUM (default) ──────────────────────────────────

    // Auth tests — local only (need Supabase credentials)
    ...(!isCI ? [{
      name: 'auth',
      testMatch: AUTH_TESTS,
      use: { viewport: { width: 1280, height: 720 } },
    }] : []),
    // Self-viewport tests — desktop only, no auth needed
    {
      name: 'desktop-only',
      testMatch: DESKTOP_ONLY_TESTS,
      use: { viewport: { width: 1280, height: 720 } },
    },
    // Responsive tests — 3 viewports
    {
      name: 'desktop',
      testMatch: RESPONSIVE_TESTS,
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'tablet',
      testMatch: RESPONSIVE_TESTS,
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      testMatch: RESPONSIVE_TESTS,
      use: { viewport: { width: 375, height: 812 } },
    },

    // ── WEBKIT (Safari engine) ──────────────────────────────
    // Focused on mobile PWA + signup — where Safari bugs actually matter.
    // Landing page tests skipped on WebKit (stable, rarely changes).

    // iPhone SE 2nd gen (375x667) — smallest modern iPhone, no notch
    {
      name: 'webkit-iphone-se',
      testMatch: WEBKIT_RESPONSIVE_TESTS,
      use: {
        ...devices['iPhone SE'],
        browserName: 'webkit',
      },
    },
    // iPhone 14 (390x844) — standard modern iPhone with notch
    {
      name: 'webkit-iphone-14',
      testMatch: WEBKIT_RESPONSIVE_TESTS,
      use: {
        ...devices['iPhone 14'],
        browserName: 'webkit',
      },
    },
    // iPad Mini (768x1024) — smallest iPad
    {
      name: 'webkit-ipad-mini',
      testMatch: WEBKIT_RESPONSIVE_TESTS,
      use: {
        ...devices['iPad Mini'],
        browserName: 'webkit',
      },
    },
    // iPad Pro 11 (834x1194) — mid-size iPad
    {
      name: 'webkit-ipad-pro-11',
      testMatch: WEBKIT_RESPONSIVE_TESTS,
      use: {
        ...devices['iPad Pro 11'],
        browserName: 'webkit',
      },
    },
    // Mobile PWA tests on WebKit (catches Safari-specific JS/layout bugs)
    {
      name: 'webkit-mobile-pwa',
      testMatch: [
        'mobile-pwa.spec.js',
        'mobile-pwa-flows.spec.js',
      ],
      use: {
        ...devices['iPhone 14'],
        browserName: 'webkit',
      },
    },
  ],
  webServer: {
    command: isCI ? 'npm start' : 'npm run dev',
    port: playwrightPort,
    timeout: 60000,
    reuseExistingServer: shouldReuseExistingServer,
  },
});
