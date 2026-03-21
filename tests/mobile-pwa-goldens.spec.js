// @ts-check
const { test, expect } = require('@playwright/test');
const { mockAuthenticatedPwa } = require('./helpers/app-helpers');

/**
 * Mobile PWA Golden Screenshots
 * Captures the "baseline" visual state of the PWA before major refactors.
 * Run this to generate reference images in test-results/goldens/
 */

const MOBILE_URL = '/mobile-app/index.html';

async function skipOnboarding(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mtc-onboarding-complete', 'true');
    localStorage.setItem('mtc-bypass-install-gate', 'true');
    localStorage.setItem('mtc-user-theme', 'dark'); // Force dark for goldens
  });
}

test.describe('Mobile PWA Goldens', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14-ish

  test('Capture Golden: Login Screen', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto(MOBILE_URL);
    await page.waitForSelector('#login-screen.active');
    // Remove loader if present to avoid obstruction
    await page.evaluate(() => {
      const loader = document.getElementById('splashScreen');
      if (loader) loader.remove();
    });
    await page.screenshot({ path: 'test-results/goldens/mobile-login-dark.png' });
  });

  test('Capture Golden: Home Screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await skipOnboarding(page);
    await page.goto(MOBILE_URL);
    await page.waitForSelector('#screen-home.active');
    await page.evaluate(() => {
      const loader = document.getElementById('splashScreen');
      if (loader) loader.remove();
    });
    // Wait for animations to settle
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/goldens/mobile-home-dark.png' });
  });

  test('Capture Golden: Booking Screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await skipOnboarding(page);
    await page.goto(MOBILE_URL);
    await page.evaluate(() => {
      // @ts-ignore
      if (window.MTC && window.MTC.fn) window.MTC.fn.navigateTo('book');
    });
    await page.waitForSelector('#screen-book.active');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/goldens/mobile-booking-dark.png' });
  });

  test('Capture Golden: Partners Screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await skipOnboarding(page);
    await page.goto(MOBILE_URL);
    await page.evaluate(() => {
      // @ts-ignore
      if (window.MTC && window.MTC.fn) window.MTC.fn.navigateTo('partners');
    });
    await page.waitForSelector('#screen-partners.active');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/goldens/mobile-partners-dark.png' });
  });

  test('Capture Golden: Settings Screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await skipOnboarding(page);
    await page.goto(MOBILE_URL);
    await page.evaluate(() => {
      // @ts-ignore
      if (window.MTC && window.MTC.fn) window.MTC.fn.navigateTo('settings');
    });
    await page.waitForSelector('#screen-settings.active');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/goldens/mobile-settings-dark.png' });
  });
});
