/* utils.js - MTC Court */
// ============================================
// MTC NAMESPACE — single global for the app
// ============================================
// All new state and helpers go here to reduce global pollution.
// Legacy global functions remain for backward compatibility
// with inline onclick handlers in index.html.
const MTC = {
  version: 'v137',
  // Screen lifecycle hooks — screens register cleanup functions here
  _screenCleanup: {},
  // Active event listeners — tracked for cleanup
  _listeners: [],

  // Register a cleanup function for a screen
  onScreenExit: function(screenId, fn) {
    if (!MTC._screenCleanup[screenId]) MTC._screenCleanup[screenId] = [];
    MTC._screenCleanup[screenId].push(fn);
  },

  // Run cleanup for a screen that's being navigated away from
  cleanupScreen: function(screenId) {
    const fns = MTC._screenCleanup[screenId];
    if (fns) {
      fns.forEach(function(fn) { try { fn(); } catch(e) { console.warn('Cleanup error:', e); } });
    }
  },

  // Add a tracked event listener (auto-removable)
  addListener: function(el, event, handler, options) {
    if (!el) return;
    el.addEventListener(event, handler, options);
    MTC._listeners.push({ el: el, event: event, handler: handler, options: options });
  },

  // Remove all tracked listeners
  removeAllListeners: function() {
    MTC._listeners.forEach(function(l) {
      try { l.el.removeEventListener(l.event, l.handler, l.options); } catch(e) {}
    });
    MTC._listeners = [];
  }
};

/**
 * @namespace MTC.state
 * @description Shared application state populated by owning modules.
 * @property {Object|null} currentUser - Logged-in user object (auth.js)
 * @property {string} currentRole - User role: 'member'|'admin'|'guest' (auth.js)
 * @property {Array<Object>} bookingsData - Court booking records (booking.js)
 * @property {Array<Object>} eventBookings - Event/RSVP booking records (mybookings.js)
 * @property {Array<string>} userRsvps - Event IDs the user has RSVP'd to (events.js)
 * @property {Array<Object>} clubEventsData - Club event definitions (events.js)
 * @property {Array<Object>} clubMembers - Club member directory (messaging.js)
 * @property {Object} profileData - User profile data (profile.js)
 * @property {Object} homeToClubEventMap - Maps home events to club event IDs (avatar.js)
 * @property {Object} avatarSVGs - Avatar SVG markup keyed by name (avatar.js)
 * @property {Array<Object>} memberPaymentData - Admin payment data (payments.js)
 */
MTC.state = {};

/**
 * @namespace MTC.fn
 * @description Shared utility functions populated by owning modules.
 * Functions are documented at their definition sites in individual files.
 */
MTC.fn = {};

// ============================================
// MTC.fn.trapFocus — Reusable focus trap for modals/drawers
// Traps Tab/Shift+Tab within a container element.
// @param {HTMLElement} containerEl - The container to trap focus within
// @returns {Function} cleanup - Call to remove the keydown listener
// ============================================
MTC.fn.trapFocus = function(containerEl) {
  if (!containerEl) return function() {};
  const handler = function(e) {
    if (e.key !== 'Tab') return;
    const focusable = containerEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener('keydown', handler);
  return function() { document.removeEventListener('keydown', handler); };
};

// ============================================
// MTC.fn.renderError — User-facing error fallback UI
// Shows a friendly error message inside a container when
// a render function fails. Replaces blank/broken screens.
// @param {HTMLElement} container - The container to show the error in
// @param {string} message - User-friendly error message
// ============================================
MTC.fn.renderError = function(container, message) {
  if (!container) return;
  container.innerHTML =
    '<div class="render-error">' +
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
      '</svg>' +
      '<p>' + sanitizeHTML(message) + '</p>' +
    '</div>';
};

// ============================================
// MTC.storage — Safe localStorage wrapper
// Swap to MTC.api.get/set when backend arrives
// ============================================
MTC.storage = {
  get: function(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback !== undefined ? fallback : null;
      return JSON.parse(raw);
    } catch(e) {
      console.warn('MTC storage parse error for ' + key);
      return fallback !== undefined ? fallback : null;
    }
  },
  set: function(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  },
  getString: function(key, fallback) {
    try { return localStorage.getItem(key) || fallback || null; } catch(e) { return fallback || null; }
  },
  remove: function(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }
};

// ============================================
// MTC.debounce — Delay function execution
// ============================================
MTC.debounce = function(fn, delay) {
  let timer;
  return function() {
    const ctx = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Sanitize text for safe HTML insertion (prevents XSS)
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
// Expose on MTC.fn for use in modules
MTC.fn.sanitizeHTML = sanitizeHTML;

// ============================================
// MTC.fn.safeCall — Wraps a function with try/catch + error UI fallback
// Use to wrap screen render functions so they show a friendly error instead of blank screen.
// @param {Function} fn - The function to wrap
// @param {HTMLElement} [container] - Optional container for renderError fallback
// @param {string} [label] - Optional label for console.error
// @returns {Function} Wrapped function
// ============================================
MTC.fn.safeCall = function(fn, container, label) {
  return function() {
    try {
      return fn.apply(this, arguments);
    } catch (e) {
      console.error('[MTC' + (label ? ' ' + label : '') + ']', e);
      if (container) MTC.fn.renderError(container, 'Something went wrong. Please try again.');
    }
  };
};

// Haptic feedback for mobile devices
// Note: Requires "Vibration feedback" enabled in phone settings
// Samsung: Settings > Sounds and vibration > System sound/vibration control > Touch interactions
function haptic(type = 'light') {
  // Try vibration API (Android Chrome, etc.)
  if (navigator.vibrate) {
    switch(type) {
      case 'light': navigator.vibrate(25); break;
      case 'medium': navigator.vibrate(50); break;
      case 'heavy': navigator.vibrate([50, 30, 50]); break;
      case 'success': navigator.vibrate([30, 50, 80]); break;
      case 'error': navigator.vibrate([100, 50, 100, 50, 100]); break;
    }
  }
  
  // Visual feedback fallback - subtle flash
  if (type === 'success' || type === 'error') {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${type === 'success' ? 'rgba(200, 255, 0, 0.15)' : 'rgba(255, 90, 95, 0.15)'};
      pointer-events: none;
      z-index: 9999;
      animation: flashFade 0.3s ease forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }
}

// ============================================
// GLOBAL ERROR HANDLERS
// Catch unhandled errors/rejections so the app doesn't silently break.
// ============================================
window.onerror = function(message, source, lineno, colno, error) {
  console.error('[MTC Global Error]', message, source, lineno, error);
  // Show toast only for real errors (not script loading failures from offline)
  if (navigator.onLine && typeof showToast === 'function') {
    showToast('Something went wrong', 'error');
  }
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('[MTC Unhandled Promise]', event.reason);
  if (typeof showToast === 'function') {
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
  }
});

