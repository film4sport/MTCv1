/* avatar.js - MTC Court */
// ============================================
// HOME SCREEN EVENT DATES, RSVP, AVATAR PICKER
// ============================================
(function() {
  'use strict';

  // ============================================
  // HOME SCREEN EVENT DATES (dynamic so they don't collide with demo bookings)
  // ============================================
  const homeEventDates = {
    bbq: new Date(2026, 4, 9),           // May 9 — Opening Day BBQ
    mensrr: new Date(2026, 4, 12),       // May 12 — Men's Round Robin (Tuesday)
    frimixed: new Date(2026, 4, 15)      // May 15 — Friday Night Mixed
  };

  // Cross-file function (called from interactive.js)
  /** Populates home screen event date boxes from clubEventsData */
  MTC.fn.populateHomeEventDates = function() {
    const months = MTC.config.monthNamesShort;
    for (const key in homeEventDates) {
      const d = homeEventDates[key];
      const monthEls = document.querySelectorAll('[data-home-event-month="' + key + '"]');
      const dayEls = document.querySelectorAll('[data-home-event-day="' + key + '"]');
      monthEls.forEach(function(el) { el.textContent = months[d.getMonth()]; });
      dayEls.forEach(function(el) { el.textContent = d.getDate(); });
    }
  };
  // Backward-compat alias (typeof checks in interactive.js)
  window.populateHomeEventDates = MTC.fn.populateHomeEventDates;

  // ============================================
  // EVENTS
  // ============================================
  // Map home screen short IDs to real clubEventsData IDs
  // Shared state (read by events.js, confirm-modal.js)
  MTC.state.homeToClubEventMap = {
    'euchre': 'euchre-tournament',
    'bbq': 'opening-day-bbq',
    'mensrr': 'mens-round-robin',
    'frimixed': 'friday-mixed'
  };
  // Backward-compat alias
  window.homeToClubEventMap = MTC.state.homeToClubEventMap;

  // Cross-file function (called from events.js)
  /** @param {string} eventId - Event to RSVP to @param {HTMLElement} button - The RSVP button element */
  MTC.fn.rsvpToEvent = function(eventId, button) {
    // Resolve to real club event ID
    const realId = MTC.state.homeToClubEventMap[eventId] || eventId;

    // Toggle RSVP status
    if (button.classList.contains('confirmed')) {
      button.classList.remove('confirmed');
      button.textContent = 'RSVP';
      showToast('RSVP cancelled');
      if (typeof removeEventFromMyBookings === 'function') {
        removeEventFromMyBookings(realId);
      }
      // Sync userRsvps (mutate in-place so events.js local ref stays valid)
      if (typeof userRsvps !== 'undefined') {
        const idx = userRsvps.indexOf(realId);
        if (idx !== -1) userRsvps.splice(idx, 1);
        if (typeof saveUserRsvps === 'function') saveUserRsvps();
      }
      // Also update Club Events attendee data
      if (typeof clubEventsData !== 'undefined' && clubEventsData[realId]) {
        clubEventsData[realId].attendees = clubEventsData[realId].attendees.filter(function(n) { return n !== 'You'; });
        clubEventsData[realId].spotsTaken = Math.max(0, clubEventsData[realId].spotsTaken - 1);
      }
    } else {
      button.classList.add('confirmed');
      button.textContent = 'Going';
      button.style.animation = 'successPop 0.3s ease';
      setTimeout(function() { button.style.animation = ''; }, 300);

      // Get event info from clubEventsData if available, else use fallback
      let info;
      if (typeof clubEventsData !== 'undefined' && clubEventsData[realId]) {
        const ev = clubEventsData[realId];
        info = { name: ev.title, date: ev.date, time: ev.time.split(' - ')[0], location: ev.location };
      } else {
        const fallback = {
          'bbq':      { name: 'Opening Day BBQ',   date: homeEventDates.bbq.toISOString().split('T')[0],      time: '12:30 PM' },
          'mensrr':   { name: "Men's Round Robin",  date: homeEventDates.mensrr.toISOString().split('T')[0],   time: '9:00 AM' },
          'frimixed': { name: 'Friday Night Mixed',  date: homeEventDates.frimixed.toISOString().split('T')[0], time: '6:00 PM' }
        };
        info = fallback[eventId] || { name: 'the event', date: 'Upcoming', time: 'See details' };
      }
      showToast('You\'re signed up for ' + info.name + '!');

      // Add to My Bookings with real date so it shows on calendar
      if (typeof addEventToMyBookings === 'function') {
        addEventToMyBookings(realId, 'event', {
          title: info.name,
          date: info.date,
          time: info.time,
          location: info.location || 'MTC Courts'
        });
      }

      // Sync userRsvps using real ID (no more 'home-' prefix)
      if (typeof userRsvps !== 'undefined' && userRsvps.indexOf(realId) === -1) {
        userRsvps.push(realId);
        if (typeof saveUserRsvps === 'function') saveUserRsvps();
      }

      // Update Club Events attendee data
      if (typeof clubEventsData !== 'undefined' && clubEventsData[realId]) {
        if (clubEventsData[realId].attendees.indexOf('You') === -1) {
          clubEventsData[realId].attendees.unshift('You');
          clubEventsData[realId].spotsTaken++;
        }
      }

      // Trigger push notification
      triggerRSVPNotification(info.name);
    }

    // Refresh home calendar dots and schedule calendar to reflect RSVP change
    if (typeof MTC.fn.renderHomeCalendar === 'function') MTC.fn.renderHomeCalendar();
    if (typeof generateCalendar === 'function') generateCalendar();
  };
  // Backward-compat alias (onclick in index.html uses rsvpToEvent)
  window.rsvpToEvent = MTC.fn.rsvpToEvent;

  // Sync home screen RSVP buttons with userRsvps state
  MTC.fn.syncHomeRsvpButtons = function() {
    var map = MTC.state.homeToClubEventMap || {};
    var ids = Object.keys(map);
    for (var i = 0; i < ids.length; i++) {
      var shortId = ids[i];
      var realId = map[shortId];
      var el = document.getElementById('homeEvent-' + shortId);
      if (!el) continue;
      var btn = el.querySelector('.event-rsvp-btn');
      if (!btn) continue;
      var isRsvpd = typeof userRsvps !== 'undefined' && userRsvps.indexOf(realId) !== -1;
      if (isRsvpd) {
        btn.classList.add('confirmed');
        btn.textContent = 'Going';
      } else {
        btn.classList.remove('confirmed');
        btn.textContent = 'RSVP';
      }
    }
  };
  window.syncHomeRsvpButtons = MTC.fn.syncHomeRsvpButtons;

  // Private (dead code â€” never called externally)
  function showEventDetails(eventId) {
    navigateTo('events');
    showToast('Event details loaded');
  }

  // ============================================
  // AVATAR PICKER
  // ============================================
  // Shared state (read by messaging.js, partners.js, events.js, confirm-modal.js)
  MTC.state.avatarSVGs = {
    'tennis-male-1': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFE0BD"/><path d="M30 38 Q35 20 55 22 Q75 24 72 42 L68 38 Q60 30 45 32 Q35 34 30 38 Z" fill="#6B4423"/><rect x="28" y="36" width="44" height="6" rx="2" fill="#2563EB"/><ellipse cx="50" cy="52" rx="22" ry="20" fill="#FFE0BD"/><circle cx="42" cy="50" r="3" fill="#333"/><circle cx="58" cy="50" r="3" fill="#333"/><path d="M42 60 Q50 68 58 60" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M30 78 Q50 72 70 78 L72 100 L28 100 Z" fill="#3BAFDA"/><ellipse cx="82" cy="35" rx="12" ry="15" fill="#fff" stroke="#333" stroke-width="2.5"/><line x1="74" y1="26" x2="90" y2="26" stroke="#333" stroke-width="1"/><line x1="73" y1="31" x2="91" y2="31" stroke="#333" stroke-width="1"/><line x1="73" y1="36" x2="91" y2="36" stroke="#333" stroke-width="1"/><line x1="73" y1="41" x2="91" y2="41" stroke="#333" stroke-width="1"/><line x1="74" y1="46" x2="90" y2="46" stroke="#333" stroke-width="1"/><line x1="76" y1="22" x2="76" y2="48" stroke="#333" stroke-width="1"/><line x1="80" y1="21" x2="80" y2="49" stroke="#333" stroke-width="1"/><line x1="84" y1="21" x2="84" y2="49" stroke="#333" stroke-width="1"/><line x1="88" y1="22" x2="88" y2="48" stroke="#333" stroke-width="1"/><line x1="82" y1="50" x2="82" y2="65" stroke="#333" stroke-width="4"/></svg>',
    'tennis-male-2': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#8D5524"/><path d="M30 38 Q35 20 55 22 Q75 24 72 42 L68 38 Q60 30 45 32 Q35 34 30 38 Z" fill="#1a1a1a"/><rect x="28" y="36" width="44" height="6" rx="2" fill="#c8ff00"/><ellipse cx="50" cy="52" rx="22" ry="20" fill="#8D5524"/><circle cx="42" cy="50" r="3" fill="#222"/><circle cx="58" cy="50" r="3" fill="#222"/><path d="M42 60 Q50 68 58 60" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M30 78 Q50 72 70 78 L72 100 L28 100 Z" fill="#3BAFDA"/><ellipse cx="82" cy="35" rx="12" ry="15" fill="#fff" stroke="#333" stroke-width="2.5"/><line x1="74" y1="26" x2="90" y2="26" stroke="#333" stroke-width="1"/><line x1="73" y1="31" x2="91" y2="31" stroke="#333" stroke-width="1"/><line x1="73" y1="36" x2="91" y2="36" stroke="#333" stroke-width="1"/><line x1="73" y1="41" x2="91" y2="41" stroke="#333" stroke-width="1"/><line x1="74" y1="46" x2="90" y2="46" stroke="#333" stroke-width="1"/><line x1="76" y1="22" x2="76" y2="48" stroke="#333" stroke-width="1"/><line x1="80" y1="21" x2="80" y2="49" stroke="#333" stroke-width="1"/><line x1="84" y1="21" x2="84" y2="49" stroke="#333" stroke-width="1"/><line x1="88" y1="22" x2="88" y2="48" stroke="#333" stroke-width="1"/><line x1="82" y1="50" x2="82" y2="65" stroke="#333" stroke-width="4"/></svg>',
    'tennis-female-1': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFE0BD"/><path d="M68 30 Q85 35 80 55 Q78 65 72 60 Q75 45 68 38 Z" fill="#8B4513"/><path d="M28 40 Q30 25 50 24 Q70 25 72 40 L68 42 Q60 32 40 34 Q32 36 28 40 Z" fill="#8B4513"/><rect x="26" y="36" width="48" height="7" rx="2" fill="#3BAFDA"/><rect x="26" y="38" width="48" height="2" fill="#fff"/><ellipse cx="50" cy="52" rx="21" ry="19" fill="#FFE0BD"/><circle cx="42" cy="50" r="2.5" fill="#333"/><circle cx="58" cy="50" r="2.5" fill="#333"/><path d="M43 59 Q50 66 57 59" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M32 78 Q50 72 68 78 L70 100 L30 100 Z" fill="#3BAFDA"/><ellipse cx="82" cy="38" rx="11" ry="14" fill="#fff" stroke="#333" stroke-width="2.5"/><line x1="74" y1="29" x2="90" y2="29" stroke="#333" stroke-width="1"/><line x1="73" y1="34" x2="91" y2="34" stroke="#333" stroke-width="1"/><line x1="73" y1="39" x2="91" y2="39" stroke="#333" stroke-width="1"/><line x1="73" y1="44" x2="91" y2="44" stroke="#333" stroke-width="1"/><line x1="74" y1="49" x2="90" y2="49" stroke="#333" stroke-width="1"/><line x1="76" y1="25" x2="76" y2="51" stroke="#333" stroke-width="1"/><line x1="80" y1="24" x2="80" y2="52" stroke="#333" stroke-width="1"/><line x1="84" y1="24" x2="84" y2="52" stroke="#333" stroke-width="1"/><line x1="88" y1="25" x2="88" y2="51" stroke="#333" stroke-width="1"/><line x1="82" y1="52" x2="82" y2="68" stroke="#333" stroke-width="4"/></svg>',
    'tennis-female-2': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#8D5524"/><path d="M68 30 Q85 35 80 55 Q78 65 72 60 Q75 45 68 38 Z" fill="#1a1a1a"/><path d="M28 40 Q30 25 50 24 Q70 25 72 40 L68 42 Q60 32 40 34 Q32 36 28 40 Z" fill="#1a1a1a"/><rect x="26" y="36" width="48" height="7" rx="2" fill="#c8ff00"/><rect x="26" y="38" width="48" height="2" fill="#fff"/><ellipse cx="50" cy="52" rx="21" ry="19" fill="#8D5524"/><circle cx="42" cy="50" r="2.5" fill="#222"/><circle cx="58" cy="50" r="2.5" fill="#222"/><path d="M43 59 Q50 66 57 59" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M32 78 Q50 72 68 78 L70 100 L30 100 Z" fill="#3BAFDA"/><ellipse cx="82" cy="38" rx="11" ry="14" fill="#fff" stroke="#333" stroke-width="2.5"/><line x1="74" y1="29" x2="90" y2="29" stroke="#333" stroke-width="1"/><line x1="73" y1="34" x2="91" y2="34" stroke="#333" stroke-width="1"/><line x1="73" y1="39" x2="91" y2="39" stroke="#333" stroke-width="1"/><line x1="73" y1="44" x2="91" y2="44" stroke="#333" stroke-width="1"/><line x1="74" y1="49" x2="90" y2="49" stroke="#333" stroke-width="1"/><line x1="76" y1="25" x2="76" y2="51" stroke="#333" stroke-width="1"/><line x1="80" y1="24" x2="80" y2="52" stroke="#333" stroke-width="1"/><line x1="84" y1="24" x2="84" y2="52" stroke="#333" stroke-width="1"/><line x1="88" y1="25" x2="88" y2="51" stroke="#333" stroke-width="1"/><line x1="82" y1="52" x2="82" y2="68" stroke="#333" stroke-width="4"/></svg>',
    'default': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFE0BD"/><path d="M30 38 Q35 20 55 22 Q75 24 72 42 L68 38 Q60 30 45 32 Q35 34 30 38 Z" fill="#6B4423"/><rect x="28" y="36" width="44" height="6" rx="2" fill="#2563EB"/><ellipse cx="50" cy="52" rx="22" ry="20" fill="#FFE0BD"/><circle cx="42" cy="50" r="3" fill="#333"/><circle cx="58" cy="50" r="3" fill="#333"/><path d="M42 60 Q50 68 58 60" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M30 78 Q50 72 70 78 L72 100 L28 100 Z" fill="#3BAFDA"/><ellipse cx="82" cy="35" rx="12" ry="15" fill="#fff" stroke="#333" stroke-width="2.5"/><line x1="74" y1="26" x2="90" y2="26" stroke="#333" stroke-width="1"/><line x1="73" y1="31" x2="91" y2="31" stroke="#333" stroke-width="1"/><line x1="73" y1="36" x2="91" y2="36" stroke="#333" stroke-width="1"/><line x1="73" y1="41" x2="91" y2="41" stroke="#333" stroke-width="1"/><line x1="74" y1="46" x2="90" y2="46" stroke="#333" stroke-width="1"/><line x1="76" y1="22" x2="76" y2="48" stroke="#333" stroke-width="1"/><line x1="80" y1="21" x2="80" y2="49" stroke="#333" stroke-width="1"/><line x1="84" y1="21" x2="84" y2="49" stroke="#333" stroke-width="1"/><line x1="88" y1="22" x2="88" y2="48" stroke="#333" stroke-width="1"/><line x1="82" y1="50" x2="82" y2="65" stroke="#333" stroke-width="4"/></svg>',
    // Simple profile avatars (circle head + shirt)
    'simple-1': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#f5e6d0"/><circle cx="50" cy="38" r="16" fill="#d4a030"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#4a90d9"/></svg>',
    'simple-2': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#e8d5c4"/><circle cx="50" cy="38" r="16" fill="#8B4513"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#2d8659"/></svg>',
    'simple-3': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#fce4ec"/><circle cx="50" cy="38" r="16" fill="#d4a574"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#e91e63"/></svg>',
    'simple-4': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#8D5524"/><circle cx="50" cy="38" r="16" fill="#1a1a1a"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#c8ff00"/></svg>',
    'simple-5': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#FFE0BD"/><circle cx="50" cy="38" r="16" fill="#c0392b"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#8e44ad"/></svg>',
    'simple-6': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#d4a574"/><circle cx="50" cy="38" r="16" fill="#2c3e50"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#e67e22"/></svg>',
    'simple-7': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#f0dcc8"/><circle cx="50" cy="38" r="16" fill="#5d4037"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#ff5a5f"/></svg>',
    'simple-8': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#c68642"/><circle cx="50" cy="38" r="16" fill="#1a1a1a"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#00d4ff"/></svg>'
  };
  // Backward-compat alias (used by messaging.js, partners.js, etc.)
  window.avatarSVGs = MTC.state.avatarSVGs;

  // onclick handler (index.html)
  window.showAvatarPicker = function() {
    document.getElementById('avatarPickerModal').classList.add('active');
    // Mark current avatar as selected
    const currentAvatar = MTC.storage.get('mtc-avatar', 'default');
    document.querySelectorAll('.avatar-option').forEach(function(opt) {
      opt.classList.remove('selected');
      if (opt.getAttribute('data-avatar') === currentAvatar) {
        opt.classList.add('selected');
      }
    });
  };

  // onclick handler (index.html)
  window.closeAvatarPicker = function() {
    document.getElementById('avatarPickerModal').classList.remove('active');
  };

  // onclick handler (index.html)
  window.selectAvatar = function(avatarId) {
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl && MTC.state.avatarSVGs[avatarId]) {
      avatarEl.innerHTML = MTC.state.avatarSVGs[avatarId];
    }
    MTC.storage.set('mtc-avatar', avatarId);

    // Sync to Supabase
    if (MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/members', {
        method: 'PATCH',
        body: JSON.stringify({ avatar: avatarId })
      }).catch(function() { MTC.warn('Avatar sync failed'); });
    }

    // Update selection state
    document.querySelectorAll('.avatar-option').forEach(function(opt) {
      opt.classList.remove('selected');
      if (opt.getAttribute('data-avatar') === avatarId) {
        opt.classList.add('selected');
      }
    });

    closeAvatarPicker();
    showToast('Avatar updated! Looking great!');
  };

  // Cross-file function (called from interactive.js)
  /** Loads saved avatar from localStorage and applies to all avatar containers */
  MTC.fn.loadSavedAvatar = function() {
    const saved = MTC.storage.get('mtc-avatar', null);
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
      if (saved && MTC.state.avatarSVGs[saved]) {
        avatarEl.innerHTML = MTC.state.avatarSVGs[saved];
      } else {
        avatarEl.innerHTML = MTC.state.avatarSVGs['default'];
      }
    }
  };
  // Backward-compat alias
  window.loadSavedAvatar = MTC.fn.loadSavedAvatar;
})();
