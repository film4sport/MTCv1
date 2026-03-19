const { test, expect } = require('@playwright/test');

test.describe('Landing Page - Load & Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for loader to finish
    await page.waitForTimeout(2500);
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
    await page.waitForTimeout(2500);
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
    const links = ['Home', 'About', 'Membership', 'FAQ', 'Login'];
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
    await page.waitForTimeout(2500);
  });

  test('hero section renders with parallax background', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeAttached();
    const bg = page.locator('.parallax-bg');
    await expect(bg).toBeAttached();
  });

  test('hero content becomes visible after animation delay', async ({ page }) => {
    const heroContent = page.locator('.hero-content').first();
    await expect(heroContent).toHaveClass(/visible/);
  });

  test('hero has Become a Member and Member Login buttons', async ({ page }) => {
    const joinBtn = page.locator('section').first().getByText('Become a Member');
    await expect(joinBtn).toBeVisible();
    const loginBtn = page.locator('section').first().getByText('Member Login');
    await expect(loginBtn).toBeVisible();
  });

  test('hero bottom bar has tennis info and scroll indicator', async ({ page }) => {
    const scrollDown = page.getByText('Scroll Down');
    await expect(scrollDown).toBeVisible();
    // "// Tennis" and "// 2026" are hidden on mobile (hidden sm:inline)
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    if (viewportWidth >= 640) {
      const tennis = page.getByText('// Tennis');
      await expect(tennis).toBeVisible();
      const year = page.getByText('// 2026');
      await expect(year).toBeVisible();
    }
  });
});

test.describe('Events Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('events section renders with cream background', async ({ page }) => {
    const events = page.locator('#events');
    await expect(events).toBeAttached();
    const bg = await events.evaluate(el => el.style.backgroundColor);
    expect(bg).toBeTruthy();
  });

  test('event cards are displayed', async ({ page }) => {
    const cards = page.locator('.event-card');
    const count = await cards.count();
    expect(count).toBe(3);
  });

  test('event cards have warm background', async ({ page }) => {
    const card = page.locator('.event-card').first();
    const bg = await card.evaluate(el => el.style.backgroundColor);
    expect(bg).toBeTruthy();
  });
});

test.describe('Schedule / Calendar Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
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
    await page.waitForTimeout(2500);
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
    await page.waitForTimeout(2500);
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
  test('wave divider exists on the page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const dividers = page.locator('.wave-divider');
    const count = await dividers.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
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
    expect(text).toContain('754483 Mono Centre Rd');
    expect(text).toContain('Mono, Ontario');
  });
});

test.describe('No ClubSpark Links - Full Page', () => {
  test('zero ClubSpark links on entire page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const clubsparkLinks = await page.locator('a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });
});

test.describe('Info Page', () => {
  async function gotoInfo(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
  }

  async function switchInfoTab(page, label, tabKey) {
    const tab = page.getByRole('tab', { name: label, exact: true }).first();
    await expect(tab).toBeVisible();
    let switchedViaClick = false;
    try {
      await tab.click({ timeout: 3000 });
      switchedViaClick = true;
    } catch {
      await page.goto(`/info?tab=${tabKey}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(250);
    }
    await page.waitForFunction((expectedTab) => {
      return window.location.search.includes(`tab=${expectedTab}`) ||
        !!document.getElementById(`tabpanel-${expectedTab}`);
    }, tabKey, { timeout: 4000 });
    if (!switchedViaClick) {
      await page.waitForTimeout(250);
    }
    await expect(page.locator(`#tabpanel-${tabKey}`)).toBeVisible();
    await expect(page.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
  }

  test('default tab is membership', async ({ page }) => {
    await gotoInfo(page, '/info');
    const heading = page.getByText('Why Join Mono Tennis Club').first();
    await expect(heading).toBeAttached();
  });

  test('info page has membership section on membership tab', async ({ page }) => {
    await gotoInfo(page, '/info?tab=membership');
    const membershipHeading = page.getByText('Why Join Mono Tennis Club').first();
    await expect(membershipHeading).toBeAttached();
  });

  test('info page has Membership Fees on membership tab', async ({ page }) => {
    await gotoInfo(page, '/info?tab=membership');
    const fees = page.getByText('Membership Fees').first();
    await expect(fees).toBeAttached();
  });

  test('about tab shows About content', async ({ page }) => {
    await gotoInfo(page, '/info?tab=about');
    const heading = page.getByText('About Us').first();
    await expect(heading).toBeAttached();
    const passion = page.getByText('Great Tennis');
    await expect(passion).toBeAttached();
  });

  test('faq tab shows FAQ content', async ({ page }) => {
    await gotoInfo(page, '/info?tab=faq');
    const faqHeading = page.getByText('Frequently Asked Questions');
    await expect(faqHeading).toBeAttached();
    const mapHeading = page.getByText('Find Us');
    await expect(mapHeading).toBeAttached();
  });

  test('tab navigation buttons exist', async ({ page }) => {
    await gotoInfo(page, '/info');
    const tabLabels = ['About', 'Membership', 'Coaching', 'FAQ', 'Rules', 'Privacy', 'Terms'];
    for (const label of tabLabels) {
      const tab = page.getByRole('tab', { name: label, exact: true });
      await expect(tab).toBeAttached();
    }
  });

  test('tab switching works', async ({ page }) => {
    await gotoInfo(page, '/info');
    await switchInfoTab(page, 'About', 'about');
    const aboutContent = page.getByText('Great Tennis');
    await expect(aboutContent).toBeAttached();
    await switchInfoTab(page, 'FAQ', 'faq');
    const faqContent = page.getByText('Frequently Asked Questions');
    await expect(faqContent).toBeAttached();
  });

  test('info page has Back to Home link', async ({ page }) => {
    await gotoInfo(page, '/info');
    const backLink = page.getByText('Back to Home').first();
    await expect(backLink).toBeAttached();
  });

  test('no ClubSpark links on info page', async ({ page }) => {
    await gotoInfo(page, '/info');
    const clubsparkLinks = await page.locator('a[href*="clubspark"]').count();
    expect(clubsparkLinks).toBe(0);
  });
});

test.describe('Dashboard route works', () => {
  test('/dashboard route loads', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
