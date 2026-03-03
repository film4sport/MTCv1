(function() {
  'use strict';

  /* confirm-modal.js - MTC Court */
  // ============================================
  // REUSABLE CONFIRMATION MODAL
  // ============================================

  /**
   * showConfirmModal({
   *   icon: 'danger' | 'warning' | 'info' | 'success',
   *   iconSvg: '<svg>...</svg>',
   *   title: 'TITLE TEXT',
   *   message: 'Description text',
   *   detail: 'Optional detail text in gray box',
   *   confirmText: 'CONFIRM',
   *   cancelText: 'CANCEL',
   *   confirmClass: '' | 'danger' | 'warning',
   *   onConfirm: function() { ... }
   * })
   */
  function showConfirmModal(opts) {
    const modal = document.getElementById('confirmModal');
    const iconEl = document.getElementById('confirmModalIcon');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const detailEl = document.getElementById('confirmModalDetail');
    const confirmBtn = document.getElementById('confirmModalConfirm');
    const cancelBtn = document.getElementById('confirmModalCancel');

    if (!modal) return;

    // Set icon
    iconEl.className = 'confirm-modal-icon ' + (opts.icon || 'info');
    iconEl.innerHTML = opts.iconSvg || '';

    // Set content
    titleEl.textContent = opts.title || 'CONFIRM';
    messageEl.textContent = opts.message || '';

    if (opts.detail) {
      detailEl.textContent = opts.detail;
      detailEl.style.display = 'block';
    } else {
      detailEl.textContent = '';
      detailEl.style.display = 'none';
    }

    // Set buttons
    confirmBtn.textContent = opts.confirmText || 'CONFIRM';
    confirmBtn.className = 'confirm-modal-btn primary ' + (opts.confirmClass || '');
    cancelBtn.textContent = opts.cancelText || 'CANCEL';

    // Wire confirm action
    confirmBtn.onclick = function() {
      closeConfirmModal();
      if (typeof opts.onConfirm === 'function') {
        setTimeout(opts.onConfirm, 200);
      }
    };

    // Show
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (MTC.fn.manageFocus) MTC.fn.manageFocus(modal);
  }

  function closeConfirmModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Expose on MTC.fn + window
  if (!window.MTC) window.MTC = {};
  if (!MTC.fn) MTC.fn = {};
  /** @function MTC.fn.showConfirmModal @param {Object} options - {title, message, confirmText, cancelText, onConfirm} */
  MTC.fn.showConfirmModal = showConfirmModal;
  window.showConfirmModal = showConfirmModal;
  window.closeConfirmModal = closeConfirmModal;

  // ============================================
  // 1. LOGOUT CONFIRMATION
  // ============================================
  let _originalHandleLogout = null;

  function setupLogoutConfirmation() {
    // Save original
    if (typeof handleLogout === 'function') {
      _originalHandleLogout = handleLogout;
    }

    window.handleLogout = function() {
      showConfirmModal({
        icon: 'danger',
        iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
        title: 'LOG OUT?',
        message: 'Are you sure you want to log out of MTC Court?',
        detail: 'You\'ll need to sign in again to access your bookings and messages.',
        confirmText: 'LOG OUT',
        cancelText: 'STAY',
        confirmClass: 'danger',
        onConfirm: function() {
          if (_originalHandleLogout) {
            _originalHandleLogout();
          } else {
            // Fallback
            currentUser = null;
            MTC.storage.remove('mtc-user');
            document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
            document.getElementById('bottomNav').style.display = 'none';
            document.getElementById('login-screen').classList.add('active');
            if (typeof closeMenu === 'function') closeMenu();
            showToast('Logged out successfully');
          }
        }
      });
    };
  }

  // ============================================
  // 2. ADMIN: REMOVE MEMBER
  // ============================================
  function setupAdminRemoveMember() {
    window.removeMember = function(id) {
      let memberName = 'this member';
      // Try to find member name from the admin table
      const row = document.querySelector('[data-member-id="' + id + '"]');
      if (row) {
        const nameCell = row.querySelector('.member-name');
        if (nameCell) memberName = nameCell.textContent;
      }

      showConfirmModal({
        icon: 'danger',
        iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>',
        title: 'REMOVE MEMBER?',
        message: 'This will permanently remove ' + memberName + ' from the club.',
        detail: 'Their bookings will be cancelled and their account data will be deleted. This action cannot be undone.',
        confirmText: 'REMOVE',
        cancelText: 'KEEP MEMBER',
        confirmClass: 'danger',
        onConfirm: function() {
          // Persist to Supabase
          MTC.fn.apiRequest('/mobile/members', {
            method: 'DELETE',
            body: JSON.stringify({ memberId: id })
          }).then(function() {
            showToast('Member removed successfully');
          }).catch(function(err) {
            MTC.warn('[MTC] removeMember API error:', err);
            showToast('Failed to remove member — ' + (err.message || 'try again'), 'error');
          });
        }
      });
    };
  }

  // ============================================
  // 3. ADMIN: CANCEL MEMBER'S BOOKING
  // ============================================
  function setupAdminCancelBooking() {
    window.adminCancelBooking = function(id) {
      showConfirmModal({
        icon: 'warning',
        iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>',
        title: 'CANCEL THIS BOOKING?',
        message: 'This will cancel booking ' + id + ' and notify the member.',
        detail: 'The member will receive a full credit refund for this admin-initiated cancellation.',
        confirmText: 'CANCEL BOOKING',
        cancelText: 'KEEP IT',
        confirmClass: 'warning',
        onConfirm: function() {
          // Persist cancellation to Supabase
          MTC.fn.apiRequest('/mobile/bookings', {
            method: 'DELETE',
            body: JSON.stringify({ bookingId: id })
          }).then(function() {
            showToast('Booking ' + id + ' cancelled — member notified');
          }).catch(function(err) {
            MTC.warn('[MTC] adminCancelBooking API error:', err);
            showToast('Booking cancelled locally — sync may be delayed', 'warning');
          });
        }
      });
    };
  }

  // ============================================
  // 4. MARK ALL NOTIFICATIONS READ
  // ============================================
  function setupMarkAllReadConfirmation() {
    const _originalMarkAllRead = typeof markAllNotificationsRead === 'function' ? markAllNotificationsRead : null;

    window.markAllNotificationsRead = function() {
      // Check if there are actually unread notifications
      const unreadCount = document.querySelectorAll('.notification-item.unread').length;

      if (unreadCount === 0) {
        showToast('All caught up already!');
        return;
      }

      showConfirmModal({
        icon: 'info',
        iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 12 9 23 4 18" opacity="0.5"></polyline></svg>',
        title: 'MARK ALL AS READ?',
        message: 'This will mark all ' + unreadCount + ' notification' + (unreadCount > 1 ? 's' : '') + ' as read.',
        confirmText: 'MARK ALL READ',
        cancelText: 'NEVERMIND',
        confirmClass: '',
        onConfirm: function() {
          // Execute original function
          if (_originalMarkAllRead) {
            _originalMarkAllRead();
          } else {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(function(item) {
              item.classList.remove('unread');
            });

            if (typeof updateUnreadCount === 'function') updateUnreadCount();

            const notifBadge = document.querySelector('.notification-badge');
            if (notifBadge) notifBadge.style.display = 'none';

            showToast('All notifications marked as read');
          }
        }
      });
    };
  }

  // ============================================
  // 5. EVENT RSVP WITHDRAWAL
  // ============================================
  function setupRsvpWithdrawalConfirmation() {
    // Hook rsvpToEvent (home screen events)
    const _originalRsvpToEvent = typeof rsvpToEvent === 'function' ? rsvpToEvent : null;

    window.rsvpToEvent = function(eventId, button) {
      // If already confirmed (withdrawing), show confirmation
      if (button.classList.contains('confirmed')) {
        // Look up event name from clubEventsData or fallback
        const eventNames = {
          'euchre': 'Euchre Tournament',
          'bbq': 'Opening Day BBQ',
          'mensrr': "Men's Round Robin",
          'frimixed': 'Friday Night Mixed'
        };
        let eventName = eventNames[eventId] || 'this event';
        // Also check clubEventsData via the mapping
        if (typeof homeToClubEventMap !== 'undefined' && typeof clubEventsData !== 'undefined') {
          const realId = homeToClubEventMap[eventId] || eventId;
          if (clubEventsData[realId]) eventName = clubEventsData[realId].title;
        }

        showConfirmModal({
          icon: 'warning',
          iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
          title: 'WITHDRAW RSVP?',
          message: 'You\'re signed up for ' + eventName + '. Are you sure you want to cancel?',
          detail: 'Other members will see you\'ve withdrawn. You can always RSVP again later.',
          confirmText: 'WITHDRAW',
          cancelText: 'STAY REGISTERED',
          confirmClass: 'warning',
          onConfirm: function() {
            // Call through to the original to handle full cancellation (localStorage, My Bookings, etc.)
            if (_originalRsvpToEvent) {
              _originalRsvpToEvent(eventId, button);
            } else {
              button.classList.remove('confirmed');
              button.textContent = 'RSVP';
              showToast('RSVP cancelled for ' + eventName);
            }
          }
        });
      } else {
        // Signing up — no confirmation needed, just do it
        if (_originalRsvpToEvent) {
          _originalRsvpToEvent(eventId, button);
        } else {
          button.classList.add('confirmed');
          button.textContent = 'Going';
          showToast('You\'re signed up!');
        }
      }
    };

    // Hook rsvpInterclub (event detail screen)
    const _originalRsvpInterclub = typeof rsvpInterclub === 'function' ? rsvpInterclub : null;

    window.rsvpInterclub = function(eventId, response) {
      const goingBtn = document.getElementById('rsvpGoingBtn');

      // If currently "going" and clicking "not going", confirm withdrawal
      if (response === 'not-going' && goingBtn && goingBtn.classList.contains('active')) {
        showConfirmModal({
          icon: 'warning',
          iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
          title: 'WITHDRAW FROM EVENT?',
          message: 'You\'re currently registered. Other players are counting on you!',
          confirmText: 'WITHDRAW',
          cancelText: 'STAY IN',
          confirmClass: 'warning',
          onConfirm: function() {
            if (_originalRsvpInterclub) {
              _originalRsvpInterclub(eventId, response);
            } else {
              const notGoingBtn = document.getElementById('rsvpNotGoingBtn');
              if (notGoingBtn) notGoingBtn.classList.add('active');
              if (goingBtn) {
                goingBtn.classList.remove('active');
                goingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Count Me In';
              }
              showToast('No problem - we\'ll miss you!');
            }
          }
        });
      } else {
        // Going — no confirmation needed
        if (_originalRsvpInterclub) {
          _originalRsvpInterclub(eventId, response);
        }
      }
    };
  }

  // ============================================
  // INIT ALL CONFIRMATIONS
  // ============================================
  function initConfirmModals() {
    setupLogoutConfirmation();
    setupAdminRemoveMember();
    setupAdminCancelBooking();
    setupMarkAllReadConfirmation();
    setupRsvpWithdrawalConfirmation();
  }

  // ============================================
  // SWIPE-TO-DISMISS ON CONFIRM MODAL
  // ============================================
  function setupConfirmSwipeDismiss() {
    const confirmContent = document.querySelector('.confirm-modal');
    if (!confirmContent) return;

    let startY = 0, currentDragY = 0, isDragging = false;

    confirmContent.addEventListener('touchstart', function(e) {
      const handle = e.target.closest('.confirm-modal-handle');
      if (handle || e.target === confirmContent) {
        startY = e.touches[0].clientY;
        isDragging = true;
        confirmContent.style.transition = 'none';
      }
    }, { passive: true });

    confirmContent.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      currentDragY = e.touches[0].clientY - startY;
      if (currentDragY > 0) {
        confirmContent.style.transform = 'translateY(' + currentDragY + 'px)';
      }
    }, { passive: true });

    confirmContent.addEventListener('touchend', function() {
      if (!isDragging) return;
      isDragging = false;
      confirmContent.style.transition = '';
      if (currentDragY > 100) {
        closeConfirmModal();
      }
      confirmContent.style.transform = '';
      currentDragY = 0;
    }, { passive: true });
  }

  // Run after DOM and other scripts are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() { initConfirmModals(); setupConfirmSwipeDismiss(); }, 150);
    });
  } else {
    setTimeout(function() { initConfirmModals(); setupConfirmSwipeDismiss(); }, 150);
  }

})();
