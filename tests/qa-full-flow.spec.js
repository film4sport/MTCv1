// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';

// Helper: login as a specific role via the actual login form (sets Supabase session cookie)
async function loginAs(page, role = 'member') {
  // Auth uses magic link (passwordless) — these are test-only placeholders for form fill
  const creds = {
    member: { email: 'testmember@mtc.ca', pass: 'not-a-real-password' },
    coach: { email: 'testcoach@mtc.ca', pass: 'not-a-real-password' },
    admin: { email: 'testadmin@mtc.ca', pass: 'not-a-real-password' },
  };
  const { email, pass } = creds[role];

  // Clear cookies to avoid stale sessions from previous tests
  await page.context().clearCookies();

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // If redirected away from login (stale session), clear storage and retry
  if (!page.url().includes('/login')) {
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
  }

  // Type credentials directly (demo buttons are dev-only, not available in CI production builds)
  await page.locator('input[type="email"]').click();
  await page.keyboard.type(email, { delay: 20 });
  await page.locator('input[type="password"]').click();
  await page.keyboard.type(pass, { delay: 20 });

  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard — use 'commit' (not default 'load') because
  // dashboard makes ongoing Supabase fetches that block the load event on slow CI runners
  await page.waitForURL('**/dashboard**', { timeout: 30000, waitUntil: 'commit' });
  await page.waitForTimeout(1500);
}

// Helper: navigate to a dashboard sub-page (after loginAs)
async function goTo(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
}

// ============================================================
// 1. MEMBER DASHBOARD FLOWS
// ============================================================

test.describe('Member Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'member');
  });

  test('dashboard home loads with greeting and quick actions', async ({ page }) => {
    // Should show greeting with user's first name
    const greeting = page.locator('h2').first();
    await expect(greeting).toContainText(/Good (morning|afternoon|evening), Alex/);

    // Quick action links in the main content area (not sidebar)
    const main = page.locator('main');
    await expect(main.getByText('Book Court')).toBeVisible();
    await expect(main.getByText('View Schedule')).toBeVisible();
    await expect(main.getByText('Find Partner')).toBeVisible();
  });

  test('sidebar has key navigation items for member', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeAttached();
    await expect(sidebar.getByText('Home')).toBeAttached();
    await expect(sidebar.getByText('Book Court')).toBeAttached();
    await expect(sidebar.getByText('My Schedule')).toBeAttached();
    await expect(sidebar.getByText('Partners')).toBeAttached();
    await expect(sidebar.getByText('Events')).toBeAttached();
    await expect(sidebar.getByText('Lessons')).toBeAttached();
    await expect(sidebar.getByText('Messages')).toBeAttached();
    await expect(sidebar.getByText('Profile')).toBeAttached();
    await expect(sidebar.getByText('Settings')).toBeAttached();
  });

  test('booking page loads with court selection', async ({ page }) => {
    await goTo(page, '/dashboard/book');
    await expect(page.locator('h1')).toContainText('Book');
    const body = await page.textContent('body');
    expect(body).toContain('Court');
  });

  test('schedule page loads with list and calendar views', async ({ page }) => {
    await goTo(page, '/dashboard/schedule');
    await expect(page.locator('h1')).toContainText('Schedule');
    await expect(page.locator('button:has-text("List")')).toBeVisible();
    await expect(page.locator('button:has-text("Calendar")')).toBeVisible();
  });

  test('schedule calendar view shows month navigation', async ({ page }) => {
    await goTo(page, '/dashboard/schedule');
    await page.locator('button:has-text("Calendar")').click();
    await page.waitForTimeout(500);
    // Calendar should show month name
    const body = await page.textContent('body');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const hasMonth = months.some(m => body.includes(m));
    expect(hasMonth).toBe(true);
  });

  test('partners page loads', async ({ page }) => {
    await goTo(page, '/dashboard/partners');
    await expect(page.locator('h1')).toContainText('Partner');
  });

  test('events page loads', async ({ page }) => {
    await goTo(page, '/dashboard/events');
    await expect(page.locator('h1')).toContainText('Events');
  });

  test('messages page loads', async ({ page }) => {
    await goTo(page, '/dashboard/messages');
    await expect(page.locator('h1')).toContainText('Messages');
  });

  test('profile page shows user info', async ({ page }) => {
    await goTo(page, '/dashboard/profile');
    await expect(page.locator('h1')).toContainText('Profile');
    // Profile heading shows user's name (whatever the logged-in user is)
    const heading = page.locator('main h1, main h2, main [class*="heading"]').first();
    await expect(heading).toBeVisible();
    const body = await page.textContent('body');
    expect(body).toContain('Skill Level');
  });

  test('settings page shows notification toggles and legal links', async ({ page }) => {
    await goTo(page, '/dashboard/settings');
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.getByText('Notification Preferences')).toBeVisible();
    await expect(page.getByText('Bookings', { exact: true })).toBeVisible();
    await expect(page.getByText('Privacy Policy')).toBeVisible();
    await expect(page.getByText('Terms of Service')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test('notification bell opens dropdown', async ({ page }) => {
    const bell = page.locator('button[aria-label="Notifications"]');
    await expect(bell).toBeVisible();
    await bell.click();
    await page.waitForTimeout(500);
    // Dropdown should appear with either notifications or "No notifications"
    const markAllRead = page.getByText('Mark all read');
    const noNotif = page.getByText('No notifications');
    const hasContent = (await markAllRead.isVisible().catch(() => false)) || (await noNotif.isVisible().catch(() => false));
    expect(hasContent).toBe(true);
  });

  test('hamburger menu shows user info', async ({ page }) => {
    const menuBtn = page.locator('button[aria-label="Menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await page.waitForTimeout(500);
    // Should show user name and email in the header dropdown (not sidebar)
    const header = page.locator('header');
    await expect(header.getByText('member@mtc.ca')).toBeVisible();
    await expect(header.locator('a[href="/dashboard/profile"]')).toBeVisible();
    await expect(header.locator('a[href="/dashboard/settings"]')).toBeVisible();
    await expect(header.getByText('Logout')).toBeVisible();
  });
});

// ============================================================
// 2. COACH DASHBOARD FLOWS
// ============================================================

test.describe('Coach Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'coach');
  });

  test('coach dashboard shows Club Events quick action', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Club Events')).toBeVisible();
  });

  test('coach dashboard does not show Find Partner', async ({ page }) => {
    const findPartner = page.locator('a:has-text("Find Partner")');
    await expect(findPartner).toHaveCount(0);
  });

  test('coaching route redirects to lessons', async ({ page }) => {
    await goTo(page, '/dashboard/coaching');
    await page.waitForURL('**/dashboard/lessons');
  });

  test('coach sidebar hides Partners but shows Lessons', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeAttached();
    // Coach should see Lessons
    await expect(sidebar.getByText('Lessons')).toBeAttached();
    // Partners should NOT appear for coach
    const navText = await sidebar.locator('nav').textContent();
    expect(navText).not.toContain('Partners');
  });
});

// ============================================================
// 3. ADMIN DASHBOARD FLOWS
// ============================================================

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('admin dashboard shows admin panel quick action', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Admin Panel')).toBeVisible();
  });

  test('admin panel loads with tabs', async ({ page }) => {
    await goTo(page, '/dashboard/admin');
    await expect(page.locator('h1')).toContainText('Admin');
    // Use getByRole with exact name to avoid matching "Export Members" etc.
    await expect(page.getByRole('button', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Members', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Courts', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Announcements', exact: true })).toBeVisible();
  });

  test('admin members tab shows member list with search', async ({ page }) => {
    await goTo(page, '/dashboard/admin');
    await page.getByRole('button', { name: 'Members', exact: true }).click();
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    await expect(searchInput).toBeVisible();
    // At least one member should appear in the list (loaded from Supabase)
    const main = page.locator('main');
    const memberItems = main.locator('[class*="member"], [class*="card"], tr, li').first();
    await expect(memberItems).toBeVisible();
  });

  test('admin courts tab shows court info', async ({ page }) => {
    await goTo(page, '/dashboard/admin');
    await page.getByRole('button', { name: 'Courts', exact: true }).click();
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    expect(body).toContain('Court');
  });

  test('admin announcements tab shows announcements section', async ({ page }) => {
    await goTo(page, '/dashboard/admin');
    await page.getByRole('button', { name: 'Announcements', exact: true }).click();
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    // Announcements tab is active, content should exist
    expect(body.length).toBeGreaterThan(100);
  });

  test('admin sidebar shows Admin Panel link', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeAttached();
    await expect(sidebar.getByText('Admin Panel')).toBeAttached();
  });
});

// ============================================================
// 4. MESSAGING SYSTEM
// ============================================================

test.describe('Messaging System', () => {
  test('messages page shows conversation list', async ({ page }) => {
    await loginAs(page, 'member');
    await goTo(page, '/dashboard/messages');
    await expect(page.locator('h1')).toContainText('Messages');
  });

  test('can open a conversation and see message input', async ({ page }) => {
    await loginAs(page, 'member');
    await goTo(page, '/dashboard/messages');

    // Click first conversation if exists
    const firstConvo = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Mark|Sarah|David|Lisa|Coach/ }).first();
    if (await firstConvo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstConvo.click();
      await page.waitForTimeout(500);
      const msgInput = page.locator('input[placeholder*="message"], input[placeholder*="Message"], textarea[placeholder*="message"]').first();
      const hasInput = await msgInput.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasInput).toBe(true);
    }
  });
});

// ============================================================
// 5. CROSS-CUTTING CONCERNS
// ============================================================

test.describe('Cross-cutting', () => {
  test('lessons page loads', async ({ page }) => {
    await loginAs(page, 'member');
    await goTo(page, '/dashboard/lessons');
    await expect(page.locator('h1')).toContainText('Lesson');
  });

  test('mobile sidebar toggle works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page, 'member');

    const menuToggle = page.locator('button[aria-label="Open menu"]');
    if (await menuToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuToggle.click();
      await page.waitForTimeout(500);
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
    }
  });

  test('dashboard header renders with h1', async ({ page }) => {
    await loginAs(page, 'member');
    await expect(page.locator('header')).toBeAttached();
    await expect(page.locator('h1')).toContainText('Home');
  });
});
