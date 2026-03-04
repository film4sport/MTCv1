(function() {
  'use strict';
  /* captain.js - MTC Court
   * Captain / My Team screen: roster, team updates, match lineups
   */

  // ============================================
  // TAB SWITCHING
  // ============================================
  window.switchCaptainTab = function(tab) {
    document.querySelectorAll('.captain-content').forEach(function(c) { c.style.display = 'none'; });
    document.querySelectorAll('.captain-tab').forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    var contentId = 'captain' + tab.charAt(0).toUpperCase() + tab.slice(1);
    var tabId = 'captain' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab';

    var content = document.getElementById(contentId);
    var tabBtn = document.getElementById(tabId);
    if (content) content.style.display = 'block';
    if (tabBtn) {
      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
    }
  };

  // ============================================
  // INIT — called when navigating to captain screen
  // ============================================
  window.initCaptainScreen = function() {
    var user = MTC.state.currentUser || window.currentUser;
    if (!user || !user.interclubTeam || user.interclubTeam === 'none') return;

    var team = user.interclubTeam;
    var isCaptain = user.interclubCaptain === true;
    var isAdmin = user.role === 'admin';
    var canManage = isCaptain || isAdmin;

    // Show team label
    var label = document.getElementById('captainTeamLabel');
    if (label) {
      label.textContent = 'Team ' + team.toUpperCase();
      if (isCaptain) label.textContent += ' — Captain';
    }

    // Show/hide captain-only sections
    var addSection = document.getElementById('captainAddMemberSection');
    if (addSection) addSection.style.display = canManage ? 'block' : 'none';
    var postSection = document.getElementById('captainPostSection');
    if (postSection) postSection.style.display = canManage ? 'block' : 'none';
    var createMatchSection = document.getElementById('captainCreateMatchSection');
    if (createMatchSection) createMatchSection.style.display = canManage ? 'block' : 'none';

    // Set default match date to tomorrow
    var dateInput = document.getElementById('captainMatchDate');
    if (dateInput && !dateInput.value) {
      var tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      dateInput.value = tmrw.toISOString().split('T')[0];
    }

    // Load data
    loadCaptainRoster(team, canManage);
    loadCaptainUpdates(team);
    loadCaptainMatches(team, canManage);
  };

  // ============================================
  // ROSTER
  // ============================================
  function loadCaptainRoster(team, canManage) {
    var container = document.getElementById('captainRosterList');
    if (!container) return;

    MTC.fn.apiRequest('/mobile/members').then(function(res) {
      if (!res.ok) { container.innerHTML = '<div class="admin-empty-state">Failed to load roster</div>'; return; }
      return res.json();
    }).then(function(members) {
      if (!members) return;
      var teamMembers = members.filter(function(m) { return m.interclub_team === team; });
      if (teamMembers.length === 0) {
        container.innerHTML = '<div class="admin-empty-state">No team members yet</div>';
        return;
      }

      var html = '';
      teamMembers.forEach(function(m) {
        var avatar = typeof getAvatar === 'function' ? getAvatar(m.name) : '';
        var badges = '';
        if (m.interclub_captain) badges += '<span class="captain-badge">CAPTAIN</span>';
        if (m.skill_level) badges += '<span class="skill-badge ' + sanitizeHTML(m.skill_level) + '">' + sanitizeHTML(m.skill_level) + '</span>';

        html += '<div class="settings-item captain-roster-item">' +
          '<div class="settings-item-left">' +
            '<div class="captain-roster-avatar">' + avatar + '</div>' +
            '<div class="captain-roster-info">' +
              '<span class="settings-label">' + sanitizeHTML(m.name) + '</span>' +
              '<div class="captain-roster-badges">' + badges + '</div>' +
            '</div>' +
          '</div>';

        if (canManage && !m.interclub_captain) {
          html += '<button class="captain-remove-btn" onclick="captainRemoveMember(\'' + sanitizeHTML(m.id) + '\', \'' + sanitizeHTML(m.name).replace(/'/g, "\\'") + '\')" aria-label="Remove ' + sanitizeHTML(m.name) + ' from team">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>';
        }
        html += '</div>';
      });
      container.innerHTML = html;

      // Populate add-member dropdown (members not on any team)
      if (canManage) {
        var available = members.filter(function(m) { return !m.interclub_team || m.interclub_team === 'none'; });
        var select = document.getElementById('captainAddMemberSelect');
        if (select) {
          select.innerHTML = '<option value="">Select a member...</option>';
          available.forEach(function(m) {
            select.innerHTML += '<option value="' + sanitizeHTML(m.id) + '">' + sanitizeHTML(m.name) + '</option>';
          });
        }
      }
    }).catch(function() {
      container.innerHTML = '<div class="admin-empty-state">Failed to load roster</div>';
    });
  }

  // ============================================
  // ADD / REMOVE MEMBER
  // ============================================
  window.captainAddMember = function() {
    var select = document.getElementById('captainAddMemberSelect');
    if (!select || !select.value) { showToast('Select a member first'); return; }
    var memberId = select.value;
    var user = MTC.state.currentUser || window.currentUser;
    var team = user.interclubTeam;

    MTC.fn.apiRequest('/mobile/members', {
      method: 'PATCH',
      body: JSON.stringify({ memberId: memberId, interclub_team: team })
    }).then(function(res) {
      if (res.ok) {
        showToast('Member added to team');
        initCaptainScreen();
      } else {
        return res.json().then(function(d) { showToast(d.error || 'Failed to add member'); });
      }
    }).catch(function() { showToast('Failed to add member'); });
  };

  window.captainRemoveMember = function(memberId, memberName) {
    if (!confirm('Remove ' + memberName + ' from the team?')) return;

    MTC.fn.apiRequest('/mobile/members', {
      method: 'PATCH',
      body: JSON.stringify({ memberId: memberId, interclub_team: 'none' })
    }).then(function(res) {
      if (res.ok) {
        showToast(memberName + ' removed from team');
        initCaptainScreen();
      } else {
        return res.json().then(function(d) { showToast(d.error || 'Failed to remove member'); });
      }
    }).catch(function() { showToast('Failed to remove member'); });
  };

  // ============================================
  // TEAM UPDATES (Announcements)
  // ============================================
  function loadCaptainUpdates(team) {
    var container = document.getElementById('captainUpdatesList');
    if (!container) return;

    MTC.fn.apiRequest('/mobile/announcements').then(function(res) {
      if (!res.ok) { container.innerHTML = '<div class="admin-empty-state">Failed to load updates</div>'; return; }
      return res.json();
    }).then(function(data) {
      if (!data || !data.announcements) return;
      var audience = 'interclub_' + team;
      var teamUpdates = data.announcements.filter(function(a) {
        return a.audience === audience || a.audience === 'interclub_all';
      });
      if (teamUpdates.length === 0) {
        container.innerHTML = '<div class="admin-empty-state">No team updates yet</div>';
        return;
      }
      var html = '';
      teamUpdates.slice(0, 20).forEach(function(a) {
        var typeClass = a.type === 'urgent' ? 'captain-update-urgent' : a.type === 'warning' ? 'captain-update-warning' : 'captain-update-info';
        var dateStr = a.date ? new Date(a.date).toLocaleDateString() : '';
        html += '<div class="settings-item captain-update-item ' + typeClass + '">' +
          '<div class="captain-update-content">' +
            '<span class="captain-update-text">' + sanitizeHTML(a.text) + '</span>' +
            '<span class="captain-update-date">' + dateStr + '</span>' +
          '</div>' +
        '</div>';
      });
      container.innerHTML = html;
    }).catch(function() {
      container.innerHTML = '<div class="admin-empty-state">Failed to load updates</div>';
    });
  }

  window.captainPostUpdate = function() {
    var textEl = document.getElementById('captainUpdateText');
    var typeEl = document.getElementById('captainUpdateType');
    if (!textEl || !textEl.value.trim()) { showToast('Please write a message'); return; }

    var user = MTC.state.currentUser || window.currentUser;
    var audience = 'interclub_' + user.interclubTeam;

    MTC.fn.apiRequest('/mobile/announcements', {
      method: 'POST',
      body: JSON.stringify({
        text: textEl.value.trim(),
        type: typeEl ? typeEl.value : 'info',
        title: 'Team Update',
        audience: audience
      })
    }).then(function(res) {
      if (res.ok) {
        showToast('Update posted!');
        textEl.value = '';
        loadCaptainUpdates(user.interclubTeam);
      } else {
        return res.json().then(function(d) { showToast(d.error || 'Failed to post update'); });
      }
    }).catch(function() { showToast('Failed to post update'); });
  };

  // ============================================
  // MATCHES / LINEUPS
  // ============================================
  function loadCaptainMatches(team, canManage) {
    var container = document.getElementById('captainMatchesList');
    if (!container) return;

    MTC.fn.apiRequest('/mobile/lineups').then(function(res) {
      if (!res.ok) { container.innerHTML = '<div class="admin-empty-state">Failed to load matches</div>'; return; }
      return res.json();
    }).then(function(lineups) {
      if (!lineups || lineups.length === 0) {
        container.innerHTML = '<div class="admin-empty-state">No upcoming matches</div>';
        return;
      }
      var user = MTC.state.currentUser || window.currentUser;
      var html = '';
      lineups.forEach(function(lineup) {
        var dateStr = lineup.matchDate ? new Date(lineup.matchDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '';
        html += '<div class="captain-match-card">';
        html += '<div class="captain-match-header">';
        html += '<div class="captain-match-info">';
        html += '<div class="captain-match-date">' + dateStr + (lineup.matchTime ? ' · ' + sanitizeHTML(lineup.matchTime) : '') + '</div>';
        html += '<div class="captain-match-opponent">' + (lineup.opponent ? 'vs ' + sanitizeHTML(lineup.opponent) : 'TBD') + '</div>';
        if (lineup.location) html += '<div class="captain-match-location">' + sanitizeHTML(lineup.location) + '</div>';
        html += '</div>';
        if (canManage) {
          html += '<button class="captain-remove-btn" onclick="captainDeleteMatch(\'' + lineup.id + '\')" aria-label="Delete match">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
          '</button>';
        }
        html += '</div>';

        // Availability summary
        var available = 0, unavailable = 0, maybe = 0, pending = 0;
        (lineup.entries || []).forEach(function(e) {
          if (e.status === 'available') available++;
          else if (e.status === 'unavailable') unavailable++;
          else if (e.status === 'maybe') maybe++;
          else pending++;
        });
        html += '<div class="captain-match-summary">';
        html += '<span class="captain-avail-dot captain-avail-yes"></span>' + available + ' ';
        html += '<span class="captain-avail-dot captain-avail-maybe"></span>' + maybe + ' ';
        html += '<span class="captain-avail-dot captain-avail-no"></span>' + unavailable + ' ';
        html += '<span class="captain-avail-dot captain-avail-pending"></span>' + pending;
        html += '</div>';

        // Player entries
        html += '<div class="captain-match-entries">';
        (lineup.entries || []).forEach(function(entry) {
          var isSelf = entry.memberId === user.id;
          var statusClass = 'captain-status-' + (entry.status || 'pending');
          html += '<div class="captain-entry ' + statusClass + '">';
          html += '<span class="captain-entry-name">' + sanitizeHTML(entry.memberName || 'Unknown') + (isSelf ? ' (you)' : '') + '</span>';

          if (isSelf || canManage) {
            html += '<div class="captain-entry-actions">';
            html += '<button class="captain-avail-btn ' + (entry.status === 'available' ? 'active' : '') + '" onclick="captainSetAvailability(\'' + lineup.id + '\', \'' + entry.memberId + '\', \'available\')" title="Available">✓</button>';
            html += '<button class="captain-avail-btn captain-avail-btn-maybe ' + (entry.status === 'maybe' ? 'active' : '') + '" onclick="captainSetAvailability(\'' + lineup.id + '\', \'' + entry.memberId + '\', \'maybe\')" title="Maybe">?</button>';
            html += '<button class="captain-avail-btn captain-avail-btn-no ' + (entry.status === 'unavailable' ? 'active' : '') + '" onclick="captainSetAvailability(\'' + lineup.id + '\', \'' + entry.memberId + '\', \'unavailable\')" title="Unavailable">✗</button>';
            html += '</div>';
          } else {
            var statusLabel = entry.status === 'available' ? '✓' : entry.status === 'unavailable' ? '✗' : entry.status === 'maybe' ? '?' : '—';
            html += '<span class="captain-entry-status">' + statusLabel + '</span>';
          }
          html += '</div>';
        });
        html += '</div>';
        html += '</div>';
      });
      container.innerHTML = html;
    }).catch(function() {
      container.innerHTML = '<div class="admin-empty-state">Failed to load matches</div>';
    });
  }

  window.captainCreateMatch = function() {
    var dateEl = document.getElementById('captainMatchDate');
    if (!dateEl || !dateEl.value) { showToast('Please set a match date'); return; }

    var timeEl = document.getElementById('captainMatchTime');
    var opponentEl = document.getElementById('captainMatchOpponent');
    var locationEl = document.getElementById('captainMatchLocation');

    MTC.fn.apiRequest('/mobile/lineups', {
      method: 'POST',
      body: JSON.stringify({
        matchDate: dateEl.value,
        matchTime: timeEl ? timeEl.value : null,
        opponent: opponentEl ? opponentEl.value : null,
        location: locationEl ? locationEl.value : null
      })
    }).then(function(res) {
      if (res.ok) {
        showToast('Match created!');
        dateEl.value = '';
        if (timeEl) timeEl.value = '';
        if (opponentEl) opponentEl.value = '';
        if (locationEl) locationEl.value = '';
        var user = MTC.state.currentUser || window.currentUser;
        loadCaptainMatches(user.interclubTeam, true);
      } else {
        return res.json().then(function(d) { showToast(d.error || 'Failed to create match'); });
      }
    }).catch(function() { showToast('Failed to create match'); });
  };

  window.captainDeleteMatch = function(lineupId) {
    if (!confirm('Delete this match and all availability data?')) return;

    MTC.fn.apiRequest('/mobile/lineups?id=' + encodeURIComponent(lineupId), {
      method: 'DELETE'
    }).then(function(res) {
      if (res.ok) {
        showToast('Match deleted');
        var user = MTC.state.currentUser || window.currentUser;
        loadCaptainMatches(user.interclubTeam, true);
      } else {
        return res.json().then(function(d) { showToast(d.error || 'Failed to delete match'); });
      }
    }).catch(function() { showToast('Failed to delete match'); });
  };

  window.captainSetAvailability = function(lineupId, memberId, status) {
    MTC.fn.apiRequest('/mobile/lineups', {
      method: 'PATCH',
      body: JSON.stringify({ lineupId: lineupId, memberId: memberId, status: status })
    }).then(function(res) {
      if (res.ok) {
        showToast('Availability updated');
        var user = MTC.state.currentUser || window.currentUser;
        var canManage = user.interclubCaptain === true || user.role === 'admin';
        loadCaptainMatches(user.interclubTeam, canManage);
      } else {
        return res.json().then(function(d) { showToast(d.error || 'Failed to update'); });
      }
    }).catch(function() { showToast('Failed to update availability'); });
  };

})();
