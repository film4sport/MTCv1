const { test, expect } = require('@playwright/test');

async function gotoLanding(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && !!document.querySelector('.wave-divider'), null, { timeout: 10000 }).catch(() => {});
  await expect(page.locator('.hero-content').first()).toBeAttached();
}

test('Hero-wave transition closeup', async ({ page }) => {
  await gotoLanding(page);

  await page.evaluate(() => {
    document.querySelector('.wave-divider')?.scrollIntoView({ block: 'center' });
  }).catch(() => {});
  const box = await expect
    .poll(async () => {
      try {
        return await page.locator('.wave-divider').first().boundingBox();
      } catch {
        return null;
      }
    }, { timeout: 5000 })
    .not.toBeNull()
    .then(async () => page.locator('.wave-divider').first().boundingBox());
  if (box) {
    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    const clip = {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.max(1, Math.min(box.width, viewport.width - Math.max(0, box.x))),
      height: Math.max(1, Math.min(box.height, viewport.height - Math.max(0, box.y))),
    };

    if (clip.width > 0 && clip.height > 0) {
      try {
        await page.screenshot({
          path: 'test-results/hero-wave-closeup.png',
          clip,
        });
      } catch {
        await page.screenshot({ path: 'test-results/hero-wave-closeup.png', fullPage: false });
      }
    } else {
      await page.screenshot({ path: 'test-results/hero-wave-closeup.png', fullPage: false });
    }
  }

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

});
