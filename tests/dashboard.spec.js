// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Dashboard — Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
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
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.locator('input[type="email"]').type('notanemail');
    await page.locator('input[type="password"]').type('somepass');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('demo credential buttons fill in the form', async ({ page }) => {
    await page.getByText('Member', { exact: true }).click();
    await expect(page.locator('input[type="email"]')).toHaveValue('member@mtc.ca');
    await expect(page.locator('input[type="password"]')).toHaveValue('member123');
  });

  test('forgot password button opens modal', async ({ page }) => {
    await page.getByText('Forgot password?').click();
    await expect(page.getByText('Reset Password')).toBeVisible();
    await expect(page.getByText("Enter your email and we'll send a reset link.")).toBeVisible();
    await expect(page.getByText('Send Reset Link')).toBeVisible();
    await expect(page.getByText('Cancel')).toBeVisible();
  });

  test('forgot password modal closes on cancel', async ({ page }) => {
    await page.getByText('Forgot password?').click();
    await expect(page.getByText('Reset Password')).toBeVisible();
    await page.getByText('Cancel').click();
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

  test('has test accounts section', async ({ page }) => {
    await expect(page.getByText('Test Accounts')).toBeVisible();
    await expect(page.getByText('member@mtc.ca')).toBeVisible();
    await expect(page.getByText('coach@mtc.ca')).toBeVisible();
    await expect(page.getByText('admin@mtc.ca')).toBeVisible();
  });
});

test.describe('Dashboard — Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage with a demo user to bypass auth
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const demoUser = {
        id: 'test-user-1',
        name: 'Test Member',
        email: 'test@mtc.ca',
        role: 'member',
        ntrp: 3.5,
        memberSince: '2024-05',
      };
      localStorage.setItem('mtc-current-user', JSON.stringify(demoUser));
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
    });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
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
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const demoUser = {
        id: 'test-user-1',
        name: 'Test Member',
        email: 'testmember@mtc.ca',
        role: 'member',
        ntrp: 4.0,
        memberSince: '2024-05',
      };
      localStorage.setItem('mtc-current-user', JSON.stringify(demoUser));
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
    });
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
  });

  test('profile page shows user info', async ({ page }) => {
    await expect(page.getByText('Test Member')).toBeVisible();
    await expect(page.getByText('testmember@mtc.ca')).toBeVisible();
  });

  test('profile page shows NTRP from user data', async ({ page }) => {
    await expect(page.getByText('NTRP 4')).toBeVisible();
    await expect(page.getByText('Intermediate')).toBeVisible();
  });

  test('profile page shows member badge', async ({ page }) => {
    await expect(page.getByText('Member', { exact: true })).toBeVisible();
  });
});
