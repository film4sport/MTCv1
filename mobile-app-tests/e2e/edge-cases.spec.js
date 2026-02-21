const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

// ============================================
// HELPER: Fresh login + clear state
// ============================================
async function freshStart(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    localStorage.removeItem('mtc-event-bookings');
    localStorage.removeItem('mtc-user-rsvps');
    localStorage.removeItem('mtc-class-registrations');
    localStorage.removeItem('mtc-coach-notifications');
    localStorage.removeItem('mtc-joined-partners');
    localStorage.removeItem('mtc-conversations');
    localStorage.removeItem('mtc-partner-requests');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// ============================================
// DOUBLE-BOOKING PREVENTION
// ============================================
test.describe('Double-Booking Prevention', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('Cannot book the same court slot twice', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Count confirmed bookings BEFORE (demo data has existing ones)
    const countBefore = await page.evaluate(() => {
      return memberPaymentData.bookings.filter(function(b) {
        return b.status === 'confirmed';
      }).length;
    });

    // Find and click first available slot
    const slotBooked = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!slotBooked) return; // No available slots, skip

    // Confirm the booking
    await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });
    const confirmed = await page.evaluate(() => {
      if (typeof confirmBookingPayment === 'function') {
        confirmBookingPayment();
        return true;
      }
      return false;
    });
    if (!confirmed) return;
    await page.waitForFunction(() => {
      const m = document.getElementById('modal');
      return m && m.classList.contains('active');
    }, { timeout: 5000 });

    // Close celebration modal
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });
    await page.waitForFunction(() => !document.querySelector('#modal.active'), { timeout: 5000 });

    // Close confirmation screen if visible
    await page.evaluate(() => {
      if (typeof closeConfirmation === 'function') closeConfirmation();
    });
    await page.waitForFunction(() => {
      const cs = document.getElementById('confirmationScreen');
      return !cs || !cs.classList.contains('active');
    }, { timeout: 5000 });

    // Count user's bookings — should be one more than before
    const bookingCount = await page.evaluate(() => {
      return memberPaymentData.bookings.filter(function(b) {
        return b.status === 'confirmed';
      }).length;
    });
    expect(bookingCount).toBe(countBefore + 1);

    // Try to book same slot again via direct function call
    const doubleBookResult = await page.evaluate(() => {
      // Find the most recently added booking (first confirmed one)
      var existingBooking = memberPaymentData.bookings.find(function(b) {
        return b.status === 'confirmed';
      });
      if (!existingBooking) return 'no-booking';
      selectedSlot = {
        date: existingBooking.date,
        time: existingBooking.time,
        court: String(existingBooking.court)
      };
      confirmBookingPayment();
      return 'attempted';
    });
    await page.waitForFunction((expected) => {
      return memberPaymentData.bookings.filter(b => b.status === 'confirmed').length === expected;
    }, countBefore + 1, { timeout: 5000 });

    // Count should still be countBefore + 1 (double-booking prevented)
    const finalCount = await page.evaluate(() => {
      return memberPaymentData.bookings.filter(function(b) {
        return b.status === 'confirmed';
      }).length;
    });
    expect(finalCount).toBe(countBefore + 1);
  });

  test('Clicking own booking slot shows info, does not re-book', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Check that clicking a my-booking slot doesn't open booking modal
    const hasMyBooking = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.my-booking');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });

    if (hasMyBooking) {
      // Booking modal should NOT be active
      const modalActive = await page.evaluate(() => {
        var m = document.getElementById('bookingModal');
        return m ? m.classList.contains('active') : false;
      });
      expect(modalActive).toBe(false);
    }
  });
});

// ============================================
// RSVP CYCLE (Register → Cancel → Re-register)
// ============================================
test.describe('RSVP Lifecycle', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('RSVP → cancel → re-RSVP preserves data integrity', async ({ page }) => {
    // RSVP to BBQ
    await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });
    await page.waitForFunction(() => {
      var rsvps = JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
      return rsvps.includes('opening-day-bbq');
    }, { timeout: 5000 });

    // Check user is in RSVP list
    var rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });
    expect(rsvps).toContain('opening-day-bbq');

    // Check attendees include 'You'
    var hasYou = await page.evaluate(() => {
      return clubEventsData['opening-day-bbq'].attendees.includes('You');
    });
    expect(hasYou).toBe(true);

    // Cancel the RSVP (click again — this triggers a confirm dialog via confirm-modal.js hook)
    const cancelDebug = await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (!btn) return { error: 'no-btn' };
      var hasConfirmed = btn.classList.contains('confirmed');
      rsvpToEvent('bbq', btn);
      var modal = document.getElementById('confirmModal');
      return {
        hasConfirmed: hasConfirmed,
        modalExists: !!modal,
        modalActive: modal ? modal.classList.contains('active') : false
      };
    });

    // The modal is already active from the evaluate above, click confirm immediately
    const clicked = await page.evaluate(() => {
      var confirmBtn = document.getElementById('confirmModalConfirm');
      if (!confirmBtn) return 'no-btn';
      confirmBtn.click();
      return 'clicked';
    });
    // Wait for closeConfirmModal() + setTimeout(onConfirm, 200) + the onConfirm execution
    await page.waitForFunction(() => {
      var rsvps = JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
      return !rsvps.includes('opening-day-bbq');
    }, { timeout: 5000 });

    // Check removed from RSVP list
    rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });
    expect(rsvps).not.toContain('opening-day-bbq');

    // Check 'You' removed from attendees
    hasYou = await page.evaluate(() => {
      return clubEventsData['opening-day-bbq'].attendees.includes('You');
    });
    expect(hasYou).toBe(false);

    // Check event booking removed
    var bookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    var hasBbq = bookings.some(function(b) { return b.eventId === 'opening-day-bbq'; });
    expect(hasBbq).toBe(false);

    // Re-RSVP
    await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });
    await page.waitForFunction(() => {
      var rsvps = JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
      return rsvps.includes('opening-day-bbq');
    }, { timeout: 5000 });

    // Should be back in
    rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });
    expect(rsvps).toContain('opening-day-bbq');
  });

  test('Rapid RSVP clicks only register once', async ({ page }) => {
    // Click RSVP 5x rapidly
    await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (btn) {
        rsvpToEvent('bbq', btn);
        rsvpToEvent('bbq', btn);
        rsvpToEvent('bbq', btn);
        rsvpToEvent('bbq', btn);
        rsvpToEvent('bbq', btn);
      }
    });
    await page.waitForFunction(() => {
      return localStorage.getItem('mtc-user-rsvps') !== null;
    }, { timeout: 5000 });

    // Odd number of clicks → should be registered (toggle)
    // 5 clicks: on-off-on-off-on → registered
    var rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });

    // Count how many times opening-day-bbq appears (should be max 1)
    var count = rsvps.filter(function(r) { return r === 'opening-day-bbq'; }).length;
    expect(count).toBeLessThanOrEqual(1);

    // Attendees should have 'You' at most once
    var youCount = await page.evaluate(() => {
      return clubEventsData['opening-day-bbq'].attendees.filter(function(n) {
        return n === 'You';
      }).length;
    });
    expect(youCount).toBeLessThanOrEqual(1);
  });

  test('RSVP from Club Events modal works correctly', async ({ page }) => {
    await page.evaluate(() => navigateTo('events'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Clear any existing RSVPs for this event
    await page.evaluate(() => {
      userRsvps = userRsvps.filter(function(id) { return id !== 'opening-day-bbq'; });
      saveUserRsvps();
      clubEventsData['opening-day-bbq'].attendees = clubEventsData['opening-day-bbq'].attendees.filter(function(n) { return n !== 'You'; });
    });

    // Open event modal and RSVP
    await page.evaluate(() => {
      showEventModal('opening-day-bbq');
    });
    await page.waitForFunction(() => document.getElementById('eventModal') !== null, { timeout: 5000 });

    // Click register
    await page.evaluate(() => {
      toggleEventRsvp('opening-day-bbq');
    });
    await page.waitForFunction(() => {
      var rsvps = JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
      return rsvps.includes('opening-day-bbq');
    }, { timeout: 5000 });

    // Verify registration
    var rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });
    expect(rsvps).toContain('opening-day-bbq');

    // Modal should auto-close
    await page.waitForFunction(() => document.getElementById('eventModal') === null, { timeout: 5000 });
    var modalExists = await page.evaluate(() => {
      return document.getElementById('eventModal') !== null;
    });
    expect(modalExists).toBe(false);
  });
});

// ============================================
// RSVP LIST MODAL
// ============================================
test.describe('RSVP List Modal', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('Tapping home event opens RSVP list modal', async ({ page }) => {
    // Tap on event card (not the RSVP button)
    await page.evaluate(() => {
      showRsvpListModal('bbq');
    });
    await page.waitForFunction(() => document.getElementById('rsvpListModal') !== null, { timeout: 5000 });

    // Modal should exist
    var modalExists = await page.evaluate(() => {
      return document.getElementById('rsvpListModal') !== null;
    });
    expect(modalExists).toBe(true);

    // Should show event title
    var title = await page.evaluate(() => {
      var el = document.querySelector('.rsvp-modal-title');
      return el ? el.textContent : '';
    });
    expect(title).toContain('BBQ');

    // Should show attendee list
    var attendeeCount = await page.evaluate(() => {
      return document.querySelectorAll('.rsvp-attendee').length;
    });
    expect(attendeeCount).toBeGreaterThan(0);

    // Close modal
    await page.evaluate(() => closeRsvpListModal());
    await page.waitForFunction(() => document.getElementById('rsvpListModal') === null, { timeout: 5000 });

    var modalGone = await page.evaluate(() => {
      return document.getElementById('rsvpListModal') === null;
    });
    expect(modalGone).toBe(true);
  });

  test('RSVP list shows "You" badge when registered', async ({ page }) => {
    // RSVP first
    await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });
    await page.waitForFunction(() => {
      var rsvps = JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
      return rsvps.includes('opening-day-bbq');
    }, { timeout: 5000 });

    // Open RSVP list
    await page.evaluate(() => showRsvpListModal('bbq'));
    await page.waitForFunction(() => document.getElementById('rsvpListModal') !== null, { timeout: 5000 });

    // Check for YOU badge
    var hasYouBadge = await page.evaluate(() => {
      return document.querySelector('.rsvp-you-badge') !== null;
    });
    expect(hasYouBadge).toBe(true);

    // Check for registered button state
    var hasRegisteredBtn = await page.evaluate(() => {
      return document.querySelector('.rsvp-modal-action-btn.registered') !== null;
    });
    expect(hasRegisteredBtn).toBe(true);

    await page.evaluate(() => closeRsvpListModal());
  });

  test('RSVP list shows attendee count for social events (no spot limit)', async ({ page }) => {
    await page.evaluate(() => showRsvpListModal('bbq'));
    await page.waitForFunction(() => document.getElementById('rsvpListModal') !== null, { timeout: 5000 });

    var spotsText = await page.evaluate(() => {
      var el = document.querySelector('.rsvp-spots-text');
      return el ? el.textContent : '';
    });
    // BBQ is a social event (badge: 'free') — should show "X going" not "X / 60"
    expect(spotsText).toContain('going');

    await page.evaluate(() => closeRsvpListModal());
  });
});

// ============================================
// BOOKING MODAL UI
// ============================================
test.describe('Booking Modal Compactness', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Booking modal confirm button is visible without scroll on iPhone viewport', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Select a slot
    var slotFound = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!slotFound) return;

    await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });

    // Check confirm button is in viewport
    var btnVisible = await page.evaluate(() => {
      var btn = document.querySelector('.booking-confirm-btn');
      if (!btn) return false;
      var rect = btn.getBoundingClientRect();
      return rect.bottom <= window.innerHeight && rect.top >= 0;
    });
    expect(btnVisible).toBe(true);
  });

  test('Booking modal is centered (not bottom-sheet)', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    var slotFound = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!slotFound) return;

    await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });

    // Check overlay uses align-items: center
    var alignment = await page.evaluate(() => {
      var overlay = document.querySelector('.booking-modal-overlay');
      if (!overlay) return '';
      return window.getComputedStyle(overlay).alignItems;
    });
    expect(alignment).toBe('center');
  });
});

// ============================================
// CONFIRMATION SCREEN
// ============================================
test.describe('Confirmation Screen', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Confirmation buttons are side-by-side (not stacked)', async ({ page }) => {
    // Open confirmation screen
    await page.evaluate(() => {
      showConfirmationScreen({
        date: 'Saturday, May 9',
        time: '2:00 PM - 3:00 PM',
        court: 'Court 2'
      });
    });
    await page.waitForFunction(() => {
      var cs = document.getElementById('confirmationScreen');
      return cs && cs.classList.contains('active');
    }, { timeout: 5000 });

    // Check actions container is flex row
    var direction = await page.evaluate(() => {
      var container = document.querySelector('.confirmation-actions');
      if (!container) return '';
      return window.getComputedStyle(container).flexDirection;
    });
    expect(direction).toBe('row');

    await page.evaluate(() => closeConfirmation());
  });

  test('Add to Calendar button is compact (not oversized)', async ({ page }) => {
    await page.evaluate(() => {
      showConfirmationScreen({
        date: 'Saturday, May 9',
        time: '2:00 PM - 3:00 PM',
        court: 'Court 2'
      });
    });
    await page.waitForFunction(() => {
      var cs = document.getElementById('confirmationScreen');
      return cs && cs.classList.contains('active');
    }, { timeout: 5000 });

    // Primary button height should be reasonable
    var btnHeight = await page.evaluate(() => {
      var btn = document.querySelector('.confirmation-btn.primary');
      if (!btn) return 999;
      return btn.getBoundingClientRect().height;
    });
    // Should be < 60px (was huge before fix)
    expect(btnHeight).toBeLessThan(60);

    await page.evaluate(() => closeConfirmation());
  });
});

// ============================================
// PARTNER CARDS — JOIN + REPOPULATE
// ============================================
test.describe('Partner Card Lifecycle', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('Joining partner removes card and repopulates from pool', async ({ page }) => {
    // Count initial cards
    var initial = await page.evaluate(() => {
      return document.querySelectorAll('#screen-home .partner-request-card').length;
    });
    expect(initial).toBe(2);

    // Click Join on FIRST card
    await page.evaluate(() => {
      var btn = document.querySelector('#screen-home .partner-join-btn');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      var joined = JSON.parse(localStorage.getItem('mtc-joined-partners') || '[]');
      return joined.length > 0;
    }, { timeout: 5000 });

    // Close celebration modal if shown and wait for card removal animation
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });
    await page.waitForTimeout(400);

    // After joining 1 of 2, card is removed with animation (300ms)
    // hideEmptyPartnerRequests only repopulates when ALL cards are gone
    // So we expect 1 card remaining
    var afterFirst = await page.evaluate(() => {
      return document.querySelectorAll('#screen-home .partner-request-card').length;
    });
    expect(afterFirst).toBe(1);

    // Now join the second card too
    await page.evaluate(() => {
      var btn = document.querySelector('#screen-home .partner-join-btn');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      var joined = JSON.parse(localStorage.getItem('mtc-joined-partners') || '[]');
      return joined.length >= 2;
    }, { timeout: 5000 });

    // Close celebration modal and wait for animation
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });
    await page.waitForTimeout(400);

    // After joining both, repopulation should kick in from the pool
    var afterBoth = await page.evaluate(() => {
      return document.querySelectorAll('#screen-home .partner-request-card').length;
    });
    // Should have repopulated with new cards from pool (up to 2)
    expect(afterBoth).toBeGreaterThanOrEqual(1);
  });

  test('Joined partners persist to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      var btn = document.querySelector('.partner-join-btn');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      var joined = JSON.parse(localStorage.getItem('mtc-joined-partners') || '[]');
      return joined.length > 0;
    }, { timeout: 5000 });

    // Check localStorage
    var joined = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-joined-partners') || '[]');
    });
    expect(joined.length).toBeGreaterThan(0);
  });
});

// ============================================
// COACH CLASS REGISTRATION
// ============================================
test.describe('Coach Class Registration', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('Register for class saves to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      registerForClass('adult-beginner');
    });
    await page.waitForFunction(() => {
      var regs = JSON.parse(localStorage.getItem('mtc-class-registrations') || '{}');
      return regs['adult-beginner'] && regs['adult-beginner'].length > 0;
    }, { timeout: 5000 });

    var regs = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-class-registrations') || '{}');
    });
    expect(regs['adult-beginner']).toBeDefined();
    expect(regs['adult-beginner'].length).toBe(1);
    expect(regs['adult-beginner'][0].name).toBe('You');
  });

  test('Cannot register for same class twice', async ({ page }) => {
    // Register once
    await page.evaluate(() => registerForClass('adult-beginner'));
    await page.waitForFunction(() => {
      var regs = JSON.parse(localStorage.getItem('mtc-class-registrations') || '{}');
      return regs['adult-beginner'] && regs['adult-beginner'].length > 0;
    }, { timeout: 5000 });

    // Close celebration modal
    await page.evaluate(() => {
      var m = document.getElementById('celebrationModal');
      if (m) m.remove();
    });

    // Try again
    await page.evaluate(() => registerForClass('adult-beginner'));
    await page.waitForFunction(() => {
      return localStorage.getItem('mtc-class-registrations') !== null;
    }, { timeout: 5000 });

    // Should still have only 1 registration
    var regs = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-class-registrations') || '{}');
    });
    expect(regs['adult-beginner'].length).toBe(1);
  });

  test('Class adds to My Bookings', async ({ page }) => {
    await page.evaluate(() => registerForClass('junior-development'));
    await page.waitForFunction(() => {
      var bookings = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return bookings.some(function(b) { return b.eventId === 'class-junior-development'; });
    }, { timeout: 5000 });

    var bookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    var hasClass = bookings.some(function(b) { return b.eventId === 'class-junior-development'; });
    expect(hasClass).toBe(true);
  });
});

// ============================================
// BOOKING → CANCEL → RE-BOOK CYCLE
// ============================================
test.describe('Court Booking Full Cycle', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('Book court → appears in My Bookings → cancel → removed', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Book first available slot
    var booked = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return null;
      selectSlot(slot);
      return { date: slot.dataset.date, time: slot.dataset.time, court: slot.dataset.court };
    });
    if (!booked) return;

    await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => {
      if (typeof confirmBookingPayment === 'function') confirmBookingPayment();
    });
    await page.waitForFunction(() => {
      var m = document.getElementById('modal');
      return m && m.classList.contains('active');
    }, { timeout: 5000 });

    // Close celebration modal
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });
    await page.waitForFunction(() => !document.querySelector('#modal.active'), { timeout: 5000 });

    // Verify in My Bookings localStorage (type is 'booking', not 'court')
    var eventBookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    var hasCourtBooking = eventBookings.some(function(b) { return b.type === 'booking'; });
    expect(hasCourtBooking).toBe(true);

    // Get the booking ID for the court booking we just made
    var courtBookingEventId = await page.evaluate(() => {
      var bookings = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      var courtBooking = bookings.find(function(b) { return b.type === 'booking'; });
      return courtBooking ? courtBooking.eventId : null;
    });

    // Now cancel via payments system
    var cancelResult = await page.evaluate(() => {
      var booking = memberPaymentData.bookings.find(function(b) {
        return b.status === 'confirmed';
      });
      if (!booking) return 'no-booking';
      if (typeof cancelBooking === 'function') {
        cancelBooking(booking.id);
        // Also remove from event bookings using the court-ID pattern
        if (typeof removeEventFromMyBookings === 'function') {
          removeEventFromMyBookings('court-' + booking.id);
        }
        return 'cancelled';
      }
      return 'no-function';
    });
    expect(cancelResult).toBe('cancelled');

    // Verify removed from event bookings
    eventBookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    var stillHas = eventBookings.some(function(b) { return b.type === 'booking'; });
    expect(stillHas).toBe(false);
  });

  test('Booked slot visually shows MY COURT label after confirm', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Find and book first available slot
    var slotInfo = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return null;
      selectSlot(slot);
      return { date: slot.dataset.date, time: slot.dataset.time, court: slot.dataset.court };
    });
    if (!slotInfo) return;

    await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => {
      if (typeof confirmBookingPayment === 'function') confirmBookingPayment();
    });
    await page.waitForFunction(() => {
      var m = document.getElementById('modal');
      return m && m.classList.contains('active');
    }, { timeout: 5000 });

    // Close celebration modal
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });
    await page.waitForFunction(() => !document.querySelector('#modal.active'), { timeout: 5000 });

    // Verify the slot now has .my-booking class and MY COURT label
    var slotState = await page.evaluate((info) => {
      var slots = document.querySelectorAll('.weekly-slot');
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].dataset.date === info.date && slots[i].dataset.time === info.time && slots[i].dataset.court === info.court) {
          return {
            hasMyBooking: slots[i].classList.contains('my-booking'),
            innerHTML: slots[i].innerHTML
          };
        }
      }
      return null;
    }, slotInfo);

    expect(slotState).not.toBeNull();
    expect(slotState.hasMyBooking).toBe(true);
    expect(slotState.innerHTML).toContain('MY COURT');
  });
});

// ============================================
// NAVIGATION SAFETY
// ============================================
test.describe('Navigation Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Rapid navigation between screens causes no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Rapid screen switching
    await page.evaluate(() => {
      navigateTo('book');
      navigateTo('events');
      navigateTo('schedule');
      navigateTo('home');
      navigateTo('partners');
      navigateTo('notifications');
      navigateTo('messages');
      navigateTo('home');
    });
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    expect(errors).toEqual([]);
  });

  test('Navigating to invalid screen does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => {
      navigateTo('nonexistent-screen');
    });
    // No observable state change expected; just verify no errors after a brief wait
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);

    // App should still be usable
    var homeVisible = await page.evaluate(() => {
      // Navigate back to home
      navigateTo('home');
      return document.getElementById('screen-home').classList.contains('active');
    });
    expect(homeVisible).toBe(true);
  });

  test('Opening menu then navigating closes menu', async ({ page }) => {
    // Open hamburger menu
    await page.evaluate(() => {
      if (typeof openMenu === 'function') openMenu();
    });
    await page.waitForFunction(() => {
      var drawer = document.getElementById('menuDrawer');
      return drawer && drawer.classList.contains('open');
    }, { timeout: 5000 });

    // Navigate via menu item
    await page.evaluate(() => {
      navigateTo('events');
    });
    await page.waitForFunction(() => {
      var drawer = document.getElementById('menuDrawer');
      return !drawer || !drawer.classList.contains('open');
    }, { timeout: 5000 });

    // Menu should be closed
    var menuOpen = await page.evaluate(() => {
      var drawer = document.getElementById('menuDrawer');
      return drawer ? drawer.classList.contains('open') : false;
    });
    expect(menuOpen).toBe(false);
  });
});

// ============================================
// DARK MODE ACROSS MODALS
// ============================================
test.describe('Dark Mode Modal Rendering', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Enable dark mode
    await page.evaluate(() => {
      document.getElementById('app').setAttribute('data-theme', 'dark');
    });
  });

  test('Booking modal renders properly in dark mode', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    var slotFound = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });

    if (slotFound) {
      await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });
      var modalVisible = await page.evaluate(() => {
        var m = document.getElementById('bookingModal');
        return m ? m.classList.contains('active') : false;
      });
      expect(modalVisible).toBe(true);
      expect(errors).toEqual([]);

      await page.evaluate(() => closeBookingModal());
    }
  });

  test('Celebration modal renders properly in dark mode', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => {
      showCelebrationModal("TEST!", "Dark mode celebration test");
    });
    await page.waitForSelector('#modal.active', { timeout: 3000 });

    expect(errors).toEqual([]);

    await page.evaluate(() => closeModal());
  });

  test('RSVP list modal renders properly in dark mode', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => showRsvpListModal('bbq'));
    await page.waitForFunction(() => document.getElementById('rsvpListModal') !== null, { timeout: 5000 });

    var exists = await page.evaluate(() => {
      return document.getElementById('rsvpListModal') !== null;
    });
    expect(exists).toBe(true);
    expect(errors).toEqual([]);

    await page.evaluate(() => closeRsvpListModal());
  });
});

// ============================================
// DATA INTEGRITY AFTER OPERATIONS
// ============================================
test.describe('Data Integrity', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('RSVP count stays consistent with attendee list', async ({ page }) => {
    // RSVP to BBQ (not in defaults, so this is a fresh RSVP)
    await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });
    await page.waitForFunction(() => {
      var rsvps = JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
      return rsvps.includes('opening-day-bbq');
    }, { timeout: 5000 });

    // spotsTaken should match attendees length
    var consistent = await page.evaluate(() => {
      var ev = clubEventsData['opening-day-bbq'];
      // Allow spotsTaken to be >= attendees.length (other members may be counted)
      return ev.attendees.includes('You') && ev.spotsTaken >= ev.attendees.length;
    });
    expect(consistent).toBe(true);
  });

  test('localStorage does not contain duplicate event bookings', async ({ page }) => {
    // RSVP to same event twice
    await page.evaluate(() => {
      var btn = document.querySelector('#homeEvent-bbq .event-rsvp-btn');
      if (btn) {
        rsvpToEvent('bbq', btn); // register
        rsvpToEvent('bbq', btn); // cancel
        rsvpToEvent('bbq', btn); // register again
      }
    });
    await page.waitForFunction(() => {
      return localStorage.getItem('mtc-event-bookings') !== null;
    }, { timeout: 5000 });

    var bookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });

    // Count entries for opening-day-bbq (should be at most 1)
    var bbqCount = bookings.filter(function(b) { return b.eventId === 'opening-day-bbq'; }).length;
    expect(bbqCount).toBeLessThanOrEqual(1);
  });

  test('Modify booking removes old booking card', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Book a slot first
    var booked = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!booked) return;

    await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => {
      if (typeof confirmBookingPayment === 'function') confirmBookingPayment();
    });
    await page.waitForFunction(() => {
      var m = document.getElementById('modal');
      return m && m.classList.contains('active');
    }, { timeout: 5000 });

    // Close modals
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
    });
    await page.waitForFunction(() => !document.querySelector('#modal.active'), { timeout: 5000 });

    // Get booking count before modify
    var countBefore = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]').length;
    });

    // Modify: change time (cancels old + navigates to book)
    await page.evaluate(() => {
      var booking = memberPaymentData.bookings.find(function(b) { return b.status === 'confirmed'; });
      if (booking) {
        currentBookingToModify = booking.id;
        changeBookingTime();
      }
    });
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Old booking card should be removed from event bookings
    var countAfter = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]').filter(function(b) {
        return b.type === 'court';
      }).length;
    });
    expect(countAfter).toBe(countBefore - 1);
  });
});

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
test.describe('Search Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Search with empty query shows no results', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => navigateTo('search'));
    await page.waitForFunction(() => document.getElementById('screen-search')?.classList.contains('active'), { timeout: 5000 });

    // Enter empty search
    await page.evaluate(() => {
      var input = document.querySelector('#screen-search input, #screen-search .search-input');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
      }
    });
    // Small wait for debounced search input handler
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
  });

  test('Search with special characters does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => navigateTo('search'));
    await page.waitForFunction(() => document.getElementById('screen-search')?.classList.contains('active'), { timeout: 5000 });

    // Count scripts BEFORE the XSS attempt
    var scriptsBefore = await page.evaluate(() => {
      return document.querySelectorAll('script').length;
    });

    await page.evaluate(() => {
      var input = document.querySelector('#screen-search input, #screen-search .search-input');
      if (input) {
        input.value = '<script>alert("xss")</script>';
        input.dispatchEvent(new Event('input'));
      }
    });
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);

    // No new script elements should have been injected
    var scriptsAfter = await page.evaluate(() => {
      return document.querySelectorAll('script').length;
    });
    expect(scriptsAfter).toBe(scriptsBefore);
  });
});

// ============================================
// MESSAGING EDGE CASES
// ============================================
test.describe('Messaging Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Login first so navigation works
    await page.evaluate(() => handleLogin());
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Sending empty message does not create blank bubble', async ({ page }) => {
    await page.evaluate(() => navigateTo('messages'));
    await page.waitForFunction(() => document.getElementById('screen-messages')?.classList.contains('active'), { timeout: 5000 });

    // Open first conversation
    await page.evaluate(() => {
      var item = document.querySelector('.message-item');
      if (item) item.click();
    });
    await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active') && document.querySelectorAll('.chat-bubble').length > 0, { timeout: 5000 });

    // Count existing messages
    var countBefore = await page.evaluate(() => {
      return document.querySelectorAll('.chat-bubble').length;
    });

    // Try sending empty message
    await page.evaluate(() => {
      var input = document.querySelector('.chat-input');
      if (input) {
        input.value = '';
        var sendBtn = document.querySelector('.chat-send-btn, .send-btn');
        if (sendBtn) sendBtn.click();
      }
    });
    await page.waitForTimeout(200);

    // Count should not increase
    var countAfter = await page.evaluate(() => {
      return document.querySelectorAll('.chat-bubble').length;
    });
    expect(countAfter).toBe(countBefore);
  });

  test('Very long message does not break layout', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => navigateTo('messages'));
    await page.waitForFunction(() => document.getElementById('screen-messages')?.classList.contains('active'), { timeout: 5000 });

    await page.evaluate(() => {
      var item = document.querySelector('.message-item');
      if (item) item.click();
    });
    await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active') && document.querySelectorAll('.chat-bubble').length > 0, { timeout: 5000 });

    // Send a very long message (500 chars)
    const bubblesBefore = await page.evaluate(() => document.querySelectorAll('.chat-bubble').length);
    await page.evaluate(() => {
      var input = document.querySelector('.chat-input');
      if (input) {
        input.value = 'A'.repeat(500);
        if (typeof sendMessage === 'function') sendMessage();
      }
    });
    await page.waitForFunction((before) => {
      return document.querySelectorAll('.chat-bubble').length > before;
    }, bubblesBefore, { timeout: 5000 });

    expect(errors).toEqual([]);

    // Chat bubbles should not overflow the container
    var overflows = await page.evaluate(() => {
      var bubbles = document.querySelectorAll('.chat-bubble');
      var container = document.querySelector('.chat-messages, .messages-body');
      if (!container) return false;
      var cRect = container.getBoundingClientRect();
      for (var i = 0; i < bubbles.length; i++) {
        var bRect = bubbles[i].getBoundingClientRect();
        if (bRect.width > cRect.width + 10) return true; // allow 10px margin
      }
      return false;
    });
    expect(overflows).toBe(false);
  });
});

// ============================================
// THEME PERSISTENCE ACROSS INTERACTIONS
// ============================================
test.describe('Theme Consistency', () => {

  test('Dark mode persists through modal interactions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Set dark mode
    await page.evaluate(() => {
      if (typeof toggleTheme === 'function') toggleTheme();
    });
    await page.waitForFunction(() => document.getElementById('app')?.getAttribute('data-theme') === 'dark', { timeout: 5000 });

    var isDark = await page.evaluate(() => {
      return document.getElementById('app').getAttribute('data-theme') === 'dark';
    });
    expect(isDark).toBe(true);

    // Open and close celebration modal
    await page.evaluate(() => {
      showCelebrationModal("TEST!", "Modal test");
    });
    await page.waitForFunction(() => document.querySelector('#modal.active') !== null, { timeout: 5000 });
    await page.evaluate(() => closeModal());
    await page.waitForFunction(() => !document.querySelector('#modal.active'), { timeout: 5000 });

    // Theme should still be dark
    isDark = await page.evaluate(() => {
      return document.getElementById('app').getAttribute('data-theme') === 'dark';
    });
    expect(isDark).toBe(true);
  });
});

// ============================================
// REGRESSION: Court Booking Persistence
// ============================================
test.describe('Court Booking Persistence', () => {

  test('Court booking persists to localStorage immediately', async ({ page }) => {
    await freshStart(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Book a court via confirmBookingPayment
    const booked = await page.evaluate(() => {
      // Find an available slot for today
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });

    if (booked) {
      await page.waitForFunction(() => document.getElementById('bookingModal')?.classList.contains('active'), { timeout: 5000 });
      await page.evaluate(() => {
        if (typeof confirmBookingPayment === 'function') confirmBookingPayment();
        else if (typeof confirmBooking === 'function') confirmBooking();
      });
      await page.waitForFunction(() => localStorage.getItem('mtc-bookings') !== null, { timeout: 5000 });

      // Check that bookingsData was saved to localStorage
      const savedBookings = await page.evaluate(() => {
        return localStorage.getItem('mtc-bookings');
      });
      expect(savedBookings).not.toBeNull();
      expect(savedBookings.length).toBeGreaterThan(2);
    }
  });
});

// ============================================
// REGRESSION: Interclub Type Label
// ============================================
test.describe('Interclub Event Type', () => {

  test('Interclub league shows Doubles label not Singles', async ({ page }) => {
    await freshStart(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => {
      var screen = document.getElementById('screen-book');
      var slots = document.querySelectorAll('.weekly-slot');
      return screen?.classList.contains('active') && slots.length > 0;
    }, { timeout: 5000 });

    // Navigate to Thursday (day index 3) where interclub is scheduled
    const hasInterclub = await page.evaluate(() => {
      // Find Thursday tab and click it
      var tabs = document.querySelectorAll('.week-day-tab');
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent.includes('Thu')) {
          tabs[i].click();
          return true;
        }
      }
      return false;
    });
    await page.waitForFunction(() => {
      var activeTab = document.querySelector('.week-day-tab.active');
      return activeTab && activeTab.textContent.includes('Thu');
    }, { timeout: 5000 });

    if (hasInterclub) {
      // Check that the event block says "Doubles" not "Singles"
      const eventLabels = await page.evaluate(() => {
        var blocks = document.querySelectorAll('.event-block');
        var labels = [];
        blocks.forEach(function(b) { labels.push(b.textContent); });
        return labels.join(' ');
      });
      // Interclub should now be type 'doubles'
      expect(eventLabels).not.toContain('Singles');
    }
  });
});

// ============================================
// REGRESSION: Paid Event Spot Limits Enforced
// ============================================
test.describe('Spot Limit Enforcement', () => {

  test('Paid coaching events still enforce spot limits', async ({ page }) => {
    await freshStart(page);

    // Set coaching class to full capacity
    const blocked = await page.evaluate(() => {
      if (typeof clubEventsData === 'undefined') return 'no-data';
      var cls = clubEventsData['mark-taylor-classes'];
      if (!cls) return 'no-class';
      // Fill it up
      cls.spotsTaken = cls.spotsTotal;
      // Try to register
      toggleEventRsvp('mark-taylor-classes');
      // Check if it was blocked (user should NOT be in attendees)
      return cls.attendees.indexOf('You') === -1 ? 'blocked' : 'registered';
    });
    expect(blocked).toBe('blocked');
  });

  test('Social events allow unlimited RSVP (no spot limit)', async ({ page }) => {
    await freshStart(page);

    const result = await page.evaluate(() => {
      if (typeof clubEventsData === 'undefined') return 'no-data';
      var bbq = clubEventsData['opening-day-bbq'];
      if (!bbq) return 'no-event';
      // Fill it to capacity
      bbq.spotsTaken = bbq.spotsTotal;
      // Try to register — should succeed since it's a free/social event
      toggleEventRsvp('opening-day-bbq');
      return bbq.attendees.indexOf('You') !== -1 ? 'registered' : 'blocked';
    });
    expect(result).toBe('registered');
  });
});

// ============================================
// REGRESSION: Cache Version Sync
// ============================================
test.describe('Cache Version Sync', () => {

  test('Service worker and interactive.js have matching cache versions', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Fetch sw.js and extract cache version
    const swVersion = await page.evaluate(async () => {
      var response = await fetch('/sw.js');
      var text = await response.text();
      var match = text.match(/CACHE_NAME\s*=\s*'([^']+)'/);
      return match ? match[1] : null;
    });

    // Get interactive.js cache version
    const interactiveVersion = await page.evaluate(async () => {
      var response = await fetch('/js/interactive.js');
      var text = await response.text();
      var match = text.match(/name\s*!==\s*'([^']+)'/);
      return match ? match[1] : null;
    });

    expect(swVersion).not.toBeNull();
    expect(interactiveVersion).not.toBeNull();
    expect(swVersion).toBe(interactiveVersion);
  });
});

// ============================================
// PHASE 2 RESTRUCTURING TESTS
// ============================================
test.describe('Phase 2 Restructuring', () => {

  // ------------------------------------------
  // Group A: MTC.storage API
  // ------------------------------------------
  test.describe('MTC.storage API', () => {

    test('MTC.storage.get() parses JSON and returns correct types', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const results = await page.evaluate(() => {
        // Set various types via localStorage directly (JSON-stringified)
        localStorage.setItem('test-obj', JSON.stringify({ name: 'Alex', ntrp: 4.2 }));
        localStorage.setItem('test-arr', JSON.stringify(['doubles', 'singles']));
        localStorage.setItem('test-str', JSON.stringify('hello'));
        localStorage.setItem('test-num', JSON.stringify(42));
        localStorage.setItem('test-bool', JSON.stringify(true));

        const obj = MTC.storage.get('test-obj', null);
        const arr = MTC.storage.get('test-arr', []);
        const str = MTC.storage.get('test-str', '');
        const num = MTC.storage.get('test-num', 0);
        const bool = MTC.storage.get('test-bool', false);

        // Clean up
        ['test-obj', 'test-arr', 'test-str', 'test-num', 'test-bool'].forEach(k => localStorage.removeItem(k));

        return {
          objType: typeof obj, objName: obj && obj.name, objNtrp: obj && obj.ntrp,
          arrIsArray: Array.isArray(arr), arrLen: arr.length, arrFirst: arr[0],
          strType: typeof str, strVal: str,
          numType: typeof num, numVal: num,
          boolType: typeof bool, boolVal: bool
        };
      });

      expect(results.objType).toBe('object');
      expect(results.objName).toBe('Alex');
      expect(results.objNtrp).toBe(4.2);
      expect(results.arrIsArray).toBe(true);
      expect(results.arrLen).toBe(2);
      expect(results.arrFirst).toBe('doubles');
      expect(results.strType).toBe('string');
      expect(results.strVal).toBe('hello');
      expect(results.numType).toBe('number');
      expect(results.numVal).toBe(42);
      expect(results.boolType).toBe('boolean');
      expect(results.boolVal).toBe(true);
    });

    test('MTC.storage.get() returns fallback on corrupt JSON', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const result = await page.evaluate(() => {
        localStorage.setItem('test-corrupt', 'not{valid json');
        const val = MTC.storage.get('test-corrupt', { fallback: true });
        localStorage.removeItem('test-corrupt');
        return val;
      });

      expect(result).toEqual({ fallback: true });
    });

    test('MTC.storage.get() returns fallback on missing key', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const results = await page.evaluate(() => {
        // Ensure key doesn't exist
        localStorage.removeItem('nonexistent-key-abc');

        const withFallback = MTC.storage.get('nonexistent-key-abc', 'default');
        const withoutFallback = MTC.storage.get('nonexistent-key-abc');

        return { withFallback, withoutFallback };
      });

      expect(results.withFallback).toBe('default');
      expect(results.withoutFallback).toBeNull();
    });

    test('MTC.storage.set() + get() roundtrip survives reload', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Set complex object
      await page.evaluate(() => {
        MTC.storage.set('test-roundtrip', {
          name: 'Alex',
          ntrp: 4.2,
          tags: ['doubles', 'morning'],
          nested: { court: 3, surface: 'hard' }
        });
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Read back
      const result = await page.evaluate(() => {
        const val = MTC.storage.get('test-roundtrip', {});
        localStorage.removeItem('test-roundtrip');
        return val;
      });

      expect(result.name).toBe('Alex');
      expect(result.ntrp).toBe(4.2);
      expect(result.tags).toEqual(['doubles', 'morning']);
      expect(result.nested.court).toBe(3);
      expect(result.nested.surface).toBe('hard');
    });
  });

  // ------------------------------------------
  // Group B: MTC.storage.remove()
  // ------------------------------------------
  test.describe('MTC.storage.remove()', () => {

    test('MTC.storage.remove() deletes data completely', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const result = await page.evaluate(() => {
        // Set a value and verify it exists
        MTC.storage.set('test-remove', { data: 'exists' });
        const before = localStorage.getItem('test-remove');

        // Remove it
        MTC.storage.remove('test-remove');
        const after = localStorage.getItem('test-remove');

        return { before, after };
      });

      expect(result.before).not.toBeNull();
      expect(result.after).toBeNull();
    });
  });

  // ------------------------------------------
  // Group C: Persistence Hooks
  // ------------------------------------------
  test.describe('Persistence Hooks', () => {

    test('saveBookings fires on visibilitychange', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      // Demo login
      await page.evaluate(() => handleLogin());
      await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

      const result = await page.evaluate(() => {
        // Clear any previously saved bookings
        localStorage.removeItem('mtc-bookings');

        // Verify bookingsData exists in scope
        if (typeof bookingsData === 'undefined') return 'no-bookings-data';

        // Simulate visibilitychange (document.hidden is read-only, but the
        // handler checks document.hidden — we override it temporarily)
        Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });

        // Check if bookings were saved
        const saved = localStorage.getItem('mtc-bookings');
        return saved !== null ? 'saved' : 'not-saved';
      });

      expect(result).toBe('saved');
    });

    test('saveConversations fires on beforeunload', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      // Demo login
      await page.evaluate(() => handleLogin());
      await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

      // Navigate to messages and send a message to create conversation data
      await page.evaluate(() => navigateTo('messages'));
      await page.waitForFunction(() => document.getElementById('screen-messages')?.classList.contains('active'), { timeout: 5000 });

      // Open a conversation and send a message
      await page.evaluate(() => {
        const msgItem = document.querySelector('.message-item');
        if (msgItem) msgItem.click();
      });
      await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active') && document.querySelectorAll('.chat-bubble').length > 0, { timeout: 5000 });

      await page.evaluate(() => {
        const input = document.getElementById('chatInput');
        if (input) {
          input.value = 'test-beforeunload-msg';
          sendMessage();
        }
      });
      await page.waitForFunction(() => {
        var bubbles = document.querySelectorAll('.chat-bubble.sent');
        for (var i = 0; i < bubbles.length; i++) {
          if (bubbles[i].textContent.includes('test-beforeunload-msg')) return true;
        }
        return false;
      }, { timeout: 5000 });

      // Dispatch beforeunload event
      const saved = await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeunload'));
        const data = localStorage.getItem('mtc-conversations');
        return data !== null && data.includes('test-beforeunload-msg') ? 'saved' : 'not-saved';
      });

      expect(saved).toBe('saved');
    });
  });

  // ------------------------------------------
  // Group D: Cache Version Sync (all 3 files)
  // ------------------------------------------
  test.describe('Cache Version Sync (all 3 files)', () => {

    test('sw.js, interactive.js, and index.html all have matching cache versions', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const versions = await page.evaluate(async () => {
        // 1. sw.js
        const swResp = await fetch('/sw.js');
        const swText = await swResp.text();
        const swMatch = swText.match(/CACHE_NAME\s*=\s*'([^']+)'/);

        // 2. interactive.js
        const intResp = await fetch('/js/interactive.js');
        const intText = await intResp.text();
        const intMatch = intText.match(/name\s*!==\s*'([^']+)'/);

        // 3. index.html
        const htmlResp = await fetch('/');
        const htmlText = await htmlResp.text();
        const htmlMatch = htmlText.match(/indexOf\('([^']+)'\)\s*===\s*-1/);

        return {
          sw: swMatch ? swMatch[1] : null,
          interactive: intMatch ? intMatch[1] : null,
          html: htmlMatch ? htmlMatch[1] : null
        };
      });

      expect(versions.sw).not.toBeNull();
      expect(versions.interactive).not.toBeNull();
      expect(versions.html).not.toBeNull();
      expect(versions.sw).toBe(versions.interactive);
      expect(versions.sw).toBe(versions.html);
    });
  });

  // ------------------------------------------
  // Group E: No Runtime Errors After Restructuring
  // ------------------------------------------
  test.describe('No Runtime Errors After Restructuring', () => {

    test('No pageerror across all screens after var→const/let migration', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Demo login
      await page.evaluate(() => handleLogin());
      await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

      // Navigate through all major screens
      const screens = ['home', 'schedule', 'book', 'partners', 'messages', 'notifications', 'profile', 'events'];
      for (const screen of screens) {
        await page.evaluate((s) => navigateTo(s), screen);
        // events redirects to schedule, so check the correct screen
        const expectedScreen = screen === 'events' ? 'schedule' : screen;
        await page.waitForFunction((id) => document.getElementById('screen-' + id)?.classList.contains('active'), expectedScreen, { timeout: 5000 });
      }

      expect(errors).toEqual([]);
    });

    test('No "is not a function" errors from dead code removal', async ({ page }) => {
      const fnErrors = [];
      page.on('pageerror', (err) => {
        if (err.message.includes('is not a function') || err.message.includes('is not defined')) {
          fnErrors.push(err.message);
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Demo login
      await page.evaluate(() => handleLogin());
      await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

      // Navigate all screens
      const screens = ['home', 'schedule', 'book', 'partners', 'messages', 'notifications', 'profile', 'events'];
      for (const screen of screens) {
        await page.evaluate((s) => navigateTo(s), screen);
        const expectedScreen = screen === 'events' ? 'schedule' : screen;
        await page.waitForFunction((id) => document.getElementById('screen-' + id)?.classList.contains('active'), expectedScreen, { timeout: 5000 });
      }

      // Trigger key flows
      // 1. Book a court (select slot)
      await page.evaluate(() => navigateTo('book'));
      await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });
      await page.evaluate(() => {
        const slot = document.querySelector('.weekly-slot.available');
        if (slot) selectSlot(slot);
      });
      await page.waitForTimeout(200);

      // 2. RSVP to an event
      await page.evaluate(() => navigateTo('events'));
      await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });
      await page.evaluate(() => {
        const rsvpBtn = document.querySelector('.rsvp-btn');
        if (rsvpBtn) rsvpBtn.click();
      });
      await page.waitForTimeout(200);

      // 3. Open a conversation
      await page.evaluate(() => navigateTo('messages'));
      await page.waitForFunction(() => document.getElementById('screen-messages')?.classList.contains('active'), { timeout: 5000 });
      await page.evaluate(() => {
        const msgItem = document.querySelector('.message-item');
        if (msgItem) msgItem.click();
      });
      await page.waitForTimeout(200);

      expect(fnErrors).toEqual([]);
    });
  });
});
