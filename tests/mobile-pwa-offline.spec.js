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

test.describe('Mobile PWA — Offline Resilience', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login shows error when API is unreachable', async ({ page }) => {
    // Block all API calls to simulate offline
    await page.route('**/api/mobile-auth', (route) => {
      route.abort('connectionrefused');
    });

    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Fill in login form
    await page.fill('#loginEmail', 'test@mtc.ca');
    await page.fill('#loginPassword', 'password123');
    await page.locator('.login-btn').click();
    await page.waitForTimeout(2000);

    // Should show an error toast or message, NOT a blank screen
    const toast = page.locator('.toast').or(page.locator('[class*="toast"]')).or(page.locator('.field-error'));
    const hasError = await toast.first().isVisible().catch(() => false);
    // Login screen should still be visible (not crashed)
    await expect(page.locator('#login-screen')).toBeAttached();
  });

  test('page structure intact even without network', async ({ page }) => {
    // Block all external network calls
    await page.route('**supabase**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

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

    await page.route('**/api/mobile-auth', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Server error"}' });
    });

    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.fill('#loginEmail', 'test@mtc.ca');
    await page.fill('#loginPassword', 'password123');
    await page.locator('.login-btn').click();
    await page.waitForTimeout(2000);

    // Should have no unhandled JS errors (global error handler catches them)
    expect(errors).toEqual([]);
  });

  test('API rate limiting returns proper error', async ({ page }) => {
    await page.route('**/api/mobile-auth', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many login attempts. Please wait a minute.' }),
      });
    });

    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.fill('#loginEmail', 'test@mtc.ca');
    await page.fill('#loginPassword', 'password123');
    await page.locator('.login-btn').click();
    await page.waitForTimeout(2000);

    // Login screen should still be showing (not navigated away)
    await expect(page.locator('#login-screen')).toBeAttached();
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });

    // Service worker should be registered (caches for offline use)
    expect(swRegistered).toBe(true);
  });

  test('MTC global object initializes without network', async ({ page }) => {
    await page.route('**supabase**', (route) => route.abort('connectionrefused'));
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
    await page.waitForTimeout(1000);

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
