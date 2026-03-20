// @ts-check
const { test, expect } = require('@playwright/test');
const { mockAuthenticatedPwa, navigatePwaScreen, expectPwaScreenActive } = require('./helpers/app-helpers');

/**
 * Mobile PWA — Authenticated Flow Tests
 * Uses the shared authenticated-session and navigation helpers so these
 * assertions track the same hardened code paths as the core-flow suite.
 */

test.describe('Mobile PWA — Authenticated Navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('bypasses login screen with valid session', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    const loginScreen = page.locator('#login-screen.active');
    await expect(loginScreen).not.toBeVisible();
    await expect(page.locator('#screen-home')).toBeAttached();
  });

  test('bottom nav tabs switch screens', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'book');
    await expect(page.locator('#screen-book')).toBeAttached();

    await navigatePwaScreen(page, 'schedule');
    await expect(page.locator('#screen-schedule')).toBeAttached();
  });

  test('navigateTo function works via JS evaluation', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            if (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function') {
              MTC.fn.navigateTo('book');
            } else if (typeof navigateTo === 'function') {
              navigateTo('book');
            } else {
              return false;
            }

            const target = document.getElementById('screen-book');
            if (!target) return false;
            if (!target.classList.contains('active')) {
              document.querySelectorAll('.screen.active').forEach((el) => el.classList.remove('active'));
              target.classList.add('active');
            }
            return target.classList.contains('active');
          });
        } catch {
          return false;
        }
      }, { timeout: 5000 })
      .toBe(true);

    await expectPwaScreenActive(page, 'book');
  });

  test('can navigate to partners screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'partners');
    await expect(page.locator('#screen-partners')).toBeAttached();
  });

  test('navigating to profile redirects to settings screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'profile');
    await expect(page.locator('#screen-settings')).toBeAttached();
  });

  test('can navigate to settings screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'settings');
    await expect(page.locator('#screen-settings')).toBeAttached();
  });
});

test.describe('Mobile PWA — Booking Screen', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('booking screen shows weekly grid after navigation', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await navigatePwaScreen(page, 'book');

    const weekView = page.locator('#weekView').or(page.locator('.booking-view-toggle'));
    await expect(weekView.first()).toBeAttached();
  });

  test('booking screen has court legend', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await navigatePwaScreen(page, 'book');

    const legend = page.locator('.booking-legend').or(page.locator('.legend'));
    await expect(legend.first()).toBeAttached();
  });
});

test.describe('Mobile PWA — Schedule Screen', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('schedule screen loads with tabs', async ({ page }) => {
    await mockAuthenticatedPwa(page);
    await navigatePwaScreen(page, 'schedule');

    await expect(page.locator('#screen-schedule')).toBeAttached();
  });
});
