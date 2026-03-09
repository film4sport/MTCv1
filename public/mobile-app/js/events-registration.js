/**
 * events-registration.js - MTC Court
 * IIFE Module: Event tasks, interclub RSVP, admin event actions, search
 */
(function() {
  'use strict';

  // ============================================
  // PRIVATE: Event Task Data (only used within this file)
  // ============================================
  const eventTasksData = {
    'interclub-league': {
      name: 'Interclub Competitive League',
      date: 'Every Thursday · Starts May 14',
      time: '7:00 PM - 9:30 PM',
      type: 'interclub',
      volunteersNeeded: [
        { id: 't1', name: 'Snacks & Refreshments', icon: '\uD83C\uDF4A', iconClass: 'snacks', assigned: null },
        { id: 't2', name: 'Court Setup', icon: '\uD83C\uDFBE', iconClass: 'setup', assigned: null },
        { id: 't3', name: 'Clean Up', icon: '\uD83E\uDDF9', iconClass: 'cleanup', assigned: null }
      ],
      assignedTasks: [
        { id: 't4', name: 'Scorekeeper', icon: '\uD83D\uDCCA', iconClass: 'score', assigned: 'Kelly K.' },
        { id: 't5', name: 'Team Captain A', icon: '\uD83D\uDC51', iconClass: 'drinks', assigned: 'Patti P.' }
      ],
      instructions: [
        'Arrive by 6:30 PM for warm-up',
        'Post-match social at clubhouse'
      ],
      rsvpList: []
    },
    '95-mixed-doubles': {
      name: '95+ Mixed Doubles Tournament',
      date: 'Saturday, July 18, 2026',
      time: '9:00 AM - 5:00 PM',
      type: 'tournament',
      volunteersNeeded: [
        { id: 't1', name: 'Registration Desk', icon: '\uD83D\uDCCB', iconClass: 'score', assigned: null }
      ],
      assignedTasks: [
        { id: 't2', name: 'Photographer', icon: '\uD83D\uDCF7', iconClass: 'photo', assigned: 'Joey Rogers' },
        { id: 't3', name: 'Scorekeeper', icon: '\uD83D\uDCCA', iconClass: 'score', assigned: 'Bobby O\'Reilly' },
        { id: 't4', name: 'Snacks & Lunch', icon: '\uD83C\uDF4A', iconClass: 'snacks', assigned: 'Jan H.' },
        { id: 't5', name: 'Court Setup', icon: '\uD83C\uDFBE', iconClass: 'setup', assigned: 'Phil P.' },
        { id: 't6', name: 'First Aid', icon: '\uD83C\uDFE5', iconClass: 'firstaid', assigned: null }
      ],
      instructions: [
        'Check-in opens at 8:30 AM',
        'Combined ages must equal 95+',
        'Lunch provided for all participants',
        'Awards ceremony at 4:30 PM'
      ],
      rsvpList: []
    },
    'opening-day-bbq': {
      name: 'Opening Day BBQ & Round Robin',
      date: 'Saturday, May 9, 2026',
      time: '12:30 PM - 3:00 PM',
      type: 'social',
      volunteersNeeded: [
        { id: 't1', name: 'Parking Attendant', icon: '\uD83D\uDE97', iconClass: 'parking', assigned: null }
      ],
      assignedTasks: [
        { id: 't2', name: 'BBQ Grill Master', icon: '\uD83C\uDF54', iconClass: 'snacks', assigned: 'Patrick M.' },
        { id: 't3', name: 'Drinks Station', icon: '\uD83E\uDD64', iconClass: 'drinks', assigned: 'Michael H.' },
        { id: 't4', name: 'Welcome & Sign-in', icon: '\uD83D\uDC4B', iconClass: 'score', assigned: 'Kelly K.' },
        { id: 't5', name: 'Clean Up Crew', icon: '\uD83E\uDDF9', iconClass: 'cleanup', assigned: 'Peter G.' }
      ],
      instructions: [
        'All members and families welcome!',
        'BBQ and refreshments provided',
        'Casual play on all courts',
        'New members meet & greet at 3 PM'
      ],
      rsvpList: []
    },
    'french-open-rr': {
      name: 'French Open Round Robin Social',
      date: 'Sunday, June 7, 2026',
      time: '1:00 PM - 4:00 PM',
      type: 'social',
      volunteersNeeded: [],
      assignedTasks: [],
      instructions: [
        'All skill levels welcome',
        'Mixed doubles round robin format',
        'Refreshments provided',
        'Prizes for winners'
      ],
      rsvpList: []
    },
    'wimbledon-rr': {
      name: 'Wimbledon Open Round Robin',
      date: 'Sunday, July 12, 2026',
      time: '1:00 PM - 4:00 PM',
      type: 'social',
      volunteersNeeded: [],
      assignedTasks: [],
      instructions: [
        'Whites encouraged!',
        'Mixed doubles round robin format',
        'Strawberries & cream provided',
        'Prizes for winners'
      ],
      rsvpList: []
    }
  };

  // ============================================
  // PRIVATE: Build avatar list HTML for RSVP displays
  // ============================================
  function buildAvatarList(list) {
    var shown = list.slice(0, 6);
    var html = shown.map(function(name) {
      return '<div class="event-rsvp-avatar">' + getAvatar(name) + '<span>' + sanitizeHTML(name) + '</span></div>';
    }).join('');
    if (list.length > 6) {
      html += '<div class="event-rsvp-avatar" style="background: var(--volt); color: #000;"><span>+' + (list.length - 6) + '</span></div>';
    }
    return html;
  }

  // ============================================
  // WINDOW: Inter-Club Match RSVP Modal (onclick from schedule.js generated HTML)
  // ============================================
  window.showInterclubRsvpModal = function(eventId) {
    try {
    const event = eventTasksData[eventId] || {
      name: 'Inter-Club Match',
      date: 'Sat, Jun 7, 2026',
      time: '1:00 - 5:00 PM',
      type: 'interclub',
      instructions: [
        'Arrive by 12:30 PM for warm-up',
        'Post-match social at clubhouse'
      ],
      rsvpList: []
    };

    const userRsvpd = event.rsvpList.includes('You');

    const instructionsHtml = event.instructions ? event.instructions.map(function(i) { return '<li>' + sanitizeHTML(i) + '</li>'; }).join('') : '';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'interclubRsvpModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Interclub RSVP');
    modal.onclick = function(e) { if (e.target === modal) closeInterclubRsvpModal(); };

    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; max-width: 420px; padding: 0;">' +
        '<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 28px 24px 24px; border-radius: 20px 20px 0 0; position: relative;">' +
          '<button onclick="closeInterclubRsvpModal()" style="position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer;"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
          '<div style="font-family: Bebas Neue, sans-serif; font-size: 26px; color: #fff; margin-bottom: 8px; line-height: 1.1;">' + sanitizeHTML(event.name) + '</div>' +
          '<div style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.8); font-size: 14px;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
            sanitizeHTML(event.date) + ' \u2022 ' + sanitizeHTML(event.time) +
          '</div>' +
        '</div>' +
        '<div style="padding: 0 24px 24px;">' +
          '<div class="event-info-grid">' +
            '<div class="event-info-card"><div class="event-info-label">Location</div><div class="event-info-value">MTC Home Courts</div></div>' +
            '<div class="event-info-card"><div class="event-info-label">Opponent</div><div class="event-info-value">Orangeville TC</div></div>' +
            '<div class="event-info-card"><div class="event-info-label">Format</div><div class="event-info-value">A & B Teams</div></div>' +
            '<div class="event-info-card"><div class="event-info-label">Team Size</div><div class="event-info-value" id="interclubSpotCount">' + event.rsvpList.length + ' confirmed</div></div>' +
          '</div>' +
          (instructionsHtml ? '<div class="event-instructions"><div class="event-instructions-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> Important Instructions</div><ul class="event-instructions-list">' + instructionsHtml + '</ul></div>' : '') +
          '<div class="event-rsvp-section">' +
            '<div class="event-rsvp-header">' +
              '<div class="event-rsvp-title">Who\u2019s Playing</div>' +
              '<div class="event-rsvp-count" id="interclubRsvpCount">' + event.rsvpList.length + ' confirmed</div>' +
            '</div>' +
            '<div class="event-rsvp-avatars" id="interclubRsvpAvatars">' + buildAvatarList(event.rsvpList) + '</div>' +
          '</div>' +
          '<div class="event-rsvp-buttons">' +
            '<button class="rsvp-btn going ' + (userRsvpd ? 'active' : '') + '" onclick="rsvpInterclub(\'' + eventId + '\', \'going\')" id="rsvpGoingBtn">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ' +
              (userRsvpd ? "I\u2019m In!" : "Count Me In") +
            '</button>' +
            '<button class="rsvp-btn not-going" onclick="rsvpInterclub(\'' + eventId + '\', \'not-going\')" id="rsvpNotGoingBtn">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> ' +
              "Can\u2019t Make It" +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    } catch(e) { MTC.warn('showInterclubRsvpModal error:', e); }
  };

  // ============================================
  // WINDOW: Close Interclub RSVP Modal (onclick from generated HTML)
  // ============================================
  window.closeInterclubRsvpModal = function() {
    const modal = document.getElementById('interclubRsvpModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  // ============================================
  // WINDOW: RSVP Interclub (onclick from generated HTML, hooked by confirm-modal.js)
  // ============================================
  window.rsvpInterclub = async function(eventId, response) {
    try {
    var event = eventTasksData[eventId];
    if (!event) return;

    var goingBtn = document.getElementById('rsvpGoingBtn');
    var notGoingBtn = document.getElementById('rsvpNotGoingBtn');
    var avatarContainer = document.getElementById('interclubRsvpAvatars');
    var countEl = document.getElementById('interclubRsvpCount');
    var spotEl = document.getElementById('interclubSpotCount');

    // Optimistic UI update
    if (response === 'going') {
      if (!event.rsvpList.includes('You')) {
        event.rsvpList.unshift('You');
      }
      goingBtn.classList.add('active');
      goingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> I\u2019m In!';
      notGoingBtn.classList.remove('active');
      showToast("You\u2019re confirmed! See you there!");

      if (typeof addEventToMyBookings === 'function') {
        addEventToMyBookings(eventId, 'interclub', {
          title: event.name || 'Inter-Club Match',
          date: event.date || 'Upcoming',
          time: event.time || 'See details',
          location: 'MTC Home Courts'
        });
      }
    } else {
      var idx = event.rsvpList.indexOf('You');
      if (idx > -1) event.rsvpList.splice(idx, 1);

      notGoingBtn.classList.add('active');
      notGoingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Declined';
      goingBtn.classList.remove('active');
      goingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Count Me In';
      showToast("No problem \u2014 we\u2019ll miss you!");

      if (typeof removeEventFromMyBookings === 'function') {
        removeEventFromMyBookings(eventId);
      }
    }

    // Update the player list live so user sees the change
    if (avatarContainer) {
      avatarContainer.innerHTML = buildAvatarList(event.rsvpList);
    }
    if (countEl) countEl.textContent = event.rsvpList.length + ' confirmed';
    if (spotEl) spotEl.textContent = event.rsvpList.length + ' confirmed';

    // Persist RSVP to Supabase (toggle — server handles add/remove)
    try {
      var res = await MTC.fn.apiRequest('/mobile/events', {
        method: 'POST',
        body: JSON.stringify({ eventId: eventId })
      });
      if (!res.ok) {
        MTC.warn('Interclub RSVP persist failed:', (await res.json()).error);
      }
    } catch(apiErr) {
      MTC.warn('Interclub RSVP API error:', apiErr);
    }

    // Don't auto-close - let user see the updated list and close manually
    } catch(e) { MTC.warn('rsvpInterclub error:', e); }
  };

  // ============================================
  // WINDOW: Edit Event (onclick from admin.js generated HTML)
  // ============================================
  window.editEvent = function(id) {
    // Find the event in local state
    var ev = null;
    if (typeof MTC !== 'undefined' && MTC.state && MTC.state.events) {
      ev = MTC.state.events.find(function(e) { return e.id === id; });
    }
    var evTitle = ev ? ev.title : 'Event';
    var evTime = ev ? ev.time : '6:30 PM';
    var evSpots = ev ? (ev.spotsTotal || 16) : 16;
    var evPrice = ev ? (ev.price || 'Free') : 'Free';

    var modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editEventModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Edit event');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">EDIT EVENT</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Event Name</label>' +
          '<input type="text" id="editEvTitle" value="' + sanitizeHTML(evTitle) + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">' +
          '<div>' +
            '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Time</label>' +
            '<input type="text" id="editEvTime" value="' + sanitizeHTML(evTime) + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
          '</div>' +
          '<div>' +
            '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Max Spots</label>' +
            '<input type="number" id="editEvSpots" value="' + evSpots + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom: 16px;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Price</label>' +
          '<input type="text" id="editEvPrice" value="' + sanitizeHTML(evPrice) + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
        '</div>' +
        '<button class="modal-btn ripple" id="editEvSaveBtn">SAVE CHANGES</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'editEventModal\').remove()">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);

    // Wire save button to API
    document.getElementById('editEvSaveBtn').onclick = async function() {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'SAVING...';
      try {
        var res = await MTC.fn.apiRequest('/mobile/events', {
          method: 'PATCH',
          body: JSON.stringify({
            id: id,
            title: document.getElementById('editEvTitle').value,
            time: document.getElementById('editEvTime').value,
            spotsTotal: document.getElementById('editEvSpots').value,
            price: document.getElementById('editEvPrice').value
          })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
        // Update local state
        if (ev) {
          ev.title = document.getElementById('editEvTitle').value;
          ev.time = document.getElementById('editEvTime').value;
          ev.spotsTotal = parseInt(document.getElementById('editEvSpots').value) || 16;
          ev.price = document.getElementById('editEvPrice').value;
        }
        document.getElementById('editEventModal').remove();
        showToast('Event updated successfully');
      } catch(err) {
        btn.disabled = false;
        btn.textContent = 'SAVE CHANGES';
        showToast('Failed to update event: ' + err.message);
      }
    };
  };

  // ============================================
  // WINDOW: Delete Event (onclick from admin.js generated HTML)
  // ============================================
  window.deleteEvent = function(id) {
    showConfirmModal({
      icon: 'danger',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
      title: 'DELETE EVENT?',
      message: 'This will remove the event and notify all registered participants.',
      confirmText: 'DELETE EVENT',
      cancelText: 'KEEP',
      confirmClass: 'danger',
      onConfirm: async function() {
        try {
          var res = await MTC.fn.apiRequest('/mobile/events', {
            method: 'DELETE',
            body: JSON.stringify({ id: id })
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed');
          // Remove from local state
          if (MTC.state && MTC.state.events) {
            MTC.state.events = MTC.state.events.filter(function(e) { return e.id !== id; });
          }
          showToast('Event deleted');
          if (typeof navigateTo === 'function') navigateTo('events');
        } catch(err) {
          showToast('Failed to delete event: ' + err.message);
        }
      }
    });
  };

  // ============================================
  // WINDOW: Edit Operating Hours (onclick from admin.js generated HTML)
  // ============================================
  window.editOperatingHours = function() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editHoursModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Edit operating hours');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };

    var days = MTC.config.dayNamesFull.slice(1).concat(MTC.config.dayNamesFull[0]);
    var defaultHours = { weekday: { open: '6:00 AM', close: '10:00 PM' }, weekend: { open: '7:00 AM', close: '8:00 PM' } };

    var hours = days.map(function(day, i) {
      var isWeekend = (day === 'Saturday' || day === 'Sunday');
      var def = isWeekend ? defaultHours.weekend : defaultHours.weekday;
      return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">' +
        '<span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">' + day + '</span>' +
        '<div style="display: flex; gap: 6px; align-items: center;">' +
          '<input type="text" class="hours-input" data-day="' + day + '" data-field="open" value="' + def.open + '" style="width: 90px; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 13px; text-align: center;">' +
          '<span style="color: var(--text-muted);">–</span>' +
          '<input type="text" class="hours-input" data-day="' + day + '" data-field="close" value="' + def.close + '" style="width: 90px; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 13px; text-align: center;">' +
        '</div>' +
      '</div>';
    }).join('');

    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 420px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">OPERATING HOURS</div>' +
        '<div style="margin: 16px 0;">' + hours + '</div>' +
        '<button class="modal-btn ripple" id="saveHoursBtn">SAVE</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'editHoursModal\').remove()">CLOSE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);

    document.getElementById('saveHoursBtn').onclick = async function() {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'SAVING...';
      try {
        var hoursObj = {};
        modal.querySelectorAll('.hours-input').forEach(function(inp) {
          var day = inp.getAttribute('data-day');
          var field = inp.getAttribute('data-field');
          if (!hoursObj[day]) hoursObj[day] = {};
          hoursObj[day][field] = inp.value;
        });
        var res = await MTC.fn.apiRequest('/mobile/settings', {
          method: 'POST',
          body: JSON.stringify({ settings: { operating_hours: JSON.stringify(hoursObj) } })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        document.getElementById('editHoursModal').remove();
        showToast('Hours saved');
      } catch(err) {
        btn.disabled = false;
        btn.textContent = 'SAVE';
        showToast('Failed to save hours: ' + err.message);
      }
    };
  };

  // ============================================
  // WINDOW: Generate Report (onclick from admin.js generated HTML)
  // ============================================
  window.generateReport = async function(type) {
    showToast('\uD83D\uDCCA Generating ' + type + ' report...');
    try {
      // Fetch real data from APIs based on report type
      var data, reportRes;
      if (type === 'bookings' || type === 'court') {
        reportRes = await MTC.fn.apiRequest('/mobile/bookings');
        data = reportRes.ok ? await reportRes.json() : [];
      } else if (type === 'members' || type === 'membership') {
        reportRes = await MTC.fn.apiRequest('/mobile/members');
        data = reportRes.ok ? await reportRes.json() : [];
      } else if (type === 'events') {
        reportRes = await MTC.fn.apiRequest('/mobile/events');
        data = reportRes.ok ? await reportRes.json() : [];
      } else {
        data = [];
      }

      if (!Array.isArray(data) || data.length === 0) {
        showToast('No data found for ' + type + ' report');
        return;
      }

      // Generate CSV from real data
      var headers = Object.keys(data[0]);
      var csv = headers.join(',') + '\n';
      data.forEach(function(row) {
        csv += headers.map(function(h) {
          var val = row[h] != null ? String(row[h]) : '';
          return '"' + val.replace(/"/g, '""') + '"';
        }).join(',') + '\n';
      });

      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mtc-' + type + '-report-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('\u2705 ' + type.charAt(0).toUpperCase() + type.slice(1) + ' report downloaded!');
    } catch(err) {
      showToast('Failed to generate report: ' + err.message);
    }
  };

  // ============================================
  // PRIVATE: Maintenance Mode State
  // ============================================
  let maintenanceMode = false;

  // Load maintenance mode state from server on init
  (async function() {
    try {
      var res = await MTC.fn.apiRequest('/mobile/settings');
      if (res.ok) {
        var settings = await res.json();
        if (settings.maintenance_mode === 'true') {
          maintenanceMode = true;
          document.body.classList.add('maintenance-mode');
        }
      }
    } catch(e) { /* silent — non-critical init */ }
  })();

  // ============================================
  // WINDOW: Toggle Maintenance Mode (onclick from admin.js generated HTML)
  // ============================================
  window.toggleMaintenanceMode = async function() {
    maintenanceMode = !maintenanceMode;
    // Optimistic UI update
    if (maintenanceMode) {
      document.body.classList.add('maintenance-mode');
      showToast('\uD83D\uDD27 Maintenance mode ENABLED - Bookings paused');
    } else {
      document.body.classList.remove('maintenance-mode');
      showToast('\u2705 Maintenance mode DISABLED - Bookings resumed');
    }
    try {
      var res = await MTC.fn.apiRequest('/mobile/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { maintenance_mode: String(maintenanceMode) } })
      });
      if (!res.ok) throw new Error('Failed');
    } catch(err) {
      // Rollback
      maintenanceMode = !maintenanceMode;
      if (maintenanceMode) {
        document.body.classList.add('maintenance-mode');
      } else {
        document.body.classList.remove('maintenance-mode');
      }
      showToast('Failed to toggle maintenance mode');
    }
  };

  // ============================================
  // WINDOW: Send Broadcast Notification (onclick from admin.js generated HTML)
  // ============================================
  window.sendBroadcastNotification = function() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'broadcastModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Broadcast notification');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">BROADCAST NOTIFICATION</div>' +
        '<div class="modal-desc" style="text-align: center;">Send a notification to all members</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Message</label>' +
          '<textarea id="broadcastMessage" placeholder="Type your message..." style="width: 100%; min-height: 80px; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: vertical; font-family: Inter, sans-serif; box-sizing: border-box;"></textarea>' +
        '</div>' +
        '<button class="modal-btn ripple" id="sendBroadcastBtn">SEND TO ALL MEMBERS</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'broadcastModal\').remove()">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);

    document.getElementById('sendBroadcastBtn').onclick = async function() {
      var msg = document.getElementById('broadcastMessage').value;
      if (!msg.trim()) { showToast('Please enter a message'); return; }
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'SENDING...';
      try {
        var res = await MTC.fn.apiRequest('/mobile/announcements', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Broadcast',
            message: msg.trim(),
            type: 'general',
            priority: 'normal'
          })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        document.getElementById('broadcastModal').remove();
        showToast('\u2705 Broadcast sent!');
      } catch(err) {
        btn.disabled = false;
        btn.textContent = 'SEND TO ALL MEMBERS';
        showToast('Failed to send broadcast: ' + err.message);
      }
    };
  };

  // ============================================
  // WINDOW: Export Club Data (onclick from admin.js generated HTML)
  // ============================================
  window.exportClubData = async function() {
    showToast('\uD83D\uDCE6 Preparing club data export...');
    try {
      // Fetch members, bookings, events in parallel
      var results = await Promise.all([
        MTC.fn.apiRequest('/mobile/members').then(function(r) { return r.ok ? r.json() : []; }),
        MTC.fn.apiRequest('/mobile/bookings').then(function(r) { return r.ok ? r.json() : []; }),
        MTC.fn.apiRequest('/mobile/events').then(function(r) { return r.ok ? r.json() : []; })
      ]);
      var members = results[0], bookings = results[1], events = results[2];

      // Build multi-section CSV
      var csv = '=== MEMBERS ===\n';
      if (Array.isArray(members) && members.length > 0) {
        var mHeaders = Object.keys(members[0]);
        csv += mHeaders.join(',') + '\n';
        members.forEach(function(row) {
          csv += mHeaders.map(function(h) { return '"' + String(row[h] != null ? row[h] : '').replace(/"/g, '""') + '"'; }).join(',') + '\n';
        });
      }
      csv += '\n=== BOOKINGS ===\n';
      if (Array.isArray(bookings) && bookings.length > 0) {
        var bHeaders = Object.keys(bookings[0]);
        csv += bHeaders.join(',') + '\n';
        bookings.forEach(function(row) {
          csv += bHeaders.map(function(h) { return '"' + String(row[h] != null ? row[h] : '').replace(/"/g, '""') + '"'; }).join(',') + '\n';
        });
      }
      csv += '\n=== EVENTS ===\n';
      if (Array.isArray(events) && events.length > 0) {
        var eHeaders = Object.keys(events[0]);
        csv += eHeaders.join(',') + '\n';
        events.forEach(function(row) {
          csv += eHeaders.map(function(h) { return '"' + String(row[h] != null ? row[h] : '').replace(/"/g, '""') + '"'; }).join(',') + '\n';
        });
      }

      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mtc-data-export-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('\u2B07\uFE0F Club data export downloaded!');
    } catch(err) {
      showToast('Failed to export data: ' + err.message);
    }
  };

  // showAddMemberModal - defined in admin.js (single source of truth)

  // ============================================
  // PRIVATE: Search handler (only called via debounced wrapper)
  // ============================================
  function handleSearch(query) {
    try {
    const resultsContainer = document.getElementById('dynamicSearchResults');
    const suggestions = document.getElementById('searchSuggestions');

    if (!query || query.length < 2) {
      resultsContainer.innerHTML = '';
      suggestions.style.display = 'block';
      return;
    }

    suggestions.style.display = 'none';

    // Search the full club member database (from messaging.js) plus current user
    let searchPool = [];
    if (typeof clubMembers !== 'undefined') {
      searchPool = clubMembers.filter(function(m) { return m.id !== 'club'; }).map(function(m) {
        return { name: m.name, type: 'Member', skill: m.skill };
      });
    }
    // Add current user profile
    if (typeof profileData !== 'undefined') {
      searchPool.unshift({ name: profileData.name, type: 'You', skill: profileData.skill });
    }

    const filtered = searchPool.filter(function(m) {
      return m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.skill.toLowerCase().includes(query.toLowerCase());
    });

    if (filtered.length === 0) {
      const san = typeof sanitizeHTML === 'function' ? sanitizeHTML : function(s) { return s; };
      resultsContainer.innerHTML =
        '<div class="empty-state" style="padding: 40px 20px;">' +
          '<div class="empty-state-icon" style="width: 60px; height: 60px;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
          '</div>' +
          '<div class="empty-state-title" style="font-size: 18px;">NO RESULTS</div>' +
          '<div class="empty-state-text">No matches found for "' + san(query) + '"</div>' +
        '</div>';
      return;
    }

    const san = typeof sanitizeHTML === 'function' ? sanitizeHTML : function(s) { return s; };
    resultsContainer.innerHTML = filtered.map(function(m) {
      return '<div class="search-result-item" data-action="viewMemberProfile" data-name="' + san(m.name).replace(/"/g, '&quot;') + '">' +
        '<div class="search-result-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' +
        '</div>' +
        '<div class="search-result-info">' +
          '<h4>' + san(m.name) + '</h4>' +
          '<p>' + san(m.type) + ' \u2022 ' + san(m.skill) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');
    } catch(e) { MTC.warn('handleSearch error:', e); }
  }

  // ============================================
  // WINDOW: Debounced Search (oninput from index.html)
  // ============================================
  window.debouncedHandleSearch = MTC.debounce(handleSearch, 250);

  // ============================================
  // WINDOW: View Member Profile (onclick from generated HTML)
  // ============================================
  window.viewMemberProfile = function(name) {
    showToast('Viewing ' + name + "'s profile");
    navigateTo('partners');
  };

})();
