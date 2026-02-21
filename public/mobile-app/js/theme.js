/* theme.js - MTC Court */
// ============================================
// THEME TOGGLE
// ============================================
(function() {
  'use strict';

  // onclick handler (index.html)
  window.toggleTheme = function() {
    const app = document.getElementById('app');
    const isDark = app.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    app.setAttribute('data-theme', newTheme);

    // Persist preference
    MTC.storage.set('mtc-theme', newTheme);

    // Update toggle visual to match NEW theme state
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
      if (newTheme === 'dark') {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }

    // Sync status bar color with theme
    const metaColor = document.querySelector('meta[name="theme-color"]');
    if (metaColor) metaColor.setAttribute('content', newTheme === 'dark' ? '#0b0a09' : '#c8ff00');

    // Force COURT themed colors on weather card
    MTC.fn.updateWeatherCardColors(newTheme === 'dark');
  };

  // Cross-file function (called from interactive.js)
  /** @param {boolean} isDark - Whether dark mode is active */
  MTC.fn.updateWeatherCardColors = function(isDark) {
    // Weather card premium colors are handled by CSS via [data-theme="dark"] selectors.
    // No inline styles needed — theme toggle on #app drives everything.
  };
})();
