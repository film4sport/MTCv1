// @ts-check
const { test, expect } = require('@playwright/test');
const { activatePwaScreen, gotoInfo, mockAuthenticatedPwa } = require('./helpers/app-helpers');

test.describe('Chromium Compatibility - Info Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await gotoInfo(page, 'membership');
    await expect(page.locator('#tab-membership')).toBeVisible();
  });

  test('far-right tabs stay reachable across Chromium breakpoints', async ({ page }) => {
    const privacy = page.locator('#tab-privacy');
    const terms = page.locator('#tab-terms');
    await expect(privacy).toBeAttached({ timeout: 5000 });
    await expect(terms).toBeAttached({ timeout: 5000 });
    await privacy.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await terms.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await expect(privacy).toBeVisible();
    await expect(terms).toBeVisible();
  });

  test('layout remains usable after breakpoint-like resize', async ({ page }) => {
    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    const resizedWidth = viewport.width <= 430 ? 812 : viewport.width <= 900 ? 1024 : 1100;
    const resizedHeight = viewport.width <= 430 ? 375 : viewport.width <= 900 ? 768 : 700;

    await page.setViewportSize({ width: resizedWidth, height: resizedHeight });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const tablist = page.locator('[role="tablist"]');
    const terms = page.locator('#tab-terms');
    await expect(tablist).toBeVisible();
    await terms.scrollIntoViewIfNeeded();
    await expect(terms).toBeVisible();
  });
});

test.describe('Chromium Compatibility - Desktop Login', () => {
  test('desktop login keeps form and phone mockup visible without overflow', async ({ page }) => {
    test.skip((page.viewportSize()?.width || 0) < 1000, 'Desktop-only assertion');

    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.locator('#email').or(page.locator('input[type="email"]')).first()).toBeVisible();
    await expect(page.locator('text=Book Courts').first()).toBeAttached();
    await page.waitForLoadState('load').catch(() => {});

    await expect.poll(async () => {
      try {
        return await page.evaluate(() => ({
          bodyWidth: document.body.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
      } catch {
        return null;
      }
    }, { timeout: 10000 }).toEqual(expect.objectContaining({
      bodyWidth: expect.any(Number),
      viewportWidth: expect.any(Number),
    }));

    const widths = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.viewportWidth + 1);
  });
});

test.describe('Chromium Compatibility - Mobile PWA', () => {
  test('mobile PWA bottom nav survives resize and still navigates', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    const bottomNav = page.locator('#bottomNav');
    await expect(bottomNav).toBeVisible();

    await activatePwaScreen(page, 'book', 'nav-book');
    await activatePwaScreen(page, 'messages', 'nav-messages');
  });
});
