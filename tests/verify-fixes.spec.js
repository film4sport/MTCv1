const { test, expect } = require('@playwright/test');

test.describe('Bug Fix Verification', () => {

  test('Hero wave: no bottom text bleeding through', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Verify "Scroll Down", "2026", "Tennis" decorative text does NOT exist
    const body = await page.textContent('body');
    expect(body).not.toContain('Scroll Down');
    expect(body).not.toContain('// 2026');
    expect(body).not.toContain('// Tennis');

    // Scroll to hero-wave transition and screenshot
    await page.evaluate(() => window.scrollTo(0, window.innerHeight - 200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/hero-wave-clean.png', fullPage: false });

    // Wave divider should still exist
    const waveDivider = page.locator('.wave-divider').first();
    await expect(waveDivider).toBeVisible();
  });

  test('Events heading is "Upcoming Events & Tournaments"', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Correct heading exists
    const heading = page.locator('h2', { hasText: 'Upcoming Events & Tournaments' });
    await expect(heading).toBeVisible();

    // Old heading gone
    const body = await page.textContent('body');
    expect(body).not.toContain('Programs for Every Player');

    await page.screenshot({ path: 'test-results/events-heading.png', fullPage: false });
  });

  test('Only 2 wave dividers remain (hero+footer)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const waveDividers = page.locator('.wave-divider');
    const count = await waveDividers.count();
    expect(count).toBe(2);

    await page.screenshot({ path: 'test-results/landing-fullpage.png', fullPage: true });
  });

  test('Login page renders (no CSP block)', async ({ page }) => {
    const cspErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('content-security-policy')) {
        cspErrors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/login-page-final.png', fullPage: false });

    expect(cspErrors.length).toBe(0);
  });

});
