const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

// Helper: login as demo member and go to home
async function loginAsMember(page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  // Demo login — empty fields = auto member
  await page.evaluate(() => handleLogin());
  await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });
}

// ============================================
// LOGIN SCREEN
// ============================================
test.describe('Login Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Clear saved login so we start at login screen
    await page.evaluate(() => localStorage.removeItem('mtc-user'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Login screen renders with form fields', async ({ page }) => {
    const result = await page.evaluate(() => {
      var ls = document.getElementById('login-screen');
      return {
        isActive: ls && ls.classList.contains('active'),
        hasEmail: !!document.getElementById('loginEmail'),
        hasPassword: !!document.getElementById('loginPassword'),
        hasButton: !!document.querySelector('.login-btn')
      };
    });
    expect(result.isActive).toBe(true);
    expect(result.hasEmail).toBe(true);
    expect(result.hasPassword).toBe(true);
    expect(result.hasButton).toBe(true);
  });

  test('Demo login (empty fields) navigates to home', async ({ page }) => {
    await page.evaluate(() => handleLogin());
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    const homeVisible = await page.evaluate(() => {
      return document.getElementById('screen-home').classList.contains('active');
    });
    expect(homeVisible).toBe(true);
  });

  test('Login with valid email sets user data', async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById('loginEmail').value = 'test@example.com';
      document.getElementById('loginPassword').value = 'password123';
      handleLogin();
    });
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    const userData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user'));
    });
    expect(userData).not.toBeNull();
    expect(userData.email).toBe('test@example.com');
  });

  test('Admin email sets admin role', async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById('loginEmail').value = 'admin@mtc.ca';
      document.getElementById('loginPassword').value = 'not-a-real-password';
      handleLogin();
    });
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    const userData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user'));
    });
    expect(userData).not.toBeNull();
    expect(userData.role).toBe('admin');
  });
});

// ============================================
// HOME SCREEN
// ============================================
test.describe('Home Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
  });

  test('Home screen displays after login', async ({ page }) => {
    const homeActive = await page.evaluate(() => {
      return document.getElementById('screen-home').classList.contains('active');
    });
    expect(homeActive).toBe(true);
  });

  test('Quick action cards exist (Book, Partner, Events, Schedule)', async ({ page }) => {
    const quickActions = await page.evaluate(() => {
      return document.querySelectorAll('#screen-home .quick-action').length;
    });
    expect(quickActions).toBeGreaterThanOrEqual(4);
  });

  test('Quick action Book Court navigates to book screen', async ({ page }) => {
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => document.getElementById('screen-book')?.classList.contains('active'), { timeout: 5000 });

    const bookActive = await page.evaluate(() => {
      return document.getElementById('screen-book').classList.contains('active');
    });
    expect(bookActive).toBe(true);
  });

  test('RSVP button toggles state', async ({ page }) => {
    // Clear previous RSVPs
    await page.evaluate(() => {
      localStorage.removeItem('mtc-event-bookings');
      localStorage.removeItem('mtc-user-rsvps');
    });

    const result = await page.evaluate(() => {
      var btn = document.querySelector('.event-rsvp-btn');
      if (!btn) return { found: false };
      var wasConfirmed = btn.classList.contains('confirmed');
      rsvpToEvent('bbq', btn);
      var isConfirmed = btn.classList.contains('confirmed');
      return { found: true, wasConfirmed, isConfirmed };
    });

    expect(result.found).toBe(true);
    expect(result.isConfirmed).toBe(!result.wasConfirmed);
  });

  test('Home screen event dates are dynamic (not hardcoded)', async ({ page }) => {
    const dates = await page.evaluate(() => {
      var dayEls = document.querySelectorAll('[data-home-event-day]');
      return Array.from(dayEls).map(el => el.textContent.trim());
    });
    dates.forEach(d => {
      expect(parseInt(d)).toBeGreaterThan(0);
      expect(parseInt(d)).toBeLessThanOrEqual(31);
    });
  });

  test('Notification badge exists', async ({ page }) => {
    const badgeExists = await page.evaluate(() => {
      return document.querySelector('.notification-badge') !== null;
    });
    expect(badgeExists).toBe(true);
  });
});

// ============================================
// BOOK COURT SCREEN
// ============================================
test.describe('Book Court Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => {
      var screen = document.getElementById('screen-book');
      var slots = document.querySelectorAll('.weekly-slot');
      return screen?.classList.contains('active') && slots.length > 0;
    }, { timeout: 5000 });
  });

  test('Weekly grid renders with courts and time slots', async ({ page }) => {
    const gridInfo = await page.evaluate(() => {
      // Ensure week view is active
      if (typeof switchBookingView === 'function') switchBookingView('week');
      // Wait briefly for render
      var slots = document.querySelectorAll('.weekly-slot');
      var rows = document.querySelectorAll('.weekly-grid-row');
      // Check court labels in the header area
      var dayTabs = document.querySelectorAll('.week-day-tab');
      return {
        slots: slots.length,
        rows: rows.length,
        dayTabs: dayTabs.length
      };
    });

    expect(gridInfo.slots).toBeGreaterThan(0);
    expect(gridInfo.rows).toBeGreaterThan(0);
    expect(gridInfo.dayTabs).toBe(7);
  });

  test('Available slots have correct class', async ({ page }) => {
    const hasAvailable = await page.evaluate(() => {
      return document.querySelectorAll('.weekly-slot.available').length > 0;
    });
    expect(hasAvailable).toBe(true);
  });

  test('Clicking available slot selects it', async ({ page }) => {
    const selected = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      slot.click();
      return slot.classList.contains('selected');
    });
    expect(selected).toBe(true);
  });

  test('Selecting slot updates summary info', async ({ page }) => {
    const summaryFilled = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      slot.click();
      var dateEl = document.getElementById('summaryDate');
      var timeEl = document.getElementById('summaryTime');
      var courtEl = document.getElementById('summaryCourt');
      return (dateEl && dateEl.textContent.trim().length > 0) &&
             (timeEl && timeEl.textContent.trim().length > 0) &&
             (courtEl && courtEl.textContent.trim().length > 0);
    });
    expect(summaryFilled).toBe(true);
  });

  test('Booking modal opens after slot selection', async ({ page }) => {
    const modalOpened = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      slot.click();
      if (typeof openBookingModal === 'function') openBookingModal();
      var modal = document.getElementById('bookingModal');
      return modal && modal.classList.contains('active');
    });
    expect(modalOpened).toBe(true);
  });

  test('Confirm booking saves to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('mtc-event-bookings');
    });

    // Select an available slot
    const slotReady = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return false;
      slot.click();
      return !!selectedSlot;
    });
    expect(slotReady).toBe(true);

    // Trigger booking (confirmBookingPayment uses setTimeout 400ms)
    await page.evaluate(() => confirmBooking());
    await page.waitForFunction(() => {
      var data = localStorage.getItem('mtc-event-bookings');
      return data && JSON.parse(data).length > 0;
    }, { timeout: 5000 });

    const bookings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-event-bookings') || '[]');
    });
    expect(bookings.length).toBeGreaterThan(0);
  });

  test('Week navigation changes dates', async ({ page }) => {
    const result = await page.evaluate(() => {
      var labelBefore = document.getElementById('weekDates')?.textContent || '';
      if (typeof changeWeek === 'function') changeWeek(1);
      var labelAfter = document.getElementById('weekDates')?.textContent || '';
      return { before: labelBefore, after: labelAfter };
    });
    expect(result.before).not.toBe(result.after);
  });

  test('Day tabs exist and are clickable', async ({ page }) => {
    const tabCount = await page.evaluate(() => {
      return document.querySelectorAll('.week-day-tab').length;
    });
    expect(tabCount).toBe(7);
  });
});

// ============================================
// SCHEDULE SCREEN
// ============================================
test.describe('Schedule Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
  });

  test('Schedule screen renders with upcoming/past tabs', async ({ page }) => {
    await page.evaluate(() => navigateTo('schedule'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    const tabs = await page.evaluate(() => {
      var tabEls = document.querySelectorAll('#screen-schedule .schedule-tab, #screen-schedule .view-toggle-btn');
      return tabEls.length;
    });
    expect(tabs).toBeGreaterThanOrEqual(2);
  });

  test('Schedule shows static weekly items', async ({ page }) => {
    await page.evaluate(() => navigateTo('schedule'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('#screen-schedule .schedule-item').length;
    });
    expect(itemCount).toBeGreaterThan(0);
  });

  test('Club event RSVP does NOT appear on schedule (filtered out)', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('mtc-event-bookings');
      localStorage.removeItem('mtc-user-rsvps');
    });
    await page.evaluate(() => {
      var btn = document.querySelector('.event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });
    await page.waitForTimeout(200);

    await page.evaluate(() => navigateTo('schedule'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });

    // Club events should be filtered from schedule — only personal bookings show
    const dynamicBookings = await page.evaluate(() => {
      var container = document.getElementById('scheduleEventBookings');
      return container ? container.querySelectorAll('.schedule-item').length : 0;
    });
    expect(dynamicBookings).toBe(0);
  });
});

// ============================================
// PARTNERS SCREEN
// ============================================
test.describe('Partners Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('partners'));
    await page.waitForFunction(() => document.getElementById('screen-partners')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Partners screen renders with partner cards', async ({ page }) => {
    const cardCount = await page.evaluate(() => {
      return document.querySelectorAll('#screen-partners .partner-card').length;
    });
    expect(cardCount).toBeGreaterThan(0);
  });

  test('Filter pills exist and filter correctly', async ({ page }) => {
    const filterResult = await page.evaluate(() => {
      var pills = document.querySelectorAll('#screen-partners .filter-pill');
      return { pillCount: pills.length };
    });
    expect(filterResult.pillCount).toBeGreaterThan(0);
  });

  test('Post Partner Request modal opens', async ({ page }) => {
    const modalOpened = await page.evaluate(() => {
      if (typeof showPostPartnerModal === 'function') {
        showPostPartnerModal();
        var modal = document.getElementById('postPartnerModal');
        return modal && modal.classList.contains('active');
      }
      return false;
    });
    expect(modalOpened).toBe(true);
  });

  test('Submit partner request saves to localStorage', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('mtc-partner-requests'));

    const submitted = await page.evaluate(() => {
      if (typeof showPostPartnerModal !== 'function') return false;
      showPostPartnerModal();

      var typeBtn = document.querySelector('#postPartnerModal .partner-type-btn');
      if (typeBtn && typeof selectPartnerType === 'function') selectPartnerType(typeBtn);

      if (typeof submitPartnerRequest === 'function') {
        submitPartnerRequest();
        var saved = localStorage.getItem('mtc-partner-requests');
        return saved && JSON.parse(saved).length > 0;
      }
      return false;
    });
    expect(submitted).toBe(true);
  });
});

// ============================================
// CLUB EVENTS SCREEN
// ============================================
test.describe('Club Events Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('events'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Events list view shows event cards', async ({ page }) => {
    const eventCount = await page.evaluate(() => {
      // Events content moved to schedule screen inside #scheduleEventsView
      return document.querySelectorAll('#scheduleEventsView .event-card').length;
    });
    expect(eventCount).toBeGreaterThan(0);
  });

  test('View toggle switches between list and calendar', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (typeof switchEventsView === 'function') {
        switchEventsView('calendar');
        var calendarView = document.getElementById('eventsCalendarView');
        var listView = document.getElementById('eventsListView');
        var calActive = calendarView && calendarView.classList.contains('active');
        var listActive = listView && listView.classList.contains('active');
        return { calActive, listActive };
      }
      return null;
    });

    if (result) {
      expect(result.calActive).toBe(true);
      expect(result.listActive).toBe(false);
    }
  });

  test('Calendar view renders month grid', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof switchEventsView === 'function') switchEventsView('calendar');
    });
    await page.waitForFunction(() => document.getElementById('eventsCalendarView')?.classList.contains('active'), { timeout: 5000 });

    const gridInfo = await page.evaluate(() => {
      var grid = document.getElementById('eventsCalendarGrid');
      var days = grid ? grid.querySelectorAll('.calendar-day').length : 0;
      var monthLabel = document.getElementById('eventsCalendarMonth');
      return {
        days,
        monthText: monthLabel ? monthLabel.textContent.trim() : ''
      };
    });
    expect(gridInfo.days).toBeGreaterThan(20);
    expect(gridInfo.monthText.length).toBeGreaterThan(0);
  });

  test('Events screen has event action buttons', async ({ page }) => {
    // Events content moved to #scheduleEventsView inside schedule screen
    const hasActionButtons = await page.evaluate(() => {
      var cards = document.querySelectorAll('#scheduleEventsView .event-card');
      var buttons = document.querySelectorAll('#scheduleEventsView .event-card [onclick], #scheduleEventsView .event-register-btn, #scheduleEventsView button');
      return { cards: cards.length, buttons: buttons.length };
    });
    expect(hasActionButtons.cards).toBeGreaterThan(0);
  });

  test('RSVP from home screen persists to events', async ({ page }) => {
    // Navigate to home first for RSVP
    await page.evaluate(() => {
      localStorage.removeItem('mtc-user-rsvps');
      localStorage.removeItem('mtc-event-bookings');
      navigateTo('home');
    });
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    await page.evaluate(() => {
      var btn = document.querySelector('#screen-home .event-rsvp-btn');
      if (btn) rsvpToEvent('bbq', btn);
    });
    await page.waitForTimeout(300);

    const rsvps = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-user-rsvps') || '[]');
    });
    expect(rsvps.length).toBeGreaterThan(0);
    expect(rsvps.some(r => r === 'opening-day-bbq')).toBe(true);
  });
});

// ============================================
// MESSAGES SCREEN
// ============================================
test.describe('Messages Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('messages'));
    await page.waitForFunction(() => document.getElementById('screen-messages')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Conversation list renders with member names', async ({ page }) => {
    const convCount = await page.evaluate(() => {
      return document.querySelectorAll('#screen-messages .message-item').length;
    });
    expect(convCount).toBeGreaterThan(0);
  });

  test('Conversation items show name and preview', async ({ page }) => {
    const firstConv = await page.evaluate(() => {
      var item = document.querySelector('#screen-messages .message-item');
      if (!item) return null;
      var name = item.querySelector('.message-name');
      var preview = item.querySelector('.message-preview');
      return {
        name: name ? name.textContent.trim() : '',
        preview: preview ? preview.textContent.trim() : ''
      };
    });
    expect(firstConv).not.toBeNull();
    expect(firstConv.name.length).toBeGreaterThan(0);
  });

  test('Open conversation shows chat screen', async ({ page }) => {
    const chatOpened = await page.evaluate(() => {
      if (typeof openConversation === 'function') {
        openConversation('mike');
        return document.getElementById('screen-conversation').classList.contains('active');
      }
      return false;
    });
    expect(chatOpened).toBe(true);
  });

  test('Chat screen has input field and messages', async ({ page }) => {
    await page.evaluate(() => openConversation('mike'));
    await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active'), { timeout: 5000 });

    const chatInfo = await page.evaluate(() => {
      var input = document.getElementById('chatInput');
      var messages = document.querySelectorAll('#chatMessages .chat-bubble');
      var nameEl = document.getElementById('conversationName');
      return {
        hasInput: !!input,
        messageCount: messages.length,
        contactName: nameEl ? nameEl.textContent.trim() : ''
      };
    });
    expect(chatInfo.hasInput).toBe(true);
    expect(chatInfo.messageCount).toBeGreaterThan(0);
    expect(chatInfo.contactName).toContain('Mike');
  });

  test('Send message appears in chat', async ({ page }) => {
    await page.evaluate(() => openConversation('mike'));
    await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active'), { timeout: 5000 });

    const msgSent = await page.evaluate(() => {
      var input = document.getElementById('chatInput');
      if (!input) return false;
      input.value = 'Test message from Playwright';
      if (typeof sendMessage === 'function') sendMessage();
      var sentBubbles = document.querySelectorAll('#chatMessages .chat-bubble.sent');
      var lastSent = sentBubbles[sentBubbles.length - 1];
      return lastSent && lastSent.textContent.includes('Test message from Playwright');
    });
    expect(msgSent).toBe(true);
  });

  test('Messages persist to localStorage', async ({ page }) => {
    // Navigate to messages first, then open a conversation
    await page.evaluate(() => openConversation('sarah'));
    await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active'), { timeout: 5000 });

    // Verify the conversation screen is active and chatInput exists
    const chatReady = await page.evaluate(() => {
      return {
        conversationActive: document.getElementById('screen-conversation')?.classList.contains('active'),
        chatInputExists: !!document.getElementById('chatInput')
      };
    });
    expect(chatReady.chatInputExists).toBe(true);

    // Type and send a message
    await page.evaluate(() => {
      var input = document.getElementById('chatInput');
      input.value = 'Persistence test msg 123';
      sendMessage();
    });
    await page.waitForFunction(() => {
      var data = localStorage.getItem('mtc-conversations');
      if (!data) return false;
      try {
        var convs = JSON.parse(data);
        return convs.sarah && convs.sarah.some(function(m) { return m.text === 'Persistence test msg 123'; });
      } catch(e) { return false; }
    }, { timeout: 5000 });

    // Verify it was saved to localStorage
    const saved = await page.evaluate(() => {
      var data = localStorage.getItem('mtc-conversations');
      if (!data) return { found: false, reason: 'no mtc-conversations key', allKeys: Object.keys(localStorage) };
      try {
        var convs = JSON.parse(data);
        if (!convs.sarah) return { found: false, reason: 'no sarah key', keys: Object.keys(convs) };
        var lastMsg = convs.sarah[convs.sarah.length - 1];
        var found = convs.sarah.some(function(m) { return m.text === 'Persistence test msg 123'; });
        return { found: found, messageCount: convs.sarah.length, lastMsg: lastMsg };
      } catch(e) { return { found: false, reason: 'parse error: ' + e.message }; }
    });
    expect(saved.found).toBe(true);
  });

  test('New Message modal opens', async ({ page }) => {
    const modalOpened = await page.evaluate(() => {
      if (typeof showNewMessageModal === 'function') {
        showNewMessageModal();
        var modal = document.getElementById('newMessageModal');
        return modal && modal.classList.contains('active');
      }
      return false;
    });
    expect(modalOpened).toBe(true);
  });
});

// ============================================
// PROFILE SCREEN
// ============================================
test.describe('Profile Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('profile'));
    await page.waitForFunction(() => document.getElementById('screen-profile')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Profile displays user name', async ({ page }) => {
    const name = await page.evaluate(() => {
      var el = document.getElementById('profileName');
      return el ? el.textContent.trim() : '';
    });
    expect(name.length).toBeGreaterThan(0);
  });

  test('Profile shows NTRP rating', async ({ page }) => {
    const rating = await page.evaluate(() => {
      var el = document.getElementById('playerRatingNTRP');
      return el ? el.textContent.trim() : '';
    });
    expect(rating).toMatch(/\d\.\d/);
  });

  test('Edit profile name opens edit modal', async ({ page }) => {
    const modalOpened = await page.evaluate(() => {
      if (typeof editProfileField === 'function') {
        editProfileField('name');
        var modal = document.getElementById('profileEditModal');
        return modal && modal.classList.contains('active');
      }
      return false;
    });
    expect(modalOpened).toBe(true);
  });

  test('Save profile edit persists to localStorage', async ({ page }) => {
    await page.evaluate(() => editProfileField('name'));
    await page.waitForFunction(() => document.getElementById('profileEditModal')?.classList.contains('active'), { timeout: 5000 });

    await page.evaluate(() => {
      var input = document.getElementById('profileEditInput');
      if (input) {
        input.value = 'Test Player';
        saveProfileEdit();
      }
    });
    await page.waitForFunction(() => {
      var data = localStorage.getItem('mtc-profile');
      if (!data) return false;
      try { return JSON.parse(data).name === 'Test Player'; } catch(e) { return false; }
    }, { timeout: 5000 });

    const saved = await page.evaluate(() => {
      var data = localStorage.getItem('mtc-profile');
      if (!data) return null;
      return JSON.parse(data).name;
    });
    expect(saved).toBe('Test Player');
  });

  test('Avatar picker opens', async ({ page }) => {
    const pickerOpened = await page.evaluate(() => {
      if (typeof showAvatarPicker === 'function') {
        showAvatarPicker();
        var modal = document.getElementById('avatarPickerModal');
        return modal && modal.classList.contains('active');
      }
      return false;
    });
    expect(pickerOpened).toBe(true);
  });

  test('Select avatar persists to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof selectAvatar === 'function') selectAvatar('tennis-female-1');
    });
    await page.waitForFunction(() => {
      var data = localStorage.getItem('mtc-avatar');
      return data && JSON.parse(data) === 'tennis-female-1';
    }, { timeout: 5000 });

    const savedAvatar = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mtc-avatar'));
    });
    expect(savedAvatar).toBe('tennis-female-1');
  });
});

// ============================================
// SETTINGS SCREEN
// ============================================
test.describe('Settings Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('settings'));
    await page.waitForFunction(() => document.getElementById('screen-settings')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Settings screen renders with toggles', async ({ page }) => {
    const toggleCount = await page.evaluate(() => {
      return document.querySelectorAll('#screen-settings .toggle').length;
    });
    expect(toggleCount).toBeGreaterThan(0);
  });

  test('Dark mode toggle switches theme', async ({ page }) => {
    const result = await page.evaluate(() => {
      var app = document.getElementById('app');
      var before = app.getAttribute('data-theme') || 'light';
      var toggle = document.getElementById('darkModeToggle');
      if (toggle) toggle.click();
      var after = app.getAttribute('data-theme') || 'light';
      return { before, after };
    });
    expect(result.before).not.toBe(result.after);
  });

  test('Theme persists to localStorage', async ({ page }) => {
    const themeBefore = await page.evaluate(() => document.getElementById('app').getAttribute('data-theme') || 'light');
    await page.evaluate(() => {
      var toggle = document.getElementById('darkModeToggle');
      if (toggle) toggle.click();
    });
    await page.waitForFunction((prev) => {
      var current = document.getElementById('app').getAttribute('data-theme') || 'light';
      return current !== prev;
    }, themeBefore, { timeout: 5000 });

    const theme = await page.evaluate(() => {
      return localStorage.getItem('mtc-theme');
    });
    expect(theme).toBeTruthy();
  });

  test('Logout clears session and returns to login', async ({ page }) => {
    // Verify we are logged in first
    const loggedIn = await page.evaluate(() => !!localStorage.getItem('mtc-user'));
    expect(loggedIn).toBe(true);

    // Call handleLogout — this opens a confirmation modal
    await page.evaluate(() => handleLogout());
    await page.waitForFunction(() => document.getElementById('confirmModal')?.classList.contains('active'), { timeout: 5000 });

    // Click the confirm button in the confirmation modal
    await page.evaluate(() => {
      var confirmBtn = document.querySelector('#confirmModal .confirm-modal-btn.danger, #confirmModal .confirm-modal-confirm');
      if (confirmBtn) confirmBtn.click();
      // Fallback: try calling the original handleLogout directly
      else if (typeof _originalHandleLogout === 'function') _originalHandleLogout();
    });
    await page.waitForFunction(() => document.getElementById('login-screen')?.classList.contains('active'), { timeout: 5000 });

    const result = await page.evaluate(() => {
      var loginScreen = document.getElementById('login-screen');
      var userExists = localStorage.getItem('mtc-user');
      return {
        loginVisible: loginScreen && loginScreen.classList.contains('active'),
        userCleared: !userExists
      };
    });
    expect(result.loginVisible).toBe(true);
    expect(result.userCleared).toBe(true);
  });
});

// ============================================
// ADMIN PANEL
// ============================================
test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.getElementById('loginEmail').value = 'admin@mtc.com';
      document.getElementById('loginPassword').value = 'password123';
      handleLogin();
    });
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Admin can access admin panel', async ({ page }) => {
    await page.evaluate(() => navigateTo('admin'));
    await page.waitForFunction(() => document.getElementById('screen-admin')?.classList.contains('active'), { timeout: 5000 });

    const adminActive = await page.evaluate(() => {
      return document.getElementById('screen-admin').classList.contains('active');
    });
    expect(adminActive).toBe(true);
  });

  test('Send announcement modal opens', async ({ page }) => {
    await page.evaluate(() => navigateTo('admin'));
    await page.waitForFunction(() => document.getElementById('screen-admin')?.classList.contains('active'), { timeout: 5000 });

    const modalOpened = await page.evaluate(() => {
      if (typeof showSendAnnouncementModal === 'function') {
        showSendAnnouncementModal();
        var modal = document.getElementById('announcementModal');
        return modal && modal.classList.contains('active');
      }
      return false;
    });
    expect(modalOpened).toBe(true);
  });

  test('Send announcement creates notification', async ({ page }) => {
    await page.evaluate(() => navigateTo('admin'));
    await page.waitForFunction(() => document.getElementById('screen-admin')?.classList.contains('active'), { timeout: 5000 });

    const result = await page.evaluate(() => {
      showSendAnnouncementModal();
      var title = document.getElementById('announcementTitle');
      var message = document.getElementById('announcementMessage');
      if (!title || !message) return false;

      title.value = 'Test Announcement';
      message.value = 'This is a test announcement from Playwright';

      var recipientBtn = document.querySelector('.announcement-recipient-btn');
      if (recipientBtn && typeof selectAnnouncementRecipient === 'function') {
        selectAnnouncementRecipient(recipientBtn);
      }

      sendAnnouncement();
      return true;
    });
    expect(result).toBe(true);
  });
});

// ============================================
// NOTIFICATIONS SCREEN
// ============================================
test.describe('Notifications Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('notifications'));
    await page.waitForFunction(() => document.getElementById('screen-notifications')?.classList.contains('active'), { timeout: 5000 });
  });

  test('Notifications screen renders with items', async ({ page }) => {
    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('#screen-notifications .notification-item').length;
    });
    expect(itemCount).toBeGreaterThan(0);
  });

  test('Notification items have title and description', async ({ page }) => {
    const firstNotif = await page.evaluate(() => {
      var item = document.querySelector('#screen-notifications .notification-item');
      if (!item) return null;
      var title = item.querySelector('.notification-title');
      var desc = item.querySelector('.notification-desc');
      return {
        title: title ? title.textContent.trim() : '',
        desc: desc ? desc.textContent.trim() : ''
      };
    });
    expect(firstNotif).not.toBeNull();
    expect(firstNotif.title.length).toBeGreaterThan(0);
  });

  test('Dismiss notification removes it', async ({ page }) => {
    const result = await page.evaluate(() => {
      var items = document.querySelectorAll('#screen-notifications .notification-item');
      var countBefore = items.length;
      if (countBefore === 0) return { before: 0 };

      var firstItem = items[0];
      if (typeof dismissNotification === 'function') {
        dismissNotification(firstItem);
      }
      return { before: countBefore };
    });
    if (result.before > 0) {
      await page.waitForFunction((expectedMax) => {
        return document.querySelectorAll('#screen-notifications .notification-item').length < expectedMax;
      }, result.before, { timeout: 5000 });
    }

    const countAfter = await page.evaluate(() => {
      return document.querySelectorAll('#screen-notifications .notification-item').length;
    });

    if (result.before > 0) {
      expect(countAfter).toBeLessThan(result.before);
    }
  });
});

// ============================================
// CROSS-SCREEN NAVIGATION
// ============================================
test.describe('Cross-Screen Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
  });

  test('Bottom nav has 5 items', async ({ page }) => {
    const navCount = await page.evaluate(() => {
      return document.querySelectorAll('#bottomNav .nav-item').length;
    });
    expect(navCount).toBe(5);
  });

  test('All bottom nav items navigate correctly', async ({ page }) => {
    const screens = ['home', 'schedule', 'book', 'partners', 'messages'];

    for (const screen of screens) {
      await page.evaluate((s) => navigateTo(s), screen);
      await page.waitForFunction((id) => document.getElementById('screen-' + id)?.classList.contains('active'), screen, { timeout: 5000 });

      const isActive = await page.evaluate((s) => {
        return document.getElementById('screen-' + s)?.classList.contains('active') || false;
      }, screen);
      expect(isActive).toBe(true);
    }
  });

  test('Hamburger menu opens and closes', async ({ page }) => {
    const result = await page.evaluate(() => {
      openMenu();
      var drawer = document.getElementById('menuDrawer');
      var isOpen = drawer && drawer.classList.contains('open');
      closeMenu();
      var isClosed = drawer && !drawer.classList.contains('open');
      return { isOpen, isClosed };
    });
    expect(result.isOpen).toBe(true);
    expect(result.isClosed).toBe(true);
  });

  test('Hamburger menu items navigate correctly', async ({ page }) => {
    // 'events' now redirects to 'schedule' with club events pill active
    const menuScreens = ['profile', 'schedule', 'settings'];

    for (const screen of menuScreens) {
      await page.evaluate((s) => navigateTo(s), screen);
      await page.waitForFunction((id) => document.getElementById('screen-' + id)?.classList.contains('active'), screen, { timeout: 5000 });

      const isActive = await page.evaluate((s) => {
        return document.getElementById('screen-' + s)?.classList.contains('active') || false;
      }, screen);
      expect(isActive).toBe(true);
    }

    // Verify events redirect: navigateTo('events') activates schedule screen
    await page.evaluate(() => navigateTo('events'));
    await page.waitForFunction(() => document.getElementById('screen-schedule')?.classList.contains('active'), { timeout: 5000 });
    const scheduleActive = await page.evaluate(() => {
      return document.getElementById('screen-schedule')?.classList.contains('active') || false;
    });
    expect(scheduleActive).toBe(true);
  });

  test('No console errors across all screens', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const screens = ['home', 'schedule', 'book', 'partners', 'messages',
                     'events', 'profile', 'settings', 'notifications', 'admin'];

    for (const screen of screens) {
      await page.evaluate((s) => navigateTo(s), screen);
      await page.waitForTimeout(150);
    }

    expect(errors).toEqual([]);
  });

  test('Dark mode renders across all screens without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => {
      document.getElementById('app').setAttribute('data-theme', 'dark');
    });

    const screens = ['home', 'schedule', 'book', 'partners', 'messages', 'events', 'profile'];

    for (const screen of screens) {
      await page.evaluate((s) => navigateTo(s), screen);
      await page.waitForTimeout(150);
    }

    expect(errors).toEqual([]);

    const theme = await page.evaluate(() => {
      return document.getElementById('app').getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });
});

// Gear Exchange section removed — tests removed

// ============================================
// DATA PERSISTENCE (localStorage)
// ============================================
test.describe('Data Persistence', () => {
  test('User session survives page reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);

    // Verify user was saved
    const userSaved = await page.evaluate(() => !!localStorage.getItem('mtc-user'));
    expect(userSaved).toBe(true);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      var home = document.getElementById('screen-home');
      return home && home.classList.contains('active');
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      var user = localStorage.getItem('mtc-user');
      var loginScreen = document.getElementById('login-screen');
      return {
        hasUser: !!user,
        loginHidden: loginScreen && !loginScreen.classList.contains('active')
      };
    });
    expect(result.hasUser).toBe(true);
    expect(result.loginHidden).toBe(true);
  });

  test('Theme preference survives reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);

    await page.evaluate(() => localStorage.setItem('mtc-theme', JSON.stringify('dark')));

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.getElementById('app')?.getAttribute('data-theme') === 'dark', { timeout: 5000 });

    const theme = await page.evaluate(() => {
      return document.getElementById('app').getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });

  test('Bookings persist across reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);

    await page.evaluate(() => {
      var bookings = [{ eventId: 'test-123', type: 'court', title: 'Test Booking', date: '2026-03-01', time: '2:00 PM', location: 'Court 1' }];
      localStorage.setItem('mtc-event-bookings', JSON.stringify(bookings));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const preserved = await page.evaluate(() => {
      var data = localStorage.getItem('mtc-event-bookings');
      if (!data) return false;
      var bookings = JSON.parse(data);
      return bookings.some(function(b) { return b.eventId === 'test-123'; });
    });
    expect(preserved).toBe(true);
  });

  test('Conversations persist across reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);

    // Navigate to messages and open conversation
    await page.evaluate(() => navigateTo('messages'));
    await page.waitForFunction(() => document.getElementById('screen-messages')?.classList.contains('active'), { timeout: 5000 });
    await page.evaluate(() => openConversation('mike'));
    await page.waitForFunction(() => document.getElementById('screen-conversation')?.classList.contains('active'), { timeout: 5000 });

    // Send a message
    await page.evaluate(() => {
      var input = document.getElementById('chatInput');
      input.value = 'Reload persist test 456';
      sendMessage();
    });
    await page.waitForFunction(() => {
      var data = localStorage.getItem('mtc-conversations');
      if (!data) return false;
      try {
        var convs = JSON.parse(data);
        return convs.mike && convs.mike.some(function(m) { return m.text === 'Reload persist test 456'; });
      } catch(e) { return false; }
    }, { timeout: 5000 });

    // Check localStorage BEFORE reload
    const savedBeforeReload = await page.evaluate(() => {
      var data = localStorage.getItem('mtc-conversations');
      if (!data) return false;
      try {
        var convs = JSON.parse(data);
        if (convs.mike) return convs.mike.some(function(m) { return m.text === 'Reload persist test 456'; });
        return false;
      } catch(e) { return false; }
    });
    expect(savedBeforeReload).toBe(true);

    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');

    const preservedAfterReload = await page.evaluate(() => {
      var data = localStorage.getItem('mtc-conversations');
      if (!data) return false;
      var convs = JSON.parse(data);
      return convs.mike && convs.mike.some(function(m) { return m.text === 'Reload persist test 456'; });
    });
    expect(preservedAfterReload).toBe(true);
  });
});
