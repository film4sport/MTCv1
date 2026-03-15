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

  // Install slide removed — install gate handles PWA instructions now

  // Private helper
  function showOnboarding() {
    currentOnboardingSlide = 0;
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

  // Private helper — re-trigger CSS entrance animations on the active slide
  function reAnimateSlide(slide) {
    var animEls = slide.querySelectorAll('.onboarding-title, .onboarding-text, .onboarding-preview, .onboarding-icon');
    animEls.forEach(function(el) {
      el.style.animation = 'none';
      // Force reflow so the browser restarts the animation
      void el.offsetHeight;
      el.style.animation = '';
    });
  }

  // Private helper
  function updateOnboardingUI() {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.onboarding-dot');
    const btn = document.getElementById('onboardingBtn');

    slides.forEach(function(slide, i) {
      slide.style.transform = 'translateX(' + ((i - currentOnboardingSlide) * 100) + '%)';
      // Re-trigger entrance animations on the newly active slide
      if (i === currentOnboardingSlide) {
        reAnimateSlide(slide);
      }
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

  // Exposed globally so the CTA button on the final slide can call it
  function completeOnboarding() {
    MTC.storage.set('mtc-onboarding-complete', true);
    document.getElementById('onboardingOverlay').classList.remove('active');
  }
  window.completeOnboarding = completeOnboarding;
})();
