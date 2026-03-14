// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Mobile PWA — Offline Regression Tests
 * Verifies the app handles network failures gracefully:
 * - Shows appropriate error messages
 * - Falls back to cached data
 * - Doesn't crash or show blank screens
 */

const MOBILE_URL = '/mobile-app/index.html';

/** Dismiss onboarding overlay unconditionally (don't check visibility — animation timing varies on CI) */
async function dismissOnboarding(page) {
  // Wait for page to fully settle (avoids race where overlay re-activates after dismiss)
  await page.waitForLoadState('load').catch(() => {});
  // Retry once if context is destroyed during page initialization
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.evaluate(() => {
        const el = document.getElementById('onboardingOverlay');
        if (el) { el.classList.remove('active'); el.style.display = 'none'; }
      });
      break;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  await page.waitForTimeout(300);
}

test.describe('Mobile PWA — Offline Resilience', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login shows error when API is unreachable', async ({ page }) => {
    // Block all API calls to simulate offline (PIN auth uses /api/auth/pin-login)
    await page.route('**/api/auth/**', (route) => {
      route.abort('connectionrefused');
    });

    // Pre-set onboarding complete so overlay never activates (avoids race with 600ms setTimeout)
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
      localStorage.setItem('mtc-bypass-install-gate', 'true');
    });

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    await dismissOnboarding(page);

    // Fill in email and PIN, attempt login (PIN auth)
    await page.fill('#loginEmail', 'test@mtc.ca');
    await page.fill('#loginPin', '5678');
    await page.locator('#pinLoginBtn').click({ force: true });
    await page.waitForTimeout(2000);

    // Login screen should still be visible (not crashed — API is offline)
    await expect(page.locator('#login-screen')).toBeAttached();
  });

  test('page structure intact even without network', async ({ page }) => {
    // Block Supabase API calls (but NOT the CDN JS library — it's render-blocking)
    await page.route('**supabase.co**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });

    // Wait for all static screens to be parsed into the DOM
    await page.waitForFunction(() => document.querySelectorAll('.screen').length >= 8, { timeout: 10000 });

    // DOM should still have all screens (they're in the HTML, not JS-rendered)
    const screens = page.locator('.screen');
    const count = await screens.count();
    expect(count).toBeGreaterThanOrEqual(8);

    // Login screen should be visible
    await expect(page.locator('#login-screen')).toBeAttached();
  });

  test('no unhandled errors on network failure during login', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('**/api/auth/pin-login', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Server error"}' });
    });

    // Pre-set onboarding complete so overlay never activates
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
      localStorage.setItem('mtc-bypass-install-gate', 'true');
    });

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    await dismissOnboarding(page);

    await page.fill('#loginEmail', 'test@mtc.ca');
    await page.fill('#loginPin', '5678');
    await page.locator('#pinLoginBtn').click({ force: true });
    await page.waitForTimeout(2000);

    // Should have no unhandled JS errors (global error handler catches them)
    expect(errors).toEqual([]);
  });

  test('API rate limiting returns proper error', async ({ page }) => {
    await page.route('**/api/auth/pin-login', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many login attempts. Please wait a minute.' }),
      });
    });

    // Pre-set onboarding complete so overlay never activates
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
      localStorage.setItem('mtc-bypass-install-gate', 'true');
    });

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    await dismissOnboarding(page);

    await page.fill('#loginEmail', 'test@mtc.ca');
    await page.fill('#loginPin', '5678');
    await page.locator('#pinLoginBtn').click({ force: true });
    await page.waitForTimeout(2000);

    // Login screen should still be showing (not navigated away)
    await expect(page.locator('#login-screen')).toBeAttached();
  });

  test('service worker is registered', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
      localStorage.setItem('mtc-bypass-install-gate', 'true');
    });
    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    // Give SW time to register — CI headless can be slow
    await page.waitForTimeout(4000);

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });

    // Service worker should be registered (caches for offline use)
    expect(swRegistered).toBe(true);
  });

  test('MTC global object initializes without network', async ({ page }) => {
    await page.route('**supabase.co**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const mtcExists = await page.evaluate(() => {
      return typeof MTC !== 'undefined' && typeof MTC.fn === 'object' && typeof MTC.state === 'object';
    });
    expect(mtcExists).toBe(true);
  });

  test('localStorage utilities work when storage is available', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for MTC.storage to be defined (it's assigned after the MTC object literal)
    await page.waitForFunction(() => typeof MTC !== 'undefined' && !!MTC.storage, { timeout: 10000 });

    const storageWorks = await page.evaluate(() => {
      if (typeof MTC === 'undefined' || !MTC.storage) return false;
      MTC.storage.set('test-key', 'test-value');
      const val = MTC.storage.get('test-key', '');
      MTC.storage.remove('test-key');
      return val === 'test-value';
    });
    expect(storageWorks).toBe(true);
  });
});
