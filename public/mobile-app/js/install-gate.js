/* install-gate.js - MTC Court */
// ============================================
// PWA INSTALL GATE
// Blocks login when running in browser (not installed as PWA).
// Shows device-specific install instructions instead.
// Users can toggle between Safari and Chrome instructions.
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

  // Inline SVG icons (18px, matches text flow)
  var ic = {
    // iOS Share icon — square with arrow pointing up
    share: '<svg class="install-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
    // Plus in square — "Add to Home Screen"
    plusSquare: '<svg class="install-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    // Three vertical dots — Chrome menu
    dots: '<svg class="install-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    // Download arrow — Install App
    download: '<svg class="install-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    // Checkmark circle — confirm
    check: '<svg class="install-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
  };

  /** Safari install instructions */
  var safariSteps = {
    step1: 'Tap <strong>Share</strong> ' + ic.share,
    step1Hint: 'Bottom of screen (iPhone) or top-right (iPad)',
    step2: 'Tap <strong>\u201CAdd to Home Screen\u201D</strong> ' + ic.plusSquare,
    step2Hint: 'Scroll down if you don\u2019t see it',
    step3: 'Tap <strong>\u201CAdd\u201D</strong> ' + ic.check,
    step3Hint: 'MTC Court will appear on your home screen'
  };

  /** Chrome install instructions */
  var chromeSteps = {
    step1: 'Tap <strong>\u22EE</strong> (three dots) ' + ic.dots,
    step1Hint: 'Top-right corner of Chrome',
    step2: 'Tap <strong>\u201CAdd to Home Screen\u201D</strong> ' + ic.download,
    step2Hint: 'Or \u201CInstall App\u201D if shown',
    step3: 'Tap <strong>\u201CInstall\u201D</strong> ' + ic.check,
    step3Hint: 'MTC Court will appear on your home screen'
  };

  /**
   * Apply a set of steps to the DOM.
   */
  function applySteps(steps) {
    var s1 = document.getElementById('installStep1');
    var s1h = document.getElementById('installStep1Hint');
    var s2 = document.getElementById('installStep2');
    var s2h = document.getElementById('installStep2Hint');
    var s3 = document.getElementById('installStep3');
    var s3h = document.getElementById('installStep3Hint');

    if (s1) s1.innerHTML = steps.step1;
    if (s1h) s1h.textContent = steps.step1Hint;
    if (s2) s2.innerHTML = steps.step2;
    if (s2h) s2h.textContent = steps.step2Hint;
    if (s3) s3.innerHTML = steps.step3;
    if (s3h) s3h.textContent = steps.step3Hint;
  }

  /**
   * Switch between Safari and Chrome install instructions.
   * Called by toggle buttons in HTML.
   */
  MTC.fn.switchInstallBrowser = function(browser) {
    var safariBtn = document.getElementById('installToggleSafari');
    var chromeBtn = document.getElementById('installToggleChrome');

    if (browser === 'safari') {
      applySteps(safariSteps);
      if (safariBtn) safariBtn.classList.add('active');
      if (chromeBtn) chromeBtn.classList.remove('active');
    } else {
      applySteps(chromeSteps);
      if (chromeBtn) chromeBtn.classList.add('active');
      if (safariBtn) safariBtn.classList.remove('active');
    }
  };

  /**
   * Set up install screen — detect device, set title, auto-select browser toggle.
   */
  function customizeInstallScreen(device) {
    var title = document.getElementById('installTitle');
    var footerNote = document.getElementById('installFooterNote');

    if (!title) return;

    // Set device-specific title and default browser
    if (device === 'iphone') {
      title.textContent = 'Install MTC Court on Your iPhone';
      MTC.fn.switchInstallBrowser('safari');
    } else if (device === 'ipad') {
      title.textContent = 'Install MTC Court on Your iPad';
      MTC.fn.switchInstallBrowser('safari');
    } else if (device === 'android') {
      title.textContent = 'Install MTC Court';
      MTC.fn.switchInstallBrowser('chrome');
    } else {
      // Unknown device — default to Safari, user can toggle
      title.textContent = 'Install MTC Court';
      MTC.fn.switchInstallBrowser('safari');
    }

    if (footerNote) {
      footerNote.textContent = 'After installing, open the MTC Court app from your home screen to sign in.';
    }
  }

  // Expose the gate check so interactive.js can call it during init
  MTC.fn.checkInstallGate = function() {
    // E2E test bypass — allows Playwright to test login without PWA install
    try { if (localStorage.getItem('mtc-bypass-install-gate') === 'true') return false; } catch(e) {}

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
