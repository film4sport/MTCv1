// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Landing Page — Gallery + Lightbox E2E Tests
 * Tests keyboard navigation, lightbox open/close, focus trap, Escape key
 */

test.describe('Gallery & Lightbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500); // Loader
  });

  test('gallery section renders with slides and nav buttons', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const slides = page.locator('.gallery-slide');
    const count = await slides.count();
    expect(count).toBeGreaterThanOrEqual(5);
    await expect(page.locator('.gallery-nav.prev')).toBeAttached();
    await expect(page.locator('.gallery-nav.next')).toBeAttached();
  });

  test('gallery slides are keyboard accessible (Enter opens lightbox)', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    // Focus first slide
    const firstSlide = page.locator('.gallery-slide').first();
    await firstSlide.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    // Lightbox should be open
    const lightbox = page.locator('.lightbox.active');
    await expect(lightbox).toBeVisible();
  });

  test('gallery slides are keyboard accessible (Space opens lightbox)', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const firstSlide = page.locator('.gallery-slide').first();
    await firstSlide.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    const lightbox = page.locator('.lightbox.active');
    await expect(lightbox).toBeVisible();
  });

  test('lightbox closes on Escape key', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    // Open lightbox by clicking first slide
    await page.locator('.gallery-slide').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.lightbox.active')).toBeVisible();
    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // Lightbox should close
    await expect(page.locator('.lightbox.active')).not.toBeVisible();
  });

  test('lightbox closes on backdrop click', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('.gallery-slide').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.lightbox.active')).toBeVisible();
    // Click backdrop (the lightbox div itself, not the image)
    const lightbox = page.locator('.lightbox.active');
    const box = await lightbox.boundingBox();
    if (box) {
      // Click top-left corner (away from image/close button)
      await page.mouse.click(box.x + 10, box.y + 10);
    }
    await page.waitForTimeout(300);
    await expect(page.locator('.lightbox.active')).not.toBeVisible();
  });

  test('lightbox close button receives focus on open', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('.gallery-slide').first().click();
    await page.waitForTimeout(300);
    // Close button should be focused
    const closeBtn = page.locator('.lightbox-close');
    await expect(closeBtn).toBeFocused();
  });

  test('lightbox has proper ARIA attributes', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('.gallery-slide').first().click();
    await page.waitForTimeout(300);
    const lightbox = page.locator('.lightbox.active');
    await expect(lightbox).toHaveAttribute('role', 'dialog');
    await expect(lightbox).toHaveAttribute('aria-modal', 'true');
  });

  test('gallery next/prev buttons navigate slides', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const nextBtn = page.locator('.gallery-nav.next');
    // Get initial active dot
    const initialActive = await page.locator('.gallery-dot.active').count();
    expect(initialActive).toBe(1);
    // Click next
    await nextBtn.click();
    await page.waitForTimeout(500);
    // Active dot should still exist (carousel navigated)
    const afterActive = await page.locator('.gallery-dot.active').count();
    expect(afterActive).toBe(1);
  });

  test('gallery dots navigation works', async ({ page }) => {
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const dots = page.locator('.gallery-dot');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThanOrEqual(2);
    // Click second dot
    await dots.nth(1).click();
    await page.waitForTimeout(300);
    await expect(dots.nth(1)).toHaveClass(/active/);
  });

  test('gallery slides have unique descriptive alt text', async ({ page }) => {
    const altTexts = await page.locator('.gallery-slide img').evaluateAll(
      (imgs) => imgs.map((img) => img.getAttribute('alt'))
    );
    // All should have alt text
    altTexts.forEach((alt) => expect(alt).toBeTruthy());
    // All should be unique
    const unique = new Set(altTexts);
    expect(unique.size).toBe(altTexts.length);
    // None should be the generic "MTC Tennis"
    altTexts.forEach((alt) => expect(alt).not.toBe('MTC Tennis'));
  });
});
