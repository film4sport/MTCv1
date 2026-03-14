/* install-gate.js - MTC Court */
// ============================================
// PWA INSTALL GATE
// Blocks login when running in browser (not installed as PWA).
// Shows device-specific install instructions instead.
// ============================================
(function() {
  'use strict';

  /**
   * Detect if running as an installed PWA (standalone mode).
   * - iOS: navigator.standalone === true
   * - Android/Chrome: display-mode: standalone media query
   * - Also matches fullscreen and minimal-ui (PWA variants)
   */
  function isRunningAsInstalledPWA() {
    // iOS Safari standalone mode
    if (window.navigator.standalone === true) return true;
    // Chrome / Android / other browsers
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    return false;
  }

  /**
   * Detect device type from user agent.
   * Returns: 'iphone', 'ipad', 'android', or 'other'
   */
  function detectDevice() {
    var ua = navigator.userAgent || '';
    if (/iPhone/.test(ua)) return 'iphone';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ipad';
    if (/Android/.test(ua)) return 'android';
    return 'other';
  }

  /**
   * Customize install steps based on detected device.
   */
  function customizeInstallScreen(device) {
    var title = document.getElementById('installTitle');
    var step1 = document.getElementById('installStep1');
    var step1Hint = document.getElementById('installStep1Hint');
    var step2 = document.getElementById('installStep2');
    var step2Hint = document.getElementById('installStep2Hint');
    var footerNote = document.getElementById('installFooterNote');

    if (!title || !step1) return;

    if (device === 'iphone') {
      title.textContent = 'Install MTC Court on Your iPhone';
      step1.innerHTML = 'Tap the <strong>Share</strong> button';
      step1Hint.textContent = 'The square with an arrow at the bottom of Safari';
      step2.innerHTML = 'Tap <strong>\u201CAdd to Home Screen\u201D</strong>';
      step2Hint.textContent = 'Scroll down in the share menu if you don\u2019t see it';
    } else if (device === 'ipad') {
      title.textContent = 'Install MTC Court on Your iPad';
      step1.innerHTML = 'Tap the <strong>Share</strong> button';
      step1Hint.textContent = 'The square with an arrow at the top of Safari';
      step2.innerHTML = 'Tap <strong>\u201CAdd to Home Screen\u201D</strong>';
      step2Hint.textContent = 'Scroll down in the share menu if you don\u2019t see it';
    } else if (device === 'android') {
      title.textContent = 'Install MTC Court';
      step1.innerHTML = 'Tap the <strong>menu</strong> button';
      step1Hint.textContent = 'The three dots at the top-right of Chrome';
      step2.innerHTML = 'Tap <strong>\u201CAdd to Home Screen\u201D</strong> or <strong>\u201CInstall App\u201D</strong>';
      step2Hint.textContent = 'Chrome may also show an install banner at the bottom';
    }
    // 'other' keeps the default iOS-style instructions

    if (footerNote) {
      footerNote.textContent = 'After installing, open MTC Court from your home screen to sign in.';
    }
  }

  // Expose the gate check so interactive.js can call it during init
  MTC.fn.checkInstallGate = function() {
    if (isRunningAsInstalledPWA()) {
      // Running as installed PWA — allow login, hide install screen
      var installScreen = document.getElementById('install-screen');
      if (installScreen) installScreen.style.display = 'none';
      return false; // not gated
    }

    // Running in browser — block login, show install screen
    var device = detectDevice();
    customizeInstallScreen(device);

    var installScreen = document.getElementById('install-screen');
    var loginScreen = document.getElementById('login-screen');

    if (installScreen) {
      installScreen.style.display = '';
      installScreen.classList.add('active');
    }
    if (loginScreen) {
      loginScreen.classList.remove('active');
      loginScreen.style.display = 'none';
    }

    return true; // gated — login blocked
  };
})();
