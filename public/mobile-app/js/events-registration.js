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
      rsvpList: ['Kelly K.', 'Patrick M.', 'Michael H.', 'Phil P.', 'Peter G.', 'Jan H.']
    };

    const userRsvpd = event.rsvpList.includes('You');

    function buildAvatarList(list) {
      const shown = list.slice(0, 6);
      let html = shown.map(function(name) {
        return '<div class="event-rsvp-avatar">' + getAvatar(name) + '<span>' + sanitizeHTML(name) + '</span></div>';
      }).join('');
      if (list.length > 6) {
        html += '<div class="event-rsvp-avatar" style="background: var(--volt); color: #000;"><span>+' + (list.length - 6) + '</span></div>';
      }
      return html;
    }

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
    } catch(e) { console.warn('showInterclubRsvpModal error:', e); }
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
  window.rsvpInterclub = function(eventId, response) {
    try {
    const event = eventTasksData[eventId];
    if (!event) return;

    const goingBtn = document.getElementById('rsvpGoingBtn');
    const notGoingBtn = document.getElementById('rsvpNotGoingBtn');
    const avatarContainer = document.getElementById('interclubRsvpAvatars');
    const countEl = document.getElementById('interclubRsvpCount');
    const spotEl = document.getElementById('interclubSpotCount');

    if (response === 'going') {
      if (!event.rsvpList.includes('You')) {
        event.rsvpList.unshift('You');
      }
      goingBtn.classList.add('active');
      goingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> I\u2019m In!';
      notGoingBtn.classList.remove('active');
      showToast("You\u2019re confirmed! See you there \ud83c\udfbe");

      if (typeof addEventToMyBookings === 'function') {
        addEventToMyBookings(eventId, 'interclub', {
          title: event.name || 'Inter-Club Match',
          date: event.date || 'Upcoming',
          time: event.time || 'See details',
          location: 'MTC Home Courts'
        });
      }
    } else {
      const idx = event.rsvpList.indexOf('You');
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
      const shown = event.rsvpList.slice(0, 6);
      let html = shown.map(function(name) {
        return '<div class="event-rsvp-avatar">' + getAvatar(name) + '<span>' + sanitizeHTML(name) + '</span></div>';
      }).join('');
      if (event.rsvpList.length > 6) {
        html += '<div class="event-rsvp-avatar" style="background: var(--volt); color: #000;"><span>+' + (event.rsvpList.length - 6) + '</span></div>';
      }
      avatarContainer.innerHTML = html;
    }
    if (countEl) countEl.textContent = event.rsvpList.length + ' confirmed';
    if (spotEl) spotEl.textContent = event.rsvpList.length + ' confirmed';

    // Don't auto-close - let user see the updated list and close manually
    } catch(e) { console.warn('rsvpInterclub error:', e); }
  };

  // ============================================
  // WINDOW: Edit Event (onclick from admin.js generated HTML)
  // ============================================
  window.editEvent = function(id) {
    const modal = document.createElement('div');
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
          '<input type="text" value="Friday House League" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">' +
          '<div>' +
            '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Day</label>' +
            '<select style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">' +
              '<option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option selected>Friday</option><option>Saturday</option><option>Sunday</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Time</label>' +
            '<input type="time" value="18:30" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom: 16px;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Max Spots</label>' +
          '<input type="number" value="16" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="document.getElementById(\'editEventModal\').remove(); showToast(\'Event updated successfully\')">SAVE CHANGES</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'editEventModal\').remove()">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
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
      onConfirm: function() {
        showToast('Event deleted');
      }
    });
  };

  // ============================================
  // WINDOW: Edit Operating Hours (onclick from admin.js generated HTML)
  // ============================================
  window.editOperatingHours = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editHoursModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Edit operating hours');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };

    const days = MTC.config.dayNamesFull.slice(1).concat(MTC.config.dayNamesFull[0]);
    const hours = days.map(function(day) {
      const isWeekend = (day === 'Saturday' || day === 'Sunday');
      return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">' +
        '<span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">' + day + '</span>' +
        '<span style="font-size: 13px; color: var(--text-secondary);">' + (isWeekend ? '7:00 AM - 8:00 PM' : '6:00 AM - 10:00 PM') + '</span>' +
      '</div>';
    }).join('');

    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 380px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">OPERATING HOURS</div>' +
        '<div style="margin: 16px 0;">' + hours + '</div>' +
        '<button class="modal-btn ripple" onclick="document.getElementById(\'editHoursModal\').remove(); showToast(\'Hours saved\')">SAVE</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'editHoursModal\').remove()">CLOSE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  // ============================================
  // WINDOW: Generate Report (onclick from admin.js generated HTML)
  // ============================================
  window.generateReport = function(type) {
    showToast('\uD83D\uDCCA Generating ' + type + ' report...');
    setTimeout(function() {
      showToast('\u2705 ' + type.charAt(0).toUpperCase() + type.slice(1) + ' report ready!');
    }, 1500);
  };

  // ============================================
  // PRIVATE: Maintenance Mode State
  // ============================================
  let maintenanceMode = false;

  // ============================================
  // WINDOW: Toggle Maintenance Mode (onclick from admin.js generated HTML)
  // ============================================
  window.toggleMaintenanceMode = function() {
    maintenanceMode = !maintenanceMode;
    if (maintenanceMode) {
      showToast('\uD83D\uDD27 Maintenance mode ENABLED - Bookings paused');
      document.body.classList.add('maintenance-mode');
    } else {
      showToast('\u2705 Maintenance mode DISABLED - Bookings resumed');
      document.body.classList.remove('maintenance-mode');
    }
  };

  // ============================================
  // WINDOW: Send Broadcast Notification (onclick from admin.js generated HTML)
  // ============================================
  window.sendBroadcastNotification = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'broadcastModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Broadcast notification');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">BROADCAST NOTIFICATION</div>' +
        '<div class="modal-desc" style="text-align: center;">Send a push notification to all 156 members</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Message</label>' +
          '<textarea id="broadcastMessage" placeholder="Type your message..." style="width: 100%; min-height: 80px; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: vertical; font-family: Inter, sans-serif; box-sizing: border-box;"></textarea>' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="const msg = document.getElementById(\'broadcastMessage\').value; if (!msg.trim()) { showToast(\'Please enter a message\'); return; } document.getElementById(\'broadcastModal\').remove(); showToast(\'\uD83D\uDCE4 Sending to 156 members...\'); setTimeout(function() { showToast(\'\u2705 Notification sent!\'); }, 1500);">SEND TO ALL MEMBERS</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'broadcastModal\').remove()">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  // ============================================
  // WINDOW: Export Club Data (onclick from admin.js generated HTML)
  // ============================================
  window.exportClubData = function() {
    showToast('\uD83D\uDCE6 Preparing club data export...');
    setTimeout(function() {
      showToast('\u2B07\uFE0F Download starting: mtc-data-export.csv');
      // In real app, would trigger actual download
    }, 2000);
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
    } catch(e) { console.warn('handleSearch error:', e); }
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
