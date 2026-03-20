// @ts-check
const { test, expect } = require('@playwright/test');

async function gotoLanding(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && !!document.querySelector('footer'), null, { timeout: 10000 }).catch(() => {});
  await expect(page.locator('footer')).toBeAttached();
}

test.describe('Footer bottom whitespace check', () => {
  test('no visible whitespace gap below footer', async ({ page }) => {
    await gotoLanding(page);

    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
    await page.evaluate(() => {
      document.querySelector('footer')?.scrollIntoView({ block: 'end' });
    });

    // The body bg color should match the footer bg (#1a1f12), so any overflow
    // area is invisible (dark green on dark green). No visible whitespace.
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Body background: ${bodyBg}`);
    // rgb(26, 31, 18) = #1a1f12
    expect(bodyBg).toBe('rgb(26, 31, 18)');
  });

  test('footer padding-bottom is not inflated by safe-area rule', async ({ page }) => {
    await gotoLanding(page);
    const footer = page.locator('footer').first();
    await expect(footer).toBeAttached();

    const paddingBottom = await footer.evaluate((el) => window.getComputedStyle(el).paddingBottom);

    const pbValue = parseFloat(paddingBottom);
    console.log(`Footer padding-bottom: ${paddingBottom}`);
    // Footer has py-16 = 64px. The safe-area rule should NOT add extra on desktop.
    // So padding-bottom should be exactly 64px (py-16), not 128px (64 + 64).
    expect(pbValue).toBeLessThanOrEqual(65); // 64px + 1px tolerance
  });
});
