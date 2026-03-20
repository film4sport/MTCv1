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
  }, MOCK_USER);

  await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof MTC !== 'undefined', null, { timeout: 5000 });
  await page.evaluate((user) => {
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
}

test.describe('Chromium Compatibility - Info Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.locator('#tab-membership')).toBeVisible();
  });

  test('far-right tabs stay reachable across Chromium breakpoints', async ({ page }) => {
    const privacy = page.locator('#tab-privacy');
    const terms = page.locator('#tab-terms');
    await privacy.scrollIntoViewIfNeeded();
    await terms.scrollIntoViewIfNeeded();
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

    await page.locator('#nav-book').click();
    await expect(page.locator('#screen-book.active')).toBeAttached({ timeout: 5000 });

    await page.locator('#nav-messages').click();
    await expect(page.locator('#screen-messages.active')).toBeAttached({ timeout: 5000 });
  });
});
