/* splash.js - MTC Court */
// ============================================
// APP LAUNCH SPLASH SCREEN CONTROLLER
// Shows branded animation on launch.
// Test mode: add ?splash=1 to URL to force-show.
// ============================================
(function() {
  'use strict';

  var splash = document.getElementById('splashScreen');
  if (!splash) return;

  // Test modes via URL params:
  //   ?splash=1        force-show splash (auto-dismisses after animation)
  //   ?splash=1&hold=1 force-show and hold (tap anywhere to dismiss)
  var params = window.location.search;
  var isTestMode = /[?&]splash=1/.test(params);
  var isHoldMode = /[?&]hold=1/.test(params);

  // Show splash on all mobile devices (standalone or browser).
  // Skip only on desktop browsers.
  var isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);

  if (!isStandalone && !isMobile && !isTestMode) {
    splash.style.display = 'none';
    return;
  }

  var appReady = false;
  var minDurationElapsed = false;
  var dismissed = false;

  function dismissSplash() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('dismissed');
    setTimeout(function() {
      splash.style.display = 'none';
    }, 400);
  }

  function tryDismissSplash() {
    if (appReady && minDurationElapsed) {
      dismissSplash();
    }
  }

  window.addEventListener('mtc-app-ready', function() {
    appReady = true;
    tryDismissSplash();
  }, { once: true });

  if (isHoldMode) {
    splash.addEventListener('click', dismissSplash);
  } else {
    var hasWarmSession = false;
    try {
      hasWarmSession = !!localStorage.getItem('mtc-session-active') && !!localStorage.getItem('mtc-user');
    } catch (e) {
      hasWarmSession = false;
    }

    // Warm return sessions should feel faster than a cold launch.
    var splashDuration = hasWarmSession ? 900 : 1400;
    setTimeout(function() {
      minDurationElapsed = true;
      tryDismissSplash();
    }, splashDuration);

    // Failsafe so a broken init path cannot trap the splash forever.
    setTimeout(function() {
      appReady = true;
      minDurationElapsed = true;
      tryDismissSplash();
    }, splashDuration + 2500);
  }
})();
