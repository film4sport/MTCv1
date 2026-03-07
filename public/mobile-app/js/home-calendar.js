/**
 * home-calendar.js — Compact month-grid calendar for the home screen.
 * Shows club events as colored dots. Tap a day to see that day's events.
 * Re-uses clubEventsData from events.js.
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

  /** Generate the home calendar grid */
  function renderHomeCalendar() {
    var grid = document.getElementById('homeCalendarGrid');
    var label = document.getElementById('homeCalendarMonth');
    var listContainer = document.getElementById('homeCalendarEvents');
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
      html += '<div class="hc-day other">' + (daysInPrev - i) + '</div>';
    }

    // Current month days
    for (var day = 1; day <= daysInMonth; day++) {
      var ds = toDateStr(year, month, day);
      var evts = eventsByDate[ds];
      var cls = 'hc-day';
      if (ds === todayStr) cls += ' today';
      if (evts && evts.length > 0) cls += ' has-event';
      if (evts && evts.length > 1) cls += ' multi';
      html += '<div class="' + cls + '" data-date="' + ds + '">' + day + '</div>';
    }

    // Next month filler
    var totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (var j = 1; j <= totalCells - firstDay - daysInMonth; j++) {
      html += '<div class="hc-day other">' + j + '</div>';
    }

    grid.innerHTML = html;

    // Clear event list when month changes
    if (listContainer) {
      listContainer.innerHTML = '<div class="hc-empty">Tap a date to see events</div>';
      var titleEl = document.getElementById('homeCalendarDateTitle');
      if (titleEl) titleEl.textContent = '';
    }
  }

  /** Show events for a tapped date */
  function showHomeCalendarDate(dateStr, el) {
    // Highlight selected
    document.querySelectorAll('#homeCalendarGrid .hc-day').forEach(function(d) {
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
    var dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    var monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    if (titleEl) titleEl.textContent = dayName + ', ' + monthDay;

    if (evts.length === 0) {
      container.innerHTML = '<div class="hc-empty">No events on this date</div>';
      return;
    }

    var html = '';
    evts.forEach(function(ev) {
      var timeStr = ev.time ? ev.time.split(' - ')[0] : '';
      var going = ev.spotsTaken || 0;
      var badgeCls = ev.badge === 'paid' ? 'gold' : 'green';
      html += '<div class="hc-event" onclick="if(typeof showEventModal===\'function\')showEventModal(\'' + ev.id + '\')">' +
        '<div class="hc-event-dot ' + badgeCls + '"></div>' +
        '<div class="hc-event-body">' +
          '<div class="hc-event-title">' + (typeof sanitizeHTML === 'function' ? sanitizeHTML(ev.title) : ev.title) + '</div>' +
          '<div class="hc-event-meta">' + (typeof sanitizeHTML === 'function' ? sanitizeHTML(timeStr) : timeStr) + ' · ' + (typeof sanitizeHTML === 'function' ? sanitizeHTML(ev.location || '') : (ev.location || '')) + '</div>' +
        '</div>' +
        '<div class="hc-event-going">' + going + ' going</div>' +
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
    var day = e.target.closest('.hc-day:not(.other)');
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
