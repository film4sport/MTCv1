/* mybookings.js - MTC Court */
// ============================================
// MY BOOKINGS — Cancel / Modify / Tab Switching
// ============================================
(function() {
  'use strict';

  // Private state
  let currentBookingToModify = null;

  // ============================================
  // BOOKINGS TAB SWITCHING
  // ============================================
  // onclick handler (index.html)
  window.switchBookingsTab = function(tab) {
    const upcomingTab = document.getElementById('bookingsUpcomingTab');
    const pastTab = document.getElementById('bookingsPastTab');
    const upcomingBookings = document.getElementById('upcomingBookings');
    const pastBookings = document.getElementById('pastBookings');

    if (tab === 'upcoming') {
      upcomingTab.classList.add('active');
      pastTab.classList.remove('active');
      upcomingBookings.style.display = 'block';
      pastBookings.style.display = 'none';
    } else {
      upcomingTab.classList.remove('active');
      pastTab.classList.add('active');
      upcomingBookings.style.display = 'none';
      pastBookings.style.display = 'block';
    }
  };

  // ============================================
  // CANCEL MODAL
  // ============================================
  // onclick handler (generated HTML)
  window.closeCancelModal = function() {
    document.getElementById('cancelModalContent').classList.remove('active');
    setTimeout(function() {
      document.getElementById('cancelModal').classList.remove('active');
    }, 300);
  };

  // ============================================
  // MODIFY MODAL
  // ============================================
  // onclick handler (generated HTML)
  window.showModifyModal = function(bookingId) {
    currentBookingToModify = bookingId;
    document.getElementById('modifyModal').classList.add('active');
    setTimeout(function() {
      document.getElementById('modifyModalContent').classList.add('active');
    }, 50);
  };

  // onclick handler (generated HTML)
  window.closeModifyModal = function() {
    document.getElementById('modifyModalContent').classList.remove('active');
    setTimeout(function() {
      document.getElementById('modifyModal').classList.remove('active');
    }, 300);
  };

  // onclick handler (index.html)
  window.changeBookingTime = function() {
    try {
    closeModifyModal();
    const bookingId = currentBookingToModify;
    const booking = (typeof memberPaymentData !== 'undefined')
      ? memberPaymentData.bookings.find(function(b) { return b.id === bookingId; })
      : null;

    if (booking && typeof cancelBooking === 'function') {
      cancelBooking(bookingId);
      if (typeof bookingsData !== 'undefined' && bookingsData[booking.date]) {
        bookingsData[booking.date] = bookingsData[booking.date].filter(function(b) {
          return !(b.time === booking.time && b.court === booking.court && b.user === 'You');
        });
      }
      if (typeof removeEventFromMyBookings === 'function') {
        removeEventFromMyBookings('court-' + bookingId);
      }
    }

    navigateTo('book');
    showToast('Old booking cancelled \u2014 select a new time');
    if (typeof renderMyBookings === 'function') setTimeout(renderMyBookings, 500);
    } catch(e) { console.warn('changeBookingTime error:', e); }
  };

  // onclick handler (index.html)
  window.changeBookingCourt = function() {
    try {
    closeModifyModal();
    const bookingId = currentBookingToModify;
    const booking = (typeof memberPaymentData !== 'undefined')
      ? memberPaymentData.bookings.find(function(b) { return b.id === bookingId; })
      : null;

    if (booking && typeof cancelBooking === 'function') {
      cancelBooking(bookingId);
      if (typeof bookingsData !== 'undefined' && bookingsData[booking.date]) {
        bookingsData[booking.date] = bookingsData[booking.date].filter(function(b) {
          return !(b.time === booking.time && b.court === booking.court && b.user === 'You');
        });
      }
      if (typeof removeEventFromMyBookings === 'function') {
        removeEventFromMyBookings('court-' + bookingId);
      }
    }

    navigateTo('book');
    showToast('Old booking cancelled \u2014 select a new court');
    if (typeof renderMyBookings === 'function') setTimeout(renderMyBookings, 500);
    } catch(e) { console.warn('changeBookingCourt error:', e); }
  };

  // onclick handler (index.html)
  window.showCancelFromModify = function() {
    closeModifyModal();
    setTimeout(function() { showCancelModal(currentBookingToModify); }, 350);
  };

  // ============================================
  // CONFIRMATION SCREEN
  // ============================================
  // onclick handler (generated HTML / navigation)
  window.showConfirmationScreen = function(details) {
    const screen = document.getElementById('confirmationScreen');

    if (details) {
      document.getElementById('confirmDate').textContent = details.date || 'Saturday, Feb 1';
      document.getElementById('confirmTime').textContent = details.time || '2:00 PM - 3:00 PM';
      document.getElementById('confirmCourt').textContent = details.court || 'Court 2';
      document.getElementById('confirmNumber').textContent = 'MTC-' + Date.now().toString().slice(-8);
    }

    screen.classList.add('active');
  };

  // onclick handler (index.html)
  window.closeConfirmation = function() {
    document.getElementById('confirmationScreen').classList.remove('active');
    navigateTo('mybookings');
  };

  // onclick handler (index.html)
  window.addToCalendar = function() {
    try {
    const dateText = document.getElementById('confirmDate').textContent || '';
    const timeText = document.getElementById('confirmTime').textContent || '';
    const courtText = document.getElementById('confirmCourt').textContent || 'Court';
    const confNum = document.getElementById('confirmNumber').textContent || '';

    const now = new Date();
    const eventDate = now;

    let startHour = 12, startMin = 0, endHour = 13, endMin = 0;
    const timeParts = timeText.split('-').map(function(t) { return t.trim(); });
    if (timeParts.length >= 1) {
      const parsed = parseTimeStr(timeParts[0]);
      if (parsed) { startHour = parsed.h; startMin = parsed.m; }
    }
    if (timeParts.length >= 2) {
      const parsed2 = parseTimeStr(timeParts[1]);
      if (parsed2) { endHour = parsed2.h; endMin = parsed2.m; }
    } else {
      endHour = startHour + 1;
      endMin = startMin;
    }

    const y = eventDate.getFullYear();
    const mo = String(eventDate.getMonth() + 1).padStart(2, '0');
    const dy = String(eventDate.getDate()).padStart(2, '0');

    const dtStart = y + mo + dy + 'T' + String(startHour).padStart(2,'0') + String(startMin).padStart(2,'0') + '00';
    const dtEnd = y + mo + dy + 'T' + String(endHour).padStart(2,'0') + String(endMin).padStart(2,'0') + '00';
    const dtStamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MTC Court//Booking//EN',
      'BEGIN:VEVENT',
      'DTSTART:' + dtStart,
      'DTEND:' + dtEnd,
      'DTSTAMP:' + dtStamp,
      'UID:' + confNum + '@mtc-court.app',
      'SUMMARY:MTC Tennis - ' + courtText,
      'DESCRIPTION:' + courtText + ' booking at MTC. Confirmation: ' + confNum,
      'LOCATION:MTC Tennis Club',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mtc-booking-' + confNum + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Calendar event downloaded! Open it to add to your calendar.');
    } catch(e) { console.warn('addToCalendar error:', e); showToast('Could not generate calendar file'); }
  };

  // Private helper
  function parseTimeStr(str) {
    if (!str) return null;
    str = str.trim().toUpperCase();
    const match = str.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2] || '0');
    const ampm = match[3];
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h: h, m: m };
  }

  // ============================================
  // EVENT BOOKINGS → MY BOOKINGS CONNECTION
  // ============================================
  // Shared state (read by schedule.js, payments.js)
  MTC.state.eventBookings = [];
  window.eventBookings = MTC.state.eventBookings; // Backward-compat alias

  // Load persisted event bookings on init
  (function loadEventBookings() {
    const saved = MTC.storage.get('mtc-event-bookings', []);
    MTC.state.eventBookings = saved;
    window.eventBookings = saved;
  })();

  function saveEventBookings() {
    MTC.storage.set('mtc-event-bookings', MTC.state.eventBookings);
  }

  // Cross-file function (called from avatar.js, events.js, booking.js)
  /** @param {string} eventId @param {string} eventType - Event type key @param {Object} [customInfo] - Optional override {title, date, time, location} */
  MTC.fn.addEventToMyBookings = function(eventId, eventType, customInfo) {
    if (MTC.state.eventBookings.find(function(e) { return e.eventId === eventId; })) return;

    let eventInfo = {};
    if (customInfo && customInfo.title) {
      eventInfo = customInfo;
    } else if (typeof clubEventsData !== 'undefined' && clubEventsData[eventId]) {
      const ev = clubEventsData[eventId];
      eventInfo = { title: ev.title, date: ev.date, time: ev.time, location: ev.location || 'MTC Courts' };
    } else {
      eventInfo = { title: 'Club Event', date: 'Upcoming', time: 'See details', location: 'MTC Courts' };
    }

    MTC.state.eventBookings.push({
      eventId: eventId,
      type: eventType || 'event',
      title: eventInfo.title,
      date: eventInfo.date,
      time: eventInfo.time,
      location: eventInfo.location
    });

    saveEventBookings();
    MTC.fn.renderEventBookings();
  };
  window.addEventToMyBookings = MTC.fn.addEventToMyBookings;

  // Cross-file function (called from avatar.js, events.js)
  /** @param {string} eventId - Event ID to remove from My Bookings */
  MTC.fn.removeEventFromMyBookings = function(eventId) {
    MTC.state.eventBookings = MTC.state.eventBookings.filter(function(e) { return e.eventId !== eventId; });
    window.eventBookings = MTC.state.eventBookings;
    saveEventBookings();
    MTC.fn.renderEventBookings();
  };
  window.removeEventFromMyBookings = MTC.fn.removeEventFromMyBookings;

  // Cross-file function (called from payments.js)
  /** Renders RSVP/event booking cards into the My Bookings screen */
  MTC.fn.renderEventBookings = function() {
    try {
    const container = document.getElementById('upcomingBookings');
    if (!container) return;

    const oldCards = container.querySelectorAll('.event-booking-card');
    oldCards.forEach(function(c) { c.remove(); });

    // If adding event cards, remove any empty state that payments.js may have rendered
    if (MTC.state.eventBookings.length > 0) {
      const emptyState = container.querySelector('.empty-state');
      if (emptyState) emptyState.remove();
    }

    MTC.state.eventBookings.forEach(function(ev, i) {
      const card = document.createElement('div');
      card.className = 'booking-card event-booking-card animate-in';
      card.style.animationDelay = (i * 0.1) + 's';
      card.innerHTML =
        '<div class="booking-card-header">' +
          '<div class="booking-card-date">' + sanitizeHTML(ev.title) + '</div>' +
          '<div class="booking-card-badges">' +
            '<span class="booking-card-status upcoming" style="background: var(--volt); color: #000;">RSVP\'d</span>' +
          '</div>' +
        '</div>' +
        '<div class="booking-card-details">' +
          '<div class="booking-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>' + sanitizeHTML(ev.time) + '</span></div>' +
          '<div class="booking-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>' + sanitizeHTML(ev.location) + '</span></div>' +
        '</div>' +
        '<div class="booking-card-footer">' +
          '<span class="booking-ref">' + sanitizeHTML(ev.date) + '</span>' +
          '<div class="booking-card-actions">' +
            '<button class="booking-action-btn cancel" onclick="cancelEventRsvp(\'' + sanitizeHTML(ev.eventId) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>Cancel RSVP</button>' +
          '</div>' +
        '</div>';
      container.insertBefore(card, container.firstChild);
    });

    // If container has no booking cards at all, show empty state
    if (!container.querySelector('.booking-card')) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>' +
              '<line x1="16" y1="2" x2="16" y2="6"></line>' +
              '<line x1="8" y1="2" x2="8" y2="6"></line>' +
              '<line x1="3" y1="10" x2="21" y2="10"></line>' +
            '</svg>' +
          '</div>' +
          '<div class="empty-state-title">NO BOOKINGS YET</div>' +
          '<div class="empty-state-text">Book a court or RSVP to an event to see it here</div>' +
          '<button class="empty-state-btn" onclick="navigateTo(\'book\')">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<line x1="12" y1="5" x2="12" y2="19"></line>' +
              '<line x1="5" y1="12" x2="19" y2="12"></line>' +
            '</svg>Book a Court' +
          '</button>' +
        '</div>';
    }
    } catch(e) { console.warn('renderEventBookings error:', e); MTC.fn.renderError(container, 'Could not load event bookings. Please try again.'); }
  };
  window.renderEventBookings = MTC.fn.renderEventBookings;

  // onclick handler (generated HTML)
  window.cancelEventRsvp = function(eventId) {
    showConfirmModal({
      icon: 'warning',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      title: 'CANCEL RSVP?',
      message: 'You can re-register anytime before the event starts.',
      confirmText: 'CANCEL RSVP',
      cancelText: 'KEEP',
      confirmClass: 'danger',
      onConfirm: function() {
        MTC.fn.removeEventFromMyBookings(eventId);
        if (typeof userRsvps !== 'undefined') {
          const rIdx = userRsvps.indexOf(eventId);
          if (rIdx !== -1) userRsvps.splice(rIdx, 1);
          if (typeof saveUserRsvps === 'function') saveUserRsvps();
        }
        if (typeof clubEventsData !== 'undefined' && clubEventsData[eventId]) {
          clubEventsData[eventId].spotsTaken--;
          const aIdx = clubEventsData[eventId].attendees.indexOf('You');
          if (aIdx !== -1) clubEventsData[eventId].attendees.splice(aIdx, 1);
        }
        showToast('RSVP cancelled');
      }
    });
  };
})();
