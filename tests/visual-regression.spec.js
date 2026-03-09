// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * Visual Regression Tests
 *
 * Takes screenshots of key pages/states and compares against baselines.
 * On first run: creates baseline screenshots in tests/screenshots/
 * On subsequent runs: compares current vs baseline, fails if different.
 *
 * Run with: npx playwright test visual-regression.spec.js
 * Update baselines: npx playwright test visual-regression.spec.js --update-snapshots
 */

const LANDING_URL = '/';
const MOBILE_URL = '/mobile-app/index.html';
const LOGIN_URL = '/login';
const SIGNUP_URL = '/signup';
const INFO_URL = '/info';

/** Dismiss cookie banners, overlays, and loader */
async function cleanPage(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  // Remove any transition animations for stable screenshots
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation-duration: 0s !important; }'
  });
  await page.waitForTimeout(500);
}

// ==========================================================
// Landing Page Screenshots
// ==========================================================
test.describe('Visual Regression — Landing Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('hero section', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    await expect(page).toHaveScreenshot('landing-hero-desktop.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('events section', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    // Scroll to events section
    await page.evaluate(() => {
      const el = document.getElementById('events') || document.querySelector('[data-section="events"]');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('landing-events-desktop.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('footer section', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('landing-footer-desktop.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });
});

// ==========================================================
// Landing Page — Mobile Viewport
// ==========================================================
test.describe('Visual Regression — Landing Page (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hero section mobile', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    await expect(page).toHaveScreenshot('landing-hero-mobile.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });
});

// ==========================================================
// Info Page Tabs
// ==========================================================
test.describe('Visual Regression — Info Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  const tabs = ['about', 'membership', 'coaching', 'faq', 'rules'];

  for (const tab of tabs) {
    test(`info tab: ${tab}`, async ({ page }) => {
      await page.goto(`${INFO_URL}?tab=${tab}`, { waitUntil: 'load', timeout: 30000 });
      await cleanPage(page);
      await expect(page).toHaveScreenshot(`info-${tab}-desktop.png`, {
        maxDiffPixelRatio: 0.02,
        fullPage: false,
      });
    });
  }
});

// ==========================================================
// Login & Signup Pages
// ==========================================================
test.describe('Visual Regression — Auth Pages', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('login page', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    await expect(page).toHaveScreenshot('login-desktop.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('signup page', async ({ page }) => {
    await page.goto(SIGNUP_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    await expect(page).toHaveScreenshot('signup-desktop.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });
});

// ==========================================================
// Mobile PWA — Key Screens
// ==========================================================
test.describe('Visual Regression — Mobile PWA', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /** Skip onboarding */
  async function skipOnboarding(page) {
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
    });
  }

  test('login screen', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    // Dismiss onboarding overlay if still visible
    await page.evaluate(() => {
      const el = document.getElementById('onboardingOverlay');
      if (el) { el.classList.remove('active'); el.style.display = 'none'; }
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('mobile-login.png', {
      maxDiffPixelRatio: 0.03,
      fullPage: false,
    });
  });

  test('home screen (authenticated)', async ({ page }) => {
    await skipOnboarding(page);

    // Mock auth
    await page.route('**/api/mobile-auth', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'member', name: 'Test User', email: 'test@mtc.ca',
          userId: 'test-123', accessToken: 'mock-token',
          membershipType: 'adult', familyId: null, familyMembers: [],
        }),
      });
    });

    await page.route('**supabase**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' });
    });

    await page.route('**/api/mobile/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('mtc-user', JSON.stringify({
        role: 'member', name: 'Test User', email: 'test@mtc.ca',
        userId: 'test-123', accessToken: 'mock-token',
      }));
    });

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);
    await page.evaluate(() => {
      const el = document.getElementById('onboardingOverlay');
      if (el) { el.classList.remove('active'); el.style.display = 'none'; }
      const login = document.getElementById('login-screen');
      if (login) login.style.display = 'none';
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('mobile-home.png', {
      maxDiffPixelRatio: 0.05, // slightly more tolerance for dynamic content
      fullPage: false,
    });
  });
});

// ==========================================================
// Full Page Screenshots (catch layout shifts)
// ==========================================================
test.describe('Visual Regression — Full Page Layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('landing page full height (no horizontal overflow)', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 1280;
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('info page full height (no horizontal overflow)', async ({ page }) => {
    await page.goto(INFO_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1281);
  });
});
