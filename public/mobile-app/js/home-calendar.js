/**
 * home-calendar.js — Month-grid calendar for the home screen.
 * Shows club events as colored dots. Tap a day to see that day's events.
 * Reuses the same CSS classes as the Events screen calendar for consistent
 * neumorphic styling (calendar-day, calendar-nav-btn, calendar-event-item, etc.)
 */
(function() {
  'use strict';

  var calDate = new Date();
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  /** Build a YYYY-MM-DD string */
  function toDateStr(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  /** Collect all events keyed by date string */
  function getEventsByDate() {
    var map = {};
    if (typeof clubEventsData === 'undefined') return map;
    var evts = Object.values(clubEventsData);
    evts.forEach(function(ev) {
      if (!ev.date) return;
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }

  /** Generate the home calendar grid — uses same classes as Events screen */
  function renderHomeCalendar() {
    var grid = document.getElementById('homeCalendarGrid');
    var label = document.getElementById('homeCalendarMonth');
    if (!grid || !label) return;

    var year = calDate.getFullYear();
    var month = calDate.getMonth();
    label.textContent = monthNames[month] + ' ' + year;

    var firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrev = new Date(year, month, 0).getDate();

    var today = new Date();
    var todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    var eventsByDate = getEventsByDate();

    var html = '';

    // Previous month filler days
    for (var i = firstDay - 1; i >= 0; i--) {
      html += '<div class="calendar-day other-month">' + (daysInPrev - i) + '</div>';
    }

    // Current month days
    for (var day = 1; day <= daysInMonth; day++) {
      var ds = toDateStr(year, month, day);
      var evts = eventsByDate[ds];
      var cls = 'calendar-day';
      if (ds === todayStr) cls += ' today';
      if (evts && evts.length > 0) cls += ' has-event';
      if (evts && evts.length > 1) cls += ' has-events-multi';
      html += '<div class="' + cls + '" data-date="' + ds + '">' + day + '</div>';
    }

    // Next month filler
    var totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (var j = 1; j <= totalCells - firstDay - daysInMonth; j++) {
      html += '<div class="calendar-day other-month">' + j + '</div>';
    }

    grid.innerHTML = html;

    // Reset event list
    var listContainer = document.getElementById('homeCalendarEvents');
    var titleEl = document.getElementById('homeCalendarDateTitle');
    if (listContainer) {
      listContainer.innerHTML = '<div class="calendar-event-item-empty" style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">Tap a date to see events</div>';
    }
    if (titleEl) titleEl.textContent = 'SELECT A DATE';
  }

  /** Show events for a tapped date — uses calendar-event-item markup */
  function showHomeCalendarDate(dateStr, el) {
    // Highlight selected
    document.querySelectorAll('#homeCalendarGrid .calendar-day').forEach(function(d) {
      d.classList.remove('selected');
    });
    if (el) el.classList.add('selected');

    var container = document.getElementById('homeCalendarEvents');
    var titleEl = document.getElementById('homeCalendarDateTitle');
    if (!container) return;

    var eventsByDate = getEventsByDate();
    var evts = eventsByDate[dateStr] || [];

    // Format date title
    var date = new Date(dateStr + 'T12:00:00');
    if (titleEl) {
      titleEl.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
    }

    if (evts.length === 0) {
      container.innerHTML = '<div class="calendar-event-item-empty" style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">No events on this date</div>';
      return;
    }

    var html = '';
    evts.forEach(function(ev) {
      var timeStr = ev.time ? ev.time.split(' - ')[0] : '';
      var going = ev.spotsTaken || 0;
      var dotCls = ev.badge === 'paid' ? 'gold' : ev.badge === 'free' ? 'blue' : '';
      var safeTitle = typeof sanitizeHTML === 'function' ? sanitizeHTML(ev.title) : ev.title;
      var safeLoc = typeof sanitizeHTML === 'function' ? sanitizeHTML(ev.location || '') : (ev.location || '');
      var safeTime = typeof sanitizeHTML === 'function' ? sanitizeHTML(timeStr) : timeStr;

      html += '<div class="calendar-event-item" onclick="if(typeof showEventModal===\'function\')showEventModal(\'' + ev.id + '\')">' +
        '  <div class="calendar-event-time">' + safeTime + '</div>' +
        '  <div class="calendar-event-info">' +
        '    <div class="calendar-event-title">' + safeTitle + '</div>' +
        '    <div class="calendar-event-location">' + safeLoc + ' \u2022 ' + going + ' going</div>' +
        '  </div>' +
        '  <div class="calendar-event-dot ' + dotCls + '"></div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function changeHomeMonth(delta) {
    calDate.setMonth(calDate.getMonth() + delta);
    renderHomeCalendar();
  }

  // Click delegation on the grid
  function handleGridClick(e) {
    var day = e.target.closest('.calendar-day:not(.other-month)');
    if (!day) return;
    var ds = day.getAttribute('data-date');
    if (ds) showHomeCalendarDate(ds, day);
  }

  // Initialize when DOM is ready
  function init() {
    var grid = document.getElementById('homeCalendarGrid');
    if (!grid) return;
    grid.addEventListener('click', handleGridClick);
    renderHomeCalendar();
  }

  // Run init after a short delay to let events.js populate clubEventsData
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }

  // Expose for nav refresh and month navigation
  MTC.fn.renderHomeCalendar = renderHomeCalendar;
  MTC.fn.changeHomeMonth = changeHomeMonth;
})();
