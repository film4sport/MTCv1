(function() {
  'use strict';
  /* admin-dashboard.js - MTC Court
   * Dashboard tab: quick stats, charts, gate code, revenue, trends.
   * Depends on MTC.admin (from admin-helpers.js).
   */

  // ============================================
  // DASHBOARD TAB
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
        created_at: m.created_at || m.createdAt || m.member_since || m.memberSince || null,
      };
    });
  }

  function normalizeArrayResponse(payload, key) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload[key])) return payload[key];
    return [];
  }

  function normalizeSettingsResponse(payload) {
    if (!payload || Array.isArray(payload)) return {};
    if (payload.settings && !Array.isArray(payload.settings)) return payload.settings;
    return payload;
  }

  window.loadAdminDashboard = function() {
    MTC.admin.dataLoaded.dashboard = true;
    var token = MTC.getToken();
    if (!token) return;
    var headers = MTC.admin.getHeaders();

    Promise.all([
      fetch('/api/mobile/bookings', { headers: headers }).then(function(r) { return r.ok ? r.json() : { bookings: [] }; }),
      fetch('/api/mobile/members', { headers: headers }).then(function(r) { return r.ok ? r.json() : { members: [] }; }),
      fetch('/api/mobile/courts', { headers: headers }).then(function(r) { return r.ok ? r.json() : { courts: [] }; }),
      fetch('/api/mobile/settings', { headers: headers }).then(function(r) { return r.ok ? r.json() : { settings: [] }; }),
      fetch('/api/mobile/partners', { headers: headers }).then(function(r) { return r.ok ? r.json() : { partners: [] }; }).catch(function() { return { partners: [] }; })
    ]).then(function(results) {
      MTC.admin.bookings = normalizeArrayResponse(results[0], 'bookings');
      MTC.admin.members = normalizeMembersResponse(results[1]);
      MTC.admin.courts = normalizeArrayResponse(results[2], 'courts');
      var settings = normalizeSettingsResponse(results[3]);
      var partners = normalizeArrayResponse(results[4], 'partners');

      renderQuickStats(partners);
      renderPeakTimes();
      renderCourtUsage();
      renderPartnerStats(partners);
      renderRevenueBreakdown();
      renderMonthlyTrends();

      var exportPicker = document.getElementById('exportMonthPicker');
      if (exportPicker && !exportPicker.value) {
        var now2 = new Date();
        exportPicker.value = now2.getFullYear() + '-' + String(now2.getMonth() + 1).padStart(2, '0');
      }

      var codeEl = document.getElementById('currentGateCode');
      if (codeEl) codeEl.textContent = settings.gate_code || '----';
    }).catch(function(err) {
      console.error('[Admin] Dashboard load error:', err);
    });
  };

  function renderQuickStats(partners) {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    var confirmed = MTC.admin.bookings.filter(function(b) { return b.status === 'confirmed'; });
    var thisMonth = confirmed.filter(function(b) { return b.date >= monthStart; });
    var activeMembers = MTC.admin.members.filter(function(m) { return m.status !== 'paused'; });
    var openCourts = MTC.admin.courts.filter(function(c) { return c.status !== 'maintenance'; });
    var matched = (partners || []).filter(function(p) { return p.status === 'matched'; });

    var el;
    el = document.getElementById('statActiveMembers'); if (el) el.textContent = activeMembers.length;
    el = document.getElementById('statBookingsMonth'); if (el) el.textContent = thisMonth.length;
    el = document.getElementById('statCourtsOpen'); if (el) el.textContent = openCourts.length + '/' + MTC.admin.courts.length;
    el = document.getElementById('statPartnerMatches'); if (el) el.textContent = matched.length;

    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    var weekStr = weekAgo.toISOString().split('T')[0];
    var recentBookers = {};
    confirmed.forEach(function(b) { if (b.date >= weekStr && b.user_id) recentBookers[b.user_id] = true; });
    var engagementPct = MTC.admin.members.length > 0 ? Math.round((Object.keys(recentBookers).length / MTC.admin.members.length) * 100) : 0;
    el = document.getElementById('statEngagement'); if (el) el.textContent = engagementPct + '% active this week';

    var updatedEl = document.getElementById('statLastUpdated');
    if (updatedEl) updatedEl.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    var memberBadge = document.getElementById('adminMemberCountBadge');
    if (memberBadge) memberBadge.textContent = MTC.admin.members.length;
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
    var confirmed = MTC.admin.bookings.filter(function(b) { return b.status === 'confirmed'; });
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
    var confirmed = MTC.admin.bookings.filter(function(b) { return b.status === 'confirmed'; });
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

  function renderRevenueBreakdown() {
    var barEl = document.getElementById('revenueBarContainer');
    var legendEl = document.getElementById('revenueLegend');
    if (!barEl || !legendEl) return;

    var feeMap = MTC.admin.FEES;
    var categories = {};
    MTC.admin.members.forEach(function(m) {
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

  function renderMemberActivity() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    var newMembers = MTC.admin.members.filter(function(m) {
      return m.created_at && m.created_at.split('T')[0] >= monthStart;
    });
    var el = document.getElementById('statNewMembers');
    if (el) el.textContent = newMembers.length;

    var confirmed = MTC.admin.bookings.filter(function(b) { return b.status === 'confirmed'; });
    var avg = MTC.admin.members.length > 0 ? Math.round((confirmed.length / MTC.admin.members.length) * 10) / 10 : 0;
    el = document.getElementById('statAvgBookings');
    if (el) el.textContent = avg;

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

  function renderMonthlyTrends() {
    var container = document.getElementById('monthlyTrendsChart');
    if (!container) return;

    var confirmed = MTC.admin.bookings.filter(function(b) { return b.status === 'confirmed'; });
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
    var token = MTC.getToken();
    if (!token) return;
    var headers = MTC.admin.getHeaders();

    fetch('/api/mobile/settings', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ key: 'gate_code', value: code })
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      var codeEl = document.getElementById('currentGateCode');
      if (codeEl) codeEl.textContent = code;
      input.value = '';

      var activeMembers = MTC.admin.members.filter(function(m) {
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

})();
