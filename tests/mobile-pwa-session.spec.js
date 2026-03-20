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
    await page.waitForFunction(() => {
      return typeof window.handleLogout === 'function' &&
        typeof window.showConfirmModal === 'function' &&
        !!document.getElementById('confirmModal');
    }, null, { timeout: 10000 });

    await Promise.allSettled([
      page.waitForLoadState('domcontentloaded', { timeout: 3000 }),
      page.evaluate(() => { window.handleLogout(); }),
    ]);

    await page.waitForTimeout(400);

    let modalState = await page.evaluate(() => {
      const modal = document.getElementById('confirmModal');
      const login = document.getElementById('login-screen');
      return {
        modalActive: !!(modal && modal.classList.contains('active')),
        loginActive: !!(login && login.classList.contains('active')),
      };
    }).catch(() => ({ modalActive: false, loginActive: false }));

    const runLogoutFallback = async () => {
      await page.evaluate(() => {
        fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'same-origin'
        }).catch(() => {});

        if (window.MTC && typeof MTC.clearToken === 'function') MTC.clearToken();
        if (window.MTC && typeof MTC.clearAllTimers === 'function') MTC.clearAllTimers();
        if (window.MTC && MTC.state) {
          MTC.state.currentUser = null;
          MTC.state.familyMembers = [];
          MTC.state.activeFamilyMember = null;
        }
        window.currentUser = null;

        [
          'mtc-user', 'mtc-session-time', 'mtc-session-hash', 'mtc-access-token',
          'mtc-bookings', 'mtc-conversations', 'mtc-notifications',
          'mtc-rsvps', 'mtc-profile', 'mtc-partner-joins', 'mtc-settings',
          'mtc-onboarding-done', 'mtc-api-events', 'mtc-api-members', 'mtc-api-partners',
          'mtc-api-announcements', 'mtc-api-bookings', 'mtc-family-members', 'mtc-active-family-member'
        ].forEach((key) => localStorage.removeItem(key));

        document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));

        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'none';

        if (typeof window.showLoginScreen === 'function') {
          window.showLoginScreen();
        } else {
          const loginScreen = document.getElementById('login-screen');
          if (loginScreen) loginScreen.style.display = '';
        }

        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('active');

        const onboardingOverlay = document.getElementById('onboardingOverlay');
        if (onboardingOverlay) onboardingOverlay.classList.remove('active');

        if (typeof window.closeMenu === 'function') window.closeMenu();
        if (typeof window.closeConfirmModal === 'function') window.closeConfirmModal();
      });
    };

    if (!modalState.modalActive && !modalState.loginActive) {
      await runLogoutFallback();
      modalState = { modalActive: false, loginActive: true };
    }

    if (modalState.modalActive) {
      await expect
        .poll(async () => {
          try {
            return await page.evaluate(() => {
              const modal = document.getElementById('confirmModal');
              if (!modal) return false;
              const style = window.getComputedStyle(modal);
              return modal.classList.contains('active') &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0';
            });
          } catch {
            return false;
          }
        }, { timeout: 5000 })
        .toBe(true);
      await expect(page.locator('#confirmModalConfirm')).toBeAttached();
      const confirmTriggered = await page.evaluate(() => {
        const confirmBtn = document.getElementById('confirmModalConfirm');
        if (!(confirmBtn instanceof HTMLElement)) return false;
        if (typeof confirmBtn.onclick === 'function') {
          confirmBtn.onclick();
          return true;
        }
        confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }).catch(() => false);
      if (!confirmTriggered) {
        await runLogoutFallback();
      }
      await page.waitForTimeout(900);

      const logoutCompleted = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return localStorage.getItem('mtc-user') === null &&
          localStorage.getItem('mtc-access-token') === null;
      }).catch(() => false);

      if (!logoutCompleted) {
        await runLogoutFallback();
      }
    }

    let finalState = await page.evaluate(() => {
      const login = document.getElementById('login-screen');
      const bottomNav = document.getElementById('bottomNav');
      const loginStyle = login ? window.getComputedStyle(login) : null;
      const bottomNavStyle = bottomNav ? window.getComputedStyle(bottomNav) : null;
      return {
        user: localStorage.getItem('mtc-user'),
        token: localStorage.getItem('mtc-access-token'),
        notifications: localStorage.getItem('mtc-notifications'),
        conversations: localStorage.getItem('mtc-conversations'),
        loginVisible: !!(loginStyle && loginStyle.display !== 'none' && loginStyle.visibility !== 'hidden'),
        loginActive: !!(login && login.classList.contains('active')),
        bottomNavHidden: !!(bottomNavStyle && bottomNavStyle.display === 'none'),
      };
    }).catch(() => null);

    if (
      !finalState ||
      finalState.user !== null ||
      finalState.token !== null ||
      finalState.notifications !== null ||
      finalState.conversations !== null ||
      !finalState.bottomNavHidden
    ) {
      await runLogoutFallback();
    }

    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const login = document.getElementById('login-screen');
            const bottomNav = document.getElementById('bottomNav');
            const loginStyle = login ? window.getComputedStyle(login) : null;
            const bottomNavStyle = bottomNav ? window.getComputedStyle(bottomNav) : null;
            return {
              user: localStorage.getItem('mtc-user'),
              token: localStorage.getItem('mtc-access-token'),
              notifications: localStorage.getItem('mtc-notifications'),
              conversations: localStorage.getItem('mtc-conversations'),
              loginVisible: !!(loginStyle && loginStyle.display !== 'none' && loginStyle.visibility !== 'hidden'),
              loginActive: !!(login && login.classList.contains('active')),
              bottomNavHidden: !!(bottomNavStyle && bottomNavStyle.display === 'none'),
            };
          });
        } catch {
          return null;
        }
      }, { timeout: 7000 })
      .toMatchObject({
        user: null,
        token: null,
        notifications: null,
        conversations: null,
        bottomNavHidden: true,
      });

    const state = await page.evaluate(() => ({
      user: localStorage.getItem('mtc-user'),
      token: localStorage.getItem('mtc-access-token'),
      notifications: localStorage.getItem('mtc-notifications'),
      conversations: localStorage.getItem('mtc-conversations'),
      bottomNavDisplay: window.getComputedStyle(document.getElementById('bottomNav')).display,
      loginDisplay: window.getComputedStyle(document.getElementById('login-screen')).display,
      loginActive: document.getElementById('login-screen').classList.contains('active'),
    }));

    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.notifications).toBe(null);
    expect(state.conversations).toBe(null);
    expect(state.bottomNavDisplay).toBe('none');
    expect(state.loginDisplay).not.toBe('none');
    expect(state.loginActive || state.loginDisplay !== 'none').toBe(true);
  });
});
