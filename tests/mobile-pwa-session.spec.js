// @ts-check
const { test, expect } = require('@playwright/test');

const MOBILE_URL = '/mobile-app/index.html';

test.describe('Mobile PWA - Session Recovery', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('stale saved user without active PIN session shows PIN setup instead of entering the app', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
      localStorage.setItem('mtc-bypass-install-gate', 'true');
      localStorage.setItem('mtc-user', JSON.stringify({
        id: 'legacy-user-1',
        name: 'Legacy User',
        email: 'legacy@mtc.ca',
        role: 'member',
        isMember: true,
      }));
      localStorage.removeItem('mtc-session-active');
    });

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);

    const pinSetupVisible = await page.locator('#pinSetupCard').isVisible().catch(() => false);
    expect(pinSetupVisible).toBe(true);
    await expect(page.locator('#screen-home.active')).toHaveCount(0);
  });

  test('logout confirmation returns user cleanly to login screen and clears session keys', async ({ page }) => {
    await page.addInitScript(() => {
      const user = {
        id: 'member-1',
        name: 'Session User',
        email: 'session@mtc.ca',
        role: 'member',
        isMember: true,
      };
      localStorage.setItem('mtc-onboarding-complete', 'true');
      localStorage.setItem('mtc-bypass-install-gate', 'true');
      localStorage.setItem('mtc-user', JSON.stringify(user));
      localStorage.setItem('mtc-session-active', 'true');
      localStorage.setItem('mtc-access-token', 'sess-test-token');
      localStorage.setItem('mtc-notifications', JSON.stringify([{ id: 'n1' }]));
      localStorage.setItem('mtc-conversations', JSON.stringify({ member: [] }));
    });

    await page.route('**/api/auth/session', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto(MOBILE_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1200);

    await page.evaluate(() => { window.handleLogout(); });
    await expect(page.locator('#confirmModal.active')).toBeVisible();
    await page.locator('#confirmModalConfirm').click();
    await page.waitForTimeout(600);

    await expect(page.locator('#login-screen.active')).toBeVisible();

    const state = await page.evaluate(() => ({
      user: localStorage.getItem('mtc-user'),
      token: localStorage.getItem('mtc-access-token'),
      notifications: localStorage.getItem('mtc-notifications'),
      conversations: localStorage.getItem('mtc-conversations'),
      bottomNavDisplay: window.getComputedStyle(document.getElementById('bottomNav')).display,
      loginDisplay: window.getComputedStyle(document.getElementById('login-screen')).display,
    }));

    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.notifications).toBe(null);
    expect(state.conversations).toBe(null);
    expect(state.bottomNavDisplay).toBe('none');
    expect(state.loginDisplay).not.toBe('none');
  });
});
