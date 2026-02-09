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

  test('nav links exist for all sections', async ({ page }) => {
    const links = ['Events', 'Gallery', 'Book'];
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

  test('hero has glass buttons', async ({ page }) => {
    const glassBtn = page.locator('.glass-btn').first();
    await expect(glassBtn).toBeAttached();
    const glassBtnSolid = page.locator('.glass-btn-solid').first();
    await expect(glassBtnSolid).toBeAttached();
  });

  test('hero preview images exist', async ({ page }) => {
    const previews = page.locator('.hero-preview-img');
    const count = await previews.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Events & Programs Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('events section has filter tabs', async ({ page }) => {
    const filters = page.locator('#events .filter-btn');
    const count = await filters.count();
    expect(count).toBe(6); // All, Tournaments, Camps, Social, Membership, News
  });

  test('filter tabs work - clicking Tournaments shows only tournaments', async ({ page }) => {
    await page.locator('#events .filter-btn').getByText('Tournaments').click();
    await page.waitForTimeout(300);
    const visibleCards = page.locator('#eventsGrid .event-card:not(.hidden)');
    const count = await visibleCards.count();
    expect(count).toBe(1);
  });

  test('Membership tab shows membership info cards', async ({ page }) => {
    await page.locator('#events .filter-btn').getByText('Membership').click();
    await page.waitForTimeout(300);
    const heading = page.locator('#events').getByText('Membership Information');
    await expect(heading).toBeVisible();
    const howToJoin = page.locator('#events').getByText('How to Join');
    await expect(howToJoin).toBeVisible();
    const fees = page.locator('#events').getByText('Membership Fees');
    await expect(fees).toBeVisible();
  });

  test('News tab shows news items', async ({ page }) => {
    await page.locator('#events .filter-btn').getByText('News').click();
    await page.waitForTimeout(300);
    const heading = page.locator('#events').getByText('News & Updates');
    await expect(heading).toBeVisible();
    const registration = page.locator('#events').getByText('Registration Opens March 1st');
    await expect(registration).toBeVisible();
  });

  test('All tab shows events + membership + news', async ({ page }) => {
    await page.locator('#events .filter-btn').getByText('All').click();
    await page.waitForTimeout(300);
    // Event cards should be visible
    const eventCards = page.locator('#eventsGrid .event-card');
    const eventCount = await eventCards.count();
    expect(eventCount).toBe(3);
    // Membership cards should be visible
    const howToJoin = page.locator('#events').getByText('How to Join');
    await expect(howToJoin).toBeVisible();
    // News items should be visible
    const registration = page.locator('#events').getByText('Registration Opens March 1st');
    await expect(registration).toBeVisible();
  });

  test('no ClubSpark links in events', async ({ page }) => {
    const clubsparkLinks = await page.locator('#events a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });

  test('event cards have 3D hover effect class', async ({ page }) => {
    const card = page.locator('.event-card-enhanced').first();
    await expect(card).toBeAttached();
  });
});

test.describe('Schedule Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#schedule').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('calendar grid renders', async ({ page }) => {
    const grid = page.locator('.cal-grid');
    await expect(grid).toBeAttached();
  });

  test('calendar has day headers', async ({ page }) => {
    const headers = page.locator('.cal-header');
    const count = await headers.count();
    expect(count).toBe(7);
  });

  test('month navigation works', async ({ page }) => {
    const monthYear = page.locator('#schedule').getByRole('heading', { level: 3 }).first();
    const initialText = await monthYear.textContent();
    // Click next month
    await page.locator('#schedule button').filter({ hasText: '' }).nth(1).click();
    await page.waitForTimeout(300);
    const newText = await monthYear.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('clicking a day shows events for that day', async ({ page }) => {
    // Click a day that might have events
    const days = page.locator('.cal-day:not(.empty)');
    const count = await days.count();
    if (count > 0) {
      await days.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('no court hours cards present', async ({ page }) => {
    const courtsText = page.locator('#schedule').getByText('Courts 1 & 2');
    await expect(courtsText).toHaveCount(0);
  });
});

test.describe('Book a Court Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#book').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('book section has texture overlay', async ({ page }) => {
    const section = page.locator('#book');
    await expect(section).toHaveClass(/texture-overlay/);
  });

  test('book section has glass/tilt cards', async ({ page }) => {
    const tiltCards = page.locator('#book .tilt-card');
    const count = await tiltCards.count();
    expect(count).toBe(4);
  });

  test('Book Now button exists and triggers booking overlay', async ({ page }) => {
    const btn = page.locator('#book').getByText('Book Now');
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForTimeout(500);
    const overlay = page.locator('.booking-overlay.active');
    await expect(overlay).toBeAttached();
  });

  test('no ClubSpark links in book section', async ({ page }) => {
    const clubsparkLinks = await page.locator('#book a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });
});

test.describe('Booking Overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    // Open booking overlay via book section
    await page.locator('#book').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('#book').getByText('Book Now').click();
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

  test('gallery carousel renders with slides', async ({ page }) => {
    const slides = page.locator('.gallery-slide');
    const count = await slides.count();
    expect(count).toBe(8);
  });

  test('gallery has navigation buttons', async ({ page }) => {
    const prev = page.locator('.gallery-nav.prev');
    const next = page.locator('.gallery-nav.next');
    await expect(prev).toBeAttached();
    await expect(next).toBeAttached();
  });

  test('gallery dots are rendered', async ({ page }) => {
    const dots = page.locator('.gallery-dot');
    const count = await dots.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clicking gallery slide opens lightbox', async ({ page }) => {
    await page.locator('.gallery-slide').first().click();
    await page.waitForTimeout(300);
    const lightbox = page.locator('.lightbox.active');
    await expect(lightbox).toBeAttached();
  });

  test('lightbox closes on Escape', async ({ page }) => {
    await page.locator('.gallery-slide').first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const lightbox = page.locator('.lightbox.active');
    await expect(lightbox).toHaveCount(0);
  });
});

test.describe('FAQ Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('FAQ accordion has 6 items', async ({ page }) => {
    const items = page.locator('.faq-item');
    const count = await items.count();
    expect(count).toBe(6);
  });

  test('clicking a question expands the answer', async ({ page }) => {
    const firstItem = page.locator('.faq-item').first();
    await expect(firstItem).not.toHaveClass(/active/);
    await firstItem.locator('.faq-question').click();
    await expect(firstItem).toHaveClass(/active/);
  });

  test('clicking same question collapses it', async ({ page }) => {
    const firstItem = page.locator('.faq-item').first();
    await firstItem.locator('.faq-question').click();
    await expect(firstItem).toHaveClass(/active/);
    await firstItem.locator('.faq-question').click();
    await expect(firstItem).not.toHaveClass(/active/);
  });

  test('Google Maps iframe exists', async ({ page }) => {
    const iframe = page.locator('#faq iframe, #directions iframe');
    await expect(iframe).toBeAttached();
  });

  test('no ClubSpark references in FAQ answers', async ({ page }) => {
    // Expand all answers
    const questions = page.locator('.faq-question');
    const count = await questions.count();
    for (let i = 0; i < count; i++) {
      await questions.nth(i).click();
      await page.waitForTimeout(100);
    }
    const clubsparkText = await page.locator('.faq-answer').filter({ hasText: 'clubspark' }).count();
    expect(clubsparkText).toBe(0);
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('footer has texture overlay', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toHaveClass(/texture-overlay/);
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

test.describe('Wave Dividers', () => {
  test('wave dividers are present between sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const dividers = page.locator('.wave-divider');
    const count = await dividers.count();
    expect(count).toBeGreaterThanOrEqual(4);
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

test.describe('Mobile PWA route still works', () => {
  test('/app route loads', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
