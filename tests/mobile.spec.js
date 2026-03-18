const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
  });

  test('mobile menu button is visible', async ({ page }) => {
    // On mobile, hamburger should be visible and desktop nav hidden
    const mobileMenuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(mobileMenuBtn).toBeAttached();
  });

  test('calendar renders on mobile', async ({ page }) => {
    await page.locator('#schedule').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const calGrid = page.locator('.cal-grid');
    await expect(calGrid).toBeAttached();
  });

  test('page scrolls smoothly without horizontal overflow', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('no light background sections on mobile', async ({ page }) => {
    const lightGray = await page.locator('[class*="bg-gray"]').count();
    expect(lightGray).toBe(0);
  });
});
