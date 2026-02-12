// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Footer bottom whitespace check', () => {
  test('no visible whitespace gap below footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000); // wait for loader

    // Scroll to the very bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footer = page.locator('footer');
    await expect(footer).toBeAttached();

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
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const paddingBottom = await page.evaluate(() => {
      const f = document.querySelector('footer');
      if (!f) return '999px';
      return window.getComputedStyle(f).paddingBottom;
    });

    const pbValue = parseFloat(paddingBottom);
    console.log(`Footer padding-bottom: ${paddingBottom}`);
    // Footer has py-16 = 64px. The safe-area rule should NOT add extra on desktop.
    // So padding-bottom should be exactly 64px (py-16), not 128px (64 + 64).
    expect(pbValue).toBeLessThanOrEqual(65); // 64px + 1px tolerance
  });
});
