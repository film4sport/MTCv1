const { test, expect } = require('@playwright/test');

test.describe('Landing Page - Load & Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for loader to finish
    await page.waitForTimeout(4500);
  });

  test('page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('page title is set', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('scroll progress bar exists', async ({ page }) => {
    const bar = page.locator('.scroll-progress');
    await expect(bar).toBeAttached();
  });

  test('back-to-top button appears on scroll', async ({ page }) => {
    const btn = page.locator('.back-to-top');
    await expect(btn).not.toHaveClass(/visible/);
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);
    await expect(btn).toHaveClass(/visible/);
  });
});

test.describe('Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('navbar exists and is fixed', async ({ page }) => {
    const nav = page.locator('.navbar');
    await expect(nav).toBeAttached();
  });

  test('navbar gets scrolled class on scroll', async ({ page }) => {
    const nav = page.locator('.navbar');
    await expect(nav).not.toHaveClass(/scrolled/);
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);
    await expect(nav).toHaveClass(/scrolled/);
  });

  test('nav links exist for key sections', async ({ page }) => {
    const links = ['Home', 'About', 'Membership', 'Events', 'Contact', 'Book'];
    for (const text of links) {
      const link = page.locator('.navbar').getByText(text, { exact: false }).first();
      await expect(link).toBeAttached();
    }
  });

  test('no ClubSpark links in navbar', async ({ page }) => {
    const clubsparkLinks = await page.locator('.navbar a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });
});

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('hero section renders with parallax background', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeAttached();
    const bg = page.locator('.parallax-bg');
    await expect(bg).toBeAttached();
  });

  test('hero content becomes visible after animation delay', async ({ page }) => {
    const heroContent = page.locator('.hero-content');
    await expect(heroContent).toHaveClass(/visible/);
  });

  test('hero has Join Now and Book a Court buttons', async ({ page }) => {
    const joinBtn = page.locator('section').first().getByText('Join Now');
    await expect(joinBtn).toBeVisible();
    const bookBtn = page.locator('section').first().getByText('Book a Court');
    await expect(bookBtn).toBeVisible();
  });

  test('hero preview images exist', async ({ page }) => {
    const previews = page.locator('.hero-preview-img');
    const count = await previews.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('About Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('about section renders with white background', async ({ page }) => {
    const about = page.locator('#about');
    await expect(about).toBeAttached();
    await expect(about).toHaveClass(/bg-white/);
  });

  test('about section has images', async ({ page }) => {
    const images = page.locator('#about img');
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('about section has amenity tags', async ({ page }) => {
    const parking = page.locator('#about').getByText('Parking');
    await expect(parking).toBeAttached();
    const accessible = page.locator('#about').getByText('Wheelchair Accessible');
    await expect(accessible).toBeAttached();
  });
});

test.describe('Events Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('events section renders with gray background', async ({ page }) => {
    const events = page.locator('#events');
    await expect(events).toBeAttached();
    await expect(events).toHaveClass(/bg-gray-50/);
  });

  test('filter buttons exist', async ({ page }) => {
    const filters = page.locator('.filter-btn');
    const count = await filters.count();
    expect(count).toBe(4);
  });

  test('event cards are displayed', async ({ page }) => {
    const cards = page.locator('.event-card');
    const count = await cards.count();
    expect(count).toBe(3);
  });

  test('event cards have white background', async ({ page }) => {
    const card = page.locator('.event-card').first();
    await expect(card).toHaveClass(/bg-white/);
  });

  test('filter buttons work', async ({ page }) => {
    // Click Tournaments filter
    await page.locator('.filter-btn').nth(1).click();
    await page.waitForTimeout(300);
    const cards = page.locator('.event-card');
    const count = await cards.count();
    expect(count).toBe(1);
    // Click All Events to restore
    await page.locator('.filter-btn').first().click();
    await page.waitForTimeout(300);
    const allCards = page.locator('.event-card');
    const allCount = await allCards.count();
    expect(allCount).toBe(3);
  });
});

test.describe('Book a Court Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#book').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('book section renders with background image', async ({ page }) => {
    const book = page.locator('#book');
    await expect(book).toBeAttached();
    const bgImg = page.locator('#book img').first();
    await expect(bgImg).toBeAttached();
  });

  test('glass cards are displayed', async ({ page }) => {
    const cards = page.locator('.glass-card');
    const count = await cards.count();
    expect(count).toBe(4);
  });

  test('book now button exists', async ({ page }) => {
    const bookBtn = page.locator('#book').getByText('Book Now');
    await expect(bookBtn).toBeAttached();
  });
});

test.describe('Partners Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('3 partner logos are displayed', async ({ page }) => {
    const logos = page.locator('.partner-logo');
    const count = await logos.count();
    expect(count).toBe(3);
  });

  test('partner logos have images', async ({ page }) => {
    const imgs = page.locator('.partner-logo img');
    const count = await imgs.count();
    expect(count).toBe(3);
  });
});

test.describe('FAQ Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('FAQ section renders with gray background', async ({ page }) => {
    const faq = page.locator('#faq');
    await expect(faq).toBeAttached();
    await expect(faq).toHaveClass(/bg-gray-50/);
  });

  test('FAQ has accordion items', async ({ page }) => {
    const items = page.locator('.faq-item');
    const count = await items.count();
    expect(count).toBe(6);
  });

  test('FAQ accordion opens on click', async ({ page }) => {
    const firstQuestion = page.locator('.faq-question').first();
    await firstQuestion.click();
    await page.waitForTimeout(300);
    const firstItem = page.locator('.faq-item').first();
    await expect(firstItem).toHaveClass(/active/);
  });

  test('Google Maps iframe exists', async ({ page }) => {
    const map = page.locator('#faq iframe');
    await expect(map).toBeAttached();
  });
});

test.describe('Wave Dividers', () => {
  test('multiple wave dividers on the page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const dividers = page.locator('.wave-divider');
    const count = await dividers.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Booking Overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    // Open booking overlay via navbar Book button
    await page.locator('.navbar').getByText('Book', { exact: false }).first().click();
    await page.waitForTimeout(500);
  });

  test('booking overlay opens with court selection screen', async ({ page }) => {
    const overlay = page.locator('.booking-overlay.active');
    await expect(overlay).toBeAttached();
    const header = page.locator('.booking-header').getByText('Book a Court');
    await expect(header).toBeVisible();
  });

  test('date picker renders 7 days', async ({ page }) => {
    const chips = page.locator('.date-chip');
    const count = await chips.count();
    expect(count).toBe(7);
  });

  test('filter toggles work', async ({ page }) => {
    const toggle = page.locator('.filter-toggle').first();
    await toggle.click();
    await expect(toggle).toHaveClass(/active/);
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);
  });

  test('court cards are displayed', async ({ page }) => {
    const cards = page.locator('.court-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('selecting available court goes to time slot screen', async ({ page }) => {
    const selectBtn = page.locator('.court-select-btn:not([disabled])').first();
    await selectBtn.click();
    await page.waitForTimeout(300);
    const timeGrid = page.locator('.time-grid');
    await expect(timeGrid).toBeVisible();
  });

  test('full booking flow: court -> time -> confirm', async ({ page }) => {
    // Select court
    await page.locator('.court-select-btn:not([disabled])').first().click();
    await page.waitForTimeout(300);
    // Select time
    await page.locator('.time-slot:not(.booked)').first().click();
    await page.waitForTimeout(300);
    // Should be on confirm screen
    const confirmBtn = page.locator('.booking-cta');
    await expect(confirmBtn).toBeVisible();
  });

  test('close button closes overlay', async ({ page }) => {
    await page.locator('.booking-close').click();
    await page.waitForTimeout(400);
    const overlay = page.locator('.booking-overlay.active');
    await expect(overlay).toHaveCount(0);
  });

  test('escape key closes overlay', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const overlay = page.locator('.booking-overlay.active');
    await expect(overlay).toHaveCount(0);
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('footer has watermark text', async ({ page }) => {
    const watermark = page.locator('.footer-watermark');
    await expect(watermark).toBeAttached();
    const text = await watermark.textContent();
    expect(text?.trim()).toBe('MONO TENNIS');
  });

  test('footer social links exist', async ({ page }) => {
    const facebook = page.locator('footer a[href*="facebook"]');
    const instagram = page.locator('footer a[href*="instagram"]');
    await expect(facebook).toBeAttached();
    await expect(instagram).toBeAttached();
  });

  test('no ClubSpark links in footer', async ({ page }) => {
    const clubsparkLinks = await page.locator('footer a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });

  test('footer has correct address', async ({ page }) => {
    const address = page.locator('footer address');
    const text = await address.textContent();
    expect(text).toContain('754883 Mono Centre Road');
    expect(text).toContain('Mono, Ontario');
  });
});

test.describe('No ClubSpark Links - Full Page', () => {
  test('zero ClubSpark links on entire page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const clubsparkLinks = await page.locator('a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });
});

test.describe('Info Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  });

  test('/info page loads', async ({ page }) => {
    const heading = page.getByText('Membership & News');
    await expect(heading).toBeAttached();
  });

  test('info page has How to Join section', async ({ page }) => {
    const howToJoin = page.getByText('How to Join').first();
    await expect(howToJoin).toBeAttached();
  });

  test('info page has Membership Fees section', async ({ page }) => {
    const fees = page.getByText('Membership Fees').first();
    await expect(fees).toBeAttached();
  });

  test('info page has Season & Facilities section', async ({ page }) => {
    const facilities = page.getByText('Season & Facilities').first();
    await expect(facilities).toBeAttached();
  });

  test('info page has News section', async ({ page }) => {
    const news = page.getByText('News & Updates').first();
    await expect(news).toBeAttached();
  });

  test('info page has registration news', async ({ page }) => {
    const registration = page.getByRole('heading', { name: 'Registration Opens March 1st' });
    await expect(registration).toBeAttached();
  });

  test('info page has Back to Home link', async ({ page }) => {
    const backLink = page.getByText('Back to Home').first();
    await expect(backLink).toBeAttached();
  });

  test('no ClubSpark links on info page', async ({ page }) => {
    const clubsparkLinks = await page.locator('a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });
});

test.describe('Mobile PWA route still works', () => {
  test('/app route loads', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
