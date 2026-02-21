const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('MTC Court Bug Fixes', () => {

  test.beforeEach(async ({ page }) => {
    // Use mobile viewport like the actual PWA
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Bug 1: Celebration modal shows dark circle + volt checkmark SVG', async ({ page }) => {
    // Trigger celebration modal via JS
    await page.evaluate(() => {
      showCelebrationModal("YOU'RE IN!", "Test event registration");
    });
    await page.waitForSelector('#modal.active', { timeout: 3000 });

    // Check the SVG icon
    const svg = page.locator('.modal-icon-success svg');
    await expect(svg).toBeVisible();

    // Verify dark circle fill
    const circleFill = await svg.locator('circle').getAttribute('fill');
    expect(circleFill).toBe('#1a1a1a');

    // Verify volt checkmark stroke
    const checkStroke = await svg.locator('polyline').getAttribute('stroke');
    expect(checkStroke).toBe('#c8ff00');

    // Close modal
    await page.evaluate(() => closeModal());
  });

  test('Bug 2: RSVP from home persists to userRsvps (club events excluded from schedule)', async ({ page }) => {
    // Clear any existing localStorage data
    await page.evaluate(() => {
      localStorage.removeItem('mtc-event-bookings');
      localStorage.removeItem('mtc-user-rsvps');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Use JS to RSVP (avoids scroll/visibility issues)
    await page.evaluate(() => {
      var btn = document.querySelector('.event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });

    // Verify eventBookings saved to localStorage
    const bookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    expect(bookings.length).toBeGreaterThan(0);

    // Verify userRsvps saved to localStorage
    const rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });
    expect(rsvps.length).toBeGreaterThan(0);
    const hasRealRsvp = rsvps.some(function(r) { return r === 'opening-day-bbq'; });
    expect(hasRealRsvp).toBe(true);

    // Navigate to schedule — club events should NOT appear (filtered out)
    await page.evaluate(() => navigateTo('schedule'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Schedule should not show club event RSVPs — only personal bookings
    const clubEventOnSchedule = await page.evaluate(() => {
      var container = document.getElementById('scheduleEventBookings');
      if (!container) return false;
      var items = container.querySelectorAll('.schedule-item');
      for (var i = 0; i < items.length; i++) {
        if (items[i].textContent.includes('BBQ')) return true;
      }
      return false;
    });
    expect(clubEventOnSchedule).toBe(false);
  });

  test('Bug 3: Club Events calendar shows dots on event dates', async ({ page }) => {
    // Login first so navigation works
    await page.evaluate(() => handleLogin());
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    // Navigate to Club Events
    await page.evaluate(() => navigateTo('events'));
    // events redirects to schedule screen with events pill active
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Switch to calendar view via JS
    await page.evaluate(() => {
      if (typeof switchEventsView === 'function') switchEventsView('calendar');
    });
    await page.waitForFunction(() => document.getElementById('eventsCalendarView')?.classList.contains('active'), { timeout: 5000 });

    // Check for calendar days with has-event class
    const eventDayCount = await page.evaluate(() => {
      return document.querySelectorAll('#eventsCalendarGrid .calendar-day.has-event').length;
    });
    expect(eventDayCount).toBeGreaterThan(0);

    // Verify the ::after pseudo-element has content (not 'none')
    const afterContent = await page.evaluate(() => {
      var day = document.querySelector('#eventsCalendarGrid .calendar-day.has-event');
      if (!day) return 'none';
      return window.getComputedStyle(day, '::after').content;
    });
    expect(afterContent).not.toBe('none');

    // Verify the dot uses left: calc positioning (no transform override)
    const leftValue = await page.evaluate(() => {
      var day = document.querySelector('#eventsCalendarGrid .calendar-day.has-event');
      if (!day) return '';
      return window.getComputedStyle(day, '::after').left;
    });
    // Should be a pixel value (not 'auto' or '50%')
    expect(leftValue).toMatch(/\d+px/);
  });

  test('Bug 4: Partner card disappears after Join', async ({ page }) => {
    // Count initial partner cards
    const initialCount = await page.evaluate(() => {
      return document.querySelectorAll('.partner-request-card').length;
    });
    expect(initialCount).toBe(2);

    // Click Join via JS to avoid visibility/scroll issues
    await page.evaluate(() => {
      var btn = document.querySelector('.partner-join-btn');
      if (btn) btn.click();
    });

    // Wait for card to be removed from DOM after animation
    await page.waitForFunction(
      (expected) => document.querySelectorAll('.partner-request-card').length === expected,
      initialCount - 1,
      { timeout: 5000 }
    );

    // Close celebration modal if open
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });

    // Should have one fewer card
    const newCount = await page.evaluate(() => {
      return document.querySelectorAll('.partner-request-card').length;
    });
    expect(newCount).toBe(initialCount - 1);
  });

  test('Bug 5: Search and Gear Exchange not in hamburger menu', async ({ page }) => {
    // Login first so menu has proper items
    await page.evaluate(() => handleLogin());
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    // Open menu via JS
    await page.evaluate(() => {
      if (typeof openMenu === 'function') openMenu();
    });
    await page.waitForFunction(() => document.getElementById('menuDrawer')?.classList.contains('open'), { timeout: 5000 });

    // Get all menu item texts
    const menuTexts = await page.evaluate(() => {
      var items = document.querySelectorAll('.menu-item .menu-item-text');
      return Array.from(items).map(function(el) { return el.textContent.trim(); });
    });

    // Search should NOT be in menu
    expect(menuTexts).not.toContain('Search');

    // Gear Exchange should NOT be in menu
    expect(menuTexts).not.toContain('Gear Exchange');

    // Club Events moved to Schedule screen pill toggle — no longer in menu
    expect(menuTexts).not.toContain('Club Events');

    // But other items should still be there
    expect(menuTexts).toContain('Profile');
    expect(menuTexts).toContain('Settings');
  });

  test('No console errors on navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate through key screens
    // events redirects to schedule screen
    await page.evaluate(() => navigateTo('events'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => navigateTo('schedule'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => navigateTo('notifications'));
    await page.waitForFunction(() => document.getElementById('screen-notifications')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => navigateTo('home'));
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    expect(errors).toEqual([]);
  });
});
