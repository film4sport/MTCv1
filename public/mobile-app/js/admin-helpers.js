(function() {
  'use strict';
  /* admin-helpers.js - MTC Court
   * Shared admin state, tab switching, CSV exports, init, and utilities.
   * Extracted from admin.js for maintainability.
   */

  // ============================================
  // SHARED ADMIN STATE (accessible via MTC.admin)
  // ============================================
  MTC.admin = {
    members: [],
    bookings: [],
    courts: [],
    blocks: [],
    searchTerm: '',
    teamFilter: 'all',
    dataLoaded: {}
  };

  // ============================================
  // MEMBERSHIP FEE MAP (shared constant)
  // ============================================
  MTC.admin.FEES = { adult: 120, family: 240, junior: 55 };

  // ============================================
  // AUTH HEADERS HELPER
  // ============================================
  MTC.admin.getHeaders = function() {
    var token = MTC.getToken();
    return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  };

  // ============================================
  // TAB SWITCHING
  // ============================================
  window.switchAdminTab = function(tab) {
    document.querySelectorAll('.admin-tab-content').forEach(function(c) { c.classList.remove('active'); });
    document.querySelectorAll('.admin-tabs-bar .admin-tab').forEach(function(t) { t.classList.remove('active'); });

    var contentId = 'adminTab' + tab.charAt(0).toUpperCase() + tab.slice(1);
    var content = document.getElementById(contentId);
    if (content) content.classList.add('active');

    var tabBtn = document.querySelector('.admin-tabs-bar .admin-tab[data-tab="' + tab + '"]');
    if (tabBtn) tabBtn.classList.add('active');

    if (tab === 'dashboard' && !MTC.admin.dataLoaded.dashboard) { loadAdminDashboard(); }
    if (tab === 'members' && !MTC.admin.dataLoaded.members) { loadMembersList(); }
    if (tab === 'courts' && !MTC.admin.dataLoaded.courts) { loadCourts(); }
    if (tab === 'announcements' && !MTC.admin.dataLoaded.announcements) { loadAnnouncementHistory(); }
  };

  // ============================================
  // CSV EXPORT UTILITIES
  // ============================================
  function downloadCSV(filename, csvContent) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  MTC.admin.downloadCSV = downloadCSV;

  function getExportFromDate() {
    var el = document.getElementById('adminExportFromDate') || document.getElementById('exportMonthPicker');
    return el && el.value ? el.value : '';
  }
  MTC.admin.getExportFromDate = getExportFromDate;

  function getMemberStartDate(member) {
    if (!member) return '';
    if (member.created_at) return String(member.created_at).split('T')[0];
    if (member.memberSince) return String(member.memberSince).split('T')[0];
    return '';
  }
  MTC.admin.getMemberStartDate = getMemberStartDate;

  window.exportMembersCSV = function() {
    if (!MTC.admin.members.length) { showToast('No member data loaded'); return; }
    var fromDate = getExportFromDate();
    var feeMap = MTC.admin.FEES;
    var filtered = fromDate ? MTC.admin.members.filter(function(m) {
      var startDate = getMemberStartDate(m);
      return startDate && startDate >= fromDate;
    }) : MTC.admin.members;
    var rows = [['Name','Email','Role','Membership','Fee','Skill Level','Status','Since']];
    filtered.forEach(function(m) {
      var startDate = getMemberStartDate(m);
      rows.push([m.name || '', m.email || '', m.role || 'member', m.membership_type || 'adult',
        '$' + (feeMap[m.membership_type] || 120), m.skill_level || '', m.status || 'active', startDate]);
    });
    downloadCSV('mtc-members-' + new Date().toISOString().split('T')[0] + '.csv', rows.map(function(r) { return r.join(','); }).join('\n'));
    showToast(filtered.length + ' members exported');
  };

  window.exportPaymentsCSV = function() {
    if (!MTC.admin.members.length) { showToast('No member data loaded'); return; }
    var fromDate = getExportFromDate();
    var feeMap = MTC.admin.FEES;
    var filtered = fromDate ? MTC.admin.members.filter(function(m) {
      var startDate = getMemberStartDate(m);
      return startDate && startDate >= fromDate;
    }) : MTC.admin.members;
    var rows = [['Name','Email','Membership','Annual Fee','Since','Status']];
    var total = 0;
    filtered.forEach(function(m) {
      var fee = feeMap[m.membership_type] || 120;
      total += fee;
      rows.push([m.name || '', m.email || '', m.membership_type || 'adult', '$' + fee, getMemberStartDate(m), m.status || 'active']);
    });
    rows.push(['TOTAL','','',('$' + total),'','']);
    downloadCSV('mtc-payments-' + new Date().toISOString().split('T')[0] + '.csv', rows.map(function(r) { return r.join(','); }).join('\n'));
    showToast(filtered.length + ' members · $' + total + ' revenue exported');
  };

  window.exportCourtUsageCSV = function() {
    if (!MTC.admin.bookings.length) { showToast('No booking data loaded'); return; }
    var fromDate = getExportFromDate();
    var confirmed = MTC.admin.bookings.filter(function(b) {
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
  // INIT, REFRESH, REPORTS TOGGLE
  // ============================================
  window.initAdminPanel = function() {
    MTC.admin.dataLoaded = {};
    switchAdminTab('dashboard');
  };

  window.toggleAdminReports = function() {
    var content = document.getElementById('adminReportsContent');
    var chevron = document.getElementById('adminReportsChevron');
    if (!content) return;
    var isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : '';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  };

  window.refreshAdminTab = function() {
    var activeTab = document.querySelector('.admin-tabs-bar .admin-tab.active');
    var tab = activeTab ? activeTab.getAttribute('data-tab') : 'dashboard';
    MTC.admin.dataLoaded[tab] = false;
    switchAdminTab(tab);
    if (typeof showToast === 'function') showToast('Refreshing...');
  };

  // Animated close for dynamic admin modals
  function closeAdminModal(modalId, callback) {
    const m = document.getElementById(modalId);
    if (!m) return;
    m.classList.remove('active');
    setTimeout(function() { m.remove(); if (callback) callback(); }, 300);
  }
  window.closeAdminModal = closeAdminModal;

})();
