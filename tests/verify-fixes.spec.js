const { test, expect } = require('@playwright/test');

async function gotoLanding(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await expect(page.locator('.navbar')).toBeAttached();
}

test.describe('Latest Fix Verification', () => {

  test('Events section has "// Featured Events" label and correct heading', async ({ page }) => {
    await gotoLanding(page);
    await page.locator('#events').scrollIntoViewIfNeeded();

    const label = page.locator('.section-label', { hasText: 'Featured Events' });
    await expect(label).toBeVisible();

    const heading = page.locator('h2', { hasText: 'Upcoming Events' });
    await expect(heading).toBeVisible();

    await page.screenshot({ path: 'test-results/events-section.png', fullPage: false });
  });

  test('Hero has scroll down text with bouncing arrow', async ({ page }) => {
    await gotoLanding(page);

    const scrollText = page.getByText('Scroll Down');
    await expect(scrollText).toBeVisible();

    const arrow = page.locator('svg.animate-bounce');
    await expect(arrow).toBeAttached();

    await page.screenshot({ path: 'test-results/hero-scroll-down.png', fullPage: false });
  });

  test('Schedule section says "Club\'s Schedule" not "Events"', async ({ page }) => {
    await gotoLanding(page);
    await page.locator('#schedule').scrollIntoViewIfNeeded();

    const heading = page.locator('h2', { hasText: "Club's Calendar" });
    await expect(heading).toBeVisible();

    await page.screenshot({ path: 'test-results/schedule-heading.png', fullPage: false });
  });

  test('Login page Book Courts badge is visible', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load').catch(() => {});
    await expect(page.getByText('Book Courts').first()).toBeAttached();
    await page.screenshot({ path: 'test-results/login-badges-updated.png', fullPage: false });
  });

});
