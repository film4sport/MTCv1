/* account.js - MTC Court */
// ============================================
// FORGOT PASSWORD, COURT PREFS, MATCH HISTORY
// ============================================
(function() {
  'use strict';

  // ============================================
  // FORGOT PASSWORD
  // ============================================
  // onclick handler (index.html)
  window.showForgotPassword = function() {
    document.getElementById('forgotPasswordModal').classList.add('active');
  };

  // onclick handler (index.html)
  window.closeForgotPassword = function() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
  };

  // onclick handler (index.html)
  window.sendResetEmail = function() {
    const email = document.getElementById('resetEmail').value;
    if (!email) {
      showToast('Please enter your email address');
      return;
    }
    showToast('Password reset link sent to ' + email);
    closeForgotPassword();
  };

  // ============================================
  // COURT PREFERENCES
  // ============================================
  function getCourtPreferences() {
    return MTC.storage.get('mtc-court-prefs', { preferred: 'Court 1', surface: 'Hard', lighting: true });
  }

  // onclick handler (generated HTML)
  window.editCourtPreferences = function() {
    const prefs = getCourtPreferences();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'courtPrefsModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Court preferences');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 380px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">COURT PREFERENCES</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">PREFERRED COURT</label>' +
          '<select id="prefCourt" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">' +
            '<option' + (prefs.preferred === 'Court 1' ? ' selected' : '') + '>Court 1</option>' +
            '<option' + (prefs.preferred === 'Court 2' ? ' selected' : '') + '>Court 2</option>' +
            '<option' + (prefs.preferred === 'Court 3' ? ' selected' : '') + '>Court 3</option>' +
            '<option' + (prefs.preferred === 'Court 4' ? ' selected' : '') + '>Court 4</option>' +
            '<option' + (prefs.preferred === 'No Preference' ? ' selected' : '') + '>No Preference</option>' +
          '</select>' +
        '</div>' +
        '<div style="margin: 16px 0;">' +
          '<label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">SURFACE TYPE</label>' +
          '<select id="prefSurface" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 14px;">' +
            '<option' + (prefs.surface === 'Hard' ? ' selected' : '') + '>Hard</option>' +
            '<option' + (prefs.surface === 'Clay' ? ' selected' : '') + '>Clay</option>' +
            '<option' + (prefs.surface === 'No Preference' ? ' selected' : '') + '>No Preference</option>' +
          '</select>' +
        '</div>' +
        '<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0;">' +
          '<div><div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Lighted Courts Only</div><div style="font-size: 12px; color: var(--text-muted);">For evening bookings</div></div>' +
          '<div class="toggle' + (prefs.lighting ? ' active' : '') + '" id="prefLighting" onclick="this.classList.toggle(\'active\')" style="flex-shrink:0;"></div>' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="saveCourtPreferences()">SAVE</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'courtPrefsModal\').remove()">CANCEL</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  // onclick handler (generated HTML)
  window.saveCourtPreferences = function() {
    const prefs = {
      preferred: document.getElementById('prefCourt').value,
      surface: document.getElementById('prefSurface').value,
      lighting: document.getElementById('prefLighting').classList.contains('active')
    };
    MTC.storage.set('mtc-court-prefs', prefs);
    document.getElementById('courtPrefsModal').remove();
    showToast('Court preferences saved');
  };

  // ============================================
  // MATCH HISTORY
  // ============================================
  // onclick handler (generated HTML)
  window.showAllMatches = function() {
    const matches = [
      { opponent: 'Mike Chen', result: 'W', score: '6-4, 7-5', date: 'Jan 28' },
      { opponent: 'Sarah Wilson', result: 'L', score: '3-6, 4-6', date: 'Jan 21' },
      { opponent: 'James Park', result: 'W', score: '6-3, 6-2', date: 'Jan 14' },
      { opponent: 'Emily Rodriguez', result: 'W', score: '6-1, 6-4', date: 'Jan 7' },
      { opponent: 'David Kim', result: 'W', score: '7-6, 6-3', date: 'Dec 20' },
      { opponent: 'Lisa Thompson', result: 'L', score: '4-6, 2-6', date: 'Dec 15' },
      { opponent: 'Mike Chen', result: 'L', score: '5-7, 6-7', date: 'Dec 8' },
      { opponent: 'Sarah Wilson', result: 'W', score: '6-2, 6-4', date: 'Dec 1' }
    ];
    const wins = matches.filter(function(m) { return m.result === 'W'; }).length;
    const losses = matches.length - wins;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'matchHistoryModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Match history');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    const rows = matches.map(function(m) {
      const color = m.result === 'W' ? 'var(--volt)' : 'var(--text-muted)';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);">' +
        '<div><div style="font-weight:600;font-size:14px;color:var(--text-primary);">vs ' + m.opponent + '</div><div style="font-size:12px;color:var(--text-muted);">' + m.date + '</div></div>' +
        '<div style="text-align:right;"><span style="font-weight:700;color:' + color + ';">' + m.result + '</span> <span style="font-size:13px;color:var(--text-secondary);">' + m.score + '</span></div>' +
      '</div>';
    }).join('');

    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; max-height: 80vh; overflow-y: auto;">' +
        '<div class="modal-title">MATCH HISTORY</div>' +
        '<div style="display:flex;gap:16px;justify-content:center;margin:12px 0 16px;">' +
          '<div style="text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--volt);">' + wins + '</div><div style="font-size:11px;color:var(--text-muted);">WINS</div></div>' +
          '<div style="text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--text-muted);">' + losses + '</div><div style="font-size:11px;color:var(--text-muted);">LOSSES</div></div>' +
          '<div style="text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--text-primary);">' + matches.length + '</div><div style="font-size:11px;color:var(--text-muted);">TOTAL</div></div>' +
        '</div>' +
        '<div>' + rows + '</div>' +
        '<button class="modal-btn ripple" style="margin-top:16px;" onclick="document.getElementById(\'matchHistoryModal\').remove()">CLOSE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  // ============================================
  // PUSH NOTIFICATIONS (Simulated)
  // ============================================
  // onclick handler (settings)
  window.requestPushPermission = function() {
    if ('Notification' in window) {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          showToast('Push notifications enabled!');
          MTC.storage.set('mtc-push-enabled', true);
        } else {
          showToast('Notifications blocked. Enable in browser settings.');
        }
      });
    } else {
      showToast('Push notifications not supported');
    }
  };

  function simulatePushNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '\uD83C\uDFBE',
        badge: '\uD83C\uDFBE'
      });
    }
  }
})();
