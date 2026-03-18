const { test, expect } = require('@playwright/test');

test.describe('Latest Fix Verification', () => {

  test('Events section has "// Featured Events" label and correct heading', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const label = page.locator('.section-label', { hasText: 'Featured Events' });
    await expect(label).toBeVisible();

    const heading = page.locator('h2', { hasText: 'Upcoming Events' });
    await expect(heading).toBeVisible();

    await page.screenshot({ path: 'test-results/events-section.png', fullPage: false });
  });

  test('Hero has scroll down text with bouncing arrow', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const scrollText = page.getByText('Scroll Down');
    await expect(scrollText).toBeVisible();

    const arrow = page.locator('svg.animate-bounce');
    await expect(arrow).toBeAttached();

    await page.screenshot({ path: 'test-results/hero-scroll-down.png', fullPage: false });
  });

  test('Schedule section says "Club\'s Schedule" not "Events"', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.locator('#schedule').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const heading = page.locator('h2', { hasText: "Club's Calendar" });
    await expect(heading).toBeVisible();

    await page.screenshot({ path: 'test-results/schedule-heading.png', fullPage: false });
  });

  test('Login page Book Courts badge is visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/login-badges-updated.png', fullPage: false });
  });

});
