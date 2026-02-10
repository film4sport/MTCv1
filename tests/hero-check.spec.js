const { test } = require('@playwright/test');

test('Hero bottom + wave transition', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2500);

  // Scroll to show the hero bottom / wave overlap area
  const heroHeight = await page.evaluate(() => {
    const hero = document.querySelector('section');
    return hero ? hero.getBoundingClientRect().height : window.innerHeight;
  });

  await page.evaluate((h) => window.scrollTo(0, h - 300), heroHeight);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/hero-bottom-check.png', fullPage: false });
});
