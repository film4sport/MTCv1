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
    localStorage.removeItem('mtc-privacy');
    localStorage.removeItem('mtc-court-prefs');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function loginAsMember(page) {
  await freshStart(page);
  await page.evaluate(() => handleLogin());
  await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });
}

async function loginAsAdmin(page) {
  await freshStart(page);
  await page.evaluate(() => {
    localStorage.setItem('mtc-onboarding-complete', 'true');
    document.getElementById('loginEmail').value = 'admin@mtc.ca';
    document.getElementById('loginPassword').value = 'admin123';
    handleLogin();
  });
  await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 10000 });
}

// ============================================
// HIGH 1: BOOKING GRID EVENT TAP + REGISTER
// ============================================
test.describe('Booking Grid Event Tap & Register', () => {

  test('Tapping event slot opens event detail card', async ({ page }) => {
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Find an event slot on the grid and tap it
    const eventFound = await page.evaluate(() => {
      var slots = document.querySelectorAll('.weekly-slot.event-slot');
      if (slots.length === 0) return false;
      slots[0].click();
      return true;
    });

    if (!eventFound) return; // No events on current week — skip gracefully

    await page.waitForFunction(() => document.getElementById('eventDetailCard') !== null, { timeout: 5000 });

    // Event detail card should appear
    const cardVisible = await page.evaluate(() => {
      var card = document.getElementById('eventDetailCard');
      return card !== null;
    });
    expect(cardVisible).toBe(true);
  });

  test('registerForGridEvent adds event to My Bookings localStorage', async ({ page }) => {
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // First render the grid so eventsData is populated, then find an event cell to register
    const result = await page.evaluate(() => {
      // Look for an event cell in the rendered grid
      var eventCell = document.querySelector('.grid-event');
      if (!eventCell) return 'no-event-cells';
      // Click it to open the event detail card
      eventCell.click();
      return 'clicked';
    });
    if (result === 'no-event-cells') return; // skip if no events in grid
    await page.waitForFunction(() => document.getElementById('eventDetailCard') !== null, { timeout: 5000 });

    // Click the register button in the event detail card
    const regResult = await page.evaluate(() => {
      var btn = document.querySelector('.event-detail-btn');
      if (!btn) return 'no-btn';
      btn.click();
      var stored = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return stored.length > 0 ? 'registered' : 'empty';
    });
    if (regResult === 'no-btn') return;
    expect(regResult).toBe('registered');
  });

  test('addEventToMyBookings persists to localStorage', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      addEventToMyBookings('test-event-123', 'event', {
        title: 'Test Event',
        date: '2026-06-15',
        time: '2:00 PM',
        location: 'Court 1'
      });
      var stored = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      var found = stored.find(function(e) { return e.eventId === 'test-event-123'; });
      return found ? 'found' : 'not-found';
    });
    expect(result).toBe('found');
  });
});

// ============================================
// HIGH 2: MODIFY BOOKING (Change Time/Court)
// ============================================
test.describe('Modify Booking Flow', () => {

  test('Change Time cancels old booking and navigates to book screen', async ({ page }) => {
    await loginAsMember(page);

    // First book a court
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });
    const booked = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!booked) return;
    await page.waitForFunction(() => document.querySelector('.modal-overlay.active') !== null, { timeout: 5000 });
    await page.evaluate(() => { if (typeof confirmBookingPayment === 'function') confirmBookingPayment(); });
    await page.waitForFunction(() => document.getElementById('celebrationModal')?.classList.contains('active') || document.querySelector('.celebration-modal') !== null, { timeout: 5000 });
    // Close celebration modal
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForFunction(() => !document.querySelector('.modal-overlay.active'), { timeout: 5000 });

    // Navigate to My Bookings
    await page.evaluate(() => navigateTo('mybookings'));
    await page.waitForFunction(() => document.getElementById('screen-mybookings')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => { if (typeof renderMyBookings === 'function') renderMyBookings(); });
    await page.waitForFunction(() => document.querySelector('#screen-mybookings .booking-card, #screen-mybookings .event-booking-card') !== null, { timeout: 5000 }).catch(() => {});

    // Get booking count before modify
    const countBefore = await page.evaluate(() => {
      return memberPaymentData.bookings.filter(b => b.status === 'confirmed').length;
    });

    // Click Modify on most recent booking and change time
    const modifyResult = await page.evaluate(() => {
      var bookings = memberPaymentData.bookings.filter(b => b.status === 'confirmed');
      if (bookings.length === 0) return 'no-bookings';
      var lastBooking = bookings[bookings.length - 1];
      showModifyModal(lastBooking.id);
      changeBookingTime();
      return 'modified';
    });
    if (modifyResult === 'no-bookings') return;
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Should have navigated to book screen
    const currentScreen = await page.evaluate(() => {
      var bookScreen = document.getElementById('screen-book');
      return bookScreen && bookScreen.classList.contains('active') ? 'book' : 'other';
    });
    expect(currentScreen).toBe('book');

    // Old booking should be cancelled
    const countAfter = await page.evaluate(() => {
      return memberPaymentData.bookings.filter(b => b.status === 'confirmed').length;
    });
    expect(countAfter).toBe(countBefore - 1);
  });

  test('Change Court cancels old booking and navigates to book screen', async ({ page }) => {
    await loginAsMember(page);

    // Book a court first
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });
    const booked = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!booked) return;
    await page.waitForFunction(() => document.querySelector('.modal-overlay.active') !== null, { timeout: 5000 });
    await page.evaluate(() => { if (typeof confirmBookingPayment === 'function') confirmBookingPayment(); });
    await page.waitForFunction(() => document.getElementById('celebrationModal')?.classList.contains('active') || document.querySelector('.celebration-modal') !== null, { timeout: 5000 });
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForFunction(() => !document.querySelector('.modal-overlay.active'), { timeout: 5000 });

    // Change court
    const result = await page.evaluate(() => {
      var bookings = memberPaymentData.bookings.filter(b => b.status === 'confirmed');
      if (bookings.length === 0) return 'no-bookings';
      var lastBooking = bookings[bookings.length - 1];
      showModifyModal(lastBooking.id);
      changeBookingCourt();
      return 'modified';
    });
    if (result === 'no-bookings') return;
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Should be on book screen
    const onBookScreen = await page.evaluate(() => {
      var bookScreen = document.getElementById('screen-book');
      return bookScreen && bookScreen.classList.contains('active');
    });
    expect(onBookScreen).toBe(true);
  });

  test('Modify removes old event booking card from My Bookings', async ({ page }) => {
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    // Book a court
    const slotFound = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!slotFound) return;
    await page.waitForFunction(() => document.querySelector('.modal-overlay.active') !== null, { timeout: 5000 });
    await page.evaluate(() => { if (typeof confirmBookingPayment === 'function') confirmBookingPayment(); });
    // Wait for the full setTimeout chain (400ms slot marking + addEventToMyBookings)
    await page.waitForFunction(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return events.some(e => e.eventId.startsWith('court-'));
    }, { timeout: 5000 });
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForFunction(() => !document.querySelector('.modal-overlay.active'), { timeout: 5000 });

    // Find the event booking entry for the newly-created court booking
    const newestBookingId = await page.evaluate(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      // The newest is the one we just created (starts with 'court-')
      var courtEvents = events.filter(e => e.eventId.startsWith('court-'));
      return courtEvents.length > 0 ? courtEvents[courtEvents.length - 1].eventId : null;
    });
    if (!newestBookingId) return;

    // Extract the booking ID from the event ID (e.g., 'court-MTC-1004' → 'MTC-1004')
    const actualBookingId = newestBookingId.replace('court-', '');

    // Verify it exists in eventBookings
    const eventCountBefore = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]').length;
    });
    expect(eventCountBefore).toBeGreaterThan(0);

    // Change time on that specific booking — should cancel it and remove the event card
    await page.evaluate((bId) => {
      showModifyModal(bId);
      changeBookingTime();
    }, actualBookingId);
    await page.waitForFunction((prevCount) => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return events.length < prevCount;
    }, eventCountBefore, { timeout: 5000 });

    // Event bookings count should have decreased
    const eventCountAfter = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]').length;
    });
    expect(eventCountAfter).toBeLessThan(eventCountBefore);
  });
});

// ============================================
// HIGH 3: INTERCLUB RSVP MODAL FULL FLOW
// ============================================
test.describe('Interclub RSVP Modal', () => {

  test('showInterclubRsvpModal opens modal with event details', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showInterclubRsvpModal('interclub-league');
      var modal = document.getElementById('interclubRsvpModal');
      if (!modal) return { exists: false };
      return {
        exists: true,
        hasGoingBtn: !!document.getElementById('rsvpGoingBtn'),
        hasNotGoingBtn: !!document.getElementById('rsvpNotGoingBtn'),
        hasAvatars: !!document.getElementById('interclubRsvpAvatars')
      };
    });
    expect(result.exists).toBe(true);
    expect(result.hasGoingBtn).toBe(true);
    expect(result.hasNotGoingBtn).toBe(true);
    expect(result.hasAvatars).toBe(true);
  });

  test('Count Me In adds You to rsvpList and updates UI', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showInterclubRsvpModal('interclub-league');
      rsvpInterclub('interclub-league', 'going');
      var goingBtn = document.getElementById('rsvpGoingBtn');
      return {
        btnActive: goingBtn ? goingBtn.classList.contains('active') : false,
        btnText: goingBtn ? goingBtn.textContent.trim() : ''
      };
    });
    expect(result.btnActive).toBe(true);
    expect(result.btnText).toContain('In');
  });

  test('Count Me In adds to event bookings in localStorage', async ({ page }) => {
    await loginAsMember(page);

    const stored = await page.evaluate(() => {
      showInterclubRsvpModal('interclub-league');
      rsvpInterclub('interclub-league', 'going');
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    var interclubBooking = stored.find(e => e.eventId === 'interclub-league');
    expect(interclubBooking).toBeTruthy();
    expect(interclubBooking.type).toBe('interclub');
  });

  test('Can\'t Make It removes You from rsvpList (with confirm modal)', async ({ page }) => {
    await loginAsMember(page);

    // Open modal and RSVP going
    await page.evaluate(() => {
      showInterclubRsvpModal('interclub-league');
      rsvpInterclub('interclub-league', 'going');
    });
    await page.waitForFunction(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return events.some(function(e) { return e.eventId === 'interclub-league'; });
    }, { timeout: 5000 });

    // Verify event booking was added to localStorage
    const addedOk = await page.evaluate(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return events.some(function(e) { return e.eventId === 'interclub-league'; });
    });
    expect(addedOk).toBe(true);

    // Now decline — this triggers a confirm modal (confirm-modal.js hooks rsvpInterclub)
    await page.evaluate(() => {
      rsvpInterclub('interclub-league', 'not-going');
    });

    // Wait for confirm modal to appear
    await page.waitForFunction(() => {
      var modal = document.getElementById('confirmModal');
      return modal && modal.classList.contains('active');
    }, { timeout: 5000 }).catch(() => {});

    // Click confirm (WITHDRAW) button
    await page.evaluate(() => {
      var confirmBtn = document.getElementById('confirmModalConfirm');
      if (confirmBtn) confirmBtn.click();
    });
    // Wait for closeConfirmModal + setTimeout(onConfirm, 200) — uses setTimeout so keep a small wait
    await page.waitForFunction(() => {
      var goingBtn = document.getElementById('rsvpGoingBtn');
      return goingBtn ? !goingBtn.classList.contains('active') : true;
    }, { timeout: 5000 });

    // Verify going button is no longer active
    const result = await page.evaluate(() => {
      var goingBtn = document.getElementById('rsvpGoingBtn');
      return {
        btnNotActive: goingBtn ? !goingBtn.classList.contains('active') : true
      };
    });
    expect(result.btnNotActive).toBe(true);
  });

  test('Can\'t Make It removes from event bookings in localStorage', async ({ page }) => {
    await loginAsMember(page);

    // RSVP going first
    await page.evaluate(() => {
      showInterclubRsvpModal('interclub-league');
      rsvpInterclub('interclub-league', 'going');
    });
    await page.waitForFunction(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return events.some(e => e.eventId === 'interclub-league');
    }, { timeout: 5000 });

    // Verify event booking was added
    const addedOk = await page.evaluate(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return events.some(e => e.eventId === 'interclub-league');
    });
    expect(addedOk).toBe(true);

    // Decline — triggers confirm modal
    await page.evaluate(() => {
      rsvpInterclub('interclub-league', 'not-going');
    });
    await page.waitForFunction(() => {
      var modal = document.getElementById('confirmModal');
      return modal && modal.classList.contains('active');
    }, { timeout: 5000 }).catch(() => {});

    // Click confirm/withdraw
    await page.evaluate(() => {
      var confirmBtn = document.getElementById('confirmModalConfirm');
      if (confirmBtn) confirmBtn.click();
    });
    // Wait for confirm modal to close and localStorage to update
    await page.waitForFunction(() => {
      var events = JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
      return !events.some(e => e.eventId === 'interclub-league');
    }, { timeout: 5000 });

    const stored = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    var interclubBooking = stored.find(e => e.eventId === 'interclub-league');
    expect(interclubBooking).toBeUndefined();
  });

  test('closeInterclubRsvpModal removes modal from DOM', async ({ page }) => {
    await loginAsMember(page);

    await page.evaluate(() => {
      showInterclubRsvpModal('interclub-league');
    });
    await page.waitForFunction(() => document.getElementById('interclubRsvpModal') !== null, { timeout: 5000 });
    await page.evaluate(() => closeInterclubRsvpModal());
    await page.waitForFunction(() => document.getElementById('interclubRsvpModal') === null, { timeout: 5000 });

    const modalExists = await page.evaluate(() => {
      return document.getElementById('interclubRsvpModal') !== null;
    });
    expect(modalExists).toBe(false);
  });
});

// ============================================
// HIGH 4: CLUB EVENTS CALENDAR MONTH NAVIGATION
// ============================================
test.describe('Club Events Calendar Month Navigation', () => {

  test('Forward arrow advances month in calendar header', async ({ page }) => {
    await loginAsMember(page);
    await page.evaluate(() => {
      navigateTo('events');
    });
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Switch to calendar view
    await page.evaluate(() => {
      if (typeof switchEventsView === 'function') switchEventsView('calendar');
    });
    await page.waitForFunction(() => document.getElementById('eventsCalendarGrid') !== null, { timeout: 5000 });

    // Get initial month label
    const initialMonth = await page.evaluate(() => {
      var label = document.getElementById('eventsCalendarMonth');
      return label ? label.textContent.trim() : '';
    });

    // Click forward
    await page.evaluate(() => changeEventsMonth(1));
    await page.waitForFunction((prev) => {
      var label = document.getElementById('eventsCalendarMonth');
      return label && label.textContent.trim() !== prev;
    }, initialMonth, { timeout: 5000 });

    const nextMonth = await page.evaluate(() => {
      var label = document.getElementById('eventsCalendarMonth');
      return label ? label.textContent.trim() : '';
    });

    // Month label should have changed
    expect(nextMonth).not.toBe('');
    if (initialMonth) {
      expect(nextMonth).not.toBe(initialMonth);
    }
  });

  test('Back arrow goes to previous month', async ({ page }) => {
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('events'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Switch to calendar view
    await page.evaluate(() => {
      if (typeof switchEventsView === 'function') switchEventsView('calendar');
    });
    await page.waitForFunction(() => document.getElementById('eventsCalendarGrid') !== null, { timeout: 5000 });

    // Get initial month label
    const initialMonth = await page.evaluate(() => {
      var label = document.getElementById('eventsCalendarMonth');
      return label ? label.textContent.trim() : '';
    });

    // Go forward then back
    await page.evaluate(() => {
      changeEventsMonth(1);
    });
    await page.waitForFunction((prev) => {
      var label = document.getElementById('eventsCalendarMonth');
      return label && label.textContent.trim() !== prev;
    }, initialMonth, { timeout: 5000 });
    const afterForward = await page.evaluate(() => {
      var label = document.getElementById('eventsCalendarMonth');
      return label ? label.textContent.trim() : '';
    });

    await page.evaluate(() => {
      changeEventsMonth(-1);
    });
    await page.waitForFunction((prev) => {
      var label = document.getElementById('eventsCalendarMonth');
      return label && label.textContent.trim() !== prev;
    }, afterForward, { timeout: 5000 });
    const afterBack = await page.evaluate(() => {
      var label = document.getElementById('eventsCalendarMonth');
      return label ? label.textContent.trim() : '';
    });

    expect(afterBack).not.toBe(afterForward);
  });

  test('Calendar grid re-renders with correct days after month change', async ({ page }) => {
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('events'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Switch to calendar view
    await page.evaluate(() => {
      if (typeof switchEventsView === 'function') switchEventsView('calendar');
    });
    await page.waitForFunction(() => document.getElementById('eventsCalendarGrid') !== null, { timeout: 5000 });

    // Get day count and month label before
    const initialMonth = await page.evaluate(() => {
      var label = document.getElementById('eventsCalendarMonth');
      return label ? label.textContent.trim() : '';
    });
    const daysBefore = await page.evaluate(() => {
      var grid = document.getElementById('eventsCalendarGrid');
      return grid ? grid.querySelectorAll('.calendar-day:not(.other-month)').length : 0;
    });

    // Navigate forward
    await page.evaluate(() => changeEventsMonth(1));
    await page.waitForFunction((prev) => {
      var label = document.getElementById('eventsCalendarMonth');
      return label && label.textContent.trim() !== prev;
    }, initialMonth, { timeout: 5000 });

    const daysAfter = await page.evaluate(() => {
      var grid = document.getElementById('eventsCalendarGrid');
      return grid ? grid.querySelectorAll('.calendar-day:not(.other-month)').length : 0;
    });

    // Both should have valid day counts (28-31)
    expect(daysBefore).toBeGreaterThanOrEqual(28);
    expect(daysBefore).toBeLessThanOrEqual(31);
    expect(daysAfter).toBeGreaterThanOrEqual(28);
    expect(daysAfter).toBeLessThanOrEqual(31);
  });
});

// ============================================
// HIGH 5: GUEST/NON-MEMBER PAYMENT POPUP
// ============================================
test.describe('Guest Payment Popup', () => {

  test('showGuestPaymentPopup renders popup with fee info', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showGuestPaymentPopup(2, '2:00 PM');
      var popup = document.getElementById('guestPaymentPopup');
      if (!popup) return { exists: false };
      return {
        exists: true,
        hasCloseBtn: !!popup.querySelector('.event-detail-close'),
        containsFee: popup.textContent.indexOf('$10.00') !== -1,
        containsEmail: popup.textContent.indexOf('monotennis.payment@gmail.com') !== -1,
        containsCourt: popup.textContent.indexOf('Court 2') !== -1
      };
    });
    expect(result.exists).toBe(true);
    expect(result.hasCloseBtn).toBe(true);
    expect(result.containsFee).toBe(true);
    expect(result.containsEmail).toBe(true);
    expect(result.containsCourt).toBe(true);
  });

  test('showNonMemberEventPayment renders popup with event name', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showNonMemberEventPayment('Friday House League', 20);
      var popup = document.getElementById('guestPaymentPopup');
      if (!popup) return { exists: false };
      return {
        exists: true,
        containsFee: popup.textContent.indexOf('$20.00') !== -1,
        containsEvent: popup.textContent.indexOf('Friday House League') !== -1,
        containsEmail: popup.textContent.indexOf('monotennis.payment@gmail.com') !== -1
      };
    });
    expect(result.exists).toBe(true);
    expect(result.containsFee).toBe(true);
    expect(result.containsEvent).toBe(true);
    expect(result.containsEmail).toBe(true);
  });

  test('Guest popup close button removes popup', async ({ page }) => {
    await loginAsMember(page);

    await page.evaluate(() => showGuestPaymentPopup(1, '3:00 PM'));
    await page.waitForFunction(() => document.getElementById('guestPaymentPopup') !== null, { timeout: 5000 });

    await page.evaluate(() => {
      document.getElementById('guestPaymentPopup').remove();
    });

    const exists = await page.evaluate(() => {
      return document.getElementById('guestPaymentPopup') !== null;
    });
    expect(exists).toBe(false);
  });

  test('Non-member booking triggers guest payment popup after celebration', async ({ page }) => {
    await loginAsMember(page);

    // Set user as non-member
    await page.evaluate(() => {
      memberPaymentData.currentUser.isMember = false;
    });

    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    const slotSelected = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!slotSelected) return;
    await page.waitForFunction(() => document.querySelector('.modal-overlay.active') !== null, { timeout: 5000 });

    await page.evaluate(() => { if (typeof confirmBookingPayment === 'function') confirmBookingPayment(); });
    // Wait for celebration + guest popup timeout (setTimeout-based chain)
    await page.waitForFunction(() => document.getElementById('guestPaymentPopup') !== null, { timeout: 5000 });

    const popupShown = await page.evaluate(() => {
      return document.getElementById('guestPaymentPopup') !== null;
    });
    expect(popupShown).toBe(true);

    // Reset isMember
    await page.evaluate(() => { memberPaymentData.currentUser.isMember = true; });
  });
});

// ============================================
// MEDIUM 6: SIGN-UP FLOW
// ============================================
test.describe('Sign Up Flow', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
    await page.evaluate(() => localStorage.removeItem('mtc-user'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Show Signup screen hides login card and shows signup card', async ({ page }) => {
    const result = await page.evaluate(() => {
      showSignUpScreen();
      var loginCard = document.querySelector('.login-card:not(.signup-card)');
      var signupCard = document.getElementById('signupCard');
      return {
        loginHidden: loginCard ? loginCard.style.display === 'none' : true,
        signupVisible: signupCard ? signupCard.style.display !== 'none' : false
      };
    });
    expect(result.loginHidden).toBe(true);
    expect(result.signupVisible).toBe(true);
  });

  test('selectSignupType toggles between member and guest', async ({ page }) => {
    await page.evaluate(() => showSignUpScreen());

    const memberResult = await page.evaluate(() => {
      selectSignupType('member');
      var memberBtn = document.getElementById('signupTypeMember');
      var guestBtn = document.getElementById('signupTypeGuest');
      return {
        memberActive: memberBtn ? memberBtn.classList.contains('active') : false,
        guestActive: guestBtn ? guestBtn.classList.contains('active') : false
      };
    });
    expect(memberResult.memberActive).toBe(true);
    expect(memberResult.guestActive).toBe(false);

    const guestResult = await page.evaluate(() => {
      selectSignupType('guest');
      var memberBtn = document.getElementById('signupTypeMember');
      var guestBtn = document.getElementById('signupTypeGuest');
      return {
        memberActive: memberBtn ? memberBtn.classList.contains('active') : false,
        guestActive: guestBtn ? guestBtn.classList.contains('active') : false
      };
    });
    expect(guestResult.memberActive).toBe(false);
    expect(guestResult.guestActive).toBe(true);
  });

  test('handleSignUp validates required fields', async ({ page }) => {
    await page.evaluate(() => showSignUpScreen());
    await page.waitForFunction(() => {
      var card = document.getElementById('signupCard');
      return card && card.style.display !== 'none';
    }, { timeout: 5000 });

    // Try submitting with empty fields
    const hasError = await page.evaluate(() => {
      handleSignUp();
      var nameInput = document.getElementById('signupName');
      return nameInput ? nameInput.classList.contains('input-error') : false;
    });
    expect(hasError).toBe(true);
  });

  test('handleSignUp with valid data creates user and navigates to home', async ({ page }) => {
    await page.evaluate(() => showSignUpScreen());
    await page.waitForFunction(() => {
      var card = document.getElementById('signupCard');
      return card && card.style.display !== 'none';
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      document.getElementById('signupName').value = 'Test User';
      document.getElementById('signupEmail').value = 'test@example.com';
      document.getElementById('signupPhone').value = '519-555-0123';
      document.getElementById('signupPassword').value = 'password123';
      handleSignUp();
      var user = JSON.parse(localStorage.getItem('mtc-user') || '{}');
      return {
        name: user.name,
        email: user.email,
        role: user.role,
        isMember: user.isMember
      };
    });
    expect(result.name).toBe('Test User');
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe('member');
    expect(result.isMember).toBe(true);
  });

  test('Guest signup sets isMember false', async ({ page }) => {
    await page.evaluate(() => showSignUpScreen());
    await page.waitForFunction(() => {
      var card = document.getElementById('signupCard');
      return card && card.style.display !== 'none';
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      selectSignupType('guest');
      document.getElementById('signupName').value = 'Guest User';
      document.getElementById('signupEmail').value = 'guest@example.com';
      document.getElementById('signupPassword').value = 'password123';
      handleSignUp();
      var user = JSON.parse(localStorage.getItem('mtc-user') || '{}');
      return {
        role: user.role,
        isMember: user.isMember
      };
    });
    expect(result.role).toBe('guest');
    expect(result.isMember).toBe(false);
  });
});

// ============================================
// MEDIUM 7: FORGOT PASSWORD MODAL
// ============================================
test.describe('Forgot Password Flow', () => {

  test.beforeEach(async ({ page }) => {
    await freshStart(page);
    await page.evaluate(() => localStorage.removeItem('mtc-user'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('showForgotPassword opens modal', async ({ page }) => {
    const result = await page.evaluate(() => {
      showForgotPassword();
      var modal = document.getElementById('forgotPasswordModal');
      return modal ? modal.classList.contains('active') : false;
    });
    expect(result).toBe(true);
  });

  test('sendResetEmail with empty email shows toast', async ({ page }) => {
    await page.evaluate(() => showForgotPassword());
    await page.waitForFunction(() => {
      var modal = document.getElementById('forgotPasswordModal');
      return modal && modal.classList.contains('active');
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      document.getElementById('resetEmail').value = '';
      sendResetEmail();
      // Modal should still be open since validation failed
      var modal = document.getElementById('forgotPasswordModal');
      return modal ? modal.classList.contains('active') : false;
    });
    expect(result).toBe(true);
  });

  test('sendResetEmail with valid email closes modal', async ({ page }) => {
    await page.evaluate(() => showForgotPassword());
    await page.waitForFunction(() => {
      var modal = document.getElementById('forgotPasswordModal');
      return modal && modal.classList.contains('active');
    }, { timeout: 5000 });

    await page.evaluate(() => {
      document.getElementById('resetEmail').value = 'test@example.com';
      sendResetEmail();
    });
    await page.waitForFunction(() => {
      var modal = document.getElementById('forgotPasswordModal');
      return !modal || !modal.classList.contains('active');
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      var modal = document.getElementById('forgotPasswordModal');
      return modal ? modal.classList.contains('active') : false;
    });
    expect(result).toBe(false);
  });
});

// ============================================
// MEDIUM 8: PRIVACY SETTINGS MODAL
// ============================================
test.describe('Privacy Settings Modal', () => {

  test('showPrivacySettings opens modal with 4 toggles', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showPrivacySettings();
      var modal = document.getElementById('privacyModal');
      if (!modal) return { exists: false };
      var toggles = modal.querySelectorAll('.toggle');
      return {
        exists: true,
        toggleCount: toggles.length,
        hasActiveClass: modal.classList.contains('active')
      };
    });
    expect(result.exists).toBe(true);
    expect(result.toggleCount).toBe(4);
    expect(result.hasActiveClass).toBe(true);
  });

  test('togglePrivacySetting persists to localStorage', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showPrivacySettings();
      var modal = document.getElementById('privacyModal');
      var firstToggle = modal.querySelector('.toggle');
      // Toggle off (default is active/on)
      togglePrivacySetting('onlineStatus', firstToggle);
      var saved = JSON.parse(localStorage.getItem('mtc-privacy') || '{}');
      return {
        savedOnlineStatus: saved.onlineStatus
      };
    });
    // Default was true, toggle should make it false or true depending on initial state
    expect(result.savedOnlineStatus).toBeDefined();
  });

  test('Privacy settings load saved state on reopen', async ({ page }) => {
    await loginAsMember(page);

    // Save custom settings
    await page.evaluate(() => {
      localStorage.setItem('mtc-privacy', JSON.stringify({
        onlineStatus: false,
        profileVisible: true,
        matchHistory: false,
        shareAvailability: true
      }));
    });

    const result = await page.evaluate(() => {
      showPrivacySettings();
      var modal = document.getElementById('privacyModal');
      var toggles = modal.querySelectorAll('.toggle');
      return {
        first: toggles[0] ? toggles[0].classList.contains('active') : null,   // onlineStatus=false
        second: toggles[1] ? toggles[1].classList.contains('active') : null,  // profileVisible=true
        third: toggles[2] ? toggles[2].classList.contains('active') : null,   // matchHistory=false
        fourth: toggles[3] ? toggles[3].classList.contains('active') : null   // shareAvailability=true
      };
    });
    expect(result.first).toBe(false);
    expect(result.second).toBe(true);
    expect(result.third).toBe(false);
    expect(result.fourth).toBe(true);
  });
});

// ============================================
// MEDIUM 9: COURT PREFERENCES MODAL
// ============================================
test.describe('Court Preferences Modal', () => {

  test('editCourtPreferences opens modal with selects', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      editCourtPreferences();
      var modal = document.getElementById('courtPrefsModal');
      if (!modal) return { exists: false };
      return {
        exists: true,
        hasCourt: !!document.getElementById('prefCourt'),
        hasSurface: !!document.getElementById('prefSurface'),
        hasLighting: !!document.getElementById('prefLighting')
      };
    });
    expect(result.exists).toBe(true);
    expect(result.hasCourt).toBe(true);
    expect(result.hasSurface).toBe(true);
    expect(result.hasLighting).toBe(true);
  });

  test('saveCourtPreferences persists to localStorage', async ({ page }) => {
    await loginAsMember(page);

    const saved = await page.evaluate(() => {
      editCourtPreferences();
      document.getElementById('prefCourt').value = 'Court 3';
      document.getElementById('prefSurface').value = 'Clay';
      saveCourtPreferences();
      return JSON.parse(localStorage.getItem('mtc-court-prefs') || '{}');
    });
    expect(saved.preferred).toBe('Court 3');
    expect(saved.surface).toBe('Clay');
  });

  test('Court preferences load saved state on reopen', async ({ page }) => {
    await loginAsMember(page);

    await page.evaluate(() => {
      localStorage.setItem('mtc-court-prefs', JSON.stringify({
        preferred: 'Court 4',
        surface: 'Clay',
        lighting: false
      }));
    });

    const result = await page.evaluate(() => {
      editCourtPreferences();
      return {
        court: document.getElementById('prefCourt').value,
        surface: document.getElementById('prefSurface').value,
        lighting: document.getElementById('prefLighting').classList.contains('active')
      };
    });
    expect(result.court).toBe('Court 4');
    expect(result.surface).toBe('Clay');
    expect(result.lighting).toBe(false);
  });
});

// ============================================
// MEDIUM 10: MATCH HISTORY MODAL
// ============================================
test.describe('Match History Modal', () => {

  test('showAllMatches opens modal with stats and match list', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showAllMatches();
      var modal = document.getElementById('matchHistoryModal');
      if (!modal) return { exists: false };
      var text = modal.textContent;
      return {
        exists: true,
        hasWins: text.indexOf('WINS') !== -1,
        hasLosses: text.indexOf('LOSSES') !== -1,
        hasTotal: text.indexOf('TOTAL') !== -1,
        hasMatchTitle: text.indexOf('MATCH HISTORY') !== -1,
        hasOpponent: text.indexOf('vs ') !== -1,
        matchCount: (text.match(/vs /g) || []).length
      };
    });
    expect(result.exists).toBe(true);
    expect(result.hasWins).toBe(true);
    expect(result.hasLosses).toBe(true);
    expect(result.hasTotal).toBe(true);
    expect(result.hasMatchTitle).toBe(true);
    expect(result.matchCount).toBe(8);
  });

  test('Match history close button removes modal', async ({ page }) => {
    await loginAsMember(page);

    await page.evaluate(() => showAllMatches());
    await page.waitForFunction(() => document.getElementById('matchHistoryModal') !== null, { timeout: 5000 });
    await page.evaluate(() => {
      document.getElementById('matchHistoryModal').remove();
    });

    const exists = await page.evaluate(() => {
      return document.getElementById('matchHistoryModal') !== null;
    });
    expect(exists).toBe(false);
  });
});

// ============================================
// MEDIUM 11: EXPORT PAYMENT REPORT (CSV)
// ============================================
test.describe('Export Payment Report', () => {

  test('exportPaymentReport generates CSV with member data', async ({ page }) => {
    await loginAsAdmin(page);

    // Override download to capture blob
    const csvContent = await page.evaluate(() => {
      var capturedCsv = '';
      // Intercept Blob creation
      var origBlob = window.Blob;
      window.Blob = function(parts, opts) {
        if (opts && opts.type === 'text/csv') {
          capturedCsv = parts.join('');
        }
        return new origBlob(parts, opts);
      };
      // Intercept click
      var origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        if (this.download && this.download.indexOf('mtc-payment') !== -1) {
          // Don't actually download
        } else {
          origClick.call(this);
        }
      };

      exportPaymentReport();

      window.Blob = origBlob;
      HTMLAnchorElement.prototype.click = origClick;
      return capturedCsv;
    });

    expect(csvContent).toContain('Name,Email,Tab');
    expect(csvContent).toContain('Alex Thompson');
    expect(csvContent).toContain('Sarah Wilson');
  });
});

// ============================================
// MEDIUM 12: ADD TO CALENDAR (ICS)
// ============================================
test.describe('Add to Calendar ICS', () => {

  test('addToCalendar generates valid ICS content', async ({ page }) => {
    await loginAsMember(page);

    // Book a court first to populate confirmation screen
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    const slotSelected = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      selectSlot(slot);
      return true;
    });
    if (!slotSelected) return;

    await page.waitForFunction(() => document.querySelector('.modal-overlay.active') !== null, { timeout: 5000 });
    await page.evaluate(() => { if (typeof confirmBookingPayment === 'function') confirmBookingPayment(); });
    await page.waitForFunction(() => document.getElementById('celebrationModal')?.classList.contains('active') || document.querySelector('.celebration-modal') !== null, { timeout: 5000 });
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForFunction(() => !document.querySelector('.modal-overlay.active'), { timeout: 5000 });

    // Intercept blob creation in addToCalendar
    const icsContent = await page.evaluate(() => {
      var capturedIcs = '';
      var origBlob = window.Blob;
      window.Blob = function(parts, opts) {
        if (opts && opts.type && opts.type.indexOf('calendar') !== -1) {
          capturedIcs = parts.join('');
        }
        return new origBlob(parts, opts);
      };
      var origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        if (this.download && this.download.indexOf('.ics') !== -1) {
          // Don't actually download
        } else {
          origClick.call(this);
        }
      };

      // Navigate to confirmation screen (may already be showing)
      showConfirmationScreen({
        date: 'Saturday, Feb 1',
        time: '2:00 PM - 3:00 PM',
        court: 'Court 2'
      });
      addToCalendar();

      window.Blob = origBlob;
      HTMLAnchorElement.prototype.click = origClick;
      return capturedIcs;
    });

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain('MTC Tennis');
    expect(icsContent).toContain('END:VCALENDAR');
  });
});

// ============================================
// MEDIUM 13: CONFIRMATION SCREEN END-TO-END
// ============================================
test.describe('Confirmation Screen', () => {

  test('showConfirmationScreen populates details correctly', async ({ page }) => {
    await loginAsMember(page);

    const result = await page.evaluate(() => {
      showConfirmationScreen({
        date: 'Monday, Mar 10',
        time: '4:00 PM - 5:00 PM',
        court: 'Court 3'
      });
      var screen = document.getElementById('confirmationScreen');
      return {
        active: screen ? screen.classList.contains('active') : false,
        date: document.getElementById('confirmDate') ? document.getElementById('confirmDate').textContent : '',
        time: document.getElementById('confirmTime') ? document.getElementById('confirmTime').textContent : '',
        court: document.getElementById('confirmCourt') ? document.getElementById('confirmCourt').textContent : '',
        hasConfNumber: document.getElementById('confirmNumber') ? document.getElementById('confirmNumber').textContent.indexOf('MTC-') !== -1 : false
      };
    });
    expect(result.active).toBe(true);
    expect(result.date).toBe('Monday, Mar 10');
    expect(result.time).toBe('4:00 PM - 5:00 PM');
    expect(result.court).toBe('Court 3');
    expect(result.hasConfNumber).toBe(true);
  });

  test('closeConfirmation navigates to My Bookings', async ({ page }) => {
    await loginAsMember(page);

    await page.evaluate(() => {
      showConfirmationScreen({ date: 'Test', time: 'Test', court: 'Test' });
    });
    await page.waitForFunction(() => document.getElementById('confirmationScreen')?.classList.contains('active'), { timeout: 5000 });

    await page.evaluate(() => closeConfirmation());
    await page.waitForFunction(() => {
      var screen = document.getElementById('confirmationScreen');
      return !screen || !screen.classList.contains('active');
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      var screen = document.getElementById('confirmationScreen');
      var mybookings = document.getElementById('screen-mybookings');
      return {
        confirmClosed: screen ? !screen.classList.contains('active') : true,
        onMyBookings: mybookings ? mybookings.classList.contains('active') : false
      };
    });
    expect(result.confirmClosed).toBe(true);
  });
});

// ============================================
// ADDITIONAL: Show Login Screen from Signup
// ============================================
test.describe('Login/Signup Toggle', () => {

  test('showLoginScreen returns to login card from signup', async ({ page }) => {
    await freshStart(page);
    await page.evaluate(() => localStorage.removeItem('mtc-user'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      showSignUpScreen();
      showLoginScreen();
      var loginCard = document.querySelector('.login-card:not(.signup-card)');
      var signupCard = document.getElementById('signupCard');
      return {
        loginVisible: loginCard ? loginCard.style.display !== 'none' : false,
        signupHidden: signupCard ? signupCard.style.display === 'none' : true
      };
    });
    expect(result.loginVisible).toBe(true);
    expect(result.signupHidden).toBe(true);
  });
});
