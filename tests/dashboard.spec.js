// @ts-check
const { test, expect } = require('@playwright/test');

const LOGIN_EMAIL = '#login-email';
const LOGIN_PIN = '#login-pin';
const LOGIN_SUBMIT_NAME = /^sign in$/i;

async function waitForLoginForm(page) {
  await expect(page.locator(LOGIN_EMAIL)).toBeVisible();
  await expect(page.locator(LOGIN_PIN)).toBeVisible();
  await expect(page.getByRole('button', { name: LOGIN_SUBMIT_NAME })).toBeVisible();
}

async function loginAsMember(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await waitForLoginForm(page);
  await page.locator(LOGIN_EMAIL).fill('member@mtc.ca');
  await page.locator(LOGIN_PIN).fill('1234');
  await page.getByRole('button', { name: LOGIN_SUBMIT_NAME }).click();
  await page.waitForURL('**/dashboard**', { timeout: 30000, waitUntil: 'commit' });
  await expect(page.locator('header')).toBeAttached();
}

test.describe('Dashboard — Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await waitForLoginForm(page);
  });

  test('login page loads with form elements', async ({ page }) => {
    await expect(page.locator(LOGIN_EMAIL)).toBeAttached();
    await expect(page.locator(LOGIN_PIN)).toBeAttached();
    await expect(page.getByRole('button', { name: LOGIN_SUBMIT_NAME })).toBeAttached();
    await expect(page.getByText('Your courts, your community.')).toBeVisible();
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: LOGIN_SUBMIT_NAME }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Please enter your 4-digit PIN.')).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    // Type an email that passes browser HTML5 validation but fails the app's stricter regex
    const emailInput = page.locator(LOGIN_EMAIL);
    const passInput = page.locator(LOGIN_PIN);
    await emailInput.click();
    await page.keyboard.type('bad@x', { delay: 30 }); // passes HTML5 email type but fails app regex (needs .tld)
    await passInput.click();
    await page.keyboard.type('1234', { delay: 30 });
    await page.getByRole('button', { name: LOGIN_SUBMIT_NAME }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  // Demo credential buttons only render in NODE_ENV=development — skip in CI (production build)
  test('demo credential buttons fill in the form', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Demo buttons are dev-only');
    await page.getByText('Member', { exact: true }).click();
    await expect(page.locator('input[type="email"]')).toHaveValue('member@mtc.ca');
    await expect(page.locator('input[type="password"]')).toHaveValue('not-a-real-password');
  });

  test('forgot password button opens modal', async ({ page }) => {
    await page.getByText('Forgot PIN?').click();
    await expect(page.getByText("Enter your email and we'll send a 4-digit code to reset your PIN.")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Reset Code' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to sign in' })).toBeVisible();
  });

  test('forgot password modal closes on cancel', async ({ page }) => {
    await page.getByText('Forgot PIN?').click();
    await expect(page.getByRole('button', { name: 'Back to sign in' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to sign in' }).click();
    await expect(page.locator(LOGIN_EMAIL)).toBeVisible();
  });

  test('has back to home link', async ({ page }) => {
    await expect(page.getByText('Back to Home')).toBeAttached();
  });

  test('has become a member link', async ({ page }) => {
    const link = page.getByText('Become a Member').first();
    await expect(link).toBeAttached();
    await expect(link).toHaveAttribute('href', '/info?tab=membership');
  });

  // Test accounts section only renders in NODE_ENV=development — skip in CI (production build)
  test('has test accounts section', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Test accounts section is dev-only');
    await expect(page.getByText('Test Accounts')).toBeVisible();
    await expect(page.getByText('member@mtc.ca')).toBeVisible();
    await expect(page.getByText('admin@mtc.ca')).toBeVisible();
  });
});

test.describe('Dashboard — Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Login via real Supabase auth (member demo account)
    // Type credentials directly (demo buttons are dev-only, not available in CI production builds)
    await loginAsMember(page);
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
    await loginAsMember(page);
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('profile page shows user info', async ({ page }) => {
    // Verifies profile page renders with the logged-in user's name and email
    const heading = page.locator('main h1, main h2').first();
    await expect(heading).toBeVisible();
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
