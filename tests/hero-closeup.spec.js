const { test, expect } = require('@playwright/test');

test('Hero-wave transition closeup', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2500);

  // Scroll to just where the hero bottom meets the wave
  const heroHeight = await page.evaluate(() => {
    const hero = document.querySelector('section');
    return hero ? hero.getBoundingClientRect().height : window.innerHeight;
  });

  // Scroll to show the bottom 200px of hero + wave area
  await page.evaluate((h) => window.scrollTo(0, h - 300), heroHeight);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/hero-wave-closeup.png', fullPage: false });

  // Also take a full page screenshot to see overall layout
  await page.screenshot({ path: 'test-results/landing-fullpage.png', fullPage: true });
});

test('Membership profile banner visible', async ({ page }) => {
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
  await page.reload();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/membership-profile-banner.png', fullPage: false });

  // Clean up
  await page.evaluate(() => localStorage.removeItem('currentUser'));
});
