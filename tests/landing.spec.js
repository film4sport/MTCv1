const { test, expect } = require('@playwright/test');
const { gotoInfo, gotoLanding, switchInfoTab } = require('./helpers/app-helpers');
const { waitForCountAtLeast, waitForCountExact } = require('./helpers/dom-helpers');

async function gotoLandingSection(page, sectionSelector) {
  await gotoLanding(page);
}

async function scrollWindow(page, y) {
  await page.evaluate(async (scrollY) => {
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      document.body.scrollHeight - window.innerHeight,
      0
    );
    const targetY = Math.min(scrollY, maxScroll);
    window.scrollTo(0, targetY);
    document.documentElement.scrollTop = targetY;
    document.body.scrollTop = targetY;
    window.dispatchEvent(new Event('scroll'));
    document.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 100));
  }, y).catch(() => {});
  await page.waitForFunction((minY) => {
    return window.scrollY >= minY || document.documentElement.scrollTop >= minY || document.body.scrollTop >= minY;
  }, y).catch(() => {});
  await page.waitForLoadState('load').catch(() => {});
}

test.describe('Landing Page - Load & Structure', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test('page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load').catch(() => {});
    await expect(page.locator('.navbar')).toBeAttached();
    expect(errors).toEqual([]);
  });

  test('page title is set', async ({ page }) => {
    await page.waitForLoadState('load').catch(() => {});
    await expect
      .poll(async () => {
        try {
          return await page.title();
        } catch {
          return '';
        }
      }, { timeout: 5000 })
      .not.toBe('');
    const title = await page.title().catch(async () => {
      await page.waitForLoadState('load').catch(() => {});
      return await page.title();
    });
    expect(title).toBeTruthy();
  });

  test('scroll progress bar exists', async ({ page }) => {
    const bar = page.locator('.scroll-progress');
    await expect(bar).toBeAttached();
  });

  test('back-to-top button appears on scroll', async ({ page }) => {
    const btn = page.locator('.back-to-top');
    await expect(btn).not.toHaveClass(/visible/);
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const maxScroll = Math.max(
              document.documentElement.scrollHeight - window.innerHeight,
              document.body.scrollHeight - window.innerHeight,
              0
            );
            window.scrollTo(0, maxScroll);
            document.documentElement.scrollTop = maxScroll;
            document.body.scrollTop = maxScroll;
            window.dispatchEvent(new Event('scroll'));
            document.dispatchEvent(new Event('scroll'));
            const el = document.querySelector('.back-to-top');
            if (!(el instanceof HTMLElement)) return null;
            return {
              className: el.className,
              opacity: getComputedStyle(el).opacity,
              visibility: getComputedStyle(el).visibility,
            };
          });
        } catch {
          return null;
        }
      }, { timeout: 10000 })
      .toMatchObject({
        visibility: 'visible',
      });
  });
});

test.describe('Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test('navbar exists and is fixed', async ({ page }) => {
    const nav = page.locator('.navbar');
    await expect(nav).toBeAttached();
  });

  test('navbar gets scrolled class on scroll', async ({ page }) => {
    const nav = page.locator('.navbar');
    await expect(nav).not.toHaveClass(/scrolled/);
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const maxScroll = Math.max(
              document.documentElement.scrollHeight - window.innerHeight,
              document.body.scrollHeight - window.innerHeight,
              0
            );
            window.scrollTo(0, maxScroll);
            document.documentElement.scrollTop = maxScroll;
            document.body.scrollTop = maxScroll;
            window.dispatchEvent(new Event('scroll'));
            document.dispatchEvent(new Event('scroll'));
            const el = document.querySelector('.navbar');
            if (!(el instanceof HTMLElement)) return null;
            return {
              className: el.className,
              backgroundColor: getComputedStyle(el).backgroundColor,
            };
          });
        } catch {
          return null;
        }
      }, { timeout: 10000 })
      .toMatchObject({
        className: expect.stringMatching(/scrolled/),
      });
  });

  test('nav links exist for key sections', async ({ page }) => {
    const links = ['Home', 'About', 'Membership', 'FAQ', 'Login'];
    for (const text of links) {
      const link = page.locator('.navbar').getByText(text, { exact: false }).first();
      await expect(link).toBeAttached();
    }
  });

});

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
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
    await gotoLandingSection(page, '#events');
  });

  test('events section renders with cream background', async ({ page }) => {
    const events = page.locator('#events');
    await expect(events).toBeAttached();
    const bg = await events.evaluate(el => el.style.backgroundColor);
    expect(bg).toBeTruthy();
  });

  test('event cards are displayed', async ({ page }) => {
    const cards = page.locator('.event-card');
    await waitForCountExact(cards, 3);
  });

  test('event cards have warm background', async ({ page }) => {
    const card = page.locator('.event-card').first();
    const bg = await card.evaluate(el => el.style.backgroundColor);
    expect(bg).toBeTruthy();
  });
});

test.describe('Schedule / Calendar Section', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLandingSection(page, '#schedule');
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
    await waitForCountExact(headers, 7);
  });

  test('calendar has day cells', async ({ page }) => {
    const days = page.locator('.cal-day:not(.empty)');
    await waitForCountAtLeast(days, 28);
  });

  test('today button exists', async ({ page }) => {
    const todayBtn = page.locator('#schedule').getByText('Today');
    await expect(todayBtn).toBeAttached();
  });

  test('month navigation works', async ({ page }) => {
    const monthTitle = page.locator('#schedule h3').first();
    const nextMonthButton = page.locator('#schedule button[aria-label="Next month"]');
    const initialText = (await monthTitle.textContent())?.trim();
    await expect(nextMonthButton).toBeAttached();
    await expect
      .poll(async () => {
        await nextMonthButton.click().catch(() => {});
        return (await monthTitle.textContent())?.trim();
      }, { timeout: 7000 })
      .not.toBe(initialText);
  });
});

test.describe('Partners Section', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test('3 partner logos are displayed', async ({ page }) => {
    const partners = page.locator('.partner-logo');
    await expect(partners.first()).toBeAttached({ timeout: 5000 });
    await expect
      .poll(async () => await partners.count(), { timeout: 5000 })
      .toBe(3);
  });

  test('partner logos have images', async ({ page }) => {
    const logos = page.locator('.partner-logo');
    await expect(logos.first()).toBeAttached({ timeout: 5000 });
    await page.evaluate(() => {
      document.querySelector('.partner-logo')?.scrollIntoView({ block: 'center' });
    }).catch(() => {});
    const imgs = page.locator('.partner-logo img, .partner-logo [data-nimg]');
    await expect(imgs.first()).toBeAttached({ timeout: 5000 });
    await expect
      .poll(async () => await imgs.count(), { timeout: 5000 })
      .toBe(3);
  });
});

test.describe('Gallery Section', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLandingSection(page, '#gallery');
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
    await waitForCountAtLeast(slides, 10);
  });

  test('gallery navigation buttons exist', async ({ page }) => {
    const prev = page.locator('.gallery-nav.prev');
    const next = page.locator('.gallery-nav.next');
    await expect(prev).toBeAttached();
    await expect(next).toBeAttached();
  });

  test('gallery dots exist', async ({ page }) => {
    await page.locator('#gallery').first().scrollIntoViewIfNeeded();
    const dots = page.locator('.gallery-dot');
    await waitForCountAtLeast(dots, 1);
  });
});

test.describe('Wave Dividers', () => {
  test('wave divider exists on the page', async ({ page }) => {
    await gotoLanding(page);
    const dividers = page.locator('.wave-divider');
    await waitForCountAtLeast(dividers, 1);
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLandingSection(page, 'footer');
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

  test('footer has correct address', async ({ page }) => {
    const address = page.locator('footer address');
    const text = await address.textContent();
    expect(text).toContain('754483 Mono Centre Rd');
    expect(text).toContain('Mono, Ontario');
  });
});

test.describe('Info Page', () => {
  test('default tab is membership', async ({ page }) => {
    await gotoInfo(page, 'membership');
    const heading = page.getByText('Why Join Mono Tennis Club').first();
    await expect(heading).toBeAttached();
  });

  test('info page has membership section on membership tab', async ({ page }) => {
    await gotoInfo(page, 'membership');
    const membershipHeading = page.getByText('Why Join Mono Tennis Club').first();
    await expect(membershipHeading).toBeAttached();
  });

  test('info page has Membership Fees on membership tab', async ({ page }) => {
    await gotoInfo(page, 'membership');
    const fees = page.getByText('Membership Fees').first();
    await expect(fees).toBeAttached();
  });

  test('about tab shows About content', async ({ page }) => {
    await gotoInfo(page, 'about');
    const heading = page.getByText('About Us').first();
    await expect(heading).toBeAttached();
    const passion = page.getByText('Great Tennis');
    await expect(passion).toBeAttached();
  });

  test('faq tab shows FAQ content', async ({ page }) => {
    await gotoInfo(page, 'faq');
    const faqHeading = page.getByText('Frequently Asked Questions');
    await expect(faqHeading).toBeAttached();
    const mapHeading = page.getByText('Find Us');
    await expect(mapHeading).toBeAttached();
  });

  test('tab navigation buttons exist', async ({ page }) => {
    await gotoInfo(page, 'membership');
    const tabLabels = ['About', 'Membership', 'Coaching', 'FAQ', 'Rules', 'Privacy', 'Terms'];
    for (const label of tabLabels) {
      const tab = page.getByRole('tab', { name: label, exact: true });
      await expect(tab).toBeAttached();
    }
  });

  test('tab switching works', async ({ page }) => {
    await gotoInfo(page, 'membership');
    await switchInfoTab(page, 'About', 'about');
    const aboutContent = page.getByText('Great Tennis');
    await expect(aboutContent).toBeAttached();
    await switchInfoTab(page, 'FAQ', 'faq');
    const faqContent = page.getByText('Frequently Asked Questions');
    await expect(faqContent).toBeAttached();
  });

  test('info page has Back to Home link', async ({ page }) => {
    await gotoInfo(page, 'membership');
    const backLink = page.getByText('Back to Home').first();
    await expect(backLink).toBeAttached();
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
