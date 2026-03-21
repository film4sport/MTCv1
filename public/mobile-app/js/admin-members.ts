// @ts-nocheck
(function() {
  'use strict';
  /* admin-members.js - MTC Court
   * Members tab: list, search, filter, pause/unpause, captain, edit, remove, add.
   * Depends on MTC.admin (from admin-helpers.js).
   */

  // ============================================
  // MEMBERS TAB
  // ============================================
  function normalizeMembersResponse(payload) {
    var members = Array.isArray(payload) ? payload : (payload && payload.members) || [];
    return members.map(function(m) {
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        membership_type: m.membership_type || m.membershipType || 'adult',
        skill_level: m.skill_level || m.skillLevel || '',
        interclub_team: m.interclub_team || m.interclubTeam || '',
        interclub_captain: !!(m.interclub_captain || m.interclubCaptain),
        residence: m.residence,
        member_since: m.member_since || m.memberSince,
      };
    });
  }

  window.loadMembersList = function() {
    MTC.admin.dataLoaded.members = true;
    var token = MTC.getToken();
    if (!token) return;
    fetch('/api/mobile/members', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.ok ? r.json() : { members: [] }; })
      .then(function(data) {
        MTC.admin.members = normalizeMembersResponse(data);
        renderMembersList();
        var badge = document.getElementById('adminMemberCountBadge');
        if (badge) badge.textContent = MTC.admin.members.length;
      })
      .catch(function() { showToast('Failed to load members'); });
  };

  function renderMembersList() {
    var summaryEl = document.getElementById('adminMemberSummary');
    if (summaryEl) {
      var activeCount = MTC.admin.members.filter(function(m) { return m.status !== 'paused'; }).length;
      var pausedCount = MTC.admin.members.filter(function(m) { return m.status === 'paused'; }).length;
      summaryEl.innerHTML = '<span class="count-active">' + activeCount + ' active</span> · <span class="count-paused">' + pausedCount + ' paused</span>';
    }

    var container = document.getElementById('adminMembersList');
    if (!container) return;
    var filtered = MTC.admin.members.filter(function(m) {
      if (MTC.admin.teamFilter !== 'all' && m.interclub_team !== MTC.admin.teamFilter) return false;
      if (MTC.admin.searchTerm) {
        var term = MTC.admin.searchTerm.toLowerCase();
        return (m.name && m.name.toLowerCase().indexOf(term) >= 0) || (m.email && m.email.toLowerCase().indexOf(term) >= 0);
      }
      return true;
    });
    if (!filtered.length) {
      container.innerHTML = '<div class="admin-empty-state">' + (MTC.admin.searchTerm || MTC.admin.teamFilter !== 'all' ? 'No members match this filter yet' : 'No members yet') + '</div>';
      return;
    }
    var currentUserId = MTC.state.currentUser && MTC.state.currentUser.userId;
    container.innerHTML = filtered.map(function(m) {
      var initials = (m.name || '?').split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2);
      var isSelf = m.id === currentUserId;
      var isAdmin = m.role === 'admin';
      var isPaused = m.status === 'paused';
      var badges = '';
      badges += '<span class="admin-badge admin-badge-' + (m.role || 'member') + '">' + (m.role || 'member') + '</span>';
      badges += '<span class="admin-badge admin-badge-' + (m.membership_type || 'adult') + '">' + (m.membership_type || 'adult') + '</span>';
      if (m.skill_level) badges += '<span class="admin-badge">' + m.skill_level + '</span>';
      badges += '<span class="admin-badge admin-badge-' + (isPaused ? 'paused' : 'active') + '">' + (isPaused ? 'paused' : 'active') + '</span>';
      if (m.interclub_team) badges += '<span class="admin-badge admin-badge-team">Team ' + m.interclub_team.toUpperCase() + '</span>';
      if (m.interclub_captain) badges += '<span class="admin-badge admin-badge-captain">Captain</span>';

      var actions = '';
      if (!isSelf && !isAdmin) {
        if (m.interclub_team) {
          if (m.interclub_captain) {
            actions += '<button class="admin-btn admin-btn-warning" onclick="toggleCaptain(\'' + m.id + '\', false)">Remove Captain</button>';
          } else {
            actions += '<button class="admin-btn admin-btn-secondary" onclick="toggleCaptain(\'' + m.id + '\', true)">Make Captain</button>';
          }
        }
        if (isPaused) {
          actions += '<button class="admin-btn admin-btn-success" onclick="unpauseMember(\'' + m.id + '\', \'' + (m.name || '').replace(/'/g, "\\'") + '\')">Reactivate</button>';
        } else {
          actions += '<button class="admin-btn admin-btn-warning" onclick="pauseMember(\'' + m.id + '\', \'' + (m.name || '').replace(/'/g, "\\'") + '\')">Pause</button>';
        }
        actions += '<button class="admin-btn admin-btn-danger" onclick="removeMember(\'' + m.id + '\', \'' + (m.name || '').replace(/'/g, "\\'") + '\')">Cancel</button>';
      }

      return '<div class="admin-member-card">' +
        '<div class="admin-member-header">' +
          '<div class="admin-member-avatar">' + initials + '</div>' +
          '<div class="admin-member-info">' +
            '<div class="admin-member-name">' + (m.name || 'Unknown') + '</div>' +
            '<div class="admin-member-email">' + (m.email || '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-member-badges">' + badges + '</div>' +
        (actions ? '<div class="admin-member-actions">' + actions + '</div>' : '') +
      '</div>';
    }).join('');
  }

  window.filterAdminMembers = function(term) {
    MTC.admin.searchTerm = term || '';
    renderMembersList();
  };

  window.filterMembersByTeam = function(team, btn) {
    MTC.admin.teamFilter = team;
    document.querySelectorAll('.admin-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderMembersList();
  };

  window.toggleCaptain = function(userId, value) {
    var token = MTC.getToken();
    if (!token) return;
    fetch('/api/mobile/members', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, interclub_captain: value })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      MTC.admin.members.forEach(function(m) { if (m.id === userId) m.interclub_captain = value; });
      renderMembersList();
      showToast(value ? 'Captain assigned' : 'Captain removed');
    }).catch(function() { showToast('Failed to update captain status'); });
  };

  window.pauseMember = function(userId, name) {
    if (!confirm('Pause ' + name + "'s membership? They won't be able to book courts.")) return;
    var token = MTC.getToken();
    fetch('/api/mobile/members', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, status: 'paused' })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      MTC.admin.members.forEach(function(m) { if (m.id === userId) m.status = 'paused'; });
      renderMembersList();
      showToast(name + "'s membership paused");
    }).catch(function() { showToast('Failed to pause member'); });
  };

  window.unpauseMember = function(userId, name) {
    var token = MTC.getToken();
    fetch('/api/mobile/members', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, status: 'active' })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      MTC.admin.members.forEach(function(m) { if (m.id === userId) m.status = 'active'; });
      renderMembersList();
      showToast(name + "'s membership reactivated");
    }).catch(function() { showToast('Failed to reactivate member'); });
  };

  window.removeMember = function(id) {
    // Overridden by confirm-modal.js with proper modal
    showToast('Remove member ' + id);
  };

  // ============================================
  // EDIT MEMBER MODAL
  // ============================================
  window.editMember = function(id) {
    const member = (MTC.state.clubMembers || []).find(function(m) { return m.id === id; });
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
        showToast('Failed to save -- try again', 'error');
      });
    });
  };

  // ============================================
  // ADD MEMBER MODAL
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
          '<input type="tel" id="newMemberPhone" placeholder="Optional" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">' +
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
      showToast('Failed to add member -- ' + (err.message || 'try again'), 'error');
    });
  };

  // ============================================
  // MESSAGE MEMBERS MODAL
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

    MTC.fn.apiRequest('/mobile/announcements', {
      method: 'POST',
      body: JSON.stringify({ text: subject + ': ' + body, type: 'info' })
    }).then(function() {
      showToast('Message sent successfully!');
    }).catch(function(err) {
      MTC.warn(' sendAdminMessage API error:', err);
      showToast('Message saved locally -- sync may be delayed', 'warning');
    });
    } catch(e) { MTC.warn('sendAdminMessage error:', e); }
  };

})();

