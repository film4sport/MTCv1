const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const vp of viewports) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {

    test.use({ viewport: { width: vp.width, height: vp.height } });

    async function gotoLanding(page) {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForFunction(() => document.readyState === 'complete' && !!document.querySelector('#schedule') && !!document.querySelector('footer'), null, { timeout: 10000 }).catch(() => {});
    }

    test('Landing page full scroll', async ({ page }) => {
      await gotoLanding(page);
      await page.screenshot({ path: `test-results/landing-${vp.name}.png`, fullPage: true });
    });

    test('Login page', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.screenshot({ path: `test-results/login-${vp.name}.png`, fullPage: false });
    });

    test('Info page (membership tab)', async ({ page }) => {
      await page.goto('/info?tab=membership', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.screenshot({ path: `test-results/info-${vp.name}.png`, fullPage: false });
    });

    test('Schedule section', async ({ page }) => {
      await gotoLanding(page);
      const schedule = page.locator('#schedule').first();
      await expect(schedule).toBeAttached();
      await schedule.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/schedule-${vp.name}.png`, fullPage: false });
    });

    test('Footer section', async ({ page }) => {
      await gotoLanding(page);
      await page.locator('footer').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/footer-${vp.name}.png`, fullPage: false });
    });

  });
}
