// @ts-nocheck
(function() {
  'use strict';

  /* notifications.js - MTC Court */

  // ============================================
  // OFFLINE INDICATOR
  // ============================================
  function setupOfflineIndicator() {
    window.addEventListener('online', function() {
      document.body.classList.remove('offline');
      showToast('Back online! \u2713');
    });

    window.addEventListener('offline', function() {
      document.body.classList.add('offline');
      showToast('You\'re offline. Some features unavailable.');
    });
  }

  // ============================================
  // PUSH NOTIFICATION SIMULATION
  // ============================================
  let notificationTimers = [];
  const activeNotifications = [];
  let pushNotificationsEnabled = true;

  function schedulePushNotification(title, message, delay, icon, action) {
    const timer = setTimeout(function() {
      showPushNotification(title, message, icon, action);
    }, delay);
    notificationTimers.push(timer);
  }

  function showPushNotification(title, message, icon, action) {
    // Don't show if user turned off push notifications
    if (!pushNotificationsEnabled) return;

    // Don't stack more than 2
    if (activeNotifications.length >= 2) {
      const oldest = activeNotifications.shift();
      if (oldest && oldest.parentNode) {
        oldest.classList.remove('show');
        setTimeout(function() { if (oldest.parentNode) oldest.remove(); }, 300);
      }
    }

    const notif = document.createElement('div');
    notif.className = 'push-notification';
    // Background handled by CSS based on data-theme

    const defaultIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    let actionHtml = '';
    if (action && action.label) {
      const actionClick = action.navigate ? 'dismissPushNotif(this.closest(\'.push-notification\')); navigateTo(\'' + action.navigate + '\');' : (action.onclick || '');
      actionHtml = '<button class="push-notification-action" onclick="event.stopPropagation(); ' + actionClick + '">' + action.label + '</button>';
    }

    notif.innerHTML =
      '<div class="push-notification-icon">' + (icon || defaultIcon) + '</div>' +
      '<div class="push-notification-content">' +
      '  <div class="push-notification-title">' + sanitizeHTML(title) + '</div>' +
      '  <div class="push-notification-message">' + sanitizeHTML(message) + '</div>' +
      actionHtml +
      '</div>' +
      '<button class="push-notification-close">' +
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '</button>';

    // Append to #app so data-theme styling works
    const appContainer = document.getElementById('app') || document.body;
    appContainer.appendChild(notif);
    activeNotifications.push(notif);

    // Animate in
    setTimeout(function() { notif.classList.add('show'); }, 50);

    // Auto dismiss after 6 seconds
    const autoDismiss = setTimeout(function() {
      dismissPushNotif(notif);
    }, 6000);

    // Dismiss handler - works on both touch and click
    function handleDismiss(e) {
      e.stopPropagation();
      clearTimeout(autoDismiss);
      dismissPushNotif(notif);
      if (action && action.navigate) {
        navigateTo(action.navigate);
      }
    }

    // Close button - touchend fires first on mobile (no 300ms delay), click for desktop
    const closeBtn = notif.querySelector('.push-notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(autoDismiss);
        dismissPushNotif(notif);
      }, { passive: false });
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearTimeout(autoDismiss);
        dismissPushNotif(notif);
      });
    }

    // Tap notification body to dismiss + navigate
    notif.addEventListener('touchend', function(e) {
      if (e.target.closest('.push-notification-close') || e.target.closest('.push-notification-action')) return;
      e.preventDefault();
      handleDismiss(e);
    }, { passive: false });
    notif.addEventListener('click', function(e) {
      if (e.target.closest('.push-notification-close') || e.target.closest('.push-notification-action')) return;
      handleDismiss(e);
    });
  }

  function dismissPushNotif(notif) {
    if (!notif || !notif.parentNode) return;
    if (notif.dataset.dismissing) return;
    notif.dataset.dismissing = 'true';
    notif.style.pointerEvents = 'none';
    notif.classList.remove('show');
    const idx = activeNotifications.indexOf(notif);
    if (idx > -1) activeNotifications.splice(idx, 1);
    setTimeout(function() { if (notif.parentNode) notif.remove(); }, 400);
  }

  // Ambient notifications removed - only action-triggered notifications now
  function scheduleWelcomeNotifications() {
    // No-op: ambient notifications disabled. Notifications only fire on user actions.
  }

  function clearAllNotificationTimers() {
    notificationTimers.forEach(function(t) { clearTimeout(t); });
    notificationTimers = [];
  }

  // ============================================
  // ACTION-TRIGGERED NOTIFICATIONS
  // ============================================
  function triggerBookingNotification() {
    schedulePushNotification(
      '\u2705 Booking Confirmed!',
      'Don\'t forget your racket! See you on the court.',
      3000,
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#5a8a00" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
      { navigate: 'mybookings' }
    );
  }

  function triggerRSVPNotification(eventName) {
    schedulePushNotification(
      '\uD83C\uDF89 You\'re In!',
      'Registered for ' + eventName + '. See you on the court!',
      2000,
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#c8ff00" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
      { navigate: 'events' }
    );
  }

  function triggerMessageNotification(from, preview) {
    schedulePushNotification(
      '\uD83D\uDCAC ' + from,
      preview,
      1500,
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#00b4d8" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      { navigate: 'messages', label: 'REPLY' }
    );
  }

  function triggerCancelNotification() {
    schedulePushNotification(
      '\uD83D\uDDD1\uFE0F Booking Cancelled',
      'Your booking has been cancelled and removed from your tab.',
      2000,
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ff5a5f" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      { navigate: 'mybookings' }
    );
  }

  // ============================================
  // NOTIFICATION BADGE LIVE PULSE
  // ============================================
  function pulseNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge && badge.style.display !== 'none') {
      badge.classList.add('pulse');
      setTimeout(function() { badge.classList.remove('pulse'); }, 600);
    }
  }

  // ============================================
  // PUSH NOTIFICATION TOGGLE
  // ============================================
  function togglePushNotifications(toggleEl) {
    toggleEl.classList.toggle('active');
    const isOn = toggleEl.classList.contains('active');
    pushNotificationsEnabled = isOn;

    // Sync both toggles (profile + settings)
    const profileToggle = document.getElementById('pushNotifToggle');
    const settingsToggle = document.getElementById('pushNotifToggleSettings');

    if (profileToggle && profileToggle !== toggleEl) {
      if (isOn) profileToggle.classList.add('active');
      else profileToggle.classList.remove('active');
    }
    if (settingsToggle && settingsToggle !== toggleEl) {
      if (isOn) settingsToggle.classList.add('active');
      else settingsToggle.classList.remove('active');
    }

    if (!isOn) {
      // Clear all pending timers
      clearAllNotificationTimers();
      // Dismiss any active ones
      activeNotifications.slice().forEach(function(n) { dismissPushNotif(n); });
      showToast('Push notifications disabled');
    } else {
      showToast('Push notifications enabled');
    }

    // Persist setting
    saveSettingsToggles();
  }

  let badgePulseInterval = setInterval(pulseNotificationBadge, 15000);

  // Pause pulse animation when tab is hidden to save resources
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (badgePulseInterval) { clearInterval(badgePulseInterval); badgePulseInterval = null; }
    } else {
      if (!badgePulseInterval) { badgePulseInterval = setInterval(pulseNotificationBadge, 15000); }
    }
  });

  // ============================================
  // NOTIFICATION MANAGEMENT
  // ============================================
  function updateCachedNotification(id, updates) {
    if (!id) return;
    var cached = MTC.storage.get('mtc-api-notifications', []);
    if (!Array.isArray(cached)) return;
    MTC.storage.set('mtc-api-notifications', cached.map(function(n) {
      return n.id === id ? Object.assign({}, n, updates) : n;
    }));
  }

  function markNotificationRead(element) {
    if (!element || element._dismissing) return;
    var notifId = element.getAttribute('data-notif-id');
    if (element.classList.contains('unread')) {
      element.classList.remove('unread');
      updateCachedNotification(notifId, { read: true });
      if (typeof MTC !== 'undefined' && MTC.fn && MTC.fn.apiRequest && notifId) {
        MTC.fn.apiRequest('/mobile/notifications', {
          method: 'PATCH',
          body: JSON.stringify({ id: notifId })
        }).catch(function() { /* non-critical */ });
      }
    }
    dismissNotification(element);
  }

  function dismissNotification(element) {
    if (!element || !element.parentNode || element._dismissing) return;
    element._dismissing = true;

    element.style.transform = 'translateX(100%)';
    element.style.opacity = '0';
    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    setTimeout(function() {
      if (element.parentNode) element.remove();
      updateUnreadCount();
      checkNotificationsEmpty();
    }, 300);

    showToast('Notification dismissed');
  }

  function checkNotificationsEmpty() {
    const items = document.querySelectorAll('#screen-notifications .notification-item');
    const emptyState = document.getElementById('noNotifications');
    const summary = document.getElementById('notificationsSummary');
    const sectionHeaders = document.querySelectorAll('#screen-notifications .section-header');

    if (items.length === 0 && emptyState) {
      emptyState.style.display = 'flex';
      if (summary) summary.style.display = 'none';
      sectionHeaders.forEach(function(h) { h.style.display = 'none'; });
    }
  }

  function markAllNotificationsRead() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(function(item) {
      item.classList.remove('unread');
    });

    var cached = MTC.storage.get('mtc-api-notifications', []);
    if (Array.isArray(cached)) {
      MTC.storage.set('mtc-api-notifications', cached.map(function(n) {
        return Object.assign({}, n, { read: true });
      }));
    }

    if (typeof MTC !== 'undefined' && MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAll: true })
      }).catch(function() { /* non-critical */ });
    }

    updateUnreadCount();

    const notifBadge = document.querySelector('.notification-badge');
    if (notifBadge) {
      notifBadge.style.display = 'none';
    }

    var clearBtn = document.getElementById('clearReadBtn');
    if (clearBtn) {
      var anyNotifications = document.querySelectorAll('.notification-item').length > 0;
      clearBtn.style.display = anyNotifications ? '' : 'none';
    }

    showToast('All notifications marked as read');
  }

  function deleteReadNotifications() {
    var readItems = document.querySelectorAll('.notification-item:not(.unread)');
    if (readItems.length === 0) { showToast('No read notifications to clear'); return; }
    readItems.forEach(function(item) { item.remove(); });
    // Update localStorage cache
    var cached = MTC.storage.get('mtc-api-notifications', []);
    if (Array.isArray(cached)) {
      MTC.storage.set('mtc-api-notifications', cached.filter(function(n) { return !n.read; }));
    }
    // Delete from server
    if (typeof MTC !== 'undefined' && MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/notifications', {
        method: 'DELETE',
        body: JSON.stringify({ readOnly: true })
      }).catch(function() { /* non-critical */ });
    }
    updateUnreadCount();
    checkNotificationsEmpty();
    // Hide clear button if no read items left
    var clearBtn = document.getElementById('clearReadBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    showToast('Read notifications cleared');
  }

  function updateUnreadCount() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    const count = unreadItems.length;
    const summaryEl = document.getElementById('notificationsSummary');
    const countEl = document.getElementById('unreadCount');

    if (countEl) {
      if (count === 0) {
        countEl.textContent = '\u2713 All caught up!';
        if (summaryEl) summaryEl.classList.add('all-read');
      } else {
        countEl.textContent = count + ' unread notification' + (count > 1 ? 's' : '');
        if (summaryEl) summaryEl.classList.remove('all-read');
      }
    }

    const notifBadge = document.querySelector('.notification-badge');
    if (notifBadge) {
      if (count === 0) {
        notifBadge.style.display = 'none';
      } else {
        notifBadge.style.display = 'block';
        notifBadge.textContent = count;
      }
    }
  }

  // ============================================
  // ADMIN - SEND ANNOUNCEMENT
  // ============================================
  function showSendAnnouncementModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'announcementModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Send announcement');
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; max-height: 85vh; overflow-y: auto;">' +
        '<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 24px; border-radius: 20px 20px 0 0; margin: -24px -24px 20px -24px;">' +
          '<button onclick="document.getElementById(\'announcementModal\').remove()" style="position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer;"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
          '<div style="font-family: Bebas Neue, sans-serif; font-size: 24px; color: #fff;">Send Announcement</div>' +
          '<div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 4px;">Notify club members</div>' +
        '</div>' +

        '<div style="margin-bottom: 16px;">' +
          '<div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Send To</div>' +
          '<div id="announcementRecipients" style="display: flex; flex-wrap: wrap; gap: 8px;">' +
            '<button class="announcement-recipient-btn active" data-recipient="all" onclick="selectAnnouncementRecipient(this)" style="padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border-color); background: var(--volt); color: #000; font-size: 13px; font-weight: 600; cursor: pointer;">All Members</button>' +
            '<button class="announcement-recipient-btn" data-recipient="team-a" onclick="selectAnnouncementRecipient(this)" style="padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 600; cursor: pointer;">Interclub Team A</button>' +
            '<button class="announcement-recipient-btn" data-recipient="team-b" onclick="selectAnnouncementRecipient(this)" style="padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 600; cursor: pointer;">Interclub Team B</button>' +
          '</div>' +
        '</div>' +

        '<div style="margin-bottom: 12px;">' +
          '<div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Title</div>' +
          '<input type="text" id="announcementTitle" placeholder="e.g. Court Maintenance Notice" style="width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; box-sizing: border-box;" />' +
        '</div>' +

        '<div style="margin-bottom: 20px;">' +
          '<div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Message</div>' +
          '<textarea id="announcementMessage" rows="4" placeholder="Type your announcement here..." style="width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; resize: vertical; box-sizing: border-box; font-family: inherit;"></textarea>' +
        '</div>' +

        '<button class="modal-btn ripple" onclick="sendAnnouncement()">SEND ANNOUNCEMENT</button>' +
        '<button class="modal-btn ripple" style="background: transparent; color: var(--text-muted); margin-top: 8px;" onclick="document.getElementById(\'announcementModal\').remove()">CANCEL</button>' +
      '</div>';

    document.getElementById('app').appendChild(modal);
    setTimeout(function() {
      const titleInput = document.getElementById('announcementTitle');
      if (titleInput) titleInput.focus();
    }, 300);
  }

  function selectAnnouncementRecipient(btn) {
    // Toggle multi-select
    btn.classList.toggle('active');

    // Update visual state
    const allBtns = document.querySelectorAll('#announcementRecipients .announcement-recipient-btn');
    allBtns.forEach(function(b) {
      if (b.classList.contains('active')) {
        b.style.background = 'var(--volt)';
        b.style.color = '#000';
      } else {
        b.style.background = 'var(--bg-secondary)';
        b.style.color = 'var(--text-primary)';
      }
    });

    // Must have at least one selected
    const anyActive = document.querySelector('#announcementRecipients .active');
    if (!anyActive) {
      btn.classList.add('active');
      btn.style.background = 'var(--volt)';
      btn.style.color = '#000';
    }
  }

  function sendAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const message = document.getElementById('announcementMessage').value.trim();

    if (!title) {
      showToast('Please enter a title');
      document.getElementById('announcementTitle').focus();
      return;
    }
    if (!message) {
      showToast('Please enter a message');
      document.getElementById('announcementMessage').focus();
      return;
    }

    // Get selected recipients
    const selected = [];
    document.querySelectorAll('#announcementRecipients .active').forEach(function(btn) {
      selected.push(btn.getAttribute('data-recipient'));
    });

    const recipientLabel = selected.map(function(r) {
      if (r === 'all') return 'All Members';
      if (r === 'team-a') return 'Team A';
      if (r === 'team-b') return 'Team B';
      return r;
    }).join(', ');

    // Close modal
    const modalEl = document.getElementById('announcementModal');
    if (modalEl) modalEl.remove();

    // Map selected recipients to API audience field
    var audience = 'all';
    var hasAll = selected.indexOf('all') !== -1;
    var hasA = selected.indexOf('team-a') !== -1;
    var hasB = selected.indexOf('team-b') !== -1;
    if (hasAll) {
      audience = 'all';
    } else if (hasA && hasB) {
      audience = 'interclub_all';
    } else if (hasA) {
      audience = 'interclub_a';
    } else if (hasB) {
      audience = 'interclub_b';
    }

    // Persist to Supabase via API — also creates notifications for targeted members
    if (typeof MTC !== 'undefined' && MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/announcements', {
        method: 'POST',
        body: JSON.stringify({ text: title + ': ' + message, type: 'info', title: title, audience: audience })
      }).then(function(result) {
        if (result && result.ok !== false) {
          showToast('Announcement sent to ' + recipientLabel);
        } else {
          showToast('Announcement saved locally — server sync may be delayed', 'warning');
        }
      }).catch(function() {
        showToast('Announcement saved locally — server sync may be delayed', 'warning');
      });
    }

    // Add to notifications screen (optimistic local UI)
    addAnnouncementNotification(title, message, recipientLabel);

    // Server delivery now fans announcements out to notifications plus inbox messages for opted-in members

    // Show push notification
    showPushNotification('\uD83D\uDCE2 ' + title, message, null, {
      label: 'VIEW',
      navigate: 'notifications'
    });
  }

  function addAnnouncementNotification(title, message, recipients) {
    const notifContainer = document.querySelector('#screen-notifications .section-header');
    if (!notifContainer) return;

    // Find the "TODAY" section - insert after it
    const todaySections = document.querySelectorAll('#screen-notifications .section-header');
    const insertAfter = todaySections[0]; // First section header ("TODAY")

    const notifEl = document.createElement('div');
    notifEl.className = 'notification-item announcement-type unread stagger-item';
    notifEl.onclick = function() { markNotificationRead(notifEl); };
    notifEl.innerHTML =
      '<div class="notification-icon-wrap" style="background: var(--volt); color: #000;">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
      '</div>' +
      '<div class="notification-content">' +
        '<div class="notification-title">\uD83D\uDCE2 ' + sanitizeHTML(title) + '</div>' +
        '<div class="notification-desc">' + sanitizeHTML(message) + '</div>' +
        '<div class="notification-time">Just now \u00B7 Sent to ' + sanitizeHTML(recipients) + '</div>' +
      '</div>' +
      '<button class="notification-dismiss-btn" aria-label="Dismiss notification" onclick="dismissNotification(this.parentElement); event.stopPropagation();">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '</button>' +
      '<div class="notification-unread-dot"></div>';

    // Insert right after the "TODAY" header
    if (insertAfter && insertAfter.nextSibling) {
      insertAfter.parentNode.insertBefore(notifEl, insertAfter.nextSibling);
    }

    // Hide empty state, show summary
    var noNotifs = document.getElementById('noNotifications');
    if (noNotifs) noNotifs.style.display = 'none';
    var summaryEl = document.getElementById('notificationsSummary');
    if (summaryEl) summaryEl.style.display = '';

    // Update unread count
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const countEl = document.getElementById('unreadCount');
    if (countEl) countEl.textContent = unreadCount + ' unread notification' + (unreadCount !== 1 ? 's' : '');

    // Update notification badge on bottom nav
    updateNotificationBadge(unreadCount);
  }

  function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  }

  // ============================================
  // SETTINGS TOGGLES PERSISTENCE
  // ============================================
  function saveSettingsToggles() {
    try {
      const settings = {};
      // All toggles now in merged settings screen
      // Order: 0=Booking Reminders, 1=Partner Requests, 2=Club Announcements,
      //        3=Messages, 4=Event Reminders, 5=Push Notifications,
      //        6=Dark Mode
      const allToggles = document.querySelectorAll('#screen-settings .toggle');
      allToggles.forEach(function(t, i) {
        settings['settings-toggle-' + i] = t.classList.contains('active');
      });
      settings.pushNotificationsEnabled = pushNotificationsEnabled;
      MTC.storage.set('mtc-settings', settings);

      // Sync notification preferences to Supabase
      if (typeof MTC !== 'undefined' && MTC.fn && MTC.fn.apiRequest) {
        var prefs = {
          bookings: settings['settings-toggle-0'] !== false,
          partners: settings['settings-toggle-1'] !== false,
          announcements: settings['settings-toggle-2'] !== false,
          messages: settings['settings-toggle-3'] !== false,
          events: settings['settings-toggle-4'] !== false,
        };
        MTC.fn.apiRequest('/mobile/settings', {
          method: 'PATCH',
          body: JSON.stringify({ action: 'setNotifPrefs', prefs: prefs })
        }).catch(function() { /* non-critical */ });
      }
    } catch(e) {}
  }

  function restoreSettingsToggles() {
    try {
      const settings = MTC.storage.get('mtc-settings', null);
      if (!settings) return;

      // All toggles now in merged settings screen
      // Order: 0=Booking Reminders, 1=Partner Requests, 2=Club Announcements,
      //        3=Messages, 4=Event Reminders, 5=Push Notifications, 6=Dark Mode
      const allToggles = document.querySelectorAll('#screen-settings .toggle');
      allToggles.forEach(function(t, i) {
        const key = 'settings-toggle-' + i;
        if (key in settings) {
          if (i === 6) return; // Dark mode — handled by theme.js
          if (settings[key]) t.classList.add('active');
          else t.classList.remove('active');
          t.setAttribute('aria-checked', settings[key] ? 'true' : 'false');
        }
      });

      // Restore push notifications state
      if ('pushNotificationsEnabled' in settings) {
        pushNotificationsEnabled = settings.pushNotificationsEnabled;
      }
    } catch(e) {}
  }

  // ============================================
  // API CONSUMERS
  // ============================================

  /**
   * Update notifications from Supabase API.
   * Called by auth.js after login when API data is available.
   */
  window.updateNotificationsFromAPI = function(apiNotifications) {
    if (!Array.isArray(apiNotifications)) return;
    MTC.storage.set('mtc-api-notifications', apiNotifications);

    // Count unread
    var unread = apiNotifications.filter(function(n) { return !n.read; }).length;
    updateUnreadCount(unread);

    // Inject recent unread notifications into the notifications screen
    var container = document.querySelector('#screen-notifications .notifications-list');
    if (!container) return;

    // Clear existing rendered notifications and rebuild
    container.innerHTML = '';

    // Toggle empty state
    var emptyState = document.getElementById('noNotifications');
    if (emptyState) emptyState.style.display = apiNotifications.length > 0 ? 'none' : '';
    var summary = document.getElementById('notificationsSummary');
    if (summary) summary.style.display = apiNotifications.length > 0 ? '' : 'none';
    var sectionHeaders = document.querySelectorAll('#screen-notifications .section-header');
    sectionHeaders.forEach(function(header) {
      header.style.display = apiNotifications.length > 0 ? '' : 'none';
    });

    apiNotifications.slice(0, 30).forEach(function(n) {

      var el = document.createElement('div');
      el.className = 'notification-item ' + (n.type || 'announcement') + '-type' + (n.read ? '' : ' unread') + ' stagger-item';
      el.setAttribute('data-notif-id', n.id);
      el.onclick = function() {
        markNotificationRead(el);
        // Navigate based on notification type
        var typeRoutes = { booking: 'mybookings', message: 'messages', event: 'events', partner: 'partners' };
        var target = typeRoutes[n.type];
        if (target && typeof navigateTo === 'function') navigateTo(target);
      };
      var iconSvg = {
        booking: '<path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        message: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
        partner: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
        event: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
        program: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
        announcement: '<path d="M19.4 14.9C20.2 16.4 21 17 21 17H3s3-2 3-9a6 6 0 0112 0c0 .7 0 1.3.1 1.9z"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/>'
      };
      var iconColor = { booking: 'var(--volt)', message: 'var(--electric-blue)', partner: 'var(--coral)', event: 'var(--volt)', program: 'var(--electric-blue)', announcement: 'var(--coral)' };
      var nType = n.type || 'announcement';
      el.innerHTML =
        '<div class="notification-icon-wrap" style="background: ' + (iconColor[nType] || 'var(--volt)') + '; color: #000;">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">' + (iconSvg[nType] || iconSvg.announcement) + '</svg>' +
        '</div>' +
        '<div class="notification-content">' +
          '<div class="notification-title">' + sanitizeHTML(n.title) + '</div>' +
          '<div class="notification-message">' + sanitizeHTML(n.body) + '</div>' +
          '<div class="notification-time">' + formatRelativeTime(n.timestamp) + '</div>' +
        '</div>';

      container.appendChild(el);
    });
    // Show/hide clear read button based on whether any read notifications exist
    var clearBtn = document.getElementById('clearReadBtn');
    if (clearBtn) {
      var hasRead = apiNotifications.some(function(n) { return n.read; });
      clearBtn.style.display = hasRead ? '' : 'none';
    }
  };

  function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    var diff = Date.now() - new Date(timestamp).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  /**
   * Update notification preferences from Supabase API.
   * Called by auth.js after login.
   */
  window.updateNotifPrefsFromAPI = function(prefs) {
    if (!prefs || typeof prefs !== 'object') return;
    // Store locally for the settings screen to pick up
    MTC.storage.set('mtc-notif-prefs', prefs);
  };

  // ============================================
  // EXPORTS
  // ============================================

  // MTC.fn namespace + window alias (cross-file via namespace AND backward compat)
  /** @function MTC.fn.showPushNotification @param {string} title @param {string} message @param {Object} [options] */
  MTC.fn.showPushNotification = showPushNotification;
  /** Updates the notification badge count from unread items */
  MTC.fn.updateUnreadCount = updateUnreadCount;

  // window globals (called from onclick handlers or other files)
  window.setupOfflineIndicator = setupOfflineIndicator;
  window.showPushNotification = showPushNotification;
  window.dismissPushNotif = dismissPushNotif;
  window.scheduleWelcomeNotifications = scheduleWelcomeNotifications;
  window.triggerBookingNotification = triggerBookingNotification;
  window.triggerRSVPNotification = triggerRSVPNotification;
  window.triggerMessageNotification = triggerMessageNotification;
  window.triggerCancelNotification = triggerCancelNotification;
  window.togglePushNotifications = togglePushNotifications;
  window.markNotificationRead = markNotificationRead;
  window.dismissNotification = dismissNotification;
  window.markAllNotificationsRead = markAllNotificationsRead;
  window.deleteReadNotifications = deleteReadNotifications;
  window.updateUnreadCount = updateUnreadCount;
  window.showSendAnnouncementModal = showSendAnnouncementModal;
  window.selectAnnouncementRecipient = selectAnnouncementRecipient;
  window.sendAnnouncement = sendAnnouncement;
  window.saveSettingsToggles = saveSettingsToggles;
  window.restoreSettingsToggles = restoreSettingsToggles;

})();

