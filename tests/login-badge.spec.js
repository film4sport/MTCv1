const { test, expect } = require('@playwright/test');

test('Login page phone mockup badge positions', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await expect(page.getByText('Book Courts').first()).toBeAttached();
  await page.screenshot({ path: 'test-results/login-badges.png', fullPage: false });
});
