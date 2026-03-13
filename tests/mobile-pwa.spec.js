// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Mobile PWA E2E Tests — /mobile-app/index.html
 * Tests the vanilla JS SPA served at /mobile-app/
 * Covers: login UI, validation, screen structure, navigation, booking UI
 */

const MOBILE_URL = '/mobile-app/index.html';

/** Dismiss onboarding overlay unconditionally (don't check visibility — animation timing varies on CI) */
async function dismissOnboarding(page) {
  // Wait for page to fully settle (avoids "execution context destroyed" from mid-load navigations)
  await page.waitForLoadState('load').catch(() => {});
  // Retry once if context is destroyed during page initialization
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.evaluate(() => {
        const el = document.getElementById('onboardingOverlay');
        if (el) { el.classList.remove('active'); el.style.display = 'none'; }
      });
      break;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  await page.waitForTimeout(300);
}

test.describe('Mobile PWA — Login Screen', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    await dismissOnboarding(page);
  });

  test('login screen renders with all elements', async ({ page }) => {
    await expect(page.locator('#login-screen')).toBeVisible();
    await expect(page.locator('#loginEmail')).toBeVisible();
    // Auth uses email + 4-digit PIN (no Google, no magic link)
    await expect(page.locator('#loginPin')).toBeVisible();
    await expect(page.locator('#pinLoginBtn')).toBeVisible();
  });

  test('PIN login validates empty email', async ({ page }) => {
    // Click sign in with empty email — should show error
    await page.locator('#pinLoginBtn').click();
    await page.waitForTimeout(500);
    const errors = page.locator('.field-error');
    await expect(errors.first()).toBeAttached();
  });

  test('PIN login validates empty PIN', async ({ page }) => {
    await page.fill('#loginEmail', 'test@example.com');
    await page.locator('#pinLoginBtn').click();
    await page.waitForTimeout(500);
    const pinError = page.locator('.field-error');
    await expect(pinError.first()).toBeAttached();
  });

  test('signup card toggle works', async ({ page }) => {
    const signupCard = page.locator('#signupCard');
    await expect(signupCard).toBeHidden();
    // Use dispatchEvent to bypass any overlay interception
    await page.locator('a[onclick*="showSignUpScreen"]').dispatchEvent('click');
    await page.waitForTimeout(500);
    await expect(signupCard).toBeVisible();
    await expect(page.locator('#signupName')).toBeVisible();
    await expect(page.locator('#signupEmail')).toBeVisible();
    await expect(page.locator('#signupEmailConfirm')).toBeVisible();
  });

  test('signup form validates empty fields', async ({ page }) => {
    // Show signup card via JS
    await page.locator('a[onclick*="showSignUpScreen"]').dispatchEvent('click');
    await page.waitForTimeout(500);
    // Submit empty — target the signup card's button specifically
    await page.locator('#signupCard .login-btn').click();
    await page.waitForTimeout(500);
    const errors = page.locator('#signupCard .field-error');
    await expect(errors.first()).toBeAttached();
  });

  test('sign up link exists on login screen', async ({ page }) => {
    const signupLink = page.getByText('Sign up');
    await expect(signupLink.first()).toBeAttached();
  });

  test('no horizontal overflow on login screen', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});

test.describe('Mobile PWA — Page Structure', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('all expected screens exist in DOM', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const expectedScreens = [
      'screen-home', 'screen-notifications', 'screen-book',
      'screen-partners', 'screen-schedule',
      'screen-events', 'screen-messages', 'screen-settings',
    ];

    for (const screenId of expectedScreens) {
      await expect(page.locator(`#${screenId}`)).toBeAttached();
    }
  });

  test('screens have ARIA labels', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mtc-onboarding-complete', 'true');
    });
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.screen[aria-label]', { state: 'attached', timeout: 5000 });

    const screens = page.locator('.screen[aria-label]');
    const count = await screens.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('bottom navigation bar exists', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const bottomNav = page.locator('.bottom-nav').or(page.locator('#bottomNav')).or(page.locator('nav[role="navigation"]'));
    await expect(bottomNav.first()).toBeAttached();
  });

  test('PWA manifest is linked', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toBeAttached();
  });

  test('viewport meta tag is set correctly', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('viewport-fit=cover');
  });
});

test.describe('Mobile PWA — Booking UI', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('booking screen has required elements', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const bookScreen = page.locator('#screen-book');
    await expect(bookScreen).toBeAttached();

    // Booking screen should have a header
    const header = bookScreen.locator('.screen-header').or(bookScreen.locator('h1, h2'));
    await expect(header.first()).toBeAttached();
  });

  test('partner screen has required elements', async ({ page }) => {
    await page.goto(MOBILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const partnerScreen = page.locator('#screen-partners');
    await expect(partnerScreen).toBeAttached();
  });
});

test.describe('Mobile PWA — API Endpoint', () => {
  test('PIN login endpoint rejects empty credentials', async ({ request }) => {
    const response = await request.post('/api/auth/pin-login', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('PIN login endpoint rejects invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/pin-login', {
      data: { email: 'nonexistent@test.com', pin: '0000' },
    });
    // Should be 401 (unauthorized) or 429 (rate limited)
    expect([401, 429]).toContain(response.status());
  });

  test('error reporting endpoint accepts valid error', async ({ request }) => {
    const response = await request.post('/api/errors', {
      data: { message: 'Test error from E2E', context: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  test('error reporting endpoint rejects missing message', async ({ request }) => {
    const response = await request.post('/api/errors', {
      data: { context: 'no-message' },
    });
    expect(response.status()).toBe(400);
  });
});
