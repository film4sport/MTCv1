// @ts-check
const { expect } = require('@playwright/test');

const MOBILE_URL = '/mobile-app/index.html';

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
  await page.goto(`/info?tab=${tab}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await expect(page.locator(`#tab-${tab}`)).toBeVisible();
}

async function switchInfoTab(page, label, tabKey) {
  const tab = page.getByRole('tab', { name: label, exact: true }).first();
  await expect(tab).toBeVisible();

  let switchedViaClick = false;
  try {
    await tab.scrollIntoViewIfNeeded({ timeout: 3000 });
    await tab.click({ timeout: 3000 });
    switchedViaClick = true;
  } catch {
    await gotoInfo(page, tabKey);
  }

  await page.waitForFunction((expectedTab) => {
    return window.location.search.includes(`tab=${expectedTab}`) ||
      !!document.getElementById(`tabpanel-${expectedTab}`);
  }, tabKey, { timeout: 4000 });

  if (!switchedViaClick) {
    await page.waitForTimeout(250);
  }

  await expect(page.locator(`#tabpanel-${tabKey}`)).toBeVisible();
  await expect(page.locator(`#tab-${tabKey}`)).toHaveAttribute('aria-selected', 'true');
}

async function mockAuthenticatedPwa(page, apiOverrides = {}) {
  await page.route('**/api/mobile-auth', (route) => {
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

    route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' });
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
  await page.waitForFunction(() => typeof navigateTo === 'function' || (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function'), null, { timeout: 5000 });

  await page.evaluate((user) => {
    localStorage.setItem('mtc-user', JSON.stringify(user));
    localStorage.setItem('mtc-current-user', JSON.stringify(user));
    localStorage.setItem('mtc-session-active', 'true');
    if (typeof window !== 'undefined') window.currentUser = user;
    if (typeof MTC !== 'undefined') MTC.state.currentUser = user;

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
  }, {
    id: 'test-user-id-123',
    role: 'member',
    name: 'Test User',
    email: 'test@mtc.ca',
    isMember: true,
  });

  await page.waitForFunction(() => typeof navigateTo === 'function' || (typeof MTC !== 'undefined' && MTC.fn && typeof MTC.fn.navigateTo === 'function'), null, { timeout: 5000 });
}

async function activatePwaScreen(page, screenId, navId) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
      await expect(page.locator(`#screen-${screenId}.active`)).toBeAttached({ timeout: 5000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(250);
    }
  }

  throw lastError;
}

module.exports = {
  MOCK_USER,
  activatePwaScreen,
  gotoInfo,
  gotoLanding,
  mockAuthenticatedPwa,
  switchInfoTab,
};
