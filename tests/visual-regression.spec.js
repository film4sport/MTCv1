// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Tests
 *
 * Verifies key pages render correctly by checking:
 * - No JavaScript errors during load
 * - Expected DOM elements are present and visible
 * - No horizontal overflow (layout integrity)
 * - Pages take screenshots without crashing (forces full render pipeline)
 *
 * Uses render-verification instead of pixel comparison (toHaveScreenshot)
 * because pixel comparison requires OS-specific baselines and breaks across
 * CI environments (Linux) vs dev machines (Windows/Mac).
 */

const LANDING_URL = '/';
const MOBILE_URL = '/mobile-app/index.html';
const LOGIN_URL = '/login';
const SIGNUP_URL = '/signup';
const INFO_URL = '/info';

/** Wait for page to stabilize, inject animation freeze */
async function cleanPage(page) {
  // Use 'load' event (already waited by goto) + short delay instead of 'networkidle'
  // which hangs on pages with SSE/long-polling connections
  await page.waitForTimeout(1500);
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation-duration: 0s !important; }'
  });
  await page.waitForTimeout(300);
}

// ==========================================================
// Landing Page
// ==========================================================
test.describe('Visual Regression — Landing Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('hero section renders correctly', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    // Hero section exists — it's the first <section> with texture-overlay class
    const hero = page.locator('section.texture-overlay, section.overflow-hidden').first();
    await expect(hero).toBeAttached();

    // Hero has CTA buttons
    const buttons = page.locator('section.texture-overlay a, section.overflow-hidden a');
    expect(await buttons.count()).toBeGreaterThanOrEqual(1);

    // Take screenshot to force full render
    await page.screenshot({ path: 'test-results/landing-hero-desktop.png' });

    // No JS errors
    expect(errors.filter(e => !e.includes('MTC Error Report'))).toHaveLength(0);
  });

  test('events section renders correctly', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    await page.evaluate(() => {
      const el = document.getElementById('events') || document.querySelector('[data-section="events"]');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Events section has cards
    const cards = page.locator('#events .event-card, [data-section="events"] [class*="card"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: 'test-results/landing-events-desktop.png' });
  });

  test('footer section renders correctly', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Footer exists
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    // Footer has address
    const text = await footer.textContent();
    expect(text).toContain('Mono');

    await page.screenshot({ path: 'test-results/landing-footer-desktop.png' });
  });
});

// ==========================================================
// Landing Page — Mobile Viewport
// ==========================================================
test.describe('Visual Regression — Landing Page (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hero section mobile renders correctly', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    // No horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);

    // Hero visible — first section with texture-overlay class
    const hero = page.locator('section.texture-overlay, section.overflow-hidden').first();
    await expect(hero).toBeAttached();

    await page.screenshot({ path: 'test-results/landing-hero-mobile.png' });

    expect(errors.filter(e => !e.includes('MTC Error Report'))).toHaveLength(0);
  });
});

// ==========================================================
// Info Page Tabs
// ==========================================================
test.describe('Visual Regression — Info Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  const tabs = ['about', 'membership', 'coaching', 'faq', 'rules'];

  for (const tab of tabs) {
    test(`info tab: ${tab} renders correctly`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(`${INFO_URL}?tab=${tab}`, { waitUntil: 'load', timeout: 30000 });
      await cleanPage(page);

      // Tab content area exists
      const content = page.locator('[class*="tab"], [role="tabpanel"], main').first();
      await expect(content).toBeAttached();

      // Page has visible text content
      const bodyText = await page.evaluate(() => document.body.innerText.length);
      expect(bodyText).toBeGreaterThan(100);

      // No horizontal overflow
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(1281);

      await page.screenshot({ path: `test-results/info-${tab}-desktop.png` });

      expect(errors.filter(e => !e.includes('MTC Error Report'))).toHaveLength(0);
    });
  }
});

// ==========================================================
// Login & Signup Pages
// ==========================================================
test.describe('Visual Regression — Auth Pages', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('login page renders correctly', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(LOGIN_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    // Login form or page content exists
    const loginContent = page.locator('form, [class*="login"], main').first();
    await expect(loginContent).toBeAttached();

    await page.screenshot({ path: 'test-results/login-desktop.png' });

    expect(errors.filter(e => !e.includes('MTC Error Report'))).toHaveLength(0);
  });

  test('signup page renders correctly', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(SIGNUP_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    // Signup page renders — outermost div has min-h-screen
    const signupContent = page.locator('div.min-h-screen, [class*="min-h-screen"]').first();
    await expect(signupContent).toBeAttached();

    await page.screenshot({ path: 'test-results/signup-desktop.png' });

    expect(errors.filter(e => !e.includes('MTC Error Report'))).toHaveLength(0);
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

  test('login screen renders correctly', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await skipOnboarding(page);
    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    // Dismiss onboarding overlay if still visible
    await page.evaluate(() => {
      const el = document.getElementById('onboardingOverlay');
      if (el) { el.classList.remove('active'); el.style.display = 'none'; }
    });

    // Login screen exists
    const loginScreen = page.locator('#login-screen').first();
    await expect(loginScreen).toBeAttached();

    // Has login buttons (Google and/or magic link)
    const buttons = page.locator('#login-screen button, #login-screen [class*="btn"]');
    expect(await buttons.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: 'test-results/mobile-login.png' });

    // Filter out expected errors (Supabase auth network failures in test env)
    const realErrors = errors.filter(e =>
      !e.includes('MTC Error Report') &&
      !e.includes('supabase') &&
      !e.includes('fetch')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('home screen (authenticated) renders correctly', async ({ page }) => {
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

    // App container exists
    const app = page.locator('#app').first();
    await expect(app).toBeAttached();

    // Bottom nav exists
    const nav = page.locator('.bottom-nav, nav').first();
    await expect(nav).toBeAttached();

    await page.screenshot({ path: 'test-results/mobile-home.png' });
  });
});

// ==========================================================
// Full Page Layout Checks
// ==========================================================
test.describe('Visual Regression — Full Page Layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('landing page full height (no horizontal overflow)', async ({ page }) => {
    await page.goto(LANDING_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1281);
  });

  test('info page full height (no horizontal overflow)', async ({ page }) => {
    await page.goto(INFO_URL, { waitUntil: 'load', timeout: 30000 });
    await cleanPage(page);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1281);
  });
});
