const { defineConfig } = require('@playwright/test');

// Tests requiring Supabase auth — only run locally (no env vars in CI)
const AUTH_TESTS = [
  'qa-full-flow.spec.js',
  'dashboard.spec.js',
];

// Tests that manage their own viewports — run desktop only (no auth needed)
const DESKTOP_ONLY_TESTS = [
  'responsive.spec.js',  // already loops through 3 viewports internally
  'mobile.spec.js',      // already sets its own viewport (390x812)
  'mobile-pwa.spec.js',  // mobile PWA tests (390x844 viewport)
];

// All other tests run on all 3 viewports for responsive coverage
const RESPONSIVE_TESTS = [
  'landing.spec.js',
  'signup.spec.js',
  'verify-fixes.spec.js',
  'footer-gap.spec.js',
  'hero-closeup.spec.js',
  'hero-check.spec.js',
  'login-badge.spec.js',
];

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  workers: isCI ? 4 : 2,
  retries: isCI ? 0 : 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
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
  ],
  webServer: {
    command: isCI ? 'npm start' : 'npm run dev',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: !isCI,
  },
});
