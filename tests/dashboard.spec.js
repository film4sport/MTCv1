// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Dashboard — Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    // Wait for React hydration to complete
    await page.waitForTimeout(1000);
  });

  test('login page loads with form elements', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeAttached();
    await expect(page.locator('input[type="password"]')).toBeAttached();
    await expect(page.locator('button[type="submit"]')).toBeAttached();
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Sign in to your Mono Tennis Club account')).toBeVisible();
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    // Type an email that passes browser HTML5 validation but fails the app's stricter regex
    const emailInput = page.locator('input[type="email"]');
    const passInput = page.locator('input[type="password"]');
    await emailInput.click();
    await page.keyboard.type('bad@x', { delay: 30 }); // passes HTML5 email type but fails app regex (needs .tld)
    await passInput.click();
    await page.keyboard.type('somepass', { delay: 30 });
    await page.waitForTimeout(200);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  // Demo credential buttons only render in NODE_ENV=development — skip in CI (production build)
  test('demo credential buttons fill in the form', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Demo buttons are dev-only');
    await page.getByText('Member', { exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[type="email"]')).toHaveValue('member@mtc.ca');
    await expect(page.locator('input[type="password"]')).toHaveValue('member123');
  });

  test('forgot password button opens modal', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.getByText('Forgot password?').click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Reset Password')).toBeVisible();
    await expect(page.getByText("Enter your email and we'll send a reset link.")).toBeVisible();
    await expect(page.getByText('Send Reset Link')).toBeVisible();
    await expect(page.getByText('Cancel')).toBeVisible();
  });

  test('forgot password modal closes on cancel', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.getByText('Forgot password?').click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Reset Password')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Reset Password')).not.toBeVisible();
  });

  test('has back to home link', async ({ page }) => {
    await expect(page.getByText('Back to Home')).toBeAttached();
  });

  test('has become a member link', async ({ page }) => {
    const link = page.getByText('Become a Member');
    await expect(link).toBeAttached();
    await expect(link).toHaveAttribute('href', '/info?tab=membership');
  });

  // Test accounts section only renders in NODE_ENV=development — skip in CI (production build)
  test('has test accounts section', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Test accounts section is dev-only');
    await expect(page.getByText('Test Accounts')).toBeVisible();
    await expect(page.getByText('member@mtc.ca')).toBeVisible();
    await expect(page.getByText('coach@mtc.ca')).toBeVisible();
    await expect(page.getByText('admin@mtc.ca')).toBeVisible();
  });
});

test.describe('Dashboard — Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Login via real Supabase auth (member demo account)
    // Type credentials directly (demo buttons are dev-only, not available in CI production builds)
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').click();
    await page.keyboard.type('member@mtc.ca', { delay: 20 });
    await page.locator('input[type="password"]').click();
    await page.keyboard.type('member123', { delay: 20 });
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard**', { timeout: 30000, waitUntil: 'commit' });
    await page.waitForTimeout(1000);
  });

  test('dashboard home page loads', async ({ page }) => {
    // Should show header
    await expect(page.locator('header')).toBeAttached();
  });

  test('sidebar has navigation items', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeAttached();
    // Check for key nav links
    await expect(sidebar.getByText('Home')).toBeAttached();
    await expect(sidebar.getByText('Book Court')).toBeAttached();
    await expect(sidebar.getByText('My Schedule')).toBeAttached();
    await expect(sidebar.getByText('Partners')).toBeAttached();
    await expect(sidebar.getByText('Events')).toBeAttached();
    await expect(sidebar.getByText('Messages')).toBeAttached();
    await expect(sidebar.getByText('Profile')).toBeAttached();
    await expect(sidebar.getByText('Settings')).toBeAttached();
  });

  test('sidebar shows Mono Tennis Club branding', async ({ page }) => {
    await expect(page.locator('aside').getByText('Mono Tennis Club')).toBeAttached();
  });
});

test.describe('Dashboard — Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login via real Supabase auth (member demo account)
    // Type credentials directly (demo buttons are dev-only, not available in CI production builds)
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').click();
    await page.keyboard.type('member@mtc.ca', { delay: 20 });
    await page.locator('input[type="password"]').click();
    await page.keyboard.type('member123', { delay: 20 });
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard**', { timeout: 30000, waitUntil: 'commit' });
    await page.waitForTimeout(500);
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
  });

  test('profile page shows user info', async ({ page }) => {
    // Uses real Supabase member: Alex Thompson / member@mtc.ca
    await expect(page.getByRole('heading', { name: 'Alex Thompson' })).toBeVisible();
    await expect(page.getByText('member@mtc.ca')).toBeVisible();
  });

  test('profile page shows skill level', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toContain('Skill Level');
  });

  test('profile page shows member badge', async ({ page }) => {
    // The role badge on the profile page
    const main = page.locator('main');
    await expect(main.getByText('Member').first()).toBeVisible();
  });
});
