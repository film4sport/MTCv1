const { test } = require('@playwright/test');

test('Login page phone mockup badge positions', async ({ page }) => {
  await page.goto('/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/login-badges.png', fullPage: false });
});
