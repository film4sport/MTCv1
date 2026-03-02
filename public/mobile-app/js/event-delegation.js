/**
 * event-delegation.js - MTC Court
 * IIFE Module: Central event delegation for dynamically generated elements.
 * Replaces inline onclick handlers with data-action attributes to prevent XSS.
 *
 * Usage: Add data-action="actionName" and data-* attributes to elements.
 * Example: <button data-action="joinPartner" data-name="Mike" data-time="5PM">Join</button>
 */
(function() {
  'use strict';

  // Action registry - maps action names to handler functions
  const actionHandlers = {};

  /**
   * Register an action handler.
   * @param {string} action - The action name (matches data-action attribute)
   * @param {Function} handler - Handler function(element, dataset)
   */
  function registerAction(action, handler) {
    actionHandlers[action] = handler;
  }

  /**
   * Central click delegation handler.
   * Catches clicks on any element with [data-action] and routes to the registered handler.
   */
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    if (!action || !actionHandlers[action]) return;

    e.preventDefault();
    e.stopPropagation();

    // Pass the element and its dataset to the handler
    actionHandlers[action](target, target.dataset);
  });

  // Also handle touchend for mobile (prevents 300ms delay)
  document.addEventListener('touchend', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    if (!action || !actionHandlers[action]) return;

    // Only handle if this is a tap (not a scroll)
    if (target._touchMoved) {
      target._touchMoved = false;
      return;
    }

    e.preventDefault();
    actionHandlers[action](target, target.dataset);
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    var target = e.target.closest('[data-action]');
    if (target) target._touchMoved = true;
  }, { passive: true });

  document.addEventListener('touchstart', function(e) {
    var target = e.target.closest('[data-action]');
    if (target) target._touchMoved = false;
  }, { passive: true });

  // ============================================
  // REGISTER COMMON ACTIONS
  // ============================================

  // Join partner (from navigation.js home cards)
  registerAction('joinPartner', function(el, data) {
    if (typeof window.joinPartner === 'function') {
      window.joinPartner(data.name, data.time, el);
    }
  });

  // Start conversation (from messaging.js member search)
  registerAction('startConversation', function(el, data) {
    if (typeof window.startConversation === 'function') {
      window.startConversation(data.id);
    }
  });

  // Navigate to screen
  registerAction('navigate', function(el, data) {
    if (typeof window.navigateTo === 'function') {
      window.navigateTo(data.screen);
    }
  });

  // Close/remove modal by ID
  registerAction('closeModal', function(el, data) {
    var modal = document.getElementById(data.modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }
  });

  // Dismiss notification
  registerAction('dismissNotification', function(el) {
    var item = el.closest('.notification-item') || el.parentElement;
    if (typeof window.dismissNotification === 'function') {
      window.dismissNotification(item);
    }
  });

  // RSVP for event (from events.js)
  registerAction('toggleEventRsvp', function(el, data) {
    if (typeof window.toggleEventRsvp === 'function') {
      window.toggleEventRsvp(data.eventId);
    }
  });

  // RSVP from modal
  registerAction('rsvpFromModal', function(el, data) {
    if (typeof window.rsvpFromModal === 'function') {
      window.rsvpFromModal(data.eventId);
    }
  });

  // Cancel event RSVP (from mybookings.js)
  registerAction('cancelEventRsvp', function(el, data) {
    if (typeof window.cancelEventRsvp === 'function') {
      window.cancelEventRsvp(data.eventId);
    }
  });

  // Remove partner request
  registerAction('removePartnerRequest', function(el, data) {
    if (typeof window.removePartnerRequest === 'function') {
      window.removePartnerRequest(data.reqId);
    }
  });

  // Show/cancel/modify booking modals
  registerAction('showModifyModal', function(el, data) {
    if (typeof window.showModifyModal === 'function') {
      window.showModifyModal(data.bookingId);
    }
  });

  registerAction('showCancelModal', function(el, data) {
    if (typeof window.showCancelModal === 'function') {
      window.showCancelModal(data.bookingId);
    }
  });

  // Admin task actions
  registerAction('assignTask', function(el, data) {
    if (typeof window.assignTask === 'function') {
      window.assignTask(data.eventId, data.taskId, data.member);
    }
  });

  registerAction('showAssignTaskModal', function(el, data) {
    if (typeof window.showAssignTaskModal === 'function') {
      window.showAssignTaskModal(data.eventId, data.taskId, data.taskName);
    }
  });

  registerAction('showReassignTaskModal', function(el, data) {
    if (typeof window.showReassignTaskModal === 'function') {
      window.showReassignTaskModal(data.eventId, data.taskId, data.taskName, data.assigned);
    }
  });

  registerAction('addTaskToEvent', function(el, data) {
    if (typeof window.addTaskToEvent === 'function') {
      window.addTaskToEvent(data.eventId, data.taskName, data.icon, data.iconClass);
    }
  });

  registerAction('showAddTaskModal', function(el, data) {
    if (typeof window.showAddTaskModal === 'function') {
      window.showAddTaskModal(data.eventId);
    }
  });

  // Register for coaching class
  registerAction('registerForClass', function(el, data) {
    if (typeof window.registerForClass === 'function') {
      window.registerForClass(data.classId);
    }
  });

  // Interclub RSVP
  registerAction('rsvpInterclub', function(el, data) {
    if (typeof window.rsvpInterclub === 'function') {
      window.rsvpInterclub(data.eventId, data.response);
    }
  });

  // View member profile
  registerAction('viewMemberProfile', function(el, data) {
    if (typeof window.viewMemberProfile === 'function') {
      window.viewMemberProfile(data.name);
    }
  });

  // Toggle privacy setting
  registerAction('togglePrivacySetting', function(el, data) {
    if (typeof window.togglePrivacySetting === 'function') {
      el.classList.toggle('active');
      window.togglePrivacySetting(data.setting, el);
    }
  });

  // Select announcement recipient
  registerAction('selectAnnouncementRecipient', function(el) {
    if (typeof window.selectAnnouncementRecipient === 'function') {
      window.selectAnnouncementRecipient(el);
    }
  });

  // Admin payment actions
  registerAction('adminMarkPaid', function(el, data) {
    if (typeof window.adminMarkPaid === 'function') {
      window.adminMarkPaid(parseInt(data.memberId));
    }
  });

  registerAction('adminFlagMember', function(el, data) {
    if (typeof window.adminFlagMember === 'function') {
      window.adminFlagMember(parseInt(data.memberId));
    }
  });

  registerAction('adminUnflagMember', function(el, data) {
    if (typeof window.adminUnflagMember === 'function') {
      window.adminUnflagMember(parseInt(data.memberId));
    }
  });

  registerAction('adminSendReminder', function(el, data) {
    if (typeof window.adminSendReminder === 'function') {
      window.adminSendReminder(parseInt(data.memberId));
    }
  });

  // ============================================
  // EXPORTS
  // ============================================
  MTC.fn.registerAction = registerAction;
  window.registerAction = registerAction;

})();
