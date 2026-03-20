// @ts-check
const { test, expect } = require('@playwright/test');
const { mockAuthenticatedPwa, navigatePwaScreen } = require('./helpers/app-helpers');

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
    await expect(page.locator('#screen-book.active')).toBeAttached();

    await navigatePwaScreen(page, 'schedule');
    await expect(page.locator('#screen-schedule.active')).toBeAttached();
  });

  test('navigateTo function works via JS evaluation', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'book');
    await expect(page.locator('#screen-book.active')).toBeAttached();
  });

  test('can navigate to partners screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'partners');
    await expect(page.locator('#screen-partners.active')).toBeAttached();
  });

  test('navigating to profile redirects to settings screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'profile');
    await expect(page.locator('#screen-settings.active')).toBeAttached();
  });

  test('can navigate to settings screen', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await navigatePwaScreen(page, 'settings');
    await expect(page.locator('#screen-settings.active')).toBeAttached();
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

    await expect(page.locator('#screen-schedule.active')).toBeAttached({ timeout: 5000 });
  });
});
