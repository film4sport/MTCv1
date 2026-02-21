/* enhancements.js - MTC Court */
// ============================================
// SKELETON LOADERS / SWIPE / PERSISTENCE
// ============================================
(function() {
  'use strict';

  // ============================================
  // SKELETON LOADERS
  // ============================================
  function showHomeSkeleton() {
    const quickActions = document.querySelector('#screen-home .quick-actions');
    if (!quickActions) return;

    const existing = document.getElementById('homeSkeleton');
    if (existing) return;

    const skeleton = document.createElement('div');
    skeleton.id = 'homeSkeleton';
    skeleton.className = 'skeleton-loader';
    skeleton.innerHTML =
      '<div class="skeleton-home-card">' +
        '<div class="skeleton-bar title"></div>' +
        '<div class="skeleton-row"><div class="skeleton-bar circle"></div><div style="flex:1"><div class="skeleton-bar medium"></div><div class="skeleton-bar short"></div></div></div>' +
      '</div>' +
      '<div class="skeleton-home-card">' +
        '<div class="skeleton-bar title"></div>' +
        '<div class="skeleton-bar long"></div>' +
        '<div class="skeleton-bar medium"></div>' +
      '</div>';

    quickActions.insertAdjacentElement('afterend', skeleton);
  }

  function hideHomeSkeleton() {
    const el = document.getElementById('homeSkeleton');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { el.remove(); }, 300);
    }
  }

  function showPartnersSkeleton() {
    const firstCard = document.querySelector('#screen-partners .partner-card');
    if (!firstCard) return;

    const existing = document.getElementById('partnersSkeleton');
    if (existing) return;

    document.querySelectorAll('#screen-partners .partner-card').forEach(function(c) {
      c.dataset.originalDisplay = c.style.display || '';
      c.style.display = 'none';
    });

    const skeleton = document.createElement('div');
    skeleton.id = 'partnersSkeleton';
    skeleton.className = 'skeleton-loader';

    for (let i = 0; i < 3; i++) {
      skeleton.innerHTML +=
        '<div class="skeleton-partner">' +
          '<div class="skeleton-bar circle"></div>' +
          '<div style="flex:1">' +
            '<div class="skeleton-bar medium"></div>' +
            '<div class="skeleton-bar short"></div>' +
          '</div>' +
        '</div>';
    }

    firstCard.insertAdjacentElement('beforebegin', skeleton);
  }

  function hidePartnersSkeleton() {
    const skeleton = document.getElementById('partnersSkeleton');
    if (skeleton) {
      skeleton.style.opacity = '0';
      skeleton.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { skeleton.remove(); }, 300);
    }
    document.querySelectorAll('#screen-partners .partner-card').forEach(function(c) {
      c.style.display = '';
    });
  }

  // ============================================
  // BOOKING SCREEN SKELETON
  // ============================================
  function showBookingSkeleton() {
    const container = document.querySelector('#screen-book .booking-content, #screen-book .screen-content');
    if (!container) return;
    const existing = document.getElementById('bookingSkeleton');
    if (existing) return;

    const skeleton = document.createElement('div');
    skeleton.id = 'bookingSkeleton';
    skeleton.className = 'skeleton-loader skeleton-booking-wrap';
    skeleton.innerHTML =
      '<div class="skeleton-date-bar skeleton-bar full"></div>' +
      '<div class="skeleton-slot-grid">' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
        '<div class="skeleton-slot skeleton-bar"></div>' +
      '</div>';
    container.prepend(skeleton);
  }

  function hideBookingSkeleton() {
    const el = document.getElementById('bookingSkeleton');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { el.remove(); }, 300);
    }
  }

  // ============================================
  // SCHEDULE SCREEN SKELETON
  // ============================================
  function showScheduleSkeleton() {
    const container = document.querySelector('#screen-schedule .screen-content, #screen-schedule');
    if (!container) return;
    const existing = document.getElementById('scheduleSkeleton');
    if (existing) return;

    const skeleton = document.createElement('div');
    skeleton.id = 'scheduleSkeleton';
    skeleton.className = 'skeleton-loader skeleton-schedule-wrap';
    skeleton.innerHTML =
      '<div class="skeleton-pills-row">' +
        '<div class="skeleton-bar skeleton-pill-item"></div>' +
        '<div class="skeleton-bar skeleton-pill-item"></div>' +
      '</div>' +
      '<div class="skeleton-schedule-card"><div class="skeleton-row"><div class="skeleton-bar circle" style="width:40px;height:40px"></div><div style="flex:1"><div class="skeleton-bar medium"></div><div class="skeleton-bar short"></div></div></div></div>' +
      '<div class="skeleton-schedule-card"><div class="skeleton-row"><div class="skeleton-bar circle" style="width:40px;height:40px"></div><div style="flex:1"><div class="skeleton-bar long"></div><div class="skeleton-bar medium"></div></div></div></div>' +
      '<div class="skeleton-schedule-card"><div class="skeleton-row"><div class="skeleton-bar circle" style="width:40px;height:40px"></div><div style="flex:1"><div class="skeleton-bar medium"></div><div class="skeleton-bar short"></div></div></div></div>';
    container.prepend(skeleton);
  }

  function hideScheduleSkeleton() {
    const el = document.getElementById('scheduleSkeleton');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { el.remove(); }, 300);
    }
  }

  // ============================================
  // MESSAGES SCREEN SKELETON
  // ============================================
  function showMessagesSkeleton() {
    const container = document.querySelector('#screen-messages .screen-content, #screen-messages');
    if (!container) return;
    const existing = document.getElementById('messagesSkeleton');
    if (existing) return;

    const skeleton = document.createElement('div');
    skeleton.id = 'messagesSkeleton';
    skeleton.className = 'skeleton-loader skeleton-messages-wrap';
    let html = '';
    for (let i = 0; i < 4; i++) {
      html +=
        '<div class="skeleton-message-item">' +
          '<div class="skeleton-bar circle"></div>' +
          '<div style="flex:1">' +
            '<div class="skeleton-bar medium"></div>' +
            '<div class="skeleton-bar short"></div>' +
          '</div>' +
        '</div>';
    }
    skeleton.innerHTML = html;
    container.prepend(skeleton);
  }

  function hideMessagesSkeleton() {
    const el = document.getElementById('messagesSkeleton');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { el.remove(); }, 300);
    }
  }

  function setupSkeletonHooks() {
    document.addEventListener('screenchange', function(e) {
      const screen = e.detail && e.detail.screen;
      if (screen === 'home') {
        showHomeSkeleton();
        setTimeout(hideHomeSkeleton, 400);
      }
      if (screen === 'partners') {
        showPartnersSkeleton();
        setTimeout(hidePartnersSkeleton, 500);
      }
      if (screen === 'book') {
        showBookingSkeleton();
        setTimeout(hideBookingSkeleton, 150);
      }
      if (screen === 'schedule') {
        showScheduleSkeleton();
        setTimeout(hideScheduleSkeleton, 200);
      }
      if (screen === 'messages') {
        showMessagesSkeleton();
        setTimeout(hideMessagesSkeleton, 150);
      }
    });
  }

  // ============================================
  // SWIPE-TO-DISMISS NOTIFICATIONS
  // ============================================
  function setupSwipeToDismiss() {
    const screen = document.getElementById('screen-notifications');
    if (!screen) return;

    const state = { el: null, startX: 0, startY: 0, currentX: 0, swiping: false, scrolling: false, isDismiss: false };
    let lastTouchTime = 0;

    screen.addEventListener('touchstart', function(e) {
      const item = e.target.closest('.notification-item');
      if (!item) return;
      state.el = item;
      state.startX = e.touches[0].clientX;
      state.startY = e.touches[0].clientY;
      state.swiping = false;
      state.scrolling = false;
      state.currentX = 0;
      state.isDismiss = !!e.target.closest('.notification-dismiss-btn');
    }, { passive: true });

    screen.addEventListener('touchmove', function(e) {
      if (!state.el) return;
      const dx = e.touches[0].clientX - state.startX;
      const dy = e.touches[0].clientY - state.startY;

      if (!state.swiping && Math.abs(dy) > 30) {
        state.scrolling = true;
        return;
      }

      if (!state.swiping && !state.scrolling && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        state.swiping = true;
      }

      if (state.swiping && dx < 0) {
        e.preventDefault();
        state.currentX = Math.max(dx, -120);
        state.el.style.transform = 'translateX(' + state.currentX + 'px)';
      }
    }, { passive: false });

    screen.addEventListener('touchend', function(e) {
      if (!state.el) return;
      const item = state.el;

      if (state.swiping) {
        if (state.currentX < -70) {
          item.style.transform = 'translateX(-100%)';
          item.style.opacity = '0';
          item.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
          haptic('light');
          setTimeout(function() {
            item.style.transform = ''; item.style.opacity = ''; item.style.transition = '';
            dismissNotification(item);
          }, 300);
        } else {
          item.style.transform = '';
          item.style.transition = 'transform 0.2s ease';
          setTimeout(function() { item.style.transition = ''; }, 200);
        }
      } else if (!state.scrolling && !item._dismissing) {
        lastTouchTime = Date.now();
        if (state.isDismiss) {
          dismissNotification(item);
        } else {
          markNotificationRead(item);
        }
      }

      state.el = null;
      state.swiping = false;
      state.scrolling = false;
    }, { passive: true });

    screen.addEventListener('click', function(e) {
      if (Date.now() - lastTouchTime < 500) return;
      const item = e.target.closest('.notification-item');
      if (!item || item._dismissing) return;
      if (item.getAttribute('onclick')) return;
      if (e.target.closest('.notification-dismiss-btn')) {
        dismissNotification(item);
      } else {
        markNotificationRead(item);
      }
    });
  }

  // ============================================
  // LONG-PRESS / HAPTIC FEEDBACK
  // ============================================
  function setupLongPress() {
    const interactiveItems = [
      '.partner-card',
      '.match-card',
      '.match-result',
      '.booking-card',
      '.message-item',
      '.quick-action'
    ];

    const selector = interactiveItems.join(',');
    let pressTimer = null;
    let pressElement = null;

    document.addEventListener('touchstart', function(e) {
      const el = e.target.closest(selector);
      if (!el) return;

      pressElement = el;
      pressTimer = setTimeout(function() {
        el.classList.add('pressing');
        if (navigator.vibrate) navigator.vibrate(30);

        if (el.classList.contains('booking-card')) {
          showToast('Hold to manage booking');
        } else if (el.classList.contains('message-item')) {
          showToast('Hold to pin conversation');
        }
      }, 500);
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      if (pressTimer) clearTimeout(pressTimer);
      if (pressElement) {
        pressElement.classList.remove('pressing');
        pressElement = null;
      }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (pressTimer) clearTimeout(pressTimer);
      if (pressElement) {
        pressElement.classList.remove('pressing');
        pressElement = null;
      }
    }, { passive: true });
  }

  function setupHapticTap() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.quick-action, .filter-pill, .nav-item, .partner-action-btn');
      if (!btn) return;

      btn.classList.add('haptic-tap');
      if (navigator.vibrate) navigator.vibrate(10);
      setTimeout(function() { btn.classList.remove('haptic-tap'); }, 200);
    });
  }

  // ============================================
  // LOCALSTORAGE PERSISTENCE
  // ============================================
  // Cross-file function (called from payments.js)
  /** Persists bookingsData + eventBookings to localStorage */
  MTC.fn.saveBookings = function() {
    if (typeof bookingsData !== 'undefined') {
      MTC.storage.set('mtc-bookings', bookingsData);
    }
  };
  window.saveBookings = MTC.fn.saveBookings;

  // Cross-file function (called from interactive.js)
  /** Restores bookingsData + eventBookings from localStorage */
  MTC.fn.loadBookings = function() {
    const saved = MTC.storage.get('mtc-bookings', null);
    if (saved && typeof bookingsData !== 'undefined') {
      Object.keys(saved).forEach(function(date) {
        bookingsData[date] = saved[date];
      });
    }
  };
  window.loadBookings = MTC.fn.loadBookings;

  function loadProfile() {
    return MTC.storage.get('mtc-profile', null);
  }

  function setupPersistence() {
    MTC.fn.loadBookings();

    const profile = loadProfile();
    if (profile) {
      applyProfileToDOM(profile);
    }

    document.addEventListener('visibilitychange', function() {
      if (document.hidden) MTC.fn.saveBookings();
    });

    window.addEventListener('beforeunload', function() {
      MTC.fn.saveBookings();
      if (typeof saveConversations === 'function') saveConversations();
    });
  }

  function applyProfileToDOM(profile) {
    if (!profile) return;

    const nameEl = document.querySelector('.profile-name');
    const emailEl = document.querySelector('.profile-email');

    if (nameEl && profile.name) nameEl.textContent = profile.name;
    if (emailEl && profile.email) emailEl.textContent = profile.email;
  }

  // ============================================
  // PARTNERS / MATCHES FILTER + EMPTY STATES
  // ============================================
  function setupPartnerFilters() {
    const pills = document.querySelectorAll('#screen-partners .filter-pill');
    pills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        pills.forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');

        const filter = pill.textContent.trim();
        filterPartnersEnhanced(filter);
      });
    });
  }

  function filterPartnersEnhanced(filter) {
    const cards = document.querySelectorAll('#screen-partners .partner-card');
    let visible = 0;

    cards.forEach(function(card) {
      const level = card.querySelector('.partner-level');
      const availability = card.querySelector('.partner-availability');
      let show = true;

      if (filter === 'All') {
        show = true;
      } else if (filter === 'Available Now') {
        show = availability && availability.textContent.toLowerCase().includes('available now');
      } else if (filter === 'Beginner') {
        show = level && parseFloat(level.textContent.replace('NTRP ', '')) < 3.5;
      } else if (filter === 'Intermediate') {
        const ntrp = level ? parseFloat(level.textContent.replace('NTRP ', '')) : 0;
        show = ntrp >= 3.5 && ntrp < 4.5;
      } else if (filter === 'Advanced') {
        show = level && parseFloat(level.textContent.replace('NTRP ', '')) >= 4.5;
      }

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    const emptyState = document.getElementById('noPartners');
    if (emptyState) {
      emptyState.style.display = visible === 0 ? 'flex' : 'none';
    }
  }

  // ============================================
  // DISPATCH SCREEN CHANGE EVENT
  // ============================================
  function hookNavigationForSkeletons() {
    const orig = window.navigateTo;
    if (!orig) return;

    window.navigateTo = function(screen) {
      document.dispatchEvent(new CustomEvent('screenchange', { detail: { screen: screen } }));
      return orig.apply(this, arguments);
    };
  }

  // ============================================
  // INIT ALL ENHANCEMENTS
  // ============================================
  function initEnhancements() {
    hookNavigationForSkeletons();
    setupSkeletonHooks();
    setupSwipeToDismiss();
    setupLongPress();
    setupHapticTap();
    setupPersistence();
    setupPartnerFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initEnhancements, 100);
    });
  } else {
    setTimeout(initEnhancements, 100);
  }
})();
