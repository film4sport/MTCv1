const { test, expect } = require('@playwright/test');

async function gotoLanding(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await expect(page.locator('.hero-content').first()).toBeAttached();
}

test('Hero-wave transition closeup', async ({ page }) => {
  await gotoLanding(page);

  // Scroll to just where the hero bottom meets the wave
  const heroHeight = await page.evaluate(() => {
    const hero = document.querySelector('section');
    return hero ? hero.getBoundingClientRect().height : window.innerHeight;
  });

  // Scroll to show the bottom 200px of hero + wave area
  await page.evaluate((h) => window.scrollTo(0, h - 300), heroHeight);
  await expect(page.locator('.wave-divider').first()).toBeAttached();
  await page.screenshot({ path: 'test-results/hero-wave-closeup.png', fullPage: false });

  // Also take a full page screenshot to see overall layout
  await page.screenshot({ path: 'test-results/landing-fullpage.png', fullPage: true });
});

test('Membership profile banner visible', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      name: 'Test Player',
      email: 'test@example.com',
      membershipType: 'adult',
      rating: 'Intermediate',
      waiverAccepted: true,
      joinedDate: new Date().toISOString(),
    }));
  });

  await page.goto('/info?tab=membership', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Why Join Mono Tennis Club').first()).toBeAttached();
  await page.screenshot({ path: 'test-results/membership-profile-banner.png', fullPage: false });

  // Clean up
  await page.evaluate(() => localStorage.removeItem('currentUser'));
});
