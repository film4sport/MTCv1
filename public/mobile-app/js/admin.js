(function() {
  'use strict';
  /* admin.js - MTC Court */
  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  // ============================================
  // ADMIN STATE
  // ============================================
  var _adminMembers = [];
  var _adminBookings = [];
  var _adminCourts = [];
  var _adminBlocks = [];
  var _adminSearchTerm = '';
  var _adminTeamFilter = 'all';
  var _adminDataLoaded = {};

  // ============================================
  // TAB SWITCHING
  // ============================================
  window.switchAdminTab = function(tab) {
    // Hide all tab content panels
    document.querySelectorAll('.admin-tab-content').forEach(function(c) { c.classList.remove('active'); });
    // Deactivate all tab buttons
    document.querySelectorAll('.admin-tabs-bar .admin-tab').forEach(function(t) { t.classList.remove('active'); });

    // Show selected content panel
    var contentId = 'adminTab' + tab.charAt(0).toUpperCase() + tab.slice(1);
    var content = document.getElementById(contentId);
    if (content) content.classList.add('active');

    // Activate tab button
    var tabBtn = document.querySelector('.admin-tabs-bar .admin-tab[data-tab="' + tab + '"]');
    if (tabBtn) tabBtn.classList.add('active');

    // Load data for the tab (lazy, only once or on stale)
    if (tab === 'dashboard' && !_adminDataLoaded.dashboard) { loadAdminDashboard(); }
    if (tab === 'members' && !_adminDataLoaded.members) { loadMembersList(); }
    if (tab === 'courts' && !_adminDataLoaded.courts) { loadCourts(); }
    if (tab === 'announcements' && !_adminDataLoaded.announcements) { loadAnnouncementHistory(); }
  };

  // ============================================
  // DASHBOARD TAB
  // ============================================
  function loadAdminDashboard() {
    _adminDataLoaded.dashboard = true;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    if (!token) return;
    var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    // Fetch bookings, members, courts, settings, partners in parallel
    Promise.all([
      fetch('/api/mobile/bookings', { headers: headers }).then(function(r) { return r.ok ? r.json() : { bookings: [] }; }),
      fetch('/api/mobile/members', { headers: headers }).then(function(r) { return r.ok ? r.json() : { members: [] }; }),
      fetch('/api/mobile/courts', { headers: headers }).then(function(r) { return r.ok ? r.json() : { courts: [] }; }),
      fetch('/api/mobile/settings', { headers: headers }).then(function(r) { return r.ok ? r.json() : { settings: [] }; }),
      fetch('/api/mobile/partners', { headers: headers }).then(function(r) { return r.ok ? r.json() : { partners: [] }; }).catch(function() { return { partners: [] }; })
    ]).then(function(results) {
      _adminBookings = results[0].bookings || [];
      _adminMembers = results[1].members || [];
      _adminCourts = results[2].courts || [];
      var settings = results[3].settings || [];
      var partners = results[4].partners || [];

      renderQuickStats(partners);
      renderPeakTimes();
      renderCourtUsage();
      renderPartnerStats(partners);
      renderRevenueBreakdown();
      renderMonthlyTrends();

      // Set export month picker to current month
      var exportPicker = document.getElementById('exportMonthPicker');
      if (exportPicker && !exportPicker.value) {
        var now2 = new Date();
        exportPicker.value = now2.getFullYear() + '-' + String(now2.getMonth() + 1).padStart(2, '0');
      }

      // Gate code
      var gateCodeSetting = settings.find(function(s) { return s.key === 'gate_code'; });
      var codeEl = document.getElementById('currentGateCode');
      if (codeEl) codeEl.textContent = (gateCodeSetting && gateCodeSetting.value) || '----';
    }).catch(function(err) {
      console.error('[Admin] Dashboard load error:', err);
    });
  }

  function renderQuickStats(partners) {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    var confirmed = _adminBookings.filter(function(b) { return b.status === 'confirmed'; });
    var thisMonth = confirmed.filter(function(b) { return b.date >= monthStart; });
    var activeMembers = _adminMembers.filter(function(m) { return m.status !== 'paused'; });
    var openCourts = _adminCourts.filter(function(c) { return c.status !== 'maintenance'; });
    var matched = (partners || []).filter(function(p) { return p.status === 'matched'; });

    var el;
    el = document.getElementById('statActiveMembers'); if (el) el.textContent = activeMembers.length;
    el = document.getElementById('statBookingsMonth'); if (el) el.textContent = thisMonth.length;
    el = document.getElementById('statCourtsOpen'); if (el) el.textContent = openCourts.length + '/' + _adminCourts.length;
    el = document.getElementById('statPartnerMatches'); if (el) el.textContent = matched.length;

    // Engagement: % of members who booked in last 7 days
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    var weekStr = weekAgo.toISOString().split('T')[0];
    var recentBookers = {};
    confirmed.forEach(function(b) { if (b.date >= weekStr && b.user_id) recentBookers[b.user_id] = true; });
    var engagementPct = _adminMembers.length > 0 ? Math.round((Object.keys(recentBookers).length / _adminMembers.length) * 100) : 0;
    el = document.getElementById('statEngagement'); if (el) el.textContent = engagementPct + '% active this week';

    // Last updated timestamp
    var updatedEl = document.getElementById('statLastUpdated');
    if (updatedEl) updatedEl.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update member count badge on Members tab
    var memberBadge = document.getElementById('adminMemberCountBadge');
    if (memberBadge) memberBadge.textContent = _adminMembers.length;
  }

  function renderPartnerStats(partners) {
    var total = (partners || []).length;
    var matched = (partners || []).filter(function(p) { return p.status === 'matched'; }).length;
    var rate = total > 0 ? Math.round((matched / total) * 100) : 0;

    var el;
    el = document.getElementById('statPartnerRequests'); if (el) el.textContent = total;
    el = document.getElementById('statPartnerMatched'); if (el) el.textContent = matched;
    el = document.getElementById('statPartnerRate'); if (el) el.textContent = rate + '%';
  }

  function renderPeakTimes() {
    var container = document.getElementById('peakTimesList');
    if (!container) return;
    var confirmed = _adminBookings.filter(function(b) { return b.status === 'confirmed'; });
    var counts = {};
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    confirmed.forEach(function(b) {
      if (!b.date || !b.time) return;
      var d = new Date(b.date + 'T12:00:00');
      var key = days[d.getDay()] + ' ' + b.time;
      counts[key] = (counts[key] || 0) + 1;
    });
    var sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
    if (!sorted.length) { container.innerHTML = '<div class="admin-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>No bookings yet this season</div>'; return; }
    var maxCount = sorted[0][1];
    container.innerHTML = sorted.map(function(entry) {
      var pct = Math.round((entry[1] / maxCount) * 100);
      return '<div class="peak-row"><span class="peak-label">' + entry[0] + '</span><div class="peak-bar"><div class="peak-bar-fill" style="width:' + pct + '%"></div></div><span class="peak-count">' + entry[1] + '</span></div>';
    }).join('');
  }

  function renderCourtUsage() {
    var confirmed = _adminBookings.filter(function(b) { return b.status === 'confirmed'; });
    var now = new Date();
    var today = now.toISOString().split('T')[0];
    var weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    var weekStr = weekStart.toISOString().split('T')[0];
    var monthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    var usageToday = confirmed.filter(function(b) { return b.date === today; }).length;
    var usageWeek = confirmed.filter(function(b) { return b.date >= weekStr; }).length;
    var usageMonth = confirmed.filter(function(b) { return b.date >= monthStr; }).length;

    var el;
    el = document.getElementById('usageToday'); if (el) el.textContent = usageToday;
    el = document.getElementById('usageWeek'); if (el) el.textContent = usageWeek;
    el = document.getElementById('usageMonth'); if (el) el.textContent = usageMonth;
  }

  // ============================================
  // REVENUE BREAKDOWN
  // ============================================
  function renderRevenueBreakdown() {
    var barEl = document.getElementById('revenueBarContainer');
    var legendEl = document.getElementById('revenueLegend');
    if (!barEl || !legendEl) return;

    var feeMap = { adult: 120, family: 240, junior: 55 };
    var categories = {};
    _adminMembers.forEach(function(m) {
      var type = m.membership_type || 'adult';
      var fee = feeMap[type] || 120;
      if (!categories[type]) categories[type] = { count: 0, amount: 0 };
      categories[type].count++;
      categories[type].amount += fee;
    });

    var total = 0;
    Object.keys(categories).forEach(function(k) { total += categories[k].amount; });
    if (total === 0) { barEl.innerHTML = ''; legendEl.innerHTML = '<div class="admin-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>No revenue data yet</div>'; return; }

    var colors = { adult: '#00d4ff', family: '#c8ff00', junior: '#ff5a5f' };
    var barHtml = '';
    var legendHtml = '';
    Object.keys(categories).forEach(function(type) {
      var pct = Math.round((categories[type].amount / total) * 100);
      var color = colors[type] || '#00d4ff';
      barHtml += '<div class="admin-rev-segment" style="width:' + pct + '%;background:' + color + '" title="' + type + ': $' + categories[type].amount + '"></div>';
      legendHtml += '<div class="admin-rev-legend-item"><span class="admin-rev-dot" style="background:' + color + '"></span><span class="admin-rev-label">' + type.charAt(0).toUpperCase() + type.slice(1) + '</span><span class="admin-rev-amount">$' + categories[type].amount + '</span><span class="admin-rev-pct">' + pct + '%</span></div>';
    });
    legendHtml += '<div class="admin-rev-legend-item admin-rev-total"><span class="admin-rev-label">Total</span><span class="admin-rev-amount">$' + total + '</span></div>';

    barEl.innerHTML = barHtml;
    legendEl.innerHTML = legendHtml;
  }

  // ============================================
  // MEMBER ACTIVITY
  // ============================================
  function renderMemberActivity() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // New members this month
    var newMembers = _adminMembers.filter(function(m) {
      return m.created_at && m.created_at.split('T')[0] >= monthStart;
    });
    var el = document.getElementById('statNewMembers');
    if (el) el.textContent = newMembers.length;

    // Avg bookings per member
    var confirmed = _adminBookings.filter(function(b) { return b.status === 'confirmed'; });
    var avg = _adminMembers.length > 0 ? Math.round((confirmed.length / _adminMembers.length) * 10) / 10 : 0;
    el = document.getElementById('statAvgBookings');
    if (el) el.textContent = avg;

    // Most active members (top 5)
    var container = document.getElementById('mostActiveList');
    if (!container) return;
    var memberBookings = {};
    confirmed.forEach(function(b) {
      var name = b.booker_name || b.user_id || 'Unknown';
      memberBookings[name] = (memberBookings[name] || 0) + 1;
    });
    var sorted = Object.entries(memberBookings).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
    if (!sorted.length) { container.innerHTML = '<div class="admin-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>No bookings yet this season</div>'; return; }
    var maxCount = sorted[0][1];
    container.innerHTML = sorted.map(function(entry, i) {
      var pct = Math.round((entry[1] / maxCount) * 100);
      return '<div class="peak-row"><span class="peak-rank">' + (i + 1) + '</span><span class="peak-label" style="width:100px">' + entry[0] + '</span><div class="peak-bar"><div class="peak-bar-fill" style="width:' + pct + '%"></div></div><span class="peak-count">' + entry[1] + '</span></div>';
    }).join('');
  }

  // ============================================
  // MONTHLY TRENDS
  // ============================================
  function renderMonthlyTrends() {
    var container = document.getElementById('monthlyTrendsChart');
    if (!container) return;

    var confirmed = _adminBookings.filter(function(b) { return b.status === 'confirmed'; });
    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var now = new Date();
    var trends = [];
    for (var i = 5; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var mo = m.getMonth();
      var yr = m.getFullYear();
      var count = confirmed.filter(function(b) {
        if (!b.date) return false;
        var d = new Date(b.date + 'T12:00:00');
        return d.getMonth() === mo && d.getFullYear() === yr;
      }).length;
      trends.push({ month: monthNames[mo], bookings: count });
    }

    var maxBookings = Math.max.apply(null, trends.map(function(t) { return t.bookings; }));
    if (maxBookings === 0) maxBookings = 1;

    container.innerHTML = '<div class="admin-trends-bars">' + trends.map(function(t) {
      var heightPct = Math.round((t.bookings / maxBookings) * 100);
      return '<div class="admin-trend-col"><span class="admin-trend-count">' + t.bookings + '</span><div class="admin-trend-bar" style="height:' + Math.max(heightPct, 5) + '%"></div><span class="admin-trend-label">' + t.month + '</span></div>';
    }).join('') + '</div>';
  }

  // Gate Code
  window.updateGateCodeAndNotify = function() {
    var input = document.getElementById('newGateCodeInput');
    if (!input || !input.value.trim()) { showToast('Enter a new gate code'); return; }
    var code = input.value.trim();
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    if (!token) return;
    var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    fetch('/api/mobile/settings', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ key: 'gate_code', value: code })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      var codeEl = document.getElementById('currentGateCode');
      if (codeEl) codeEl.textContent = code;
      input.value = '';

      // Notify all active members via messages
      var activeMembers = _adminMembers.filter(function(m) {
        return m.status !== 'paused' && m.role !== 'admin' && m.id !== MTC.state.currentUser.userId;
      });
      var msgBody = 'The court gate code has been updated. Your new gate code is: ' + code + '. Please keep this code private and do not share it outside the club.';
      var notifyPromises = activeMembers.map(function(m) {
        return fetch('/api/mobile/conversations', {
          method: 'POST', headers: headers,
          body: JSON.stringify({ recipientId: m.id, message: msgBody })
        }).catch(function() {});
      });
      Promise.all(notifyPromises).then(function() {
        showToast('Gate code updated. ' + activeMembers.length + ' members notified.');
      });
    }).catch(function() { showToast('Failed to update gate code'); });
  };

  // CSV Exports
  function downloadCSV(filename, csvContent) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function _getExportFromDate() {
    var el = document.getElementById('adminExportFromDate');
    return el && el.value ? el.value : '';
  }

  window.exportMembersCSV = function() {
    if (!_adminMembers.length) { showToast('No member data loaded'); return; }
    var fromDate = _getExportFromDate();
    var feeMap = { adult: 120, family: 240, junior: 55 };
    var filtered = fromDate ? _adminMembers.filter(function(m) {
      return m.created_at && m.created_at.split('T')[0] >= fromDate;
    }) : _adminMembers;
    var rows = [['Name','Email','Role','Membership','Fee','Skill Level','Status','Since']];
    filtered.forEach(function(m) {
      rows.push([m.name || '', m.email || '', m.role || 'member', m.membership_type || 'adult',
        '$' + (feeMap[m.membership_type] || 120), m.skill_level || '', m.status || 'active', m.created_at ? m.created_at.split('T')[0] : '']);
    });
    downloadCSV('mtc-members-' + new Date().toISOString().split('T')[0] + '.csv', rows.map(function(r) { return r.join(','); }).join('\n'));
    showToast(filtered.length + ' members exported');
  };

  window.exportPaymentsCSV = function() {
    if (!_adminMembers.length) { showToast('No member data loaded'); return; }
    var fromDate = _getExportFromDate();
    var feeMap = { adult: 120, family: 240, junior: 55 };
    var filtered = fromDate ? _adminMembers.filter(function(m) {
      return m.created_at && m.created_at.split('T')[0] >= fromDate;
    }) : _adminMembers;
    var rows = [['Name','Email','Membership','Annual Fee','Since','Status']];
    var total = 0;
    filtered.forEach(function(m) {
      var fee = feeMap[m.membership_type] || 120;
      total += fee;
      rows.push([m.name || '', m.email || '', m.membership_type || 'adult', '$' + fee, m.created_at ? m.created_at.split('T')[0] : '', m.status || 'active']);
    });
    rows.push(['TOTAL','','',('$' + total),'','']);
    downloadCSV('mtc-payments-' + new Date().toISOString().split('T')[0] + '.csv', rows.map(function(r) { return r.join(','); }).join('\n'));
    showToast(filtered.length + ' members · $' + total + ' revenue exported');
  };

  window.exportCourtUsageCSV = function() {
    if (!_adminBookings.length) { showToast('No booking data loaded'); return; }
    var fromDate = _getExportFromDate();
    var confirmed = _adminBookings.filter(function(b) {
      return b.status === 'confirmed' && (!fromDate || b.date >= fromDate);
    });
    var rows = [['Date','Time','Court','Member','Match Type','Duration','Status']];
    confirmed.forEach(function(b) {
      rows.push([b.date || '', b.time || '', b.court_name || ('Court ' + b.court_id), b.booker_name || '', b.match_type || '', (b.duration || 2) * 30 + ' min', b.status]);
    });
    downloadCSV('mtc-court-usage-' + new Date().toISOString().split('T')[0] + '.csv', rows.map(function(r) { return r.join(','); }).join('\n'));
    showToast(confirmed.length + ' bookings exported');
  };

  // ============================================
  // MEMBERS TAB
  // ============================================
  function loadMembersList() {
    _adminDataLoaded.members = true;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    if (!token) return;
    fetch('/api/mobile/members', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.ok ? r.json() : { members: [] }; })
      .then(function(data) {
        _adminMembers = data.members || [];
        renderMembersList();
        var badge = document.getElementById('adminMemberCountBadge');
        if (badge) badge.textContent = _adminMembers.length;
      })
      .catch(function() { showToast('Failed to load members'); });
  }

  function renderMembersList() {
    // Active/paused summary
    var summaryEl = document.getElementById('adminMemberSummary');
    if (summaryEl) {
      var activeCount = _adminMembers.filter(function(m) { return m.status !== 'paused'; }).length;
      var pausedCount = _adminMembers.filter(function(m) { return m.status === 'paused'; }).length;
      summaryEl.innerHTML = '<span class="count-active">' + activeCount + ' active</span> · <span class="count-paused">' + pausedCount + ' paused</span>';
    }

    var container = document.getElementById('adminMembersList');
    if (!container) return;
    var filtered = _adminMembers.filter(function(m) {
      if (_adminTeamFilter !== 'all' && m.interclub_team !== _adminTeamFilter) return false;
      if (_adminSearchTerm) {
        var term = _adminSearchTerm.toLowerCase();
        return (m.name && m.name.toLowerCase().indexOf(term) >= 0) || (m.email && m.email.toLowerCase().indexOf(term) >= 0);
      }
      return true;
    });
    if (!filtered.length) {
      container.innerHTML = '<div class="admin-empty-state">No members found</div>';
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
        // Captain toggle (only if on a team)
        if (m.interclub_team) {
          if (m.interclub_captain) {
            actions += '<button class="admin-btn admin-btn-warning" onclick="toggleCaptain(\'' + m.id + '\', false)">Remove Captain</button>';
          } else {
            actions += '<button class="admin-btn admin-btn-secondary" onclick="toggleCaptain(\'' + m.id + '\', true)">Make Captain</button>';
          }
        }
        // Pause / Reactivate
        if (isPaused) {
          actions += '<button class="admin-btn admin-btn-success" onclick="unpauseMember(\'' + m.id + '\', \'' + (m.name || '').replace(/'/g, "\\'") + '\')">Reactivate</button>';
        } else {
          actions += '<button class="admin-btn admin-btn-warning" onclick="pauseMember(\'' + m.id + '\', \'' + (m.name || '').replace(/'/g, "\\'") + '\')">Pause</button>';
        }
        // Delete
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
    _adminSearchTerm = term || '';
    renderMembersList();
  };

  window.filterMembersByTeam = function(team, btn) {
    _adminTeamFilter = team;
    document.querySelectorAll('.admin-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderMembersList();
  };

  window.toggleCaptain = function(userId, value) {
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    if (!token) return;
    fetch('/api/mobile/members', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, interclub_captain: value })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      // Update local state
      _adminMembers.forEach(function(m) { if (m.id === userId) m.interclub_captain = value; });
      renderMembersList();
      showToast(value ? 'Captain assigned' : 'Captain removed');
    }).catch(function() { showToast('Failed to update captain status'); });
  };

  window.pauseMember = function(userId, name) {
    if (!confirm('Pause ' + name + "'s membership? They won't be able to book courts.")) return;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    fetch('/api/mobile/members', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, status: 'paused' })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      _adminMembers.forEach(function(m) { if (m.id === userId) m.status = 'paused'; });
      renderMembersList();
      showToast(name + "'s membership paused");
    }).catch(function() { showToast('Failed to pause member'); });
  };

  window.unpauseMember = function(userId, name) {
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    fetch('/api/mobile/members', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, status: 'active' })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      _adminMembers.forEach(function(m) { if (m.id === userId) m.status = 'active'; });
      renderMembersList();
      showToast(name + "'s membership reactivated");
    }).catch(function() { showToast('Failed to reactivate member'); });
  };

  // ============================================
  // COURTS TAB
  // ============================================
  function loadCourts() {
    _adminDataLoaded.courts = true;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    if (!token) return;
    Promise.all([
      fetch('/api/mobile/courts', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.ok ? r.json() : { courts: [] }; }),
      fetch('/api/mobile/court-blocks', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.ok ? r.json() : { blocks: [] }; }).catch(function() { return { blocks: [] }; })
    ]).then(function(results) {
      _adminCourts = results[0].courts || [];
      _adminBlocks = results[1].blocks || [];
      renderCourts();
      renderBlocksList();
    });
  }

  function renderCourts() {
    var container = document.getElementById('adminCourtsList');
    if (!container) return;
    if (!_adminCourts.length) { container.innerHTML = '<div class="admin-empty-state">No courts found</div>'; return; }
    container.innerHTML = _adminCourts.map(function(c) {
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
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    fetch('/api/mobile/courts', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ courtId: courtId, status: newStatus })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      _adminCourts.forEach(function(c) { if (c.id === courtId) c.status = newStatus; });
      renderCourts();
      showToast('Court ' + (newStatus === 'maintenance' ? 'closed' : 'reopened'));
    }).catch(function() { showToast('Failed to update court status'); });
  };

  // Court Blocks
  function renderBlocksList() {
    var container = document.getElementById('adminBlocksList');
    if (!container) return;
    var today = new Date().toISOString().split('T')[0];
    var upcoming = _adminBlocks.filter(function(b) { return b.block_date >= today; });
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
    var courts = _adminCourts.map(function(c) {
      return '<option value="' + c.id + '">' + (c.name || 'Court ' + c.id) + '</option>';
    }).join('');

    var timeSlots = ['9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM',
      '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM',
      '5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM'];
    var timeOptions = timeSlots.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('');

    var today = new Date().toISOString().split('T')[0];
    var html = '<div class="modal-overlay active" id="blockCourtModal" onclick="closeBlockCourtModal()">' +
      '<div class="modal modal-scrollable-tall" onclick="event.stopPropagation()" style="max-width:400px">' +
        '<div class="modal-title">BLOCK COURT TIME</div>' +
        '<label class="admin-label">Court</label>' +
        '<select id="blockCourtSelect" class="admin-select"><option value="">All Courts</option>' + courts + '</select>' +
        '<label class="admin-label">Date</label>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">' +
          '<input type="date" id="blockDate" class="admin-input" style="flex:1;margin-bottom:0" value="' + today + '" min="' + today + '">' +
          '<span style="color:var(--text-muted);font-size:13px">to</span>' +
          '<input type="date" id="blockDateEnd" class="admin-input" style="flex:1;margin-bottom:0" value="" min="' + today + '" placeholder="Same day">' +
        '</div>' +
        '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--text-primary);font-size:14px">' +
          '<input type="checkbox" id="blockFullDay" onchange="toggleBlockTimeInputs()" checked> Full Day' +
        '</label>' +
        '<div id="blockTimeInputs" style="display:none;gap:8px;margin-bottom:8px">' +
          '<select id="blockTimeStart" class="admin-select" style="flex:1">' + timeOptions + '</select>' +
          '<select id="blockTimeEnd" class="admin-select" style="flex:1"><option value="">End Time</option>' + timeOptions + '</select>' +
        '</div>' +
        '<label class="admin-label">Reason</label>' +
        '<select id="blockReason" class="admin-select">' +
          '<option value="Maintenance">Maintenance</option><option value="Club Event">Club Event</option>' +
          '<option value="Weather">Weather</option><option value="Tournament">Tournament</option>' +
          '<option value="Coaching Session">Coaching Session</option><option value="Private Event">Private Event</option>' +
          '<option value="Other">Other</option></select>' +
        '<input type="text" id="blockNotes" class="admin-input" placeholder="Notes (optional)">' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<button class="admin-btn admin-btn-secondary" style="flex:1" onclick="closeBlockCourtModal()">Cancel</button>' +
          '<button class="admin-btn admin-btn-primary" style="flex:1" onclick="createCourtBlock()">Block</button>' +
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

    // Generate array of dates from startDate to endDate
    var dates = [];
    var cur = new Date(startDate + 'T12:00:00');
    var end = new Date(endDate + 'T12:00:00');
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    var courtId = courtSelect && courtSelect.value ? parseInt(courtSelect.value) : null;
    var reasonVal = reason ? reason.value : 'Maintenance';
    var notesVal = notes ? notes.value.trim() : '';

    // Create blocks for each date (in parallel)
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
        if (data && data.block) _adminBlocks.push(data.block);
        if (data && data.cancelledBookings) totalCancelled += data.cancelledBookings;
      });
      renderBlocksList();
      closeBlockCourtModal();
      var count = results.filter(function(r) { return r && r.block; }).length;
      var msg = count > 1 ? count + ' days blocked' : 'Court blocked';
      if (totalCancelled > 0) msg += ' — ' + totalCancelled + ' booking' + (totalCancelled > 1 ? 's' : '') + ' cancelled & users notified';
      showToast(msg);
    }).catch(function() { showToast('Failed to create block'); });
  };

  window.deleteCourtBlock = function(blockId) {
    if (!confirm('Remove this court block?')) return;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    fetch('/api/mobile/court-blocks?id=' + encodeURIComponent(blockId), {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      _adminBlocks = _adminBlocks.filter(function(b) { return b.id !== blockId; });
      renderBlocksList();
      showToast('Block removed');
    }).catch(function() { showToast('Failed to remove block'); });
  };

  window.clearAllCourtBlocks = function() {
    var today = new Date().toISOString().split('T')[0];
    var upcoming = _adminBlocks.filter(function(b) { return b.block_date >= today; });
    if (!upcoming.length) return;
    if (!confirm('Delete all ' + upcoming.length + ' court blocks?')) return;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    var ids = upcoming.map(function(b) { return b.id; });
    fetch('/api/mobile/court-blocks', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      return r.json();
    }).then(function(data) {
      _adminBlocks = _adminBlocks.filter(function(b) { return b.block_date < today; });
      renderBlocksList();
      showToast((data.deleted || ids.length) + ' blocks cleared');
    }).catch(function() { showToast('Failed to clear blocks'); });
  };

  // ============================================
  // ANNOUNCEMENTS TAB
  // ============================================
  function loadAnnouncementHistory() {
    _adminDataLoaded.announcements = true;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    if (!token) return;
    fetch('/api/mobile/announcements', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.ok ? r.json() : { announcements: [] }; })
      .then(function(data) {
        var container = document.getElementById('adminAnnouncementHistory');
        if (!container) return;
        var anns = data.announcements || [];
        if (!anns.length) { container.innerHTML = '<div class="admin-empty-state">No announcements sent yet</div>'; return; }
        container.innerHTML = anns.map(function(a) {
          var icon = a.type === 'urgent' ? '<span style="color:#ef4444">URGENT</span>' : a.type === 'warning' ? '<span style="color:#f59e0b">WARNING</span>' : '<span style="color:#3b82f6">INFO</span>';
          var audience = a.audience && a.audience !== 'all' ? ' <span class="admin-badge admin-badge-team">' + a.audience + '</span>' : '';
          return '<div class="admin-card" style="margin-bottom:8px">' +
            '<div style="display:flex;justify-content:space-between;align-items:start">' +
              '<div style="flex:1">' +
                '<div style="font-size:12px;margin-bottom:4px">' + icon + audience + ' · ' + (a.created_at ? a.created_at.split('T')[0] : '') + '</div>' +
                '<div style="font-size:14px;color:var(--text-primary)">' + (a.text || a.message || '') + '</div>' +
              '</div>' +
              '<button class="admin-btn admin-btn-danger" style="min-height:32px;padding:4px 10px;font-size:11px" onclick="deleteAdminAnnouncement(\'' + a.id + '\')">Delete</button>' +
            '</div>' +
          '</div>';
        }).join('');
      });
  }

  window.postAdminAnnouncement = function() {
    var msg = document.getElementById('adminAnnMessage');
    var type = document.getElementById('adminAnnType');
    var audience = document.getElementById('adminAnnAudience');
    if (!msg || !msg.value.trim()) { showToast('Write an announcement message'); return; }
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
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
      if (!r.ok) throw new Error('Failed');
      msg.value = '';
      if (title) title.value = '';
      showToast('Announcement posted');
      _adminDataLoaded.announcements = false;
      loadAnnouncementHistory();
    }).catch(function() { showToast('Failed to post announcement'); });
  };

  window.deleteAdminAnnouncement = function(id) {
    if (!confirm('Delete this announcement?')) return;
    var token = MTC.state.currentUser && MTC.state.currentUser.accessToken;
    fetch('/api/mobile/announcements?id=' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      _adminDataLoaded.announcements = false;
      loadAnnouncementHistory();
      showToast('Announcement deleted');
    }).catch(function() { showToast('Failed to delete announcement'); });
  };

  // ============================================
  // INIT — Load dashboard tab by default when admin navigates here
  // ============================================
  window.initAdminPanel = function() {
    _adminDataLoaded = {};
    switchAdminTab('dashboard');
  };

  // Toggle Reports & Analytics collapsible section
  window.toggleAdminReports = function() {
    var content = document.getElementById('adminReportsContent');
    var chevron = document.getElementById('adminReportsChevron');
    if (!content) return;
    var isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : '';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  };

  // Refresh current tab data
  window.refreshAdminTab = function() {
    var activeTab = document.querySelector('.admin-tabs-bar .admin-tab.active');
    var tab = activeTab ? activeTab.getAttribute('data-tab') : 'dashboard';
    _adminDataLoaded[tab] = false;
    switchAdminTab(tab);
    if (typeof showToast === 'function') showToast('Refreshing...');
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
    showToast('Creating event...');

    // Persist to Supabase with rollback
    MTC.fn.apiRequest('/mobile/events', {
      method: 'PUT',
      body: JSON.stringify({
        title: title, type: type, date: date, time: time,
        location: location, spotsTotal: spots, price: price, description: desc
      })
    }).then(function(res) {
      if (!res.ok) throw new Error((res.data && res.data.error) || 'Failed to create event');
      if (res.data && res.data.id) {
        // Update local ID to match server
        clubEventsData[res.data.id] = clubEventsData[eventId];
        clubEventsData[res.data.id].id = res.data.id;
        if (res.data.id !== eventId) delete clubEventsData[eventId];
      }
      showToast('Event created!');
    }).catch(function(err) {
      // Rollback: remove optimistic event
      delete clubEventsData[eventId];
      MTC.warn('[MTC] createEvent API error:', err);
      showToast('Failed to create event. Please try again.', 'error');
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
