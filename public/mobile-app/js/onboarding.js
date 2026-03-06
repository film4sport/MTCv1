/* onboarding.js - MTC Court */
// ============================================
// FIRST-TIME USER ONBOARDING
// ============================================
(function() {
  'use strict';

  // Private state
  let currentOnboardingSlide = 0;
  const totalOnboardingSlides = 6;

  // Cross-file function (called from interactive.js)
  /** Shows onboarding flow if user hasn't completed it yet */
  MTC.fn.checkOnboarding = function() {
    const hasSeenOnboarding = MTC.storage.get('mtc-onboarding-complete', null);
    if (!hasSeenOnboarding) {
      setTimeout(function() { showOnboarding(); }, 600);
    }
  };

  // Private helper — detect device for install slide
  function customizeInstallSlide() {
    var titleEl = document.getElementById('onboardingInstallTitle');
    var textEl = document.getElementById('onboardingInstallText');
    var iconEl = document.getElementById('onboardingDeviceIcon');
    if (!titleEl || !textEl) return;

    var ua = navigator.userAgent || '';
    var isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
    var isAndroid = /Android/.test(ua);
    var isIPhone = /iPhone/.test(ua);

    if (isIPad) {
      titleEl.textContent = 'ADD TO YOUR IPAD';
      textEl.textContent = 'Tap the Share button in Safari, then "Add to Home Screen". MTC Court works full-screen on your iPad — like a native app!';
      if (iconEl) iconEl.innerHTML = '<rect x="2" y="3" width="20" height="18" rx="2" ry="2"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M9 9l3-3 3 3M12 6v7" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (isIPhone) {
      titleEl.textContent = 'ADD TO YOUR IPHONE';
      textEl.textContent = 'Tap the Share button in Safari, then "Add to Home Screen". MTC Court will appear on your home screen — no App Store needed!';
    } else if (isAndroid) {
      titleEl.textContent = 'INSTALL THE APP';
      textEl.textContent = 'Tap the menu button in Chrome, then "Add to Home Screen" or "Install App". MTC Court works offline — no Play Store needed!';
    }
    // Default text stays for desktop/other
  }

  // Private helper
  function showOnboarding() {
    currentOnboardingSlide = 0;
    customizeInstallSlide();
    updateOnboardingUI();
    document.getElementById('onboardingOverlay').classList.add('active');

    // Setup touch swipe (only once)
    const slides = document.getElementById('onboardingSlides');
    if (slides._hasSwipe) return;
    slides._hasSwipe = true;
    let startX = 0;
    let isDragging = false;

    slides.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    slides.addEventListener('touchend', function(e) {
      if (!isDragging) return;
      isDragging = false;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentOnboardingSlide < totalOnboardingSlides - 1) {
          currentOnboardingSlide++;
          updateOnboardingUI();
        } else if (diff < 0 && currentOnboardingSlide > 0) {
          currentOnboardingSlide--;
          updateOnboardingUI();
        }
      }
    }, { passive: true });
  }

  // onclick handler (index.html)
  window.nextOnboardingSlide = function() {
    if (currentOnboardingSlide < totalOnboardingSlides - 1) {
      currentOnboardingSlide++;
      updateOnboardingUI();
    } else {
      completeOnboarding();
    }
  };

  // Private helper
  function updateOnboardingUI() {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.onboarding-dot');
    const btn = document.getElementById('onboardingBtn');

    slides.forEach(function(slide, i) {
      slide.style.transform = 'translateX(' + ((i - currentOnboardingSlide) * 100) + '%)';
    });

    dots.forEach(function(dot, i) {
      dot.classList.toggle('active', i === currentOnboardingSlide);
    });

    btn.textContent = currentOnboardingSlide === totalOnboardingSlides - 1 ? 'GET STARTED' : 'NEXT';
  }

  // onclick handler (index.html)
  window.skipOnboarding = function() {
    completeOnboarding();
  };

  // Private helper
  function completeOnboarding() {
    MTC.storage.set('mtc-onboarding-complete', true);
    document.getElementById('onboardingOverlay').classList.remove('active');
  }
})();
