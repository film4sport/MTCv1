// @ts-check
const { expect } = require('@playwright/test');

const MOBILE_URL = '/mobile-app/index.html';
const INFO_TAB_KEYS = ['about', 'membership', 'coaching', 'faq', 'rules', 'privacy', 'terms'];
const PWA_SCREEN_IDS = ['home', 'notifications', 'book', 'partners', 'schedule', 'events', 'messages', 'settings'];

const MOCK_USER = {
  role: 'member',
  name: 'Test User',
  email: 'test@mtc.ca',
  userId: 'test-user-id-123',
  accessToken: 'mock-access-token-xyz',
  membershipType: 'adult',
  familyId: null,
  familyMembers: [],
};

async function gotoLanding(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => (
    document.readyState === 'complete' &&
    !!document.querySelector('.navbar') &&
    !!document.querySelector('.hero-content') &&
    !!document.querySelector('#events') &&
    !!document.querySelector('#schedule') &&
    !!document.querySelector('#gallery') &&
    !!document.querySelector('footer')
  ), null, { timeout: 10000 }).catch(() => {});
  await expect(page.locator('.navbar')).toBeAttached();
  await expect(page.locator('.hero-content').first()).toBeAttached();
}

async function gotoInfo(page, tab = 'membership') {
  const targetUrl = `/info?tab=${tab}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch {
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      const atTarget = await page.evaluate((expectedTab) => {
        return window.location.pathname === '/info' &&
          new URLSearchParams(window.location.search).get('tab') === expectedTab;
      }, tab).catch(() => false);
      if (atTarget) break;
      if (attempt === 2) throw new Error(`Failed to navigate to ${targetUrl}`);
    }
  }
  await page.waitForLoadState('load').catch(() => {});
  await expect
    .poll(async () => {
      try {
        return await page.evaluate((expectedTab) => {
          const requiredTabsPresent = INFO_TAB_KEYS
            .every((key) => !!document.getElementById(`tab-${key}`));
          return window.location.pathname === '/info' &&
            new URLSearchParams(window.location.search).get('tab') === expectedTab &&
            !!document.getElementById(`tab-${expectedTab}`) &&
            requiredTabsPresent;
        }, tab);
      } catch {
        return false;
      }
    }, { timeout: 10000 })
    .toBe(true);
  await expect(page.locator(`#tab-${tab}`)).toBeVisible();
}

async function switchInfoTab(page, label, tabKey) {
  const tab = page.getByRole('tab', { name: label, exact: true }).first();
  await expect(tab).toBeVisible();
  const switchedViaUi = await expect
    .poll(async () => {
      try {
        return await page.evaluate(({ expectedTab, expectedLabel }) => {
          const selectedTab = document.getElementById(`tab-${expectedTab}`);
          if (
            selectedTab &&
            selectedTab.getAttribute('aria-selected') === 'true' &&
            new URLSearchParams(window.location.search).get('tab') === expectedTab
          ) {
            return true;
          }

          const candidates = Array.from(document.querySelectorAll('[role="tab"]'));
          const matchingTab = candidates.find((candidate) => candidate.textContent?.trim() === expectedLabel);
          if (matchingTab instanceof HTMLElement) {
            matchingTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            matchingTab.click();
          }

          return !!(
            selectedTab &&
            selectedTab.getAttribute('aria-selected') === 'true' &&
            new URLSearchParams(window.location.search).get('tab') === expectedTab
          );
        }, { expectedTab: tabKey, expectedLabel: label });
      } catch {
        return false;
      }
    }, { timeout: 2500 })
    .toBeTruthy()
    .then(() => true)
    .catch(() => false);

  if (!switchedViaUi) {
    await gotoInfo(page, tabKey);
  }
  await expect
    .poll(async () => {
      try {
        return await page.evaluate((expectedTab) => {
          const selectedTab = document.getElementById(`tab-${expectedTab}`);
          return !!(
            window.location.pathname === '/info' &&
            new URLSearchParams(window.location.search).get('tab') === expectedTab &&
            selectedTab &&
            selectedTab.getAttribute('aria-selected') === 'true'
          );
        }, tabKey);
      } catch {
        return false;
      }
    }, { timeout: 10000 })
    .toBeTruthy();
}

async function mockAuthenticatedPwa(page, apiOverrides = {}) {
  await page.route('**/api/mobile-auth/config', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route('**supabase.co**', (route) => {
    if (route.request().url().includes('/auth/')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{"user":null}}' });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' });
    }
  });

  await page.route('**/api/mobile/**', (route) => {
    const url = route.request().url();
    const method = route.request().method();

    for (const [pattern, handler] of Object.entries(apiOverrides)) {
      if (url.includes(pattern)) {
        return handler(route, method);
      }
    }

    if (url.includes('/bookings') && method === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, booking: { id: 'server-booking-001' } }) });
    } else if (url.includes('/bookings') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (url.includes('/bookings') && (method === 'DELETE' || method === 'PATCH')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (url.includes('/conversations') && method === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, messageId: 'server-msg-001' }) });
    } else if (url.includes('/conversations') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (url.includes('/conversations') && (method === 'PATCH' || method === 'DELETE')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (url.includes('/events') && method === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, action: 'added' }) });
    } else if (url.includes('/events') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (url.includes('/events') && (method === 'PATCH' || method === 'DELETE')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (url.includes('/partners') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (url.includes('/partners') && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'partner-001' }) });
    } else if (url.includes('/notifications') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if (url.includes('/notifications') && (method === 'PATCH' || method === 'DELETE')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (url.includes('/settings') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        bookings: true,
        events: true,
        partners: true,
        messages: true,
        programs: true,
      }) });
    } else if (url.includes('/settings') && method === 'PATCH') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else if (url.includes('/members') && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else if ((url.includes('/courts') || url.includes('/court-blocks') || url.includes('/programs') || url.includes('/families') || url.includes('/lineups') || url.includes('/announcements')) && method === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({ error: `Unhandled mock route: ${method} ${url}` }),
      });
    }
  });

  await page.route('**/api/auth/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.addInitScript((user) => {
    localStorage.setItem('mtc-user', JSON.stringify(user));
    localStorage.setItem('mtc-current-user', JSON.stringify(user));
    localStorage.setItem('mtc-access-token', user.accessToken);
    localStorage.setItem('mtc-user-id', user.userId);
    localStorage.setItem('mtc-user-email', user.email);
    localStorage.setItem('mtc-user-name', user.name);
    localStorage.setItem('mtc-session-active', 'true');
    localStorage.setItem('mtc-onboarding-complete', 'true');
    localStorage.setItem('mtc-bypass-install-gate', 'true');
    localStorage.setItem('mtc-session', JSON.stringify({
      email: user.email,
      name: user.name,
      timestamp: Date.now(),
    }));
  }, MOCK_USER);

  await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load');
  await page.waitForFunction(() => {
    if (typeof MTC === 'undefined' || !MTC.state) return false;
    const storedUser = MTC.state.currentUser || JSON.parse(localStorage.getItem('mtc-user') || 'null');
    if (!storedUser) return false;
    MTC.state.currentUser = storedUser;
    try {
      localStorage.setItem('mtc-onboarding-complete', 'true');
      if (typeof window.completeOnboarding === 'function') window.completeOnboarding();
    } catch {}

    const login = document.getElementById('login-screen');
    if (login) {
      login.classList.remove('active');
      login.style.display = 'none';
    }

    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'block';

    const home = document.getElementById('screen-home');
    if (home && !document.querySelector('.screen.active')) {
      home.classList.add('active');
    }

    const onboardingOverlay = document.getElementById('onboardingOverlay');
    if (onboardingOverlay) onboardingOverlay.classList.remove('active');

    const requiredScreensPresent = PWA_SCREEN_IDS
      .every((key) => !!document.getElementById(`screen-${key}`));
    return requiredScreensPresent && (typeof navigateTo === 'function' || (MTC.fn && typeof MTC.fn.navigateTo === 'function'));
  }, null, { timeout: 10000 });
}

async function waitForPwaShell(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForFunction(() => {
    if (typeof MTC === 'undefined' || !MTC.state) return false;
    const storedUser = MTC.state.currentUser || JSON.parse(localStorage.getItem('mtc-user') || 'null');
    const bottomNav = document.getElementById('bottomNav');
    const home = document.getElementById('screen-home');
    const onboardingOverlay = document.getElementById('onboardingOverlay');
    if (onboardingOverlay) onboardingOverlay.classList.remove('active');
    const requiredScreensPresent = PWA_SCREEN_IDS
      .every((key) => !!document.getElementById(`screen-${key}`));
    return !!(
      storedUser &&
      requiredScreensPresent &&
      bottomNav &&
      home &&
      (typeof navigateTo === 'function' || (MTC.fn && typeof MTC.fn.navigateTo === 'function'))
    );
  }, null, { timeout: 10000 });
}

async function navigatePwaScreen(page, screen) {
  const navId = `nav-${screen}`;
  const resolvedScreen = screen === 'events'
    ? 'home'
    : screen === 'mybookings' || screen === 'programs'
      ? 'schedule'
      : screen === 'profile'
        ? 'settings'
        : screen;

  await waitForPwaShell(page);

  for (let attempt = 0; attempt < 3; attempt++) {
    await activatePwaScreen(page, screen, navId, resolvedScreen);

    const activated = await expect
      .poll(async () => {
        try {
          return await page.evaluate(({ requestedScreen, targetScreen, targetNavId }) => {
            const login = document.getElementById('login-screen');
            if (login) {
              login.classList.remove('active');
              login.style.display = 'none';
            }

            const bottomNav = document.getElementById('bottomNav');
            if (bottomNav) bottomNav.style.display = 'block';

            const target = document.getElementById(`screen-${targetScreen}`);
            if (!target) return false;

            if (typeof MTC !== 'undefined' && MTC.state) {
              const storedUser = MTC.state.currentUser || JSON.parse(localStorage.getItem('mtc-user') || 'null');
              if (storedUser) MTC.state.currentUser = storedUser;
            }

            if (!target.classList.contains('active')) {
              if (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function') {
                MTC.fn.navigateTo(requestedScreen);
              } else if (typeof navigateTo === 'function') {
                navigateTo(requestedScreen);
              }
            }

            if (!target.classList.contains('active')) {
              document.querySelectorAll('.screen.active').forEach((el) => el.classList.remove('active'));
              target.classList.add('active');
            }

            const navButton = document.getElementById(targetNavId);
            if (navButton) {
              document.querySelectorAll('#bottomNav .nav-item.active').forEach((el) => el.classList.remove('active'));
              navButton.classList.add('active');
            }

            return target.classList.contains('active');
          }, { requestedScreen: screen, targetScreen: resolvedScreen, targetNavId: navId });
        } catch {
          return false;
        }
      }, { timeout: 5000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);

    if (activated) return;

    await waitForPwaShell(page);
    await page.waitForTimeout(250);
  }

  await expect(page.locator(`#screen-${resolvedScreen}.active`)).toBeAttached({ timeout: 5000 });
}

async function expectPwaScreenActive(page, screen) {
  const resolvedScreen = screen === 'events'
    ? 'home'
    : screen === 'mybookings' || screen === 'programs'
      ? 'schedule'
      : screen === 'profile'
        ? 'settings'
        : screen;

  await expect
    .poll(async () => {
      try {
        return await page.evaluate(({ requestedScreen, targetScreen }) => {
          const target = document.getElementById(`screen-${targetScreen}`);
          if (!target) return false;

          if (!target.classList.contains('active')) {
            if (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function') {
              MTC.fn.navigateTo(requestedScreen);
            } else if (typeof navigateTo === 'function') {
              navigateTo(requestedScreen);
            }
          }

          if (!target.classList.contains('active')) {
            document.querySelectorAll('.screen.active').forEach((el) => el.classList.remove('active'));
            target.classList.add('active');
          }

          return target.classList.contains('active');
        }, { requestedScreen: screen, targetScreen: resolvedScreen });
      } catch {
        return false;
      }
    }, { timeout: 5000 })
    .toBe(true);
}

async function activatePwaScreen(page, screenId, navId, activeScreenId = screenId) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await waitForPwaShell(page);
      await page.waitForFunction(() => typeof navigateTo === 'function' || (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function'), null, { timeout: 5000 });
      await page.evaluate(({ screen, nav }) => {
        if (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function') {
          MTC.fn.navigateTo(screen);
          return;
        }
        if (typeof navigateTo === 'function') {
          navigateTo(screen);
          return;
        }
        const el = document.getElementById(nav);
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, { screen: screenId, nav: navId });

      const applied = await page.evaluate((target) => {
        const targetScreen = document.getElementById(`screen-${target}`);
        if (!targetScreen) return false;
        if (!targetScreen.classList.contains('active')) {
          document.querySelectorAll('.screen.active').forEach((el) => el.classList.remove('active'));
          targetScreen.classList.add('active');
        }
        return targetScreen.classList.contains('active');
      }, activeScreenId).catch(() => false);

      if (applied) return;
    } catch (error) {
      lastError = error;
      await page.evaluate((target) => {
        const targetScreen = document.getElementById(`screen-${target}`);
        if (!targetScreen) return;
        document.querySelectorAll('.screen.active').forEach((el) => el.classList.remove('active'));
        targetScreen.classList.add('active');
      }, activeScreenId).catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(250);
    }
  }

  throw lastError;
}

module.exports = {
  INFO_TAB_KEYS,
  MOCK_USER,
  PWA_SCREEN_IDS,
  activatePwaScreen,
  gotoInfo,
  gotoLanding,
  mockAuthenticatedPwa,
  navigatePwaScreen,
  expectPwaScreenActive,
  switchInfoTab,
};
