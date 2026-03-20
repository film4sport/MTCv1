const { test, expect } = require('@playwright/test');

async function gotoLanding(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && !!document.querySelector('.wave-divider'), null, { timeout: 10000 }).catch(() => {});
  await expect(page.locator('.hero-content').first()).toBeAttached();
}

test('Hero bottom + wave transition', async ({ page }) => {
  await gotoLanding(page);

  const wave = page.locator('.wave-divider').first();
  await expect(wave).toBeAttached();
  await page.evaluate(() => {
    document.querySelector('.wave-divider')?.scrollIntoView({ block: 'center' });
  });
  await page.screenshot({ path: 'test-results/hero-bottom-check.png', fullPage: false });
});
