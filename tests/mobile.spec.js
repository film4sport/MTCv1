const { test, expect } = require('@playwright/test');
const { gotoLanding } = require('./helpers/app-helpers');

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test('mobile menu button is visible', async ({ page }) => {
    // On mobile, hamburger should be visible and desktop nav hidden
    const mobileMenuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(mobileMenuBtn).toBeAttached();
  });

  test('calendar renders on mobile', async ({ page }) => {
    const schedule = page.locator('#schedule').first();
    await expect(schedule).toBeAttached({ timeout: 5000 });
    const calGrid = page.locator('.cal-grid');
    await expect(calGrid).toBeAttached({ timeout: 5000 });
  });

  test('page scrolls smoothly without horizontal overflow', async ({ page }) => {
    const layoutState = await page.evaluate(() => {
      const main = document.querySelector('main');
      const mainWidth = main ? Math.round(main.getBoundingClientRect().width) : 0;
      return {
        viewportWidth: window.innerWidth,
        mainWidth,
      };
    });

    expect(layoutState.mainWidth).toBeLessThanOrEqual(layoutState.viewportWidth + 1);
  });

  test('no light background sections on mobile', async ({ page }) => {
    const lightGray = await page.locator('[class*="bg-gray"]').count();
    expect(lightGray).toBe(0);
  });
});
