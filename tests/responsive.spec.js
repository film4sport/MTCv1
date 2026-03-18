const { test } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const vp of viewports) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {

    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Landing page full scroll', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `test-results/landing-${vp.name}.png`, fullPage: true });
    });

    test('Login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `test-results/login-${vp.name}.png`, fullPage: false });
    });

    test('Info page (membership tab)', async ({ page }) => {
      await page.goto('/info?tab=membership');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/info-${vp.name}.png`, fullPage: false });
    });

    test('Schedule section', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);
      await page.locator('#schedule').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/schedule-${vp.name}.png`, fullPage: false });
    });

    test('Footer section', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/footer-${vp.name}.png`, fullPage: false });
    });

  });
}
