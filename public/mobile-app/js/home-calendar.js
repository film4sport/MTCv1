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

  /** Collect all events keyed by date string (deduped by title+date) */
  function getEventsByDate() {
    var map = {};
    if (typeof clubEventsData === 'undefined') return map;
    var evts = Object.values(clubEventsData);
    var seen = {};
    evts.forEach(function(ev) {
      if (!ev.date) return;
      // Deduplicate: API recurring expansions duplicate hardcoded base events
      var key = ev.title + '|' + ev.date;
      if (seen[key]) return;
      seen[key] = true;
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
      var count = evts ? evts.length : 0;
      if (ds === todayStr) cls += ' today';
      if (count > 0) cls += ' has-events';
      var dots = '';
      if (count > 0) {
        var dotColors = ['var(--coral)', 'var(--electric-blue)', 'var(--volt)', '#0a0a0a'];
        var dotCount = Math.min(count, 12);
        dots = '<div class="cal-dots">';
        for (var di = 0; di < dotCount; di++) {
          var c = dotColors[di % dotColors.length];
          dots += '<span class="cal-dot" style="background:' + c + '"></span>';
        }
        dots += '</div>';
      }
      html += '<div class="' + cls + '" data-date="' + ds + '">' + day + dots + '</div>';
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
      var timeStr = ev.time || '';
      var going = ev.spotsTaken || 0;
      var badgeCls = ev.badge === 'paid' ? 'paid' : ev.badge === 'free' ? 'free' : 'members';
      var safe = function(s) { return typeof sanitizeHTML === 'function' ? sanitizeHTML(s || '') : (s || ''); };
      var safeTitle = safe(ev.title);
      var safeLoc = safe(ev.location);
      var safeTime = safe(timeStr);
      var safeDesc = safe(ev.description);
      var safePrice = safe(ev.price || 'Free');

      // Check RSVP state
      var isRegistered = (typeof userRsvps !== 'undefined') && userRsvps.indexOf(ev.id) !== -1;

      // Attendee avatar preview (first 4 + overflow)
      var attendees = ev.attendees || [];
      var attendeeHtml = '';
      if (attendees.length > 0) {
        var shown = attendees.slice(0, 4);
        shown.forEach(function(name) {
          var initials = name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
          attendeeHtml += '<div class="hce-avatar" title="' + safe(name) + '">' + initials + '</div>';
        });
        if (attendees.length > 4) {
          attendeeHtml += '<div class="hce-avatar hce-avatar-more">+' + (attendees.length - 4) + '</div>';
        }
      }

      // Rich event card with RSVP inline + tap to open full modal
      html += '<div class="home-cal-event-card">' +
        '<div class="hce-top" onclick="if(typeof showEventModal===\'function\')showEventModal(\'' + ev.id + '\')">' +
          '<div class="hce-header">' +
            '<div class="hce-badge ' + badgeCls + '">' + safePrice + '</div>' +
          '</div>' +
          '<div class="hce-title">' + safeTitle + '</div>' +
          '<div class="hce-meta">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' +
            safeTime + ' &bull; ' + safeLoc +
          '</div>' +
          (safeDesc ? '<div class="hce-desc">' + safeDesc.slice(0, 100) + (safeDesc.length > 100 ? '...' : '') + '</div>' : '') +
        '</div>' +
        '<div class="hce-bottom">' +
          '<div class="hce-attendees">' +
            (attendeeHtml || '<span class="hce-no-attendees">Be the first!</span>') +
            '<span class="hce-going-count">' + going + ' going</span>' +
          '</div>' +
          '<div class="hce-actions">' +
            '<button class="hce-rsvp-btn ' + (isRegistered ? 'registered' : '') + '" onclick="event.stopPropagation();if(typeof toggleEventRsvp===\'function\'){toggleEventRsvp(\'' + ev.id + '\');setTimeout(function(){var sel=document.querySelector(\'#homeCalendarGrid .selected\');if(sel)showHomeCalendarDate(sel.getAttribute(\'data-date\'),sel);},300);}">' +
              (isRegistered ? '\u2713 Going' : 'RSVP') +
            '</button>' +
            '<button class="hce-details-btn" onclick="event.stopPropagation();if(typeof showEventModal===\'function\')showEventModal(\'' + ev.id + '\')">Details</button>' +
          '</div>' +
        '</div>' +
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

  /** Switch between Calendar and Weekly Schedule on homepage */
  function switchHomeCalView(view) {
    var calSection = document.getElementById('homeCalendarSection');
    var schedSection = document.getElementById('homeWeeklySchedule');
    var calBtn = document.getElementById('homeCalBtn');
    var schedBtn = document.getElementById('homeSchedBtn');
    var title = document.getElementById('homeCalSchedTitle');

    if (view === 'schedule') {
      if (calSection) calSection.style.display = 'none';
      if (schedSection) schedSection.style.display = '';
      if (calBtn) calBtn.classList.remove('active');
      if (schedBtn) schedBtn.classList.add('active');
      if (title) title.textContent = 'WEEKLY SCHEDULE';
    } else {
      if (calSection) calSection.style.display = '';
      if (schedSection) schedSection.style.display = 'none';
      if (calBtn) calBtn.classList.add('active');
      if (schedBtn) schedBtn.classList.remove('active');
      if (title) title.textContent = 'CLUB CALENDAR';
    }
  }
  window.switchHomeCalView = switchHomeCalView;

  // Expose for nav refresh, month navigation, and RSVP refresh
  MTC.fn.renderHomeCalendar = renderHomeCalendar;
  MTC.fn.changeHomeMonth = changeHomeMonth;
  window.showHomeCalendarDate = showHomeCalendarDate;
})();
