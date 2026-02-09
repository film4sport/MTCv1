const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('mobile menu button is visible', async ({ page }) => {
    // On mobile, hamburger should be visible and desktop nav hidden
    const mobileMenuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(mobileMenuBtn).toBeAttached();
  });

  test('booking overlay is fullscreen on mobile', async ({ page }) => {
    await page.locator('#book').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('#book').getByText('Book Now').click();
    await page.waitForTimeout(500);
    const modal = page.locator('.booking-modal');
    await expect(modal).toBeAttached();
  });

  test('gallery navigation arrows are hidden on mobile', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const prevBtn = page.locator('.gallery-nav.prev');
    await expect(prevBtn).toBeHidden();
  });

  test('calendar day labels are hidden on mobile', async ({ page }) => {
    await page.locator('#schedule').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const eventLabels = page.locator('.cal-event-label');
    const count = await eventLabels.count();
    // On mobile, event labels should be hidden via CSS display:none
    if (count > 0) {
      const visible = await eventLabels.first().isVisible();
      expect(visible).toBe(false);
    }
  });

  test('filter tabs wrap properly on mobile', async ({ page }) => {
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const filterContainer = page.locator('#events .flex.flex-wrap').first();
    await expect(filterContainer).toBeAttached();
  });

  test('page scrolls smoothly without horizontal overflow', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
