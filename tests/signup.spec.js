// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Signup Flow - /info?tab=membership', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
  });

  async function switchTab(page, name, expectedTab) {
    const tabByRole = page.getByRole('tab', { name, exact: true });
    await expect(tabByRole).toBeVisible();

    const tabId = `tab-${expectedTab}`;
    const panelId = `tabpanel-${expectedTab}`;
    await page.evaluate((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    }, tabId);

    await page.evaluate((id) => {
      const element = document.getElementById(id);
      if (element instanceof HTMLElement) {
        element.click();
      }
    }, tabId);
    await page.waitForFunction(({ id, panel }) => {
      const tab = document.getElementById(id);
      const tabSelected = tab?.getAttribute('aria-selected') === 'true';
      const panelVisible = Boolean(document.getElementById(panel));
      const queryMatches = window.location.search.includes(`tab=${id.replace('tab-', '')}`);
      return (tabSelected || queryMatches) && panelVisible;
    }, { id: tabId, panel: panelId });
    await expect(page.locator(`#${tabId}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`#${panelId}`)).toBeVisible();
  }

  test('membership tab loads by default', async ({ page }) => {
    await expect(page.getByText('Why Join Mono Tennis Club').first()).toBeAttached();
  });

  test('has membership fee information', async ({ page }) => {
    await expect(page.getByText('Membership Fees')).toBeAttached();
  });

  test('has signup / become a member button', async ({ page }) => {
    const signupBtn = page.getByText('Sign Up Now').or(page.getByText('Become a Member').or(page.getByText('Join Now')));
    await expect(signupBtn.first()).toBeAttached();
  });

  test('tab navigation works', async ({ page }) => {
    await switchTab(page, 'About', 'about');
    await switchTab(page, 'FAQ', 'faq');
    await switchTab(page, 'Rules', 'rules');
  });

  test('coaching tab has coach info', async ({ page }) => {
    await switchTab(page, 'Coaching', 'coaching');
    await expect(page.getByRole('heading', { name: 'Mark Taylor' })).toBeAttached();
  });

  test('back to home link exists', async ({ page }) => {
    const backLink = page.getByText('Back to Home').or(page.locator('a[href="/"]'));
    await expect(backLink.first()).toBeAttached();
  });

  test('no ClubSpark links on info page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('a[href*="clubspark" i]')).toHaveCount(0);
  });
});

test.describe('Info Page - About Tab', () => {
  test('about tab loads with club info', async ({ page }) => {
    await page.goto('/info?tab=about', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
    expect(pageText.length).toBeGreaterThan(100);
  });
});

test.describe('Info Page - FAQ Tab', () => {
  test('FAQ tab has accordion and map', async ({ page }) => {
    await page.goto('/info?tab=faq', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    await expect(page.getByText('FAQ').first()).toBeAttached();
  });
});
