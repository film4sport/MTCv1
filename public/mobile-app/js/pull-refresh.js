/* pull-refresh.js - MTC Court */
// ============================================
// PULL TO REFRESH
// ============================================
(function() {
  'use strict';

  // Private state
  let pullStartY = 0;
  let isPulling = false;

  // Cross-file function (called from interactive.js)
  /** Initializes pull-to-refresh gesture handler on all screen elements */
  MTC.fn.setupPullToRefresh = function() {
    const homeScreen = document.getElementById('screen-home');
    if (!homeScreen) return;

    homeScreen.addEventListener('touchstart', function(e) {
      if (homeScreen.scrollTop === 0) {
        pullStartY = e.touches[0].clientY;
        isPulling = true;
      }
    });

    homeScreen.addEventListener('touchmove', function(e) {
      if (!isPulling) return;

      const pullDistance = e.touches[0].clientY - pullStartY;
      const indicator = document.getElementById('pullIndicator');

      if (pullDistance > 0 && pullDistance < 150) {
        indicator.classList.add('visible');
        indicator.style.transform = 'translateX(-50%) rotate(' + (pullDistance * 2) + 'deg)';
      }
    });

    homeScreen.addEventListener('touchend', function(e) {
      if (!isPulling) return;
      isPulling = false;

      const indicator = document.getElementById('pullIndicator');
      const pullDistance = e.changedTouches[0].clientY - pullStartY;

      if (pullDistance > 80) {
        indicator.classList.add('refreshing');

        // Refresh ALL data (weather + bookings + partners + messages + events + notifications)
        fetchWeather();
        if (typeof MTC.fn.refetchAll === 'function') {
          MTC.fn.refetchAll();
        }

        setTimeout(function() {
          indicator.classList.remove('visible', 'refreshing');
          showToast('All data refreshed!');
        }, 1500);
      } else {
        indicator.classList.remove('visible');
      }
    });
  };
})();
