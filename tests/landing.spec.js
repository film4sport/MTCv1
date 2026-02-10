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
    const links = ['Home', 'About', 'Membership', 'Events', 'FAQ', 'Book'];
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

test.describe('Schedule / Calendar Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#schedule').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('schedule section renders', async ({ page }) => {
    const schedule = page.locator('#schedule');
    await expect(schedule).toBeAttached();
  });

  test('calendar grid exists', async ({ page }) => {
    const grid = page.locator('.cal-grid');
    await expect(grid).toBeAttached();
  });

  test('calendar has day headers', async ({ page }) => {
    const headers = page.locator('.cal-header');
    const count = await headers.count();
    expect(count).toBe(7);
  });

  test('calendar has day cells', async ({ page }) => {
    const days = page.locator('.cal-day:not(.empty)');
    const count = await days.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  test('today button exists', async ({ page }) => {
    const todayBtn = page.locator('#schedule').getByText('Today');
    await expect(todayBtn).toBeAttached();
  });

  test('month navigation works', async ({ page }) => {
    const monthTitle = page.locator('#schedule h3').first();
    const initialText = await monthTitle.textContent();
    // Click next month
    const nextBtn = page.locator('#schedule button').nth(1);
    await nextBtn.click();
    await page.waitForTimeout(300);
    const newText = await monthTitle.textContent();
    expect(newText).not.toBe(initialText);
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

test.describe('Gallery Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('gallery section renders', async ({ page }) => {
    const gallery = page.locator('#gallery');
    await expect(gallery).toBeAttached();
  });

  test('gallery carousel exists', async ({ page }) => {
    const carousel = page.locator('.gallery-carousel');
    await expect(carousel).toBeAttached();
  });

  test('gallery has slide images', async ({ page }) => {
    const slides = page.locator('.gallery-slide');
    const count = await slides.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('gallery navigation buttons exist', async ({ page }) => {
    const prev = page.locator('.gallery-nav.prev');
    const next = page.locator('.gallery-nav.next');
    await expect(prev).toBeAttached();
    await expect(next).toBeAttached();
  });

  test('gallery dots exist', async ({ page }) => {
    const dots = page.locator('.gallery-dot');
    const count = await dots.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Wave Dividers', () => {
  test('multiple wave dividers on the page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const dividers = page.locator('.wave-divider');
    const count = await dividers.count();
    expect(count).toBeGreaterThanOrEqual(4);
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
  test('default tab is membership', async ({ page }) => {
    await page.goto('/info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const heading = page.getByText('Membership & News');
    await expect(heading).toBeAttached();
  });

  test('info page has How to Join section on membership tab', async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const howToJoin = page.getByText('How to Join').first();
    await expect(howToJoin).toBeAttached();
  });

  test('info page has Membership Fees on membership tab', async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const fees = page.getByText('Membership Fees').first();
    await expect(fees).toBeAttached();
  });

  test('info page has Season & Facilities on membership tab', async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const facilities = page.getByText('Season & Facilities').first();
    await expect(facilities).toBeAttached();
  });

  test('info page has News on membership tab', async ({ page }) => {
    await page.goto('/info?tab=membership', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const news = page.getByText('News & Updates').first();
    await expect(news).toBeAttached();
  });

  test('about tab shows About content', async ({ page }) => {
    await page.goto('/info?tab=about', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const heading = page.getByText('About Us').first();
    await expect(heading).toBeAttached();
    const passion = page.getByText('Passion, Community,');
    await expect(passion).toBeAttached();
  });

  test('faq tab shows FAQ content', async ({ page }) => {
    await page.goto('/info?tab=faq', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const faqHeading = page.getByText('Frequently Asked Questions');
    await expect(faqHeading).toBeAttached();
    const mapHeading = page.getByText('Find Us');
    await expect(mapHeading).toBeAttached();
  });

  test('tab navigation buttons exist', async ({ page }) => {
    await page.goto('/info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const tabs = page.locator('.filter-btn');
    const count = await tabs.count();
    expect(count).toBe(3);
  });

  test('tab switching works', async ({ page }) => {
    await page.goto('/info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // Click About tab
    await page.locator('.filter-btn').getByText('About').click();
    await page.waitForTimeout(500);
    const aboutContent = page.getByText('Passion, Community,');
    await expect(aboutContent).toBeAttached();
    // Click FAQ tab
    await page.locator('.filter-btn').getByText('FAQ').click();
    await page.waitForTimeout(500);
    const faqContent = page.getByText('Frequently Asked Questions');
    await expect(faqContent).toBeAttached();
  });

  test('info page has Back to Home link', async ({ page }) => {
    await page.goto('/info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const backLink = page.getByText('Back to Home').first();
    await expect(backLink).toBeAttached();
  });

  test('no ClubSpark links on info page', async ({ page }) => {
    await page.goto('/info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
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
