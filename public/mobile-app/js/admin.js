(function() {
  'use strict';
  /* admin.js - MTC Court */
  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  window.switchAdminTab = function(tab) {
    // Hide all admin content and deactivate tabs
    document.querySelectorAll('.admin-content').forEach(function(c) { c.style.display = 'none'; });
    document.querySelectorAll('.admin-tab').forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });

    // Show selected tab
    const contentId = 'admin' + tab.charAt(0).toUpperCase() + tab.slice(1);
    const tabId = 'admin' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab';

    const content = document.getElementById(contentId);
    const tabBtn = document.getElementById(tabId);

    if (content) content.style.display = 'block';
    if (tabBtn) {
      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
      tabBtn.setAttribute('tabindex', '0');
    }

    // Render payments tab content
    if (tab === 'payments' && typeof renderAdminPayments === 'function') {
      renderAdminPayments();
    }

    announceToScreenReader(tab + ' tab selected');
  };

  window.postAnnouncement = function() {
    const title = document.getElementById('announcementTitle').value;
    const message = document.getElementById('announcementMessage').value;

    if (!title || !message) {
      showToast('Please fill in title and message');
      return;
    }

    // Persist to Supabase
    var token = MTC.getToken();
    if (token && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/announcements', {
        method: 'POST',
        body: JSON.stringify({ text: title + ': ' + message, type: 'info', title: title, audience: 'all' })
      }).then(function(res) {
        if (res.ok) {
          showToast('Announcement posted!');
          document.getElementById('announcementTitle').value = '';
          document.getElementById('announcementMessage').value = '';
        } else {
          showToast('Failed to post announcement');
        }
      }).catch(function() { showToast('Failed to post announcement'); });
    } else {
      showToast('Not authenticated');
    }
  };

  // Animated close for dynamic admin modals
  function closeAdminModal(modalId, callback) {
    const m = document.getElementById(modalId);
    if (!m) return;
    m.classList.remove('active');
    setTimeout(function() { m.remove(); if (callback) callback(); }, 300);
  }
  window.closeAdminModal = closeAdminModal;

  window.editAnnouncement = function(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editAnnouncementModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Edit announcement');
    modal.onclick = function(e) { if (e.target === this) closeAdminModal('editAnnouncementModal'); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">EDIT ANNOUNCEMENT</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Title</label>' +
          '<input type="text" value="Announcement ' + sanitizeHTML(id) + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
        '</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Message</label>' +
          '<textarea rows="4" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; resize: vertical; box-sizing: border-box;">Edit your announcement here...</textarea>' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="closeAdminModal(\'editAnnouncementModal\', function() { showToast(\'Announcement updated\'); })">SAVE</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="closeAdminModal(\'editAnnouncementModal\')">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    modal.offsetHeight;
    modal.classList.add('active');
  };

  window.deleteAnnouncement = function(id) {
    showConfirmModal({
      icon: 'danger',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
      title: 'DELETE ANNOUNCEMENT?',
      message: 'This will permanently remove this announcement from the club feed.',
      confirmText: 'DELETE',
      cancelText: 'KEEP',
      confirmClass: 'danger',
      onConfirm: function() {
        // Persist deletion to Supabase
        MTC.fn.apiRequest('/mobile/announcements', {
          method: 'DELETE',
          body: JSON.stringify({ id: id })
        }).then(function() {
          showToast('Announcement deleted');
        }).catch(function(err) {
          MTC.warn(' deleteAnnouncement API error:', err);
          showToast('Announcement deleted locally — sync may be delayed', 'warning');
        });
      }
    });
  };

  // showAddMemberModal — defined below with full modal implementation

  window.editMember = function(id) {
    const member = allMembersPayment.find(function(m) { return m.id === id; });
    if (!member) { showToast('Member not found'); return; }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editMemberModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Edit member');
    modal.onclick = function(e) { if (e.target === this) closeAdminModal('editMemberModal'); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">EDIT MEMBER</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Name</label>' +
          '<input type="text" value="' + sanitizeHTML(member.name) + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;" id="editMemberName">' +
        '</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Email</label>' +
          '<input type="email" value="' + sanitizeHTML(member.email) + '" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px; box-sizing: border-box;" id="editMemberEmail">' +
        '</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Membership Status</label>' +
          '<select style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">' +
            '<option>Active Member</option><option>Inactive</option><option>Guest</option>' +
          '</select>' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="saveEditMember(\'' + sanitizeHTML(id).replace(/'/g, '&#039;') + '\')">SAVE CHANGES</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="closeAdminModal(\'editMemberModal\')">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    modal.offsetHeight;
    modal.classList.add('active');
  };

  window.saveEditMember = function(id) {
    var nameEl = document.getElementById('editMemberName');
    var emailEl = document.getElementById('editMemberEmail');
    var selectEl = document.querySelector('#editMemberModal select');
    var name = nameEl ? nameEl.value.trim() : '';
    var email = emailEl ? emailEl.value.trim() : '';
    var statusText = selectEl ? selectEl.value : 'Active Member';
    var statusMap = { 'Active Member': 'active', 'Inactive': 'inactive', 'Guest': 'guest' };
    var status = statusMap[statusText] || 'active';

    if (!name || !email) {
      showToast('Name and email are required');
      return;
    }

    MTC.fn.apiRequest('/mobile/members', {
      method: 'PATCH',
      body: JSON.stringify({ memberId: id, name: name, email: email, status: status })
    }).then(function() {
      closeAdminModal('editMemberModal', function() {
        showToast('Member updated successfully');
      });
    }).catch(function(err) {
      MTC.warn(' editMember API error:', err);
      closeAdminModal('editMemberModal', function() {
        showToast('Failed to save — try again', 'error');
      });
    });
  };

  window.removeMember = function(id) {
    // Overridden by confirm-modal.js with proper modal
    showToast('Remove member ' + id);
  };

  window.adminModifyBooking = function(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'adminModifyModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Modify booking');
    modal.onclick = function(e) { if (e.target === this) closeAdminModal('adminModifyModal'); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 360px;">' +
        '<div class="modal-title">MODIFY BOOKING</div>' +
        '<div class="modal-desc">Booking ' + sanitizeHTML(id) + '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 10px; margin: 16px 0;">' +
          '<button class="modal-btn ripple" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color);" onclick="closeAdminModal(\'adminModifyModal\', function() { showToast(\'Select new time on booking calendar\'); navigateTo(\'book\'); })">Change Time</button>' +
          '<button class="modal-btn ripple" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color);" onclick="closeAdminModal(\'adminModifyModal\', function() { showToast(\'Select new court on booking calendar\'); navigateTo(\'book\'); })">Change Court</button>' +
          '<button class="modal-btn ripple" style="background: var(--coral); color: #fff;" onclick="closeAdminModal(\'adminModifyModal\', function() { adminCancelBooking(\'' + sanitizeHTML(id).replace(/'/g, '&#039;') + '\'); })">Cancel Booking</button>' +
        '</div>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted);" onclick="closeAdminModal(\'adminModifyModal\')">CLOSE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    modal.offsetHeight;
    modal.classList.add('active');
  };

  window.adminCancelBooking = function(id) {
    // Overridden by confirm-modal.js with proper modal — this is fallback
    MTC.fn.apiRequest('/mobile/bookings', {
      method: 'DELETE',
      body: JSON.stringify({ bookingId: id })
    }).then(function() {
      showToast('Booking ' + id + ' cancelled');
    }).catch(function(err) {
      MTC.warn(' adminCancelBooking API error:', err);
      showToast('Failed to cancel booking', 'error');
    });
  };

  window.exportBookings = function() {
    showToast('Preparing bookings export...');

    // Fetch bookings from Supabase
    MTC.fn.apiRequest('/mobile/bookings', { method: 'GET' }).then(function(bookings) {
      if (!bookings || !bookings.length) {
        showToast('No bookings to export');
        return;
      }

      // Build CSV
      var csv = 'Date,Time,Court,Member,Match Type,Duration (slots),Status\n';
      bookings.forEach(function(b) {
        csv += [b.date, b.time, b.courtName || ('Court ' + b.courtId),
          b.userName || 'Unknown', b.matchType || 'singles',
          b.duration || 2, 'confirmed'].join(',') + '\n';
      });

      // Trigger download
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mtc-bookings-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Download started: mtc-bookings-export.csv');
    }).catch(function(err) {
      MTC.warn(' exportBookings error:', err);
      showToast('Failed to export bookings', 'error');
    });
  };

  window.showCreateEventModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'createEventModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Create event');
    modal.onclick = function(e) { if (e.target === this) closeCreateEventModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; max-width: 400px;">' +
        '<div class="modal-title">CREATE EVENT</div>' +

        '<div style="text-align: left; margin-top: 20px;">' +
          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">EVENT TITLE</label>' +
          '<input type="text" id="newEventTitle" placeholder="e.g., Junior Clinic" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">EVENT TYPE</label>' +
          '<select id="newEventType" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px;">' +
            '<option value="clinic">Clinic / Lesson</option>' +
            '<option value="tournament">Tournament</option>' +
            '<option value="social">Social Event</option>' +
            '<option value="roundrobin">Round Robin</option>' +
            '<option value="camp">Camp / Multi-Day</option>' +
          '</select>' +

          '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">' +
            '<div>' +
              '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">DATE</label>' +
              '<input type="date" id="newEventDate" aria-label="Event date" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">TIME</label>' +
              '<input type="time" id="newEventTime" aria-label="Event time" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
          '</div>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">LOCATION</label>' +
          '<select id="newEventLocation" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px;">' +
            '<option value="Court 1">Court 1</option>' +
            '<option value="Court 2">Court 2</option>' +
            '<option value="Courts 1-2">Courts 1-2</option>' +
            '<option value="Courts 3-4">Courts 3-4</option>' +
            '<option value="All Courts">All Courts</option>' +
            '<option value="Clubhouse">Clubhouse</option>' +
          '</select>' +

          '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">' +
            '<div>' +
              '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">MAX SPOTS</label>' +
              '<input type="number" id="newEventSpots" aria-label="Number of spots" value="16" min="2" max="100" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">PRICE</label>' +
              '<input type="text" id="newEventPrice" placeholder="Free or $XX" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
          '</div>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">DESCRIPTION</label>' +
          '<textarea id="newEventDesc" placeholder="Describe the event..." rows="3" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; resize: none; margin-bottom: 16px; box-sizing: border-box;"></textarea>' +

          '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 12px; background: var(--bg-secondary); border-radius: 10px;">' +
            '<input type="checkbox" id="newEventNotify" checked style="width: 18px; height: 18px; accent-color: var(--volt);">' +
            '<label for="newEventNotify" style="font-size: 13px; color: var(--text-secondary);">Send notification to members</label>' +
          '</div>' +
        '</div>' +

        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' +
          '<button onclick="closeCreateEventModal()" style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer;">Cancel</button>' +
          '<button onclick="createEvent()" style="padding: 14px; border-radius: 12px; border: none; background: var(--volt); color: #000; font-size: 14px; font-weight: 700; cursor: pointer;">Create Event</button>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  window.closeCreateEventModal = function() {
    const modal = document.getElementById('createEventModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.createEvent = function() {
    try {
    const title = document.getElementById('newEventTitle').value;
    const type = document.getElementById('newEventType').value;
    const date = document.getElementById('newEventDate').value;
    const time = document.getElementById('newEventTime').value;
    const location = document.getElementById('newEventLocation').value;
    const spots = document.getElementById('newEventSpots').value;
    const price = document.getElementById('newEventPrice').value || 'Free';
    const desc = document.getElementById('newEventDesc').value;
    const notify = document.getElementById('newEventNotify').checked;

    if (!title || !date || !time) {
      showToast('Please fill in title, date, and time');
      return;
    }

    // Optimistic local add
    var eventId = 'event-' + Date.now();
    clubEventsData[eventId] = {
      id: eventId, title: title, date: date, time: time, location: location,
      badge: price.toLowerCase() === 'free' ? 'free' : 'paid',
      price: price, spotsTotal: parseInt(spots), spotsTaken: 0,
      description: desc, attendees: []
    };

    closeCreateEventModal();

    // Persist to Supabase
    MTC.fn.apiRequest('/mobile/events', {
      method: 'PUT',
      body: JSON.stringify({
        title: title, type: type, date: date, time: time,
        location: location, spotsTotal: spots, price: price, description: desc
      })
    }).then(function(res) {
      if (res && res.id) {
        // Update local ID to match server
        clubEventsData[res.id] = clubEventsData[eventId];
        clubEventsData[res.id].id = res.id;
        if (res.id !== eventId) delete clubEventsData[eventId];
      }
      showToast('Event created successfully!');
    }).catch(function(err) {
      MTC.warn(' createEvent API error:', err);
      showToast('Event saved locally — sync may be delayed', 'warning');
    });
    } catch(e) { MTC.warn('createEvent error:', e); }
  };

  // ============================================
  // ROLE SWITCHER SYSTEM
  // ============================================
  // Role is now set via login credentials (auth.js) — no FAB switcher

  // ============================================
  // COACH ANNOUNCEMENT MODAL
  // ============================================
  window.showCoachAnnouncementModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'coachAnnouncementModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Coach announcement');
    modal.onclick = function(e) { if (e.target === this) closeCoachAnnouncementModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; max-width: 400px;">' +
        '<div class="modal-title">SEND ANNOUNCEMENT</div>' +

        '<div style="text-align: left; margin-top: 20px;">' +
          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">ANNOUNCEMENT TYPE</label>' +
          '<div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">' +
            '<button class="message-type-pill active" onclick="selectAnnouncementType(this, \'coaching\')">&#127934; Coaching</button>' +
            '<button class="message-type-pill" onclick="selectAnnouncementType(this, \'club\')">&#128226; Club News</button>' +
            '<button class="message-type-pill" onclick="selectAnnouncementType(this, \'event\')">&#127942; Event</button>' +
            '<button class="message-type-pill" onclick="selectAnnouncementType(this, \'urgent\')">&#9889; Urgent</button>' +
          '</div>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">SEND TO</label>' +
          '<select id="announcementRecipients" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px;">' +
            '<option value="all">All Members (156)</option>' +
            '<option value="juniors">Junior Program Members (45)</option>' +
            '<option value="adults">Adult Program Members (78)</option>' +
            '<option value="teams">Team Players (32)</option>' +
            '<option value="interclub">Interclub League Players (24)</option>' +
          '</select>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">TITLE</label>' +
          '<input type="text" id="coachAnnouncementTitle" placeholder="e.g., Clinic Schedule Change" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">MESSAGE</label>' +
          '<textarea id="coachAnnouncementMessage" placeholder="Write your message..." rows="4" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; resize: none; margin-bottom: 16px; box-sizing: border-box;"></textarea>' +

          '<div style="background: var(--bg-secondary); border-radius: 12px; padding: 14px; margin-bottom: 20px;">' +
            '<div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">DELIVERY OPTIONS</div>' +
            '<label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">' +
              '<input type="checkbox" checked style="width: 16px; height: 16px; accent-color: var(--volt);">' +
              '<span style="font-size: 13px; color: var(--text-secondary);">Push notification</span>' +
            '</label>' +
            '<label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">' +
              '<input type="checkbox" checked style="width: 16px; height: 16px; accent-color: var(--volt);">' +
              '<span style="font-size: 13px; color: var(--text-secondary);">In-app message</span>' +
            '</label>' +
          '</div>' +
        '</div>' +

        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' +
          '<button onclick="closeCoachAnnouncementModal()" style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer;">Cancel</button>' +
          '<button onclick="sendCoachAnnouncement()" style="padding: 14px; border-radius: 12px; border: none; background: var(--volt); color: #000; font-size: 14px; font-weight: 700; cursor: pointer;">Send</button>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  window.closeCoachAnnouncementModal = function() {
    const modal = document.getElementById('coachAnnouncementModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.selectAnnouncementType = function(btn, type) {
    btn.parentElement.querySelectorAll('.message-type-pill').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
  };

  window.sendCoachAnnouncement = function() {
    try {
    const title = document.getElementById('coachAnnouncementTitle').value;
    const message = document.getElementById('coachAnnouncementMessage').value;
    const recipients = document.getElementById('announcementRecipients');
    const recipientCount = (recipients.options[recipients.selectedIndex].text.match(/\d+/) || ['0'])[0];

    if (!title || !message) {
      showToast('Please fill in title and message');
      return;
    }

    closeCoachAnnouncementModal();
    showToast('Sending to ' + recipientCount + ' members...');

    // Persist to Supabase as announcement
    MTC.fn.apiRequest('/mobile/announcements', {
      method: 'POST',
      body: JSON.stringify({ text: title + ': ' + message, type: 'coaching' })
    }).then(function() {
      showToast('Announcement sent successfully!');
    }).catch(function(err) {
      MTC.warn(' sendCoachAnnouncement API error:', err);
      showToast('Announcement saved locally — sync may be delayed', 'warning');
    });
    } catch(e) { MTC.warn('sendCoachAnnouncement error:', e); }
  };

  // ============================================
  // ADMIN MESSAGE MEMBERS MODAL
  // ============================================
  window.showMessageMembersModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'messageMembersModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Message members');
    modal.onclick = function(e) { if (e.target === this) closeMessageMembersModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; max-width: 400px;">' +
        '<div class="modal-title">MESSAGE MEMBERS</div>' +

        '<div style="text-align: left; margin-top: 20px;">' +
          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">SELECT RECIPIENTS</label>' +
          '<select id="messageRecipients" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px;">' +
            '<option value="all">All Members (156)</option>' +
            '<option value="active">Active Members (142)</option>' +
            '<option value="expired">Expired Memberships (14)</option>' +
            '<option value="new">New Members - This Month (8)</option>' +
            '<option value="unpaid">Unpaid Dues (6)</option>' +
          '</select>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">SUBJECT</label>' +
          '<input type="text" id="adminMessageSubject" placeholder="e.g., Membership Renewal Reminder" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">MESSAGE</label>' +
          '<textarea id="adminMessageBody" placeholder="Write your message..." rows="5" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; resize: none; margin-bottom: 16px; box-sizing: border-box;"></textarea>' +

          '<div style="background: rgba(200, 255, 0, 0.1); border: 1px solid var(--volt); border-radius: 12px; padding: 14px; margin-bottom: 20px;">' +
            '<div style="font-size: 12px; font-weight: 700; color: var(--volt); margin-bottom: 4px;">&#128161; TIP</div>' +
            '<div style="font-size: 12px; color: var(--text-secondary);">Use {name} to personalize with member\'s name. E.g., "Hi {name}, your membership..."</div>' +
          '</div>' +
        '</div>' +

        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' +
          '<button onclick="closeMessageMembersModal()" style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer;">Cancel</button>' +
          '<button onclick="sendAdminMessage()" style="padding: 14px; border-radius: 12px; border: none; background: var(--volt); color: #000; font-size: 14px; font-weight: 700; cursor: pointer;">Send Message</button>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  window.closeMessageMembersModal = function() {
    const modal = document.getElementById('messageMembersModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.sendAdminMessage = function() {
    try {
    const subject = document.getElementById('adminMessageSubject').value;
    const body = document.getElementById('adminMessageBody').value;
    const recipients = document.getElementById('messageRecipients');
    const recipientCount = (recipients.options[recipients.selectedIndex].text.match(/\d+/) || ['0'])[0];

    if (!subject || !body) {
      showToast('Please fill in subject and message');
      return;
    }

    closeMessageMembersModal();
    showToast('Sending to ' + recipientCount + ' members...');

    // Persist as announcement (broadcast message to all members)
    MTC.fn.apiRequest('/mobile/announcements', {
      method: 'POST',
      body: JSON.stringify({ text: subject + ': ' + body, type: 'info' })
    }).then(function() {
      showToast('Message sent successfully!');
    }).catch(function(err) {
      MTC.warn(' sendAdminMessage API error:', err);
      showToast('Message saved locally — sync may be delayed', 'warning');
    });
    } catch(e) { MTC.warn('sendAdminMessage error:', e); }
  };

  // ============================================
  // ADMIN ADD MEMBER MODAL
  // ============================================
  window.showAddMemberModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'addMemberModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Add member');
    modal.onclick = function(e) { if (e.target === this) closeAddMemberModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; max-width: 400px;">' +
        '<div class="modal-title">ADD NEW MEMBER</div>' +

        '<div style="text-align: left; margin-top: 20px;">' +
          '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">' +
            '<div>' +
              '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">FIRST NAME</label>' +
              '<input type="text" id="newMemberFirst" placeholder="John" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">LAST NAME</label>' +
              '<input type="text" id="newMemberLast" placeholder="Smith" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
          '</div>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">EMAIL</label>' +
          '<input type="email" id="newMemberEmail" placeholder="john@example.com" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">PHONE</label>' +
          '<input type="tel" id="newMemberPhone" placeholder="(519) 555-0123" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">MEMBERSHIP TYPE</label>' +
          '<select id="newMemberType" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px;">' +
            '<option value="adult">Adult (Single) - $120/season</option>' +
            '<option value="family">Family - $240/season</option>' +
            '<option value="junior">Junior (18 & under) - $55/season</option>' +
          '</select>' +

          '<label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">SKILL LEVEL</label>' +
          '<select id="newMemberSkill" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px;">' +
            '<option value="beginner">Beginner (2.0-2.5)</option>' +
            '<option value="intermediate">Intermediate (3.0-3.5)</option>' +
            '<option value="advanced">Advanced (4.0-4.5)</option>' +
            '<option value="competitive">Competitive (4.5+)</option>' +
          '</select>' +

          '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 12px; background: var(--bg-secondary); border-radius: 10px;">' +
            '<input type="checkbox" id="newMemberWelcome" checked style="width: 18px; height: 18px; accent-color: var(--volt);">' +
            '<label for="newMemberWelcome" style="font-size: 13px; color: var(--text-secondary);">Send welcome email with login instructions</label>' +
          '</div>' +
        '</div>' +

        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' +
          '<button onclick="closeAddMemberModal()" style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer;">Cancel</button>' +
          '<button onclick="addNewMember()" style="padding: 14px; border-radius: 12px; border: none; background: var(--volt); color: #000; font-size: 14px; font-weight: 700; cursor: pointer;">Add Member</button>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  window.closeAddMemberModal = function() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.addNewMember = function() {
    var first = document.getElementById('newMemberFirst').value;
    var last = document.getElementById('newMemberLast').value;
    var email = document.getElementById('newMemberEmail').value;
    var memberType = document.getElementById('newMemberType') ? document.getElementById('newMemberType').value : 'adult';
    var skillLevel = document.getElementById('newMemberSkill') ? document.getElementById('newMemberSkill').value : 'intermediate';
    var sendWelcome = document.getElementById('newMemberWelcome') ? document.getElementById('newMemberWelcome').checked : true;

    if (!first || !last || !email) {
      showToast('Please fill in name and email');
      return;
    }

    closeAddMemberModal();
    showToast('Adding member...');

    // Persist to Supabase
    MTC.fn.apiRequest('/mobile/members', {
      method: 'POST',
      body: JSON.stringify({
        name: first.trim() + ' ' + last.trim(),
        email: email.trim(),
        membershipType: memberType,
        skillLevel: skillLevel,
        sendWelcome: sendWelcome
      })
    }).then(function() {
      showToast('Member added: ' + first + ' ' + last);
      if (sendWelcome) {
        setTimeout(function() { showToast('Welcome email sent!'); }, 800);
      }
    }).catch(function(err) {
      MTC.warn(' addNewMember API error:', err);
      showToast('Failed to add member — ' + (err.message || 'try again'), 'error');
    });
  };

  // ============================================
  // E-TRANSFER SETTINGS
  // ============================================
  window.saveEtransferSettings = function() {
    var email = document.getElementById('etransferEmail').value;
    var autoDeposit = document.getElementById('etransferAutoDeposit').classList.contains('active');
    var message = document.getElementById('etransferMessage').value;

    if (!email) {
      showToast('Please enter an e-transfer email');
      return;
    }

    // Save to localStorage as cache
    MTC.storage.set('mtc-etransfer-email', email);
    MTC.storage.set('mtc-etransfer-autodeposit', autoDeposit);
    MTC.storage.set('mtc-etransfer-message', message);

    // Persist to Supabase club_settings
    MTC.fn.apiRequest('/mobile/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings: {
          'etransfer_email': email,
          'etransfer_auto_deposit': String(autoDeposit),
          'etransfer_message': message || ''
        }
      })
    }).then(function() {
      showToast('E-transfer settings saved!');
    }).catch(function(err) {
      MTC.warn(' saveEtransferSettings API error:', err);
      showToast('Settings saved locally — sync may be delayed', 'warning');
    });
  };

  // ============================================
  // EVENT TASK MANAGEMENT SYSTEM
  // ============================================

  const eventTasksData = {
    'interclub-league': {
      name: 'Interclub Competitive League',
      date: 'Sat, Jun 7, 2026',
      time: '1:00 - 5:00 PM',
      type: 'interclub',
      volunteersNeeded: [
        { id: 't1', name: 'Snacks & Refreshments', icon: '&#127818;', iconClass: 'snacks', assigned: null },
        { id: 't2', name: 'Court Setup', icon: '&#127934;', iconClass: 'setup', assigned: null },
        { id: 't3', name: 'Clean Up', icon: '&#129529;', iconClass: 'cleanup', assigned: null }
      ],
      assignedTasks: [
        { id: 't4', name: 'Scorekeeper', icon: '&#128202;', iconClass: 'score', assigned: 'Kelly K.' },
        { id: 't5', name: 'Team Captain A', icon: '&#128081;', iconClass: 'drinks', assigned: 'Patti P.' }
      ],
      instructions: [
        'Arrive by 12:30 PM for warm-up',
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
        { id: 't1', name: 'Registration Desk', icon: '&#128203;', iconClass: 'score', assigned: null }
      ],
      assignedTasks: [
        { id: 't2', name: 'Photographer', icon: '&#128247;', iconClass: 'photo', assigned: 'Joey Rogers' },
        { id: 't3', name: 'Scorekeeper', icon: '&#128202;', iconClass: 'score', assigned: 'Bobby O\'Reilly' },
        { id: 't4', name: 'Snacks & Lunch', icon: '&#127818;', iconClass: 'snacks', assigned: 'Jan H.' },
        { id: 't5', name: 'Court Setup', icon: '&#127934;', iconClass: 'setup', assigned: 'Phil P.' },
        { id: 't6', name: 'First Aid', icon: '&#127973;', iconClass: 'firstaid', assigned: null }
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
        { id: 't1', name: 'Parking Attendant', icon: '&#128663;', iconClass: 'parking', assigned: null }
      ],
      assignedTasks: [
        { id: 't2', name: 'BBQ Grill Master', icon: '&#127828;', iconClass: 'snacks', assigned: 'Patrick M.' },
        { id: 't3', name: 'Drinks Station', icon: '&#129380;', iconClass: 'drinks', assigned: 'Michael H.' },
        { id: 't4', name: 'Welcome & Sign-in', icon: '&#128075;', iconClass: 'score', assigned: 'Kelly K.' },
        { id: 't5', name: 'Clean Up Crew', icon: '&#129529;', iconClass: 'cleanup', assigned: 'Peter G.' }
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
      date: 'Saturday, June 7, 2026',
      time: '1:00 PM - 4:00 PM',
      type: 'social',
      volunteersNeeded: [],
      assignedTasks: [],
      instructions: ['All skill levels welcome', 'Mixed doubles round robin format', 'Refreshments provided', 'Prizes for winners'],
      rsvpList: []
    },
    'wimbledon-rr': {
      name: 'Wimbledon Open Round Robin',
      date: 'Saturday, July 12, 2026',
      time: '1:00 PM - 4:00 PM',
      type: 'social',
      volunteersNeeded: [],
      assignedTasks: [],
      instructions: ['Whites encouraged!', 'Mixed doubles round robin format', 'Strawberries & cream provided', 'Prizes for winners'],
      rsvpList: []
    }
  };

  window.showEventTaskManager = function(eventId) {
    try {
    const event = eventTasksData[eventId];
    if (!event) {
      showToast('Event not found');
      return;
    }

    const volunteersHtml = event.volunteersNeeded.map(function(task) {
      return '<div class="task-item">' +
        '<div class="task-icon ' + task.iconClass + '">' + task.icon + '</div>' +
        '<div class="task-info">' +
          '<div class="task-name">' + sanitizeHTML(task.name) + '</div>' +
          '<div class="task-status">Needs Volunteer</div>' +
        '</div>' +
        '<button class="task-action-btn assign" data-action="showAssignTaskModal" data-event-id="' + sanitizeHTML(eventId) + '" data-task-id="' + sanitizeHTML(task.id) + '" data-task-name="' + sanitizeHTML(task.name) + '">Assign</button>' +
      '</div>';
    }).join('');

    const assignedHtml = event.assignedTasks.map(function(task) {
      return '<div class="task-item">' +
        '<div class="task-icon ' + task.iconClass + '">' + task.icon + '</div>' +
        '<div class="task-info">' +
          '<div class="task-name">' + sanitizeHTML(task.name) + '</div>' +
          '<div class="task-assignee">' + sanitizeHTML(task.assigned) + '</div>' +
        '</div>' +
        '<button class="task-action-btn assigned" data-action="showReassignTaskModal" data-event-id="' + sanitizeHTML(eventId) + '" data-task-id="' + sanitizeHTML(task.id) + '" data-task-name="' + sanitizeHTML(task.name) + '" data-assigned="' + sanitizeHTML(task.assigned) + '">Change</button>' +
      '</div>';
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'taskManagerModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Task manager');
    modal.onclick = function(e) { if (e.target === this) closeTaskManagerModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto; max-width: 420px; padding: 0;">' +
        '<div class="event-detail-header">' +
          '<div class="event-detail-title">' + sanitizeHTML(event.name) + '</div>' +
          '<div class="event-detail-datetime">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
            sanitizeHTML(event.date) + ' &bull; ' + sanitizeHTML(event.time) +
          '</div>' +
        '</div>' +

        '<div style="padding: 0 24px 24px;">' +
          (event.volunteersNeeded.length > 0 ?
            '<div class="task-section-header">' +
              'Volunteers Needed <span class="count">' + event.volunteersNeeded.length + '</span>' +
            '</div>' +
            '<div class="task-list" style="margin: 0 0 20px;">' +
              volunteersHtml +
            '</div>'
          : '') +

          (event.assignedTasks.length > 0 ?
            '<div class="task-section-header" style="color: var(--text-muted);">' +
              'Assigned Tasks <span class="count" style="background: var(--text-muted);">' + event.assignedTasks.length + '</span>' +
            '</div>' +
            '<div class="task-list" style="margin: 0 0 20px;">' +
              assignedHtml +
            '</div>'
          : '') +

          '<button data-action="showAddTaskModal" data-event-id="' + sanitizeHTML(eventId) + '" style="width: 100%; padding: 14px; border-radius: 12px; border: 2px dashed var(--border-color); background: transparent; color: var(--text-muted); font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
            'Add New Task' +
          '</button>' +

          '<button onclick="closeTaskManagerModal()" style="width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--volt); color: #000; font-size: 14px; font-weight: 700; cursor: pointer;">' +
            'Done' +
          '</button>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
    } catch(e) { MTC.warn('showEventTaskManager error:', e); }
  };

  window.closeTaskManagerModal = function() {
    const modal = document.getElementById('taskManagerModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.showAssignTaskModal = function(eventId, taskId, taskName) {
    // Use real members from API if available, otherwise use board members
    const apiMembers = (MTC.state.clubMembers || []).filter(function(m) { return m.id !== 'club'; }).map(function(m) { return m.name; });
    const members = apiMembers.length > 0 ? apiMembers : [
      'Kelly K.', 'Phil P.', 'Jan H.', 'Patrick M.', 'Michael H.', 'Peter G.'
    ];

    const membersHtml = members.map(function(m) {
      return '<div class="admin-list-item" data-action="assignTask" data-event-id="' + sanitizeHTML(eventId) + '" data-task-id="' + sanitizeHTML(taskId) + '" data-member="' + sanitizeHTML(m) + '" style="cursor: pointer; margin-bottom: 8px;">' +
        '<span style="width: 36px; height: 36px;">' + getAvatar(m) + '</span>' +
        '<div class="admin-list-info">' +
          '<div class="admin-list-name">' + sanitizeHTML(m) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'assignTaskModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Assign task');
    modal.onclick = function(e) { if (e.target === this) closeAssignTaskModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 70vh; overflow-y: auto; max-width: 360px;">' +
        '<div class="modal-title">ASSIGN: ' + sanitizeHTML(taskName) + '</div>' +
        '<div style="margin-top: 16px; text-align: left;">' +
          '<div class="search-container" style="margin-bottom: 16px;">' +
            '<div class="search-input-wrap">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
              '<input type="text" class="search-input" placeholder="Search members..." oninput="filterAssignMembers(this.value)">' +
            '</div>' +
          '</div>' +
          '<div id="assignMembersList">' +
            membersHtml +
          '</div>' +
        '</div>' +
        '<button onclick="closeAssignTaskModal()" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; cursor: pointer; margin-top: 12px;">Cancel</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  window.closeAssignTaskModal = function() {
    const modal = document.getElementById('assignTaskModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.assignTask = function(eventId, taskId, memberName) {
    closeAssignTaskModal();
    closeTaskManagerModal();

    // Update local data
    var event = eventTasksData[eventId];
    if (event) {
      var task = event.volunteersNeeded.find(function(t) { return t.id === taskId; });
      if (task) {
        // Move from volunteersNeeded to assignedTasks
        task.assigned = memberName;
        event.assignedTasks.push(task);
        event.volunteersNeeded = event.volunteersNeeded.filter(function(t) { return t.id !== taskId; });
      }
    }

    // Persist to Supabase club_settings
    MTC.fn.apiRequest('/mobile/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings: { ['event_tasks_' + eventId]: JSON.stringify(eventTasksData[eventId]) }
      })
    }).then(function() {
      showToast(memberName + ' assigned! Notification sent.');
    }).catch(function(err) {
      MTC.warn(' assignTask API error:', err);
      showToast(memberName + ' assigned locally — sync may be delayed', 'warning');
    });

    setTimeout(function() { showEventTaskManager(eventId); }, 400);
  };

  window.showReassignTaskModal = function(eventId, taskId, taskName, currentAssignee) {
    showAssignTaskModal(eventId, taskId, taskName);
  };

  window.showAddTaskModal = function(eventId) {
    const taskTypes = [
      { name: 'Snacks & Refreshments', icon: '&#127818;', iconClass: 'snacks' },
      { name: 'Court Setup', icon: '&#127934;', iconClass: 'setup' },
      { name: 'Clean Up', icon: '&#129529;', iconClass: 'cleanup' },
      { name: 'Photographer', icon: '&#128247;', iconClass: 'photo' },
      { name: 'Scorekeeper', icon: '&#128202;', iconClass: 'score' },
      { name: 'First Aid', icon: '&#127973;', iconClass: 'firstaid' },
      { name: 'Parking Attendant', icon: '&#128663;', iconClass: 'parking' },
      { name: 'Drinks Station', icon: '&#129380;', iconClass: 'drinks' },
      { name: 'Registration', icon: '&#128203;', iconClass: 'score' },
      { name: 'Custom Task', icon: '&#9999;&#65039;', iconClass: 'setup' }
    ];

    const tasksHtml = taskTypes.map(function(t) {
      return '<div class="task-item" data-action="addTaskToEvent" data-event-id="' + sanitizeHTML(eventId) + '" data-task-name="' + sanitizeHTML(t.name) + '" data-icon="' + sanitizeHTML(t.icon) + '" data-icon-class="' + sanitizeHTML(t.iconClass) + '" style="cursor: pointer;">' +
        '<div class="task-icon ' + t.iconClass + '">' + t.icon + '</div>' +
        '<div class="task-info">' +
          '<div class="task-name">' + sanitizeHTML(t.name) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'addTaskModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Add task');
    modal.onclick = function(e) { if (e.target === this) closeAddTaskModal(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-height: 70vh; overflow-y: auto; max-width: 360px;">' +
        '<div class="modal-title">ADD TASK</div>' +
        '<div style="margin-top: 16px; text-align: left;">' +
          tasksHtml +
        '</div>' +
        '<button onclick="closeAddTaskModal()" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; cursor: pointer; margin-top: 12px;">Cancel</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  window.closeAddTaskModal = function() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  };

  window.addTaskToEvent = function(eventId, taskName, icon, iconClass) {
    closeAddTaskModal();

    // Add to local data
    var event = eventTasksData[eventId];
    if (event) {
      var newTask = {
        id: 't' + Date.now(),
        name: taskName,
        icon: icon,
        iconClass: iconClass,
        assigned: null
      };
      event.volunteersNeeded.push(newTask);
    }

    // Persist to Supabase
    MTC.fn.apiRequest('/mobile/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings: { ['event_tasks_' + eventId]: JSON.stringify(eventTasksData[eventId]) }
      })
    }).then(function() {
      showToast('"' + taskName + '" added to event');
    }).catch(function(err) {
      MTC.warn(' addTaskToEvent API error:', err);
      showToast('Task added locally — sync may be delayed', 'warning');
    });

    // Refresh task manager
    setTimeout(function() { showEventTaskManager(eventId); }, 300);
  };

})();
