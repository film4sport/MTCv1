const { defineConfig } = require('@playwright/test');

// Tests that use Supabase auth or manage their own viewports — run desktop only
const DESKTOP_ONLY_TESTS = [
  'qa-full-flow.spec.js',
  'dashboard.spec.js',
  'responsive.spec.js',  // already loops through 3 viewports internally
  'mobile.spec.js',      // already sets its own viewport (390x812)
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

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2,
  retries: process.env.CI ? 0 : 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    // Auth-heavy & self-viewport tests — desktop only
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
    command: process.env.CI ? 'npm start' : 'npm run dev',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
