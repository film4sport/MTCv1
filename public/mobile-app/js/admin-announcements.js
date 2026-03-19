(function() {
  'use strict';
  /* admin-announcements.js - MTC Court
   * Announcements tab: history, post, delete, edit, coach announcements.
   * Depends on MTC.admin (from admin-helpers.js).
   */

  // ============================================
  // ANNOUNCEMENTS TAB
  // ============================================
  window.loadAnnouncementHistory = function() {
    MTC.admin.dataLoaded.announcements = true;
    var token = MTC.getToken();
    if (!token) return;
    fetch('/api/mobile/announcements', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.ok ? r.json() : { announcements: [] }; })
      .then(function(data) {
        var container = document.getElementById('adminAnnouncementHistory');
        if (!container) return;
        var anns = Array.isArray(data) ? data : (data.announcements || []);
        if (!anns.length) { container.innerHTML = '<div class="admin-empty-state">No announcements yet. Post one above when you need to update members.</div>'; return; }
        container.innerHTML = anns.map(function(a) {
          var icon = a.type === 'urgent' ? '<span style="color:#ef4444">URGENT</span>' : a.type === 'warning' ? '<span style="color:#f59e0b">WARNING</span>' : '<span style="color:#3b82f6">INFO</span>';
          var audience = a.audience && a.audience !== 'all' ? ' <span class="admin-badge admin-badge-team">' + a.audience + '</span>' : '';
          return '<div class="admin-card" style="margin-bottom:8px">' +
            '<div style="display:flex;justify-content:space-between;align-items:start">' +
              '<div style="flex:1">' +
                '<div style="font-size:12px;margin-bottom:4px">' + icon + audience + ' · ' + (a.date || '') + '</div>' +
                '<div style="font-size:14px;color:var(--text-primary)">' + (a.text || a.message || '') + '</div>' +
              '</div>' +
              '<button class="admin-btn admin-btn-danger" style="min-height:32px;padding:4px 10px;font-size:11px" onclick="deleteAdminAnnouncement(\'' + a.id + '\')">Delete</button>' +
            '</div>' +
          '</div>';
        }).join('');
      });
  };

  window.postAdminAnnouncement = function() {
    var msg = document.getElementById('adminAnnMessage');
    var type = document.getElementById('adminAnnType');
    var audience = document.getElementById('adminAnnAudience');
    if (!msg || !msg.value.trim()) { showToast('Write an announcement message'); if (msg) msg.focus(); return; }
    var token = MTC.getToken();
    var title = document.getElementById('adminAnnTitle');
    fetch('/api/mobile/announcements', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: msg.value.trim(),
        title: title && title.value.trim() ? title.value.trim() : undefined,
        type: type ? type.value : 'info',
        audience: audience ? audience.value : 'all'
      })
    }).then(function(r) {
      if (!r.ok) return r.json().then(function(err) { throw new Error(err.error || 'Failed'); });
      msg.value = '';
      if (title) title.value = '';
      showToast('Announcement sent');
      MTC.admin.dataLoaded.announcements = false;
      loadAnnouncementHistory();
    }).catch(function(e) { showToast(e.message || 'Failed to post announcement'); });
  };

  window.deleteAdminAnnouncement = function(id) {
    if (!confirm('Delete this announcement?')) return;
    var token = MTC.getToken();
    fetch('/api/mobile/announcements', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function(r) {
      if (!r.ok) return r.json().then(function(err) { throw new Error(err.error || 'Failed'); });
      MTC.admin.dataLoaded.announcements = false;
      loadAnnouncementHistory();
      showToast('Announcement removed');
    }).catch(function(e) { showToast(e.message || 'Failed to delete announcement'); });
  };

  window.postAnnouncement = function() {
    const title = document.getElementById('announcementTitle').value;
    const message = document.getElementById('announcementMessage').value;

    if (!title || !message) {
      showToast('Please fill in title and message');
      return;
    }

    var token = MTC.getToken();
    if (token && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/announcements', {
        method: 'POST',
        body: JSON.stringify({ text: title + ': ' + message, type: 'info', title: title, audience: 'all' })
      }).then(function(res) {
        if (res.ok) {
          showToast('Announcement sent');
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
        MTC.fn.apiRequest('/mobile/announcements', {
          method: 'DELETE',
          body: JSON.stringify({ id: id })
        }).then(function() {
          showToast('Announcement deleted');
        }).catch(function(err) {
          MTC.warn(' deleteAnnouncement API error:', err);
          showToast('Announcement deleted locally -- sync may be delayed', 'warning');
        });
      }
    });
  };

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

    MTC.fn.apiRequest('/mobile/announcements', {
      method: 'POST',
      body: JSON.stringify({ text: title + ': ' + message, type: 'coaching' })
    }).then(function() {
      showToast('Announcement sent');
    }).catch(function(err) {
      MTC.warn(' sendCoachAnnouncement API error:', err);
      showToast('Announcement saved locally -- sync may be delayed', 'warning');
    });
    } catch(e) { MTC.warn('sendCoachAnnouncement error:', e); }
  };

})();
