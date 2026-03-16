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

  // Test modes via URL params:
  //   ?splash=1        — force-show splash (auto-dismisses after animation)
  //   ?splash=1&hold=1 — force-show and HOLD (tap anywhere to dismiss)
  var params = window.location.search;
  var isTestMode = /[?&]splash=1/.test(params);
  var isHoldMode = /[?&]hold=1/.test(params);

  // Show splash on iOS standalone only (iPhone/iPad PWA).
  // Android gets Chrome's OS splash from the manifest — no double splash.
  // Test mode (?splash=1) always shows it for development.
  var isIOSStandalone = window.navigator.standalone === true;
  var isAndroid = /Android/i.test(navigator.userAgent);

  if (!isIOSStandalone && !isTestMode) {
    // Not iOS standalone and not test mode — skip splash
    splash.style.display = 'none';
    return;
  }

  function dismissSplash() {
    splash.classList.add('dismissed');
    // Remove from DOM after fade-out completes
    setTimeout(function() {
      splash.style.display = 'none';
    }, 400); // matches CSS transition duration
  }

  if (isHoldMode) {
    // Hold mode — splash stays until user taps it
    splash.addEventListener('click', dismissSplash);
  } else {
    // Normal mode — dismiss after animation plays
    var SPLASH_DURATION = 1600; // ms — enough for all staggered animations to finish
    setTimeout(dismissSplash, SPLASH_DURATION);
  }
})();
