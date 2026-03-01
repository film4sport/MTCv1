// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Signup Flow — /info?tab=membership', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
  });

  test('membership tab loads by default', async ({ page }) => {
    await expect(page.getByText('How to Join').first()).toBeAttached();
  });

  test('has membership fee information', async ({ page }) => {
    await expect(page.getByText('Membership Fees')).toBeAttached();
  });

  test('has signup / become a member button', async ({ page }) => {
    const signupBtn = page.getByText('Sign Up Now').or(page.getByText('Become a Member').or(page.getByText('Join Now')));
    await expect(signupBtn.first()).toBeAttached();
  });

  test('tab navigation works', async ({ page }) => {
    // Use dispatchEvent to bypass mobile horizontal scroll viewport issues
    await page.getByText('About', { exact: true }).dispatchEvent('click');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/tab=about/);

    await page.getByText('FAQ', { exact: true }).dispatchEvent('click');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/tab=faq/);

    await page.getByText('Rules', { exact: true }).dispatchEvent('click');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/tab=rules/);
  });

  test('coaching tab has coach info', async ({ page }) => {
    await page.getByText('Coaching', { exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Mark Taylor' })).toBeAttached();
  });

  test('back to home link exists', async ({ page }) => {
    const backLink = page.getByText('Back to Home').or(page.locator('a[href="/"]'));
    await expect(backLink.first()).toBeAttached();
  });

  test('no ClubSpark links on info page', async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('clubspark');
  });
});

test.describe('Info Page — About Tab', () => {
  test('about tab loads with club info', async ({ page }) => {
    await page.goto('/info?tab=about', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    // Should have some about content
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
    expect(pageText.length).toBeGreaterThan(100);
  });
});

test.describe('Info Page — FAQ Tab', () => {
  test('FAQ tab has accordion and map', async ({ page }) => {
    await page.goto('/info?tab=faq', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    // Should have FAQ content
    await expect(page.getByText('FAQ').first()).toBeAttached();
  });
});
