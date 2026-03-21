(function() {
  'use strict';
  /* lessons.js - MTC Court */
  // ============================================
  // LESSONS & COACHING — dynamic enrollment
  // ============================================

  var _programs = [];
  var _enrollingId = null; // tracks which program is mid-action (prevent double-tap)

  /**
   * Called on auth load and by realtime-sync when coaching_programs / program_enrollments change.
   */
  function updateProgramsFromAPI(programs) {
    if (!Array.isArray(programs)) return;
    _programs = programs;
    renderPrograms();
  }

  // Expose globally so auth.js and realtime-sync.js can call it
  window.updateProgramsFromAPI = updateProgramsFromAPI;

  // ── Render ────────────────────────────────────────────────

  function renderPrograms() {
    var container = document.getElementById('lessons-programs-container');
    if (!container) return;

    if (!_programs.length) {
      container.innerHTML =
        '<div style="text-align:center;padding:32px 16px;color:var(--text-muted);font-size:13px;">' +
        'No programs available right now. Check back soon or contact the club for coaching details.</div>';
      return;
    }

    // Separate junior vs adult programs based on level field
    var junior = [];
    var adult = [];
    _programs.forEach(function(p) {
      var lvl = (p.level || '').toLowerCase();
      if (lvl.indexOf('junior') !== -1 || lvl.indexOf('kid') !== -1 || lvl.indexOf('child') !== -1 ||
          lvl.indexOf('munchkin') !== -1 || lvl.indexOf('red ball') !== -1 || lvl.indexOf('orange') !== -1 ||
          lvl.indexOf('green ball') !== -1 || lvl.indexOf('teen') !== -1) {
        junior.push(p);
      } else {
        adult.push(p);
      }
    });

    var html = '';

    if (junior.length) {
      html += '<div class="section-header"><h3 class="section-title">JUNIOR PROGRAMS</h3></div>';
      junior.forEach(function(p) { html += programCard(p); });
      // Spacer before next section
      html += '<div style="height:12px;"></div>';
    }

    if (adult.length) {
      html += '<div class="section-header"><h3 class="section-title">ADULT PROGRAMS</h3></div>';
      adult.forEach(function(p) { html += programCard(p); });
    }

    container.innerHTML = html;
  }

  function programCard(p) {
    var spotsLeft = (p.spotsTotal != null) ? Math.max(0, p.spotsTotal - (p.spotsFilled || 0)) : null;
    var isFull = spotsLeft !== null && spotsLeft <= 0;
    var isEnrolled = !!p.enrolled;
    var isActioning = (_enrollingId === p.id);

    // Spot indicator
    var spotsHtml = '';
    if (spotsLeft !== null) {
      var spotsColor = isFull ? '#ff5a5f' : spotsLeft <= 3 ? '#ff9800' : 'var(--volt)';
      spotsHtml =
        '<div style="display:flex;align-items:center;gap:4px;margin-top:6px;">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:' + spotsColor + ';"></span>' +
          '<span style="font-size:11px;color:' + spotsColor + ';">' +
            (isFull ? 'Full' : spotsLeft + ' spot' + (spotsLeft !== 1 ? 's' : '') + ' left') +
          '</span>' +
        '</div>';
    }

    // Enroll / Withdraw button
    var btnHtml = '';
    if (isEnrolled) {
      btnHtml =
        '<button onclick="window._lessonsWithdraw(\'' + p.id + '\')" ' +
        (isActioning ? 'disabled ' : '') +
        'style="margin-top:10px;width:100%;padding:10px;border-radius:12px;border:1px solid rgba(255,90,95,0.3);' +
        'background:rgba(255,90,95,0.1);color:#ff5a5f;font-weight:700;font-size:13px;cursor:pointer;">' +
        (isActioning ? 'WITHDRAWING...' : 'WITHDRAW') +
        '</button>';
    } else if (!isFull) {
      btnHtml =
        '<button onclick="window._lessonsEnroll(\'' + p.id + '\')" ' +
        (isActioning ? 'disabled ' : '') +
        'class="modal-btn ripple" style="margin-top:10px;width:100%;padding:10px;font-size:13px;">' +
        (isActioning ? 'ENROLLING...' : 'ENROLL') +
        '</button>';
    } else {
      btnHtml =
        '<div style="margin-top:10px;width:100%;padding:10px;border-radius:12px;background:rgba(255,255,255,0.05);' +
        'color:var(--text-muted);font-weight:600;font-size:13px;text-align:center;">FULL</div>';
    }

    return (
      '<div style="background:var(--bg-secondary);border-radius:14px;padding:14px;margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;font-size:14px;color:var(--text-primary);">' + escHtml(p.title) + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + escHtml(p.schedule || '') + '</div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0;margin-left:10px;">' +
            (p.price ? '<div style="font-weight:700;font-size:13px;color:var(--volt);">' + escHtml(p.price) + '</div>' : '') +
            (p.coach ? '<div style="font-size:10px;color:var(--text-muted);">' + escHtml(p.coach) + '</div>' : '') +
          '</div>' +
        '</div>' +
        (p.description ? '<p style="font-size:12px;color:var(--text-secondary);line-height:1.4;margin-bottom:2px;">' + escHtml(p.description) + '</p>' : '') +
        spotsHtml +
        (isEnrolled ? '<div style="display:flex;align-items:center;gap:4px;margin-top:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--volt)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:11px;color:var(--volt);font-weight:600;">Enrolled</span></div>' : '') +
        btnHtml +
      '</div>'
    );
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Enroll / Withdraw ─────────────────────────────────────

  window._lessonsEnroll = function(programId) {
    if (_enrollingId) return; // prevent double-tap
    _enrollingId = programId;
    renderPrograms(); // show loading state

    MTC.fn.apiRequest('/mobile/programs', {
      method: 'POST',
      body: JSON.stringify({ action: 'enroll', programId: programId })
    }).then(function(res) {
      _enrollingId = null;
      if (res.ok) {
        // Optimistic: mark enrolled locally
        _programs.forEach(function(p) {
          if (p.id === programId) {
            p.enrolled = true;
            p.spotsFilled = (p.spotsFilled || 0) + 1;
          }
        });
        renderPrograms();
        if (typeof MTC.fn.showToast === 'function') {
          MTC.fn.showToast('Enrolled in program', 'success');
        }
      } else {
        var msg = (res.data && res.data.error) || 'Enrollment failed';
        renderPrograms();
        if (typeof MTC.fn.showToast === 'function') {
          MTC.fn.showToast(msg, 'error');
        }
      }
    }).catch(function() {
      _enrollingId = null;
      renderPrograms();
      if (typeof MTC.fn.showToast === 'function') {
        MTC.fn.showToast('Network error - please try again', 'error');
      }
    });
  };

  window._lessonsWithdraw = function(programId) {
    if (_enrollingId) return;

    // Confirm before withdrawing
    if (typeof window.showConfirmModal === 'function') {
      window.showConfirmModal({
        title: 'Withdraw from Program?',
        message: 'You can re-enroll later if spots are available.',
        confirmText: 'WITHDRAW',
        cancelText: 'KEEP',
        confirmClass: 'danger',
        onConfirm: function() { doWithdraw(programId); }
      });
    } else {
      doWithdraw(programId);
    }
  };

  function doWithdraw(programId) {
    _enrollingId = programId;
    renderPrograms();

    MTC.fn.apiRequest('/mobile/programs', {
      method: 'POST',
      body: JSON.stringify({ action: 'withdraw', programId: programId })
    }).then(function(res) {
      _enrollingId = null;
      if (res.ok) {
        _programs.forEach(function(p) {
          if (p.id === programId) {
            p.enrolled = false;
            p.spotsFilled = Math.max(0, (p.spotsFilled || 1) - 1);
          }
        });
        renderPrograms();
        if (typeof MTC.fn.showToast === 'function') {
          MTC.fn.showToast('Withdrawn from program', 'success');
        }
      } else {
        var msg = (res.data && res.data.error) || 'Withdrawal failed';
        renderPrograms();
        if (typeof MTC.fn.showToast === 'function') {
          MTC.fn.showToast(msg, 'error');
        }
      }
    }).catch(function() {
      _enrollingId = null;
      renderPrograms();
      if (typeof MTC.fn.showToast === 'function') {
        MTC.fn.showToast('Network error - please try again', 'error');
      }
    });
  }

  // ── Load on screen entry ──────────────────────────────────

  // When user navigates to lessons screen, fetch fresh programs
  var origNavigate = window.navigateTo;
  if (typeof origNavigate === 'function') {
    window.navigateTo = function(screen) {
      origNavigate.apply(this, arguments);
      if (screen === 'lessons') {
        // Fetch fresh data from API
        if (MTC.fn.loadFromAPI) {
          MTC.fn.loadFromAPI('/mobile/programs', 'mtc-api-programs', null).then(function(programs) {
            if (programs) {
              MTC.state.programs = programs;
              updateProgramsFromAPI(programs);
            }
          });
        } else if (MTC.state.programs) {
          // Fallback: render from cached state
          updateProgramsFromAPI(MTC.state.programs);
        }
      }
    };
  }

  // Also render if programs are already loaded (e.g. deep link to #lessons)
  if (MTC.state && MTC.state.programs) {
    updateProgramsFromAPI(MTC.state.programs);
  }

})();
