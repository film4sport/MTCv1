const { test, expect } = require('@playwright/test');

test.describe('Bug Fix Verification', () => {

  test('Hero → wave transition: no bottom text bleeding through', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Verify the bottom section text does NOT exist anywhere
    const scrollDown = page.locator('text=// Scroll Down');
    await expect(scrollDown).toHaveCount(0);

    const tennis2026 = page.locator('text=// 2026');
    await expect(tennis2026).toHaveCount(0);

    const tennisLabel = page.locator('text=// Tennis');
    await expect(tennisLabel).toHaveCount(0);

    // Scroll to hero-wave transition and screenshot
    await page.evaluate(() => window.scrollTo(0, window.innerHeight - 200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/hero-wave-clean.png', fullPage: false });

    // Wave divider should still exist
    const waveDivider = page.locator('.wave-divider').first();
    await expect(waveDivider).toBeVisible();
  });

  test('Events section heading is "Upcoming Events & Tournaments"', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Scroll to events section
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check correct heading exists
    const heading = page.locator('h2', { hasText: 'Upcoming Events & Tournaments' });
    await expect(heading).toBeVisible();

    // Check old heading text does NOT exist
    const oldHeading = page.locator('text=Events & Programs for Every Player');
    await expect(oldHeading).toHaveCount(0);

    // Check "// Events & Programs" label does NOT exist
    const oldLabel = page.locator('text=// Events & Programs');
    await expect(oldLabel).toHaveCount(0);

    await page.screenshot({ path: 'test-results/events-heading.png', fullPage: false });
  });

  test('Three middle dividers are straight (no SVG wave)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Count total wave dividers on the page — should be exactly 2
    // (hero→events and gallery→footer)
    const waveDividers = page.locator('.wave-divider');
    const count = await waveDividers.count();
    expect(count).toBe(2);

    // Take full page screenshot to verify layout
    await page.screenshot({ path: 'test-results/landing-fullpage.png', fullPage: true });
  });

  test('Login page renders correctly (CSP not blocking)', async ({ page }) => {
    // Listen for CSP errors
    const cspErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('content-security-policy')) {
        cspErrors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/login-page-final.png', fullPage: false });

    // No CSP errors
    expect(cspErrors.length).toBe(0);
  });

});
