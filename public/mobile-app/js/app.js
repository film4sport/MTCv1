/* app.js - MTC Court */
// ============================================
// INITIALIZE APP ON LOAD
// ============================================
(function() {
  'use strict';

  // Set dark mode toggle to match current theme
  const app = document.getElementById('app');
  const currentTheme = app ? app.getAttribute('data-theme') : 'light';
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) {
    if (currentTheme === 'dark') {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  // Initialize payment system
  if (typeof initPaymentSystem === 'function') {
    initPaymentSystem();
  }
})();
