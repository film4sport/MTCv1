// @ts-check
const { test, expect } = require('@playwright/test');

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

async function switchInfoTab(page, name, expectedTab) {
  const tabId = `tab-${expectedTab}`;
  const tab = page.locator(`#${tabId}`);
  await expect(tab).toBeVisible();
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'center' });
      el.click();
    }
  }, tabId);
  await expect(page.locator(`#${tabId}`)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`#tabpanel-${expectedTab}`)).toBeVisible();
}

async function mockAuthenticatedPwa(page) {
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
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' });
  });

  await page.addInitScript((user) => {
    localStorage.setItem('mtc-user', JSON.stringify(user));
    localStorage.setItem('mtc-current-user', JSON.stringify(user));
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
  await page.waitForTimeout(1200);

  await page.evaluate((user) => {
    localStorage.setItem('mtc-user', JSON.stringify(user));
    localStorage.setItem('mtc-current-user', JSON.stringify(user));
    localStorage.setItem('mtc-session-active', 'true');
    if (typeof window !== 'undefined') {
      window.currentUser = user;
    }
    if (typeof MTC !== 'undefined') {
      MTC.state.currentUser = user;
    }
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

  await page.waitForFunction(() => typeof navigateTo === 'function', null, { timeout: 5000 });
}

test.describe('Apple Compatibility - Info Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.locator('#tab-membership')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('far-right tabs stay reachable on iPhone/iPad Safari', async ({ page }) => {
    await page.evaluate(() => {
      const tab = document.getElementById('tab-privacy');
      if (tab) {
        tab.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    });
    await expect(page.locator('#tab-privacy')).toBeVisible();
    await switchInfoTab(page, 'Privacy', 'privacy');
    await switchInfoTab(page, 'Terms', 'terms');
  });

  test('info page remains usable after landscape rotation', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(400);

    const visibleWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(visibleWidth).toBeLessThanOrEqual(viewportWidth + 1);

    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await page.evaluate(() => {
      const tab = document.getElementById('tab-terms');
      if (tab) {
        tab.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    });
    await expect(page.locator('#tab-terms')).toBeVisible();
  });
});

test.describe('Apple Compatibility - Mobile PWA', () => {
  test('bottom nav survives landscape rotation and still navigates', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);

    const bottomNav = page.locator('#bottomNav');
    await expect(bottomNav).toBeVisible();

    await page.evaluate(() => {
      const el = document.getElementById('nav-book');
      if (el) el.click();
    });
    await expect(page.locator('#screen-book.active')).toBeAttached({ timeout: 5000 });

    await page.evaluate(() => {
      const el = document.getElementById('nav-messages');
      if (el) el.click();
    });
    await expect(page.locator('#screen-messages.active')).toBeAttached({ timeout: 5000 });
  });
});
