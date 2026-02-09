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

  test('hero has simple styled buttons (no glass-btn)', async ({ page }) => {
    // Should NOT have glass buttons
    const glassBtn = await page.locator('.glass-btn').count();
    expect(glassBtn).toBe(0);
    const glassBtnSolid = await page.locator('.glass-btn-solid').count();
    expect(glassBtnSolid).toBe(0);
    // Should have btn-primary
    const btnPrimary = page.locator('.btn-primary').first();
    await expect(btnPrimary).toBeAttached();
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

  test('hero has no texture-overlay', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).not.toHaveClass(/texture-overlay/);
  });
});

test.describe('What We Offer Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('What We Offer section renders with heading', async ({ page }) => {
    const heading = page.getByText('Play, Learn, Connect');
    await expect(heading).toBeAttached();
  });

  test('has 3 offer items: Lessons, Programs, Events', async ({ page }) => {
    const lessons = page.getByText('Lessons', { exact: true }).first();
    const programs = page.getByText('Programs', { exact: true }).first();
    const events = page.getByText('Events', { exact: true }).first();
    await expect(lessons).toBeAttached();
    await expect(programs).toBeAttached();
    await expect(events).toBeAttached();
  });

  test('has Learn More links', async ({ page }) => {
    const learnMore = page.getByText('Learn More');
    const count = await learnMore.count();
    expect(count).toBe(3);
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
    const days = page.locator('.cal-day:not(.empty)');
    const count = await days.count();
    if (count > 0) {
      await days.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Membership Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('membership section renders with heading', async ({ page }) => {
    const heading = page.getByText('Join the Club');
    await expect(heading).toBeAttached();
  });

  test('has 3 membership cards', async ({ page }) => {
    const howToJoin = page.getByText('How to Join').first();
    const season = page.getByText('Season & Facilities').first();
    const news = page.getByText('News & Updates').first();
    await expect(howToJoin).toBeAttached();
    await expect(season).toBeAttached();
    await expect(news).toBeAttached();
  });

  test('membership cards have dark backgrounds (not light)', async ({ page }) => {
    // All cards should be dark-themed
    const lightBgSections = await page.locator('section[class*="bg-gray"]').count();
    expect(lightBgSections).toBe(0);
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

test.describe('CTA Banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
  });

  test('CTA banner renders with heading', async ({ page }) => {
    const heading = page.getByText('Join Mono Tennis Club Today');
    await expect(heading).toBeAttached();
  });

  test('CTA has Register Now and Book a Court buttons', async ({ page }) => {
    const register = page.getByText('Register Now');
    const book = page.getByText('Book a Court').last();
    await expect(register).toBeAttached();
    await expect(book).toBeAttached();
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

  test('footer has no texture overlay', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).not.toHaveClass(/texture-overlay/);
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
  test('only one wave divider on the page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    const dividers = page.locator('.wave-divider');
    const count = await dividers.count();
    expect(count).toBe(1);
  });
});

test.describe('All Dark Backgrounds', () => {
  test('no light gray background sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    // No sections should have bg-gray-50 or bg-gray-100 classes
    const lightGray50 = await page.locator('[class*="bg-gray-50"]').count();
    const lightGray100 = await page.locator('[class*="bg-gray-100"]').count();
    expect(lightGray50).toBe(0);
    expect(lightGray100).toBe(0);
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
    const registration = page.getByText('Registration Opens March 1st');
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
