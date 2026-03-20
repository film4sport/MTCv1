// @ts-check
const { test, expect } = require('@playwright/test');
const { activatePwaScreen, gotoInfo, mockAuthenticatedPwa, switchInfoTab } = require('./helpers/app-helpers');

test.describe('Apple Compatibility - Info Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await gotoInfo(page, 'membership');
    await expect(page.locator('#tab-membership')).toBeVisible();
  });

  test('far-right tabs stay reachable on iPhone/iPad Safari', async ({ page }) => {
    await expect(page.locator('#tab-privacy')).toBeVisible();
    await switchInfoTab(page, 'Privacy', 'privacy');
    await switchInfoTab(page, 'Terms', 'terms');
  });

  test('info page remains usable after landscape rotation', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    const tablist = page.locator('[role="tablist"]').first();
    await expect(tablist).toBeVisible();
    const terms = page.locator('#tab-terms').first();
    await expect(terms).toBeAttached();
    await switchInfoTab(page, 'Terms', 'terms');
    await expect(terms).toBeVisible();
  });
});

test.describe('Apple Compatibility - Mobile PWA', () => {
  test('bottom nav survives landscape rotation and still navigates', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await page.setViewportSize({ width: 844, height: 390 });

    const bottomNav = page.locator('#bottomNav');
    await expect(bottomNav).toBeVisible();

    await activatePwaScreen(page, 'book', 'nav-book');
    await activatePwaScreen(page, 'messages', 'nav-messages');
  });
});
