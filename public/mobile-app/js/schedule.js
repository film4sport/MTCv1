/**
 * schedule.js - MTC Court
 * IIFE Module: Calendar, schedule bookings, pill toggle
 */
(function() {
  'use strict';

  // ============================================
  // PRIVATE: Calendar State
  // ============================================
  const currentCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // ============================================
  // PRIVATE: Build calendar events from user's actual data
  // ============================================
  function getCalendarEvents() {
    const events = {};
    try {

    // Helper to add an event to a date
    function addEvent(dateStr, ev) {
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push(ev);
    }

    // 1. Add RSVP'd club events from clubEventsData + userRsvps
    if (typeof clubEventsData !== 'undefined' && typeof userRsvps !== 'undefined') {
      userRsvps.forEach(function(eventId) {
        const ev = clubEventsData[eventId];
        if (!ev) return;
        addEvent(ev.date, {
          title: ev.title,
          time: ev.time.split(' - ')[0],
          court: ev.location || 'MTC Courts',
          type: 'event',
          rsvp: ev.attendees.indexOf('You') === -1 ? ['You'].concat(ev.attendees.slice(0, 5)) : ev.attendees.slice(0, 6)
        });
      });
    }

    // 2. Add partner matches and other event bookings from eventBookings
    if (typeof eventBookings !== 'undefined') {
      eventBookings.forEach(function(ev) {
        // Skip events already added via userRsvps (any type)
        if (typeof userRsvps !== 'undefined' && userRsvps.indexOf(ev.eventId) !== -1) return;
        // Skip events already added via clubEventsData lookup
        if (typeof clubEventsData !== 'undefined' && clubEventsData[ev.eventId]) return;
        // Need a real date for the calendar
        const dateStr = ev.date;
        // If date looks like a real date (YYYY-MM-DD), add it
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          addEvent(dateStr, {
            title: ev.title,
            time: (ev.time || 'TBD').split(' - ')[0],
            court: ev.location || 'MTC Courts',
            type: ev.type === 'partner' ? 'social' : 'event',
            rsvp: ['You']
          });
        }
      });
    }

    } catch(e) { MTC.warn('getCalendarEvents error:', e); }
    return events;
  }

  // Backwards compatibility - calendarEvents used by generateCalendar
  let calendarEvents = getCalendarEvents();

  // ============================================
  // WINDOW: Generate Calendar (called from events.js via typeof check)
  // ============================================
  window.generateCalendar = function() {
    // Refresh calendar events from live data
    calendarEvents = getCalendarEvents();

    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('scheduleCalendarMonth');

    if (!grid || !monthLabel) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = MTC.config.monthNamesFull;
    monthLabel.textContent = monthNames[month] + ' ' + year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    let html = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      html += '<div class="calendar-day other-month">' + (daysInPrevMonth - i) + '</div>';
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const isToday = dateStr === todayStr;
      const dayEvents = calendarEvents[dateStr];
      const hasEvent = dayEvents && dayEvents.length > 0;

      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (hasEvent) classes += ' has-event';

      html += '<div class="' + classes + '" onclick="showDayEvents(\'' + dateStr + '\')">' + day + '</div>';
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const nextMonthDays = totalCells - (firstDay + daysInMonth);
    for (let j = 1; j <= nextMonthDays; j++) {
      html += '<div class="calendar-day other-month">' + j + '</div>';
    }

    grid.innerHTML = html;

    // Update events list for selected/today
    updateCalendarEventsList(todayStr);
  };

  // ============================================
  // WINDOW: Change Schedule Month (onclick from index.html)
  // ============================================
  window.changeScheduleMonth = function(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    generateCalendar();
  };

  // ============================================
  // WINDOW: Show Day Events (onclick from generated HTML calendar)
  // ============================================
  window.showDayEvents = function(dateStr) {
    // Highlight selected day
    document.querySelectorAll('.calendar-day').forEach(function(d) { d.classList.remove('selected'); });
    if (typeof event !== 'undefined' && event && event.target) {
      const clicked = event.target.closest('.calendar-day');
      if (clicked) clicked.classList.add('selected');
    }

    // Update events list
    updateCalendarEventsList(dateStr);

    // If there are events, show modal
    const events = calendarEvents[dateStr];
    if (events && events.length > 0) {
      showEventDetailsModal(dateStr, events);
    }
  };

  // ============================================
  // PRIVATE: Update Calendar Events List
  // ============================================
  function updateCalendarEventsList(dateStr) {
    const eventsContainer = document.querySelector('.calendar-events');
    if (!eventsContainer) return;

    const events = calendarEvents[dateStr] || [];
    const titleEl = document.getElementById('selectedDateTitle');

    // Format date for title
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const dateObj = new Date(dateStr + 'T12:00:00');
    dateObj.setHours(0,0,0,0);

    let dateTitle = 'SELECTED DAY';
    if (dateObj.getTime() === today.getTime()) {
      dateTitle = "TODAY'S EVENTS";
    } else if (dateObj.getFullYear() === today.getFullYear() && dateObj.getMonth() === today.getMonth() && dateObj.getDate() === today.getDate() + 1) {
      dateTitle = "TOMORROW'S EVENTS";
    } else {
      dateTitle = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
    }

    if (titleEl) titleEl.textContent = dateTitle;

    // Generate events HTML
    const eventItems = eventsContainer.querySelectorAll('.calendar-event-item');
    eventItems.forEach(function(item) { item.remove(); });

    if (events.length === 0) {
      eventsContainer.insertAdjacentHTML('beforeend',
        '<div class="calendar-event-item" style="justify-content: center; color: var(--text-muted);">' +
          'No events scheduled' +
        '</div>'
      );
    } else {
      events.forEach(function(ev) {
        const dotColor = ev.type === 'match' ? '' : ev.type === 'lesson' ? 'blue' : ev.type === 'tournament' ? 'gold' : 'green';
        eventsContainer.insertAdjacentHTML('beforeend',
          '<div class="calendar-event-item" onclick="showEventDetailsModal(\'' + dateStr + '\', calendarEvents[\'' + dateStr + '\'])">' +
            '<div class="calendar-event-time">' + ev.time + '</div>' +
            '<div class="calendar-event-info">' +
              '<div class="calendar-event-title">' + ev.title + '</div>' +
              '<div class="calendar-event-location">' + ev.court + ' \u2022 ' + ev.rsvp.length + ' attending</div>' +
            '</div>' +
            '<div class="calendar-event-dot ' + dotColor + '"></div>' +
          '</div>'
        );
      });
    }
  }

  // ============================================
  // PRIVATE: Show Event Details Modal
  // ============================================
  function showEventDetailsModal(dateStr, events) {
    const date = new Date(dateStr + 'T12:00:00');
    const dateTitle = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const eventsHtml = events.map(function(ev) {
      // Check if this is an inter-club match
      const isInterclub = ev.title.toLowerCase().includes('inter-club') || ev.type === 'match';
      const isSocial = ev.type === 'social';
      const isLesson = ev.type === 'lesson';
      const isOpeningDay = ev.title.toLowerCase().includes('opening day');

      // Determine what button to show
      let actionButton = '';
      if (isOpeningDay) {
        // Opening Day - no registration button
        actionButton = '';
      } else if (isSocial || isInterclub) {
        // Social events and Interclub - RSVP button
        actionButton =
          '<button onclick="event.stopPropagation(); handleEventRSVP(\'' + sanitizeHTML(ev.title) + '\')" style="margin-top: 12px; width: 100%; background: var(--volt); color: #000; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;">' +
            '\uD83C\uDFBE RSVP' +
          '</button>';
      } else if (isLesson) {
        // Lessons/camps - Register button
        actionButton =
          '<button onclick="event.stopPropagation(); handleEventRegister(\'' + sanitizeHTML(ev.title) + '\')" style="margin-top: 12px; width: 100%; background: var(--electric-blue); color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;">' +
            '\uD83D\uDCDD REGISTER' +
          '</button>';
      }

      const clickHandler = isInterclub ? 'onclick="closeEventDetailsModal(); setTimeout(function() { showInterclubRsvpModal(\'interclub-league\'); }, 300);" style="cursor: pointer;"' : '';
      const interclubBadge = isInterclub ? '<div style="font-size: 10px; color: var(--electric-blue); font-weight: 600; margin-top: 4px;">TAP FOR DETAILS & RSVP \u2192</div>' : '';

      // Type label - use INTERCLUB for interclub matches
      const typeLabel = isInterclub ? 'INTERCLUB' : ev.type.toUpperCase();

      return '<div ' + clickHandler + ' style="background: var(--bg-card); border-radius: 12px; padding: 16px; margin-bottom: 12px; ' + (isInterclub ? 'border: 2px solid var(--electric-blue);' : '') + '">' +
        '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
          '<div>' +
            '<div style="font-weight: 700; font-size: 16px; color: var(--text-primary);">' + sanitizeHTML(ev.title) + '</div>' +
            '<div style="font-size: 13px; color: var(--text-muted);">' + sanitizeHTML(ev.time) + '</div>' +
            interclubBadge +
          '</div>' +
          '<div style="background: ' + (isInterclub ? 'var(--coral)' : isSocial ? 'var(--electric-blue)' : 'var(--volt)') + '; color: ' + (isInterclub || isSocial ? '#fff' : '#000') + '; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">' +
            typeLabel +
          '</div>' +
        '</div>' +
        '<div style="border-top: 1px solid var(--border-color); padding-top: 12px;">' +
          '<div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">' +
            'WHO\'S COMING (' + ev.rsvp.length + ')' +
          '</div>' +
          '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' +
            ev.rsvp.map(function(name) {
              return '<div style="display: flex; align-items: center; gap: 6px; background: var(--bg-secondary); padding: 4px 10px 4px 4px; border-radius: 20px;">' +
                '<span style="width: 24px; height: 24px;">' + getAvatar(name) + '</span>' +
                '<span style="font-size: 13px; color: var(--text-primary);">' + sanitizeHTML(name) + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
          actionButton +
        '</div>' +
      '</div>';
    }).join('');

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'eventDetailsModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Event details');
    modal.onclick = function(e) { if (e.target === this) closeEventDetailsModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 80vh; overflow-y: auto;">' +
        '<div class="modal-title">' + dateTitle + '</div>' +
        '<div style="margin-top: 16px;">' +
          eventsHtml +
        '</div>' +
        '<button onclick="closeEventDetailsModal()" style="width: 100%; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 14px; padding: 14px; border-radius: 12px; cursor: pointer; margin-top: 8px;">' +
          'Close' +
        '</button>' +
      '</div>';

    document.getElementById('app').appendChild(modal);
    setTimeout(function() { modal.classList.add('active'); }, 10);
  }

  // ============================================
  // WINDOW: Handle Event RSVP (onclick from generated HTML)
  // ============================================
  window.handleEventRSVP = function(eventTitle) {
    closeEventDetailsModal();
    // Add to event bookings for persistence
    const eventId = 'schedule-' + eventTitle.replace(/\s/g, '-').toLowerCase();
    if (typeof addEventToMyBookings === 'function') {
      addEventToMyBookings(eventId, 'event', { title: eventTitle, date: 'Upcoming', time: 'See schedule', location: 'MTC Courts' });
    }
    showToast('\uD83C\uDFBE You\'re going to ' + eventTitle + '!');
    generateCalendar();
  };

  // ============================================
  // WINDOW: Handle Event Register (onclick from generated HTML)
  // ============================================
  window.handleEventRegister = function(eventTitle) {
    closeEventDetailsModal();
    const eventId = 'schedule-' + eventTitle.replace(/\s/g, '-').toLowerCase();
    if (typeof addEventToMyBookings === 'function') {
      addEventToMyBookings(eventId, 'program', { title: eventTitle, date: 'Upcoming', time: 'See schedule', location: 'MTC Courts' });
    }
    showToast('\uD83D\uDCDD Registered for ' + eventTitle + '!');
    generateCalendar();
  };

  // ============================================
  // WINDOW: Close Event Details Modal (onclick from generated HTML)
  // ============================================
  window.closeEventDetailsModal = function() {
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  // ============================================
  // MTC.fn + WINDOW: Switch Schedule Pill (called from navigation.js cross-file)
  // ============================================
  /** @param {string} pill - 'my' for My Schedule, 'events' for Club Events */
  MTC.fn.switchSchedulePill = function(pill) {
    const myPill = document.getElementById('scheduleMyPill');
    const eventsPill = document.getElementById('scheduleEventsPill');
    const myView = document.getElementById('scheduleMyView');
    const eventsView = document.getElementById('scheduleEventsView');
    const titleEl = document.querySelector('#screen-schedule .screen-title');

    if (pill === 'my') {
      if (myPill) myPill.classList.add('active');
      if (eventsPill) eventsPill.classList.remove('active');
      if (myView) myView.style.display = '';
      if (eventsView) eventsView.style.display = 'none';
      if (titleEl) titleEl.textContent = 'MY SCHEDULE';
    } else {
      if (myPill) myPill.classList.remove('active');
      if (eventsPill) eventsPill.classList.add('active');
      if (myView) myView.style.display = 'none';
      if (eventsView) eventsView.style.display = '';
      if (titleEl) titleEl.textContent = 'CLUB EVENTS';
      if (typeof syncEventCardDates === 'function') syncEventCardDates();
    }
  };
  window.switchSchedulePill = MTC.fn.switchSchedulePill;

  // ============================================
  // MTC.fn + WINDOW: Render Schedule Bookings (called from navigation.js, mybookings.js cross-file)
  // ============================================
  /** Renders upcoming/past booking items in the My Schedule screen */
  MTC.fn.renderScheduleBookings = function() {
    try {
    const container = document.getElementById('scheduleEventBookings');
    if (!container) return;
    container.innerHTML = '';

    if (typeof eventBookings === 'undefined' || eventBookings.length === 0) return;

    // Filter out club events - schedule shows personal items only (bookings, partner matches, programs)
    const sorted = eventBookings.slice().filter(function(ev) {
      return ev.type !== 'event' && ev.type !== 'interclub';
    }).sort(function(a, b) {
      return (a.date || '').localeCompare(b.date || '');
    });

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><div class="empty-state-title">NO UPCOMING BOOKINGS</div><div class="empty-state-text">Book a court to see it in your schedule</div><button class="empty-state-btn" onclick="navigateTo(\'book\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Book a Court</button></div>';
      return;
    }

    // Section header
    container.insertAdjacentHTML('beforeend',
      '<div class="section-header"><div class="section-title">MY BOOKINGS</div></div>');

    sorted.forEach(function(ev) {
      const timeStr = (ev.time || 'TBD');
      const timeParts = timeStr.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
      let hour = timeParts ? timeParts[1] : '';
      const minutes = timeParts && timeParts[2] ? ':' + timeParts[2] : '';
      let period = timeParts && timeParts[3] ? timeParts[3].toUpperCase() : '';
      if (!period && timeParts) {
        const h = parseInt(timeParts[1], 10);
        period = h >= 12 ? 'PM' : 'AM';
        if (h > 12) hour = String(h - 12);
        if (h === 0) hour = '12';
      }
      if (!timeParts) {
        hour = '--';
        period = '';
      }

      const typeLabel = ev.type === 'partner' ? 'Partner Match' :
                    ev.type === 'event' ? 'Club Event' :
                    ev.type === 'program' ? 'Program' : 'Booking';

      let dateLabel = '';
      if (ev.date && /^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
        const d = new Date(ev.date + 'T12:00:00');
        dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        dateLabel = ev.date || '';
      }

      const typeBadgeColor = ev.type === 'partner' ? 'var(--electric-blue)' :
                         ev.type === 'event' ? 'var(--volt)' : 'var(--coral)';

      const itemHtml = '<div class="schedule-item stagger-item" data-event-booking-id="' + sanitizeHTML(ev.eventId || '') + '">' +
        '<div class="schedule-time-block">' +
          '<div class="schedule-time">' + hour + minutes + '</div>' +
          '<div class="schedule-period">' + period + '</div>' +
        '</div>' +
        '<div class="schedule-details">' +
          '<div class="schedule-title">' + sanitizeHTML(ev.title) + '</div>' +
          '<div class="schedule-subtitle">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + typeBadgeColor + ';margin-right:6px;vertical-align:middle;"></span>' +
            typeLabel + ' &bull; ' + dateLabel +
          '</div>' +
          '<div class="schedule-meta">' +
            '<div class="schedule-meta-item">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' +
              sanitizeHTML(ev.location || 'MTC Courts') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
      container.insertAdjacentHTML('beforeend', itemHtml);
    });
    } catch(e) { MTC.warn('renderScheduleBookings error:', e); MTC.fn.renderError(container, 'Could not load your schedule. Please try again.'); }
  };
  window.renderScheduleBookings = MTC.fn.renderScheduleBookings;

})();
