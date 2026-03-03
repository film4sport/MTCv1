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

// ============================================
// MTC.DEBUG — Production-safe logging
// Only outputs when debug flag is enabled (localStorage mtc-debug = 'true')
// ============================================
MTC.DEBUG = (function() {
  try { return localStorage.getItem('mtc-debug') === 'true'; } catch(e) { return false; }
})();

/** Log only in debug mode — use instead of console.log in production code */
MTC.log = function() {
  if (MTC.DEBUG) console.log.apply(console, ['[MTC]'].concat(Array.prototype.slice.call(arguments)));
};

/** Warn only in debug mode — use instead of console.warn in production code */
MTC.warn = function() {
  if (MTC.DEBUG) console.warn.apply(console, ['[MTC]'].concat(Array.prototype.slice.call(arguments)));
};

// ============================================
// Global error handlers — catch unhandled promise rejections
// ============================================
window.addEventListener('unhandledrejection', function(e) {
  if (MTC.DEBUG) console.error('[MTC] Unhandled promise rejection:', e.reason);
});
window.addEventListener('error', function(e) {
  if (MTC.DEBUG) console.error('[MTC] Uncaught error:', e.message, e.filename, e.lineno);
});

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
      MTC.warn('MTC storage parse error for ' + key, e);
      // Clear corrupted data to prevent repeated failures
      try { localStorage.removeItem(key); } catch(e2) {}
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

// Haptic removed — no-op stub for any remaining calls
function haptic() {}

// ============================================
// GLOBAL ERROR HANDLERS
// Catch unhandled errors/rejections so the app doesn't silently break.
// ============================================
var _errorCount = 0;
var _errorResetTimer = null;

function showCrashRecovery() {
  // Only show if no overlay already present
  if (document.getElementById('crashOverlay')) return;
  var overlay = document.createElement('div');
  overlay.id = 'crashOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(19,18,17,0.95);display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;';
  overlay.innerHTML =
    '<div style="max-width:320px;">' +
      '<div style="font-size:48px;margin-bottom:16px;">&#127934;</div>' +
      '<h2 style="font-size:20px;font-weight:600;color:#e8e4d9;margin:0 0 8px;">Something went wrong</h2>' +
      '<p style="font-size:14px;color:#9ca3a0;margin:0 0 24px;">The app hit an unexpected error. Tap below to reload.</p>' +
      '<button onclick="location.reload()" style="background:#c8ff00;color:#131211;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;">Reload App</button>' +
    '</div>';
  document.body.appendChild(overlay);
}

window.onerror = function(message, source, lineno, colno, error) {
  console.error('[MTC Global Error]', message, source, lineno, error);
  _errorCount++;
  clearTimeout(_errorResetTimer);
  _errorResetTimer = setTimeout(function() { _errorCount = 0; }, 10000);
  // 3+ errors in 10s = something is fundamentally broken → show recovery
  if (_errorCount >= 3) {
    showCrashRecovery();
  } else if (navigator.onLine && typeof showToast === 'function') {
    showToast('Something went wrong', 'error');
  }
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('[MTC Unhandled Promise]', event.reason);
  _errorCount++;
  clearTimeout(_errorResetTimer);
  _errorResetTimer = setTimeout(function() { _errorCount = 0; }, 10000);
  if (_errorCount >= 3) {
    showCrashRecovery();
  } else if (typeof showToast === 'function') {
    showToast('An unexpected error occurred', 'error');
  }
});

