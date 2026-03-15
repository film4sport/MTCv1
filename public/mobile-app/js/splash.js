/* splash.js - MTC Court */
// ============================================
// APP LAUNCH SPLASH SCREEN CONTROLLER
// Shows branded animation on launch, dismisses
// after 1.6s (total visible ~2s with fade-out).
// Test mode: add ?splash=1 to URL to force-show.
// ============================================
(function() {
  'use strict';

  var splash = document.getElementById('splashScreen');
  if (!splash) return;

  // Force-show for testing: ?splash=1 in URL
  var isTestMode = /[?&]splash=1/.test(window.location.search);

  // Only show splash when running as installed PWA (standalone),
  // or in test mode for localhost development
  var isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;

  if (!isStandalone && !isTestMode) {
    // Running in browser — skip splash entirely
    splash.style.display = 'none';
    return;
  }

  // Splash is visible — dismiss after animation plays
  var SPLASH_DURATION = 1600; // ms — enough for all staggered animations to finish

  setTimeout(function() {
    splash.classList.add('dismissed');
    // Remove from DOM after fade-out completes
    setTimeout(function() {
      splash.style.display = 'none';
    }, 400); // matches CSS transition duration
  }, SPLASH_DURATION);
})();
