const { test, expect } = require('@playwright/test');

test.describe('Bug Fix Verification', () => {

  test('Hero wave transition — no text bleeding through', async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForTimeout(2000);

    // Scroll down slightly to see the hero-wave transition area
    await page.evaluate(() => window.scrollTo(0, window.innerHeight - 150));
    await page.waitForTimeout(500);

    // Take screenshot of the hero-to-wave transition area
    await page.screenshot({ path: 'test-results/hero-wave-transition.png', fullPage: false });

    // Verify the wave divider exists and has proper z-index
    const waveDivider = page.locator('.wave-divider').first();
    await expect(waveDivider).toBeVisible();

    // Check that the hero section has z-index: 0 (stacking context isolation)
    const heroSection = page.locator('section').first();
    const heroZIndex = await heroSection.evaluate(el => getComputedStyle(el).zIndex);
    expect(heroZIndex).toBe('0');

    // Check that the wave divider has z-index: 20
    const waveZIndex = await waveDivider.evaluate(el => el.style.zIndex);
    expect(waveZIndex).toBe('20');
  });

  test('No white gap below footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Scroll to the very bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Screenshot the footer area
    await page.screenshot({ path: 'test-results/footer-bottom.png', fullPage: false });

    // Check that the landing layout wrapper has dark background
    const wrapper = page.locator('body > div').first();
    const bgColor = await wrapper.evaluate(el => getComputedStyle(el).backgroundColor);
    // #1a1f12 = rgb(26, 31, 18)
    expect(bgColor).toBe('rgb(26, 31, 18)');
  });

  test('Login page loads correctly (CSP not blocking)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(3000);

    // The login page uses an iframe to /login.html
    const iframe = page.frameLocator('iframe');

    // Check that the page rendered (Tailwind styles loaded = elements have styling)
    // Look for the sign-in heading or form elements
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: false });

    // Check no CSP errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content-Security-Policy')) {
        consoleErrors.push(msg.text());
      }
    });

    // Reload to capture console errors
    await page.goto('/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/login-page-reload.png', fullPage: false });

    // Should have no CSP errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Membership e-transfer step has no name explanation box', async ({ page }) => {
    // Clear any existing profile
    await page.goto('/info?tab=membership');
    await page.evaluate(() => localStorage.removeItem('currentUser'));
    await page.reload();
    await page.waitForTimeout(1500);

    // Click "Join Now" to start signup
    const joinBtn = page.locator('button', { hasText: 'Join Now' });
    await joinBtn.click();
    await page.waitForTimeout(500);

    // Step 1: Select Adult membership
    const adultBtn = page.locator('button', { hasText: 'Adult (Single)' });
    await adultBtn.click();
    await page.waitForTimeout(500);

    // Step 2: Fill info
    await page.fill('input[placeholder="Enter your full name"]', 'Test User');
    await page.fill('input[placeholder="your@email.com"]', 'test@test.com');
    await page.locator('button', { hasText: 'Beginner' }).click();
    await page.locator('button', { hasText: 'Continue' }).click();
    await page.waitForTimeout(500);

    // Step 3: Waiver - scroll to bottom and agree
    const waiverDiv = page.locator('.rounded-xl.overflow-y-auto');
    await waiverDiv.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: 'I Agree' }).click();
    await page.waitForTimeout(500);

    // Step 4: E-transfer page - verify NO "Important: In the e-transfer message area" text
    await page.screenshot({ path: 'test-results/etransfer-step.png', fullPage: false });
    const importantText = page.locator('text=In the e-transfer message area');
    await expect(importantText).toHaveCount(0);

    // Verify the e-transfer email IS still shown
    const emailText = page.locator('text=monotennis.payment@gmail.com');
    await expect(emailText).toBeVisible();
  });

  test('Membership profile shows after signup', async ({ page }) => {
    // Set up a mock profile in localStorage
    await page.goto('/info?tab=membership');
    await page.evaluate(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        name: 'Test Player',
        email: 'test@example.com',
        membershipType: 'adult',
        rating: 'Intermediate',
        waiverAccepted: true,
        joinedDate: new Date().toISOString(),
      }));
    });

    // Reload to pick up the profile
    await page.reload();
    await page.waitForTimeout(1500);

    // Screenshot the membership page with profile
    await page.screenshot({ path: 'test-results/membership-profile.png', fullPage: false });

    // Verify profile banner is visible
    const profileName = page.locator('text=Test Player');
    await expect(profileName).toBeVisible();

    const memberType = page.locator('text=Adult (Single) Member');
    await expect(memberType).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.removeItem('currentUser'));
  });

});
