/* interactive.js - MTC Court */
(function() {
  'use strict';

  // ============================================
  // UI INTERACTIVE ELEMENTS
  // ============================================
  document.querySelectorAll('.date-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.date-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  document.querySelectorAll('.court-select-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.court-select-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  document.querySelectorAll('.time-slot:not(.unavailable)').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.time-slot').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  document.querySelectorAll('.filter-pill').forEach(function(item) {
    item.addEventListener('click', function() {
      item.parentElement.querySelectorAll('.filter-pill').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  document.querySelectorAll('.schedule-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.schedule-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
    });
  });

  document.querySelectorAll('.stat-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.stat-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  // ============================================
  // APP INITIALIZATION (DOMContentLoaded)
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    // Restore saved theme preference
    const savedTheme = MTC.storage.get('mtc-theme', null);
    if (savedTheme) {
      document.getElementById('app').setAttribute('data-theme', savedTheme);
      const toggle = document.getElementById('darkModeToggle');
      if (toggle) {
        if (savedTheme === 'dark') toggle.classList.add('active');
        else toggle.classList.remove('active');
      }
      MTC.fn.updateWeatherCardColors(savedTheme === 'dark');
      // Sync status bar color
      const metaColor = document.querySelector('meta[name="theme-color"]');
      if (metaColor) metaColor.setAttribute('content', savedTheme === 'dark' ? '#0b0a09' : '#c8ff00');
    }

    // Check for saved login
    currentUser = MTC.storage.get('mtc-user', null);
    if (currentUser) {
      document.getElementById('login-screen').classList.remove('active');
      document.getElementById('bottomNav').style.display = 'block';

      // Apply guest restrictions and route to correct screen
      if (typeof applyGuestRestrictions === 'function') applyGuestRestrictions();

      if (currentUser.isMember === false) {
        document.getElementById('screen-book').classList.add('active');
      } else {
        document.getElementById('screen-home').classList.add('active');
      }

      fetchWeather();
    }

    // Initialize UI
    animateCountUp();

    // Check for first-time user onboarding
    MTC.fn.checkOnboarding();

    // Setup pull to refresh
    MTC.fn.setupPullToRefresh();

    // Load saved avatar
    loadSavedAvatar();

    // Initialize notification badge count from DOM
    if (typeof updateUnreadCount === 'function') updateUnreadCount();

    // Restore saved settings toggles
    if (typeof restoreSettingsToggles === 'function') restoreSettingsToggles();

    // Restore saved messages from localStorage
    if (typeof loadSavedConversations === 'function') loadSavedConversations();

    // Populate dynamic home screen event dates
    if (typeof populateHomeEventDates === 'function') populateHomeEventDates();

    // Hide partner cards that were already joined
    if (typeof hideJoinedPartnerCards === 'function') hideJoinedPartnerCards();

    // Setup offline indicator
    setupOfflineIndicator();

    // Register service worker for offline support
    registerServiceWorker();

    // Backup: Add click listener to login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleLogin();
      });
    }
  });

  // ============================================
  // SERVICE WORKER REGISTRATION
  // ============================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Old cache cleanup is now handled by the service worker's activate event.
      // Removed hardcoded cache name that would fall out of sync with auto-bumped SW cache.

      navigator.serviceWorker.register('/mobile-app/sw.js', { scope: '/mobile-app/' })
        .then(function(registration) {
          // ServiceWorker registered successfully
          registration.update();
        })
        .catch(function(error) {
          MTC.warn('ServiceWorker registration failed:', error);
        });

      // Auto-reload when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
      });
    }
  }
})();
