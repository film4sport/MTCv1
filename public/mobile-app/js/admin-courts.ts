(function() {
  'use strict';
  /* admin-courts.js - MTC Court
   * Courts tab: court list, status toggle, court blocks CRUD.
   * Depends on MTC.admin (from admin-helpers.js).
   */

  // ============================================
  // COURTS TAB
  // ============================================
  function normalizeArrayResponse(payload, key) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload[key])) return payload[key];
    return [];
  }

  window.loadCourts = function() {
    MTC.admin.dataLoaded.courts = true;
    var token = MTC.getToken();
    if (!token) return;
    Promise.all([
      fetch('/api/mobile/courts', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.ok ? r.json() : { courts: [] }; }),
      fetch('/api/mobile/court-blocks', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.ok ? r.json() : { blocks: [] }; }).catch(function() { return { blocks: [] }; })
    ]).then(function(results) {
      MTC.admin.courts = normalizeArrayResponse(results[0], 'courts');
      MTC.admin.blocks = normalizeArrayResponse(results[1], 'blocks');
      renderCourts();
      renderBlocksList();
    });
  };

  function renderCourts() {
    var container = document.getElementById('adminCourtsList');
    if (!container) return;
    if (!MTC.admin.courts.length) { container.innerHTML = '<div class="admin-empty-state">No courts found</div>'; return; }
    container.innerHTML = MTC.admin.courts.map(function(c) {
      var isOpen = c.status !== 'maintenance';
      var closeTime = c.floodlight ? '10:00 PM' : '8:00 PM';
      return '<div class="admin-court-card">' +
        '<div class="admin-court-name">' + (c.name || 'Court ' + c.id) + '</div>' +
        '<div class="admin-court-detail">Floodlight: ' + (c.floodlight ? 'Yes' : 'No') + ' · Closes: ' + closeTime + '</div>' +
        '<div class="admin-court-status ' + (isOpen ? 'open' : 'closed') + '">' + (isOpen ? 'Active' : 'Closed') + '</div><br>' +
        '<button class="admin-btn ' + (isOpen ? 'admin-btn-danger' : 'admin-btn-success') + '" style="width:100%" onclick="toggleCourtStatus(' + c.id + ', \'' + (isOpen ? 'maintenance' : 'available') + '\')">' +
          (isOpen ? 'Close Court' : 'Reopen Court') +
        '</button>' +
      '</div>';
    }).join('');
  }

  window.toggleCourtStatus = function(courtId, newStatus) {
    var token = MTC.getToken();
    fetch('/api/mobile/courts', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ courtId: courtId, status: newStatus })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      MTC.admin.courts.forEach(function(c) { if (c.id === courtId) c.status = newStatus; });
      renderCourts();
      showToast('Court ' + (newStatus === 'maintenance' ? 'closed' : 'reopened'));
    }).catch(function() { showToast('Failed to update court status'); });
  };

  // ============================================
  // COURT BLOCKS
  // ============================================
  function renderBlocksList() {
    var container = document.getElementById('adminBlocksList');
    if (!container) return;
    var today = new Date().toISOString().split('T')[0];
    var upcoming = MTC.admin.blocks.filter(function(b) { return b.block_date >= today; });
    upcoming.sort(function(a, b) { return a.block_date.localeCompare(b.block_date); });
    if (!upcoming.length) { container.innerHTML = '<div class="admin-empty-state">No upcoming blocks</div>'; return; }
    var clearBtn = upcoming.length > 1 ? '<div style="text-align:right;margin-bottom:8px;"><button class="admin-btn admin-btn-danger" onclick="clearAllCourtBlocks()" style="font-size:12px;padding:6px 12px;">Clear All (' + upcoming.length + ')</button></div>' : '';
    container.innerHTML = clearBtn + upcoming.map(function(b) {
      var courtLabel = b.court_id ? ('Court ' + b.court_id) : 'All Courts';
      var timeLabel = b.time_start ? (b.time_start + ' – ' + b.time_end) : 'All Day';
      return '<div class="admin-block-item">' +
        '<div class="admin-block-info">' +
          '<div class="admin-block-court">' + courtLabel + ' · ' + b.block_date + '</div>' +
          '<div class="admin-block-time">' + timeLabel + '</div>' +
          '<div class="admin-block-reason">' + (b.reason || '') + '</div>' +
        '</div>' +
        '<button class="admin-btn admin-btn-danger" onclick="deleteCourtBlock(\'' + b.id + '\')">Delete</button>' +
      '</div>';
    }).join('');
  }

  window.showBlockCourtModal = function() {
    var courts = MTC.admin.courts.map(function(c) {
      return '<option value="' + c.id + '">' + (c.name || 'Court ' + c.id) + '</option>';
    }).join('');

    var timeSlots = ['9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM',
      '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM',
      '5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM'];
    var timeOptions = timeSlots.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('');

    var today = new Date().toISOString().split('T')[0];
    var html = '<div class="modal-overlay active" id="blockCourtModal" onclick="closeBlockCourtModal()">' +
      '<div class="modal modal-scrollable-tall admin-block-modal" onclick="event.stopPropagation()">' +
        '<div class="admin-block-modal-header">' +
          '<div class="admin-block-modal-kicker">Admin Tools</div>' +
          '<div class="admin-block-modal-title">Block Court Time</div>' +
          '<div class="admin-block-modal-subtitle">Close one court or all courts for maintenance, events, weather, or private use.</div>' +
        '</div>' +
        '<div class="admin-block-modal-body">' +
          '<div class="admin-block-field-grid">' +
            '<div class="admin-block-field-card">' +
              '<label class="admin-block-label" for="blockCourtSelect">Court</label>' +
              '<select id="blockCourtSelect" class="admin-select"><option value="">All Courts</option>' + courts + '</select>' +
            '</div>' +
            '<div class="admin-block-field-card">' +
              '<label class="admin-block-label">Date Range</label>' +
              '<div class="admin-block-range-row">' +
                '<input type="date" id="blockDate" class="admin-input" style="margin-bottom:0" value="' + today + '" min="' + today + '">' +
                '<span class="admin-block-inline-divider">to</span>' +
                '<input type="date" id="blockDateEnd" class="admin-input" style="margin-bottom:0" value="" min="' + today + '" placeholder="Same day">' +
              '</div>' +
            '</div>' +
            '<div class="admin-block-field-card">' +
              '<div class="admin-block-toggle-row">' +
                '<div class="admin-block-toggle-copy">' +
                  '<div class="admin-block-toggle-title">Full Day</div>' +
                  '<div class="admin-block-toggle-subtitle">Leave on for an all-day block, or switch off to choose a time window.</div>' +
                '</div>' +
                '<input type="checkbox" id="blockFullDay" class="admin-block-checkbox" onchange="toggleBlockTimeInputs()" checked>' +
              '</div>' +
              '<div id="blockTimeInputs" class="admin-block-time-row" style="display:none">' +
                '<select id="blockTimeStart" class="admin-select">' + timeOptions + '</select>' +
                '<span class="admin-block-inline-divider">to</span>' +
                '<select id="blockTimeEnd" class="admin-select"><option value="">End Time</option>' + timeOptions + '</select>' +
              '</div>' +
            '</div>' +
            '<div class="admin-block-field-card">' +
              '<label class="admin-block-label" for="blockReason">Reason</label>' +
              '<select id="blockReason" class="admin-select">' +
                '<option value="Maintenance">Maintenance</option><option value="Club Event">Club Event</option>' +
                '<option value="Weather">Weather</option><option value="Tournament">Tournament</option>' +
                '<option value="Coaching Session">Coaching Session</option><option value="Private Event">Private Event</option>' +
                '<option value="Other">Other</option></select>' +
              '<input type="text" id="blockNotes" class="admin-input" placeholder="Notes (optional)">' +
              '<div class="admin-block-notice">If any confirmed bookings overlap this block, they will be cancelled and those members will be notified automatically.</div>' +
            '</div>' +
          '</div>' +
          '<div class="admin-block-modal-actions">' +
            '<button class="admin-btn admin-btn-secondary" onclick="closeBlockCourtModal()">Cancel</button>' +
            '<button class="admin-btn admin-btn-primary" onclick="createCourtBlock()">Block Time</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.toggleBlockTimeInputs = function() {
    var fullDay = document.getElementById('blockFullDay');
    var inputs = document.getElementById('blockTimeInputs');
    if (inputs) inputs.style.display = fullDay && fullDay.checked ? 'none' : 'flex';
  };

  window.closeBlockCourtModal = function() {
    var modal = document.getElementById('blockCourtModal');
    if (modal) modal.remove();
  };

  window.createCourtBlock = function() {
    var dateEl = document.getElementById('blockDate');
    var dateEndEl = document.getElementById('blockDateEnd');
    var reason = document.getElementById('blockReason');
    var courtSelect = document.getElementById('blockCourtSelect');
    var fullDay = document.getElementById('blockFullDay');
    var notes = document.getElementById('blockNotes');
    if (!dateEl || !dateEl.value) { showToast('Select a date'); return; }

    var startDate = dateEl.value;
    var endDate = (dateEndEl && dateEndEl.value) ? dateEndEl.value : startDate;
    if (endDate < startDate) { showToast('End date must be on or after start date'); return; }

    var timeStart = null, timeEnd = null;
    if (fullDay && !fullDay.checked) {
      var startSel = document.getElementById('blockTimeStart');
      var endSel = document.getElementById('blockTimeEnd');
      if (!startSel || !startSel.value || !endSel || !endSel.value) { showToast('Select start and end times'); return; }
      timeStart = startSel.value;
      timeEnd = endSel.value;
    }

    var dates = [];
    var cur = new Date(startDate + 'T12:00:00');
    var end = new Date(endDate + 'T12:00:00');
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    var token = MTC.getToken();
    var courtId = courtSelect && courtSelect.value ? parseInt(courtSelect.value) : null;
    var reasonVal = reason ? reason.value : 'Maintenance';
    var notesVal = notes ? notes.value.trim() : '';

    var promises = dates.map(function(d) {
      return fetch('/api/mobile/court-blocks', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: courtId, block_date: d, time_start: timeStart, time_end: timeEnd, reason: reasonVal, notes: notesVal })
      }).then(function(r) { return r.ok ? r.json() : null; });
    });

    Promise.all(promises).then(function(results) {
      var totalCancelled = 0;
      results.forEach(function(data) {
        if (data && data.block) MTC.admin.blocks.push(data.block);
        if (data && data.cancelledBookings) totalCancelled += data.cancelledBookings;
      });
      renderBlocksList();
      closeBlockCourtModal();
      var count = results.filter(function(r) { return r && r.block; }).length;
      var msg = count > 1 ? count + ' days blocked' : 'Court blocked';
      if (totalCancelled > 0) msg += ' -- ' + totalCancelled + ' booking' + (totalCancelled > 1 ? 's' : '') + ' cancelled & users notified';
      showToast(msg);
    }).catch(function() { showToast('Failed to create block'); });
  };

  window.deleteCourtBlock = function(blockId) {
    if (!confirm('Remove this court block?')) return;
    var token = MTC.getToken();
    fetch('/api/mobile/court-blocks?id=' + encodeURIComponent(blockId), {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      MTC.admin.blocks = MTC.admin.blocks.filter(function(b) { return b.id !== blockId; });
      renderBlocksList();
      showToast('Block removed');
    }).catch(function() { showToast('Failed to remove block'); });
  };

  window.clearAllCourtBlocks = function() {
    var today = new Date().toISOString().split('T')[0];
    var upcoming = MTC.admin.blocks.filter(function(b) { return b.block_date >= today; });
    if (!upcoming.length) return;
    if (!confirm('Delete all ' + upcoming.length + ' court blocks?')) return;
    var token = MTC.getToken();
    var ids = upcoming.map(function(b) { return b.id; });
    fetch('/api/mobile/court-blocks', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      return r.json();
    }).then(function(data) {
      MTC.admin.blocks = MTC.admin.blocks.filter(function(b) { return b.block_date < today; });
      renderBlocksList();
      showToast((data.deleted || ids.length) + ' blocks cleared');
    }).catch(function() { showToast('Failed to clear blocks'); });
  };

})();
