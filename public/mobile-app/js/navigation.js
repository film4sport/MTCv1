/**
 * navigation.js - MTC Court
 * IIFE Module: Screen navigation, menu, modals, partner matching, toast, a11y
 */
(function() {
  'use strict';

  // ============================================
  // PRIVATE: Navigation State
  // ============================================
  let _currentScreen = 'home';
  const _scrollPositions = {};
  let _skipNextPop = false; // Flag to ignore popstate we triggered ourselves

  // Lazy-load tracking for code-split bundles
  const _lazyLoaded = {};

  /**
   * Load a code-split bundle (JS + CSS) on demand.
   * @param {string} name - Bundle name (e.g. 'admin', 'captain')
   * @param {function} callback - Called after bundle JS has executed
   */
  function loadLazyBundle(name, callback) {
    if (_lazyLoaded[name]) {
      if (callback) callback();
      return;
    }
    _lazyLoaded[name] = true;

    // Load CSS (non-blocking)
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/mobile-app/dist/' + name + '.bundle.css';
    document.head.appendChild(link);

    // Load JS (blocks callback until executed)
    var script = document.createElement('script');
    script.src = '/mobile-app/dist/' + name + '.bundle.js';
    script.onload = function() { if (callback) callback(); };
    script.onerror = function() {
      _lazyLoaded[name] = false; // Allow retry
      MTC.warn('Failed to load ' + name + ' bundle');
      if (callback) callback();
    };
    document.body.appendChild(script);
  }

  // ============================================
  // MTC.fn + WINDOW: Navigate To (called from EVERYWHERE - onclick, cross-file)
  // ============================================
  /** @param {string} screen - Screen ID to navigate to
   *  @param {string} [direction] - Optional 'left'|'right' for directional slide transition */
  MTC.fn.navigateTo = function(screen, direction) {
    // Redirects - merged/removed screens
    if (screen === 'mybookings') screen = 'schedule';
    if (screen === 'programs') {
      screen = 'schedule';
    }
    if (screen === 'events') {
      // Club events live on the home calendar — smooth-scroll to it
      screen = 'home';
      setTimeout(function() {
        var cal = document.getElementById('homeCalendarSection');
        if (cal) cal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    if (screen === 'matches') screen = 'home';
    if (screen === 'coach') screen = 'lessons';
    if (screen === 'profile') screen = 'settings';

    // Show target screen
    const targetScreen = document.getElementById('screen-' + screen);
    if (!targetScreen) return;

    // Save scroll position of the screen we're leaving
    if (_currentScreen && _currentScreen !== screen) {
      const leavingScreen = document.getElementById('screen-' + _currentScreen);
      if (leavingScreen) _scrollPositions[_currentScreen] = leavingScreen.scrollTop;
    }

    // Cleanup the screen we're leaving
    if (typeof MTC !== 'undefined' && _currentScreen && _currentScreen !== screen) {
      MTC.cleanupScreen(_currentScreen);
    }
    _currentScreen = screen;

    // Hide all screens
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });

    // Safety: always reset html/body/app scroll to 0.
    // Booking grid's scroll-to-now (or scroll-behavior:smooth on html) can
    // accidentally shift <html> down, which breaks ALL screens since they're
    // position:absolute inside #app.
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    var appEl = document.getElementById('app');
    if (appEl) appEl.scrollTop = 0;

    if (targetScreen) {
      targetScreen.classList.add('active');

      // Apply directional slide class if specified (swipe navigation)
      if (direction === 'left' || direction === 'right') {
        targetScreen.classList.add('from-' + direction);
        setTimeout(function() { targetScreen.classList.remove('from-left', 'from-right'); }, 280);
      }

      // Restore saved scroll position
      targetScreen.scrollTop = _scrollPositions[screen] || 0;

      // Announce screen change to screen readers
      announceToScreenReader('Navigated to ' + screen.replace(/([A-Z])/g, ' $1').trim() + ' screen');

      // Focus the screen for keyboard users
      targetScreen.setAttribute('tabindex', '-1');
      targetScreen.focus({ preventScroll: true });

      // Re-trigger stagger animations
      targetScreen.querySelectorAll('.stagger-item').forEach(function(item, index) {
        item.style.animation = 'none';
        item.offsetHeight; // Trigger reflow
        item.style.animation = null;
      });
    }

    // Initialize booking system when navigating to book screen
    if (screen === 'book') {
      setTimeout(function() { renderWeeklyGrid(); }, 100);
    }

    // Initialize profile extras (interclub team, gate code) — now on settings screen
    if (screen === 'settings') {
      setTimeout(function() { if (typeof initProfileExtras === 'function') initProfileExtras(); }, 100);
    }

    // Render conversations list dynamically when navigating to messages
    if (screen === 'messages') {
      setTimeout(function() {
        if (typeof renderConversationsList === 'function') renderConversationsList();
      }, 100);
    }

    // Initialize captain/team screen (lazy-loaded bundle)
    if (screen === 'captain') {
      loadLazyBundle('captain', function() {
        if (typeof initCaptainScreen === 'function') initCaptainScreen();
      });
    }

    // Initialize admin panel (lazy-loaded bundle) — admin/coach only
    if (screen === 'admin') {
      if (!MTC.state.currentUser || (MTC.state.currentUser.role !== 'admin' && MTC.state.currentUser.role !== 'coach')) {
        MTC.fn.showToast('Admin access required', 'error');
        navigateTo('home');
        return;
      }
      loadLazyBundle('admin', function() {
        if (typeof initAdminPanel === 'function') initAdminPanel();
      });
    }

    // Render partners screen from API data
    if (screen === 'partners') {
      setTimeout(function() { if (typeof renderPartnersScreen === 'function') renderPartnersScreen(); }, 100);
    }

    // Render schedule bookings dynamically
    if (screen === 'schedule') {
      setTimeout(function() {
        if (typeof renderScheduleBookings === 'function') renderScheduleBookings();
      }, 100);
    }

    // Update nav - new order: Home, Schedule, Book, Partners, Messages
    document.querySelectorAll('.nav-container .nav-item').forEach(function(n) {
      n.classList.remove('active', 'nav-tapped');
      n.setAttribute('aria-current', '');
    });
    const navMap = { home: 0, schedule: 1, book: 2, partners: 3, messages: 4 };
    if (navMap[screen] !== undefined) {
      const navItems = document.querySelectorAll('.nav-container .nav-item');
      if (navItems[navMap[screen]]) {
        var tappedNav = navItems[navMap[screen]];
        tappedNav.classList.add('active');
        tappedNav.setAttribute('aria-current', 'page');
        // Trigger spring bounce animation
        void tappedNav.offsetWidth; // Force reflow to restart animation
        tappedNav.classList.add('nav-tapped');
        // Clean up animation class after it finishes
        setTimeout(function() { tappedNav.classList.remove('nav-tapped'); }, 550);
      }
    }

    closeMenu();

    // Push browser history so back gesture = previous screen (not external OAuth pages)
    // Skip if this navigation was triggered by popstate (back button) to avoid double-push
    if (!_skipNextPop) {
      history.pushState({ screen: screen }, '', '');
    }
  };
  window.navigateTo = MTC.fn.navigateTo;

  // ============================================
  // BROWSER BACK BUTTON / SWIPE-BACK SUPPORT
  // ============================================
  // Set initial history state so we have something to go back from
  history.replaceState({ screen: 'home' }, '', '');

  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.screen) {
      // Going back to a previous screen within the PWA
      _skipNextPop = true;
      MTC.fn.navigateTo(e.state.screen, 'right');
      _skipNextPop = false;
    } else {
      // No PWA state — user is trying to leave the app (back to OAuth/external page)
      // Push a dummy state to trap them inside the PWA
      history.pushState({ screen: _currentScreen }, '', '');
    }
  });

  // ============================================
  // WINDOW: Open Menu (onclick from index.html)
  // ============================================
  window.openMenu = function() {
    document.getElementById('menuDrawer').classList.add('open');
    document.getElementById('menuBackdrop').classList.add('open');
    // Update aria-expanded on menu button
    const menuBtn = document.querySelector('[aria-controls="menuDrawer"]');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    // Focus the close button for keyboard users
    const closeBtn = document.querySelector('.menu-close');
    if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 100);
    announceToScreenReader('Menu opened');
  };

  // ============================================
  // WINDOW: Close Menu (onclick from index.html, called cross-file)
  // ============================================
  window.closeMenu = function() {
    document.getElementById('menuDrawer').classList.remove('open');
    document.getElementById('menuBackdrop').classList.remove('open');
    // Update aria-expanded on menu button
    const menuBtn = document.querySelector('[aria-controls="menuDrawer"]');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  };

  // ============================================
  // WINDOW: Show Modal (called from booking.js)
  // ============================================
  window.showModal = function() {
    if (!selectedSlot) { showToast('No slot selected'); return; }
    showCelebrationModal('BOOKING CONFIRMED!', 'Court ' + selectedSlot.court + ' booked for ' + selectedSlot.time + '. See you on the court!');
  };

  // ============================================
  // WINDOW: Show Celebration Modal (called from partners.js, events-registration.js, booking.js)
  // ============================================
  // Store last booking details for Add to Calendar
  var _lastBookingDetails = null;

  window.showCelebrationModal = function(title, desc, bookingDetails) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDesc').textContent = desc;
    const modalEl = document.getElementById('modal');
    modalEl.classList.add('active');
    if (MTC.fn.manageFocus) MTC.fn.manageFocus(modalEl);
    // Show/hide Add to Calendar button
    var calBtn = document.getElementById('modalAddCalBtn');
    if (calBtn) {
      if (bookingDetails && bookingDetails.date && bookingDetails.time) {
        _lastBookingDetails = bookingDetails;
        calBtn.style.display = '';
      } else {
        _lastBookingDetails = null;
        calBtn.style.display = 'none';
      }
    }
    // Hide "Book Together" button by default (joinPartner shows it explicitly)
    var bookTogetherBtn = document.getElementById('modalBookTogetherBtn');
    if (bookTogetherBtn) bookTogetherBtn.style.display = 'none';
    // Force icon pop animation replay
    const iconEl = modalEl.querySelector('.modal-icon');
    if (iconEl) {
      iconEl.style.animation = 'none';
      iconEl.offsetHeight;
      iconEl.style.animation = '';
    }
    launchConfetti();
  };

  // Generate and download .ics file for last booking
  window.addBookingToCalendar = function() {
    if (!_lastBookingDetails) return;
    var d = _lastBookingDetails;
    var title = 'Tennis — ' + (d.courtName || 'Court');
    var loc = (d.courtName || 'Court') + ' — Mono Tennis Club';

    // Parse time (e.g. "10:00 AM")
    var match = (d.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    var hour = 9, min = 0;
    if (match) {
      hour = parseInt(match[1]);
      min = parseInt(match[2]);
      if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
    }

    var duration = (d.duration || 1) * 30; // slots × 30min
    var endMin = hour * 60 + min + duration;
    var endH = Math.floor(endMin / 60);
    var endM = endMin % 60;

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    var dateParts = (d.date || '').split('-');
    var ds = dateParts.join('');
    var dtStart = ds + 'T' + pad(hour) + pad(min) + '00';
    var dtEnd = ds + 'T' + pad(endH) + pad(endM) + '00';
    var tz = 'America/Toronto';

    var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Mono Tennis Club//MTC//EN\r\nBEGIN:VEVENT\r\n' +
      'UID:' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@mtc.ca\r\n' +
      'DTSTART;TZID=' + tz + ':' + dtStart + '\r\n' +
      'DTEND;TZID=' + tz + ':' + dtEnd + '\r\n' +
      'SUMMARY:' + title + '\r\n' +
      'LOCATION:' + loc + '\r\n' +
      'END:VEVENT\r\nEND:VCALENDAR\r\n';

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mtc-booking.ics';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Calendar file downloaded');
  };

  // ============================================
  // WINDOW: Book a Court with Matched Partner
  // ============================================
  window.bookWithPartner = function() {
    closeModal();
    var partner = _matchedPartner;
    _matchedPartner = null;
    // Navigate to booking screen
    MTC.fn.navigateTo('book');
    // After navigation renders, pre-add the matched partner
    if (partner && partner.id && partner.name) {
      setTimeout(function() {
        if (typeof addParticipant === 'function') {
          addParticipant(partner.id, partner.name);
        }
      }, 300);
    }
  };

  // ============================================
  // WINDOW: Close Modal (onclick from index.html, called from tests)
  // ============================================
  window.closeModal = function() {
    document.getElementById('modal').classList.remove('active');
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ============================================
  // PRIVATE: Launch Confetti
  // ============================================
  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#c8ff00', '#ff5a5f', '#00d4ff', '#ffffff', '#FFD700', '#FF69B4'];
    const confetti = [];

    for (let i = 0; i < 80; i++) {
      confetti.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 60,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: -(Math.random() * 12 + 4),
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.15 + Math.random() * 0.1,
        opacity: 1,
        delay: Math.random() * 8
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      confetti.forEach(function(p) {
        if (p.delay > 0) { p.delay--; alive = true; return; }
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;

        if (frame > 40) p.opacity -= 0.01;
        if (p.opacity <= 0) return;
        alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frame++;
      if (alive && frame < 180) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(animate);
  }

  // ============================================
  // WINDOW: Join Partner (onclick from index.html)
  // ============================================
  // Store matched partner for "Book Together" flow
  var _matchedPartner = null;

  window.joinPartner = function(name, time, btnEl, partnerId) {
    _matchedPartner = { id: partnerId, name: name };
    showCelebrationModal('YOU\'RE IN!', 'Matched with ' + name + '. See you ' + time + '!');
    // Show "Book a Court Together" button
    var bookBtn = document.getElementById('modalBookTogetherBtn');
    if (bookBtn) bookBtn.style.display = '';
    showPushNotification(
      'Partner Matched!',
      'You\'re playing with ' + name + ' \u2014 ' + time,
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    );

    // Persist to Supabase — mark partner request as matched
    if (partnerId && typeof MTC !== 'undefined' && MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/partners', {
        method: 'PATCH',
        body: JSON.stringify({ partnerId: partnerId })
      }).then(function(result) {
        if (result && result.ok === false && result.status === 409) {
          showToast('This partner was already matched by someone else');
        }
      }).catch(function(err) {
        MTC.warn('joinPartner API error:', err);
      });
    }

    // Parse a date from the time string (e.g., "Tomorrow at 2pm", "Saturday Morning")
    let partnerDate = '';
    const now = new Date();
    const timeLower = (time || '').toLowerCase();
    if (timeLower.indexOf('tomorrow') !== -1) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      partnerDate = tomorrow.toISOString().split('T')[0];
    } else if (timeLower.indexOf('today') !== -1 || timeLower.indexOf('this evening') !== -1) {
      partnerDate = now.toISOString().split('T')[0];
    } else {
      // Default to tomorrow
      const tmrw = new Date(now);
      tmrw.setDate(tmrw.getDate() + 1);
      partnerDate = tmrw.toISOString().split('T')[0];
    }

    // Add to My Bookings with a real date so it shows in Schedule
    if (typeof addEventToMyBookings === 'function') {
      addEventToMyBookings('partner-' + name.replace(/\s/g, '-'), 'partner', {
        title: 'Partner Match: ' + name,
        date: partnerDate,
        time: time || 'See details',
        location: 'MTC Courts'
      });
    }

    // Persist joined partner so card stays gone on reload
    const joined = MTC.storage.get('mtc-joined-partners', []);
    if (joined.indexOf(name) === -1) joined.push(name);
    MTC.storage.set('mtc-joined-partners', joined);

    // Remove the partner card from DOM with animation
    if (btnEl) {
      const card = btnEl.closest('.partner-request-card');
      if (card) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(100%)';
        setTimeout(function() {
          card.remove();
          // Check if all partner cards are gone
          hideEmptyPartnerRequests();
        }, 300);
      }
    }
  };

  // ============================================
  // WINDOW: Hide Joined Partner Cards (called from interactive.js)
  // ============================================
  window.hideJoinedPartnerCards = function() {
    try {
      const joined = MTC.storage.get('mtc-joined-partners', []);
      if (joined.length === 0) return;
      const cards = document.querySelectorAll('.partner-requests .partner-request-card');
      cards.forEach(function(card) {
        const nameEl = card.querySelector('.partner-request-name');
        if (nameEl && joined.indexOf(nameEl.textContent.trim()) !== -1) {
          card.remove();
        }
      });
      hideEmptyPartnerRequests();
    } catch(e) {}
  };

  // ============================================
  // PRIVATE: Pool of partner requests available
  // ============================================
  // Partner pool populated from API via updatePartnersFromAPI() after login
  const homePartnerPool = [];

  // ============================================
  // PRIVATE: Repopulate home partner cards from pool after joining
  // ============================================
  function repopulateHomePartners() {
    const container = document.querySelector('#screen-home .partner-requests');
    if (!container) return;

    const joined = MTC.storage.get('mtc-joined-partners', []);

    // Get names currently shown on home
    const shownNames = [];
    container.querySelectorAll('.partner-request-card .partner-request-name').forEach(function(el) {
      shownNames.push(el.textContent.trim());
    });

    // Find pool members not joined and not already shown
    const available = homePartnerPool.filter(function(p) {
      return joined.indexOf(p.name) === -1 && shownNames.indexOf(p.name) === -1;
    });

    // How many slots to fill (we show max 2 cards)
    const currentCards = container.querySelectorAll('.partner-request-card').length;
    const slotsToFill = 2 - currentCards;

    if (slotsToFill <= 0 || available.length === 0) {
      // Still check if totally empty
      if (currentCards === 0 && available.length === 0) {
        if (!container.querySelector('.all-matched-msg')) {
          container.innerHTML = '<div class="all-matched-msg" style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">All matched! Check Partners for more.</div>';
        }
      }
      return;
    }

    // Remove "All matched" message if present
    const msg = container.querySelector('.all-matched-msg');
    if (msg) msg.remove();

    for (let i = 0; i < Math.min(slotsToFill, available.length); i++) {
      const p = available[i];
      const avatar = typeof getAvatar === 'function' ? getAvatar(p.name) : '';
      const card = document.createElement('div');
      card.className = 'partner-request-card stagger-item';
      card.setAttribute('data-skill', (p.level || 'intermediate').toLowerCase());
      card.innerHTML =
        '<div class="partner-request-avatar">' + avatar + '</div>' +
        '<div class="partner-request-info">' +
          '<div class="partner-request-name">' + sanitizeHTML(p.name) + '</div>' +
          '<div class="partner-request-details">' +
            '<span class="partner-time">' + sanitizeHTML(p.time) + '</span>' +
            '<span class="skill-badge ' + sanitizeHTML(p.levelClass) + '">' + sanitizeHTML(p.level.charAt(0).toUpperCase() + p.level.slice(1)) + '</span>' +
          '</div>' +
        '</div>' +
        '<button class="partner-join-btn" aria-label="Join session" data-action="joinPartner" data-id="' + sanitizeHTML(p.id || '').replace(/"/g, '&quot;') + '" data-name="' + sanitizeHTML(p.name).replace(/"/g, '&quot;') + '" data-time="' + sanitizeHTML(p.time).replace(/"/g, '&quot;') + '">Join</button>';
      // Animate in
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      container.appendChild(card);
      (function(c) {
        setTimeout(function() {
          c.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          c.style.opacity = '1';
          c.style.transform = 'translateX(0)';
        }, 50);
      })(card);
    }
  }

  // ============================================
  // PRIVATE: Show "All matched" message if no partner cards remain
  // ============================================
  function hideEmptyPartnerRequests() {
    const remaining = document.querySelectorAll('#screen-home .partner-requests .partner-request-card');
    if (remaining.length === 0) {
      // Try to repopulate first
      repopulateHomePartners();
    }
  }

  // ============================================
  // MTC.fn + WINDOW: Toast Notifications (called from EVERYWHERE)
  // ============================================
  /** @param {string} message - Toast message text @param {Function|string} [undoCallbackOrType] - Undo callback or toast type */
  MTC.fn.showToast = function(message, undoCallbackOrType) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    const toastIcon = toast ? toast.querySelector('.toast-icon') : null;

    // Clear any existing timeout
    if (window._toastTimeout) clearTimeout(window._toastTimeout);

    // Determine if 2nd arg is an undo callback (function) or a type string
    const undoCallback = typeof undoCallbackOrType === 'function' ? undoCallbackOrType : null;
    const toastType = typeof undoCallbackOrType === 'string' ? undoCallbackOrType : '';

    // Update icon based on type
    if (toastIcon) {
      if (toastType === 'error') {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      } else if (toastType === 'info') {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      } else {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      }
    }

    if (undoCallback) {
      // Toast with undo button
      toastText.innerHTML = '<div class="toast-content"><span class="toast-message">' + sanitizeHTML(message) + '</span><button class="toast-undo" onclick="event.stopPropagation();">UNDO</button></div>';
      const undoBtn = toastText.querySelector('.toast-undo');
      if (undoBtn) {
        undoBtn.onclick = function(e) {
          e.stopPropagation();
          undoCallback();
          toast.classList.remove('show');
          toast.style.visibility = 'hidden';
          toast.style.opacity = '0';
        };
      }
    } else {
      toastText.textContent = message;
    }

    // Clear inline opacity/visibility so CSS .show class can take effect
    toast.style.opacity = '';
    toast.style.visibility = 'visible';
    toast.classList.add('show');
    // ARIA live region will auto-announce since role="alert"

    window._toastTimeout = setTimeout(function() {
      toast.classList.remove('show');
      toast.style.visibility = 'hidden';
      toast.style.opacity = '0';
    }, undoCallback ? 5000 : 3000);
  };
  window.showToast = MTC.fn.showToast;

  // ============================================
  // PRIVATE: Announce messages to screen readers
  // ============================================
  function announceToScreenReader(message) {
    const announcer = document.getElementById('a11yAnnouncer');
    if (announcer) {
      announcer.textContent = '';
      setTimeout(function() { announcer.textContent = message; }, 50);
    }
  }

  // ============================================
  // ACCESSIBILITY: Modal focus management
  // ============================================
  /** @param {HTMLElement} modalEl - Modal to move focus into */
  function manageFocus(modalEl, triggerEl) {
    modalEl._triggerEl = triggerEl || document.activeElement;
    const focusable = modalEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) setTimeout(function() { focusable.focus(); }, 50);
  }

  /** @param {HTMLElement} modalEl - Modal to restore focus from */
  function restoreFocus(modalEl) {
    if (modalEl && modalEl._triggerEl && typeof modalEl._triggerEl.focus === 'function') {
      modalEl._triggerEl.focus();
    }
  }

  MTC.fn.manageFocus = manageFocus;
  MTC.fn.restoreFocus = restoreFocus;

  // ============================================
  // ACCESSIBILITY: Keyboard navigation for toggles (Enter/Space to toggle)
  // ============================================
  document.addEventListener('keydown', function(e) {
    const target = e.target;

    // Activate role="button" elements with Enter/Space (menu items, etc.)
    if (target.getAttribute('role') === 'button' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      target.click();
    }

    // Toggle switches via keyboard
    if (target.getAttribute('role') === 'switch' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      target.click();
      const isChecked = target.classList.contains('active');
      target.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      announceToScreenReader(isChecked ? 'Enabled' : 'Disabled');
    }

    // Admin tabs - arrow key navigation
    if (target.getAttribute('role') === 'tab') {
      const tabs = Array.from(target.parentElement.querySelectorAll('[role="tab"]'));
      const index = tabs.indexOf(target);
      let newIndex = index;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = tabs.length - 1;
      }

      if (newIndex !== index) {
        tabs[newIndex].focus();
        tabs[newIndex].click();
      }
    }

    // Escape key to close menu/modals (centralized handler)
    if (e.key === 'Escape') {
      // Priority-ordered list of closeable overlays
      const closeable = [
        { id: 'menuDrawer', check: 'open', fn: function(el) { closeMenu(); var btn = document.querySelector('[aria-controls="menuDrawer"]'); if (btn) btn.focus(); } },
        { id: 'confirmModal', check: 'active', fn: function(el) { closeConfirmModal(); } },
        { id: 'bookingModal', check: 'active', fn: function(el) { closeBookingModal(); } },
        { id: 'profileEditModal', check: 'active', fn: function(el) { el.classList.remove('active'); document.body.style.overflow = ''; } },
        { id: 'cancelModal', check: 'active', fn: function(el) { closeCancelModal(); } },
        { id: 'modifyModal', check: 'active', fn: function(el) { closeModifyModal(); } },
        { id: 'avatarPickerModal', check: 'active', fn: function(el) { closeAvatarPicker(); } },
        { id: 'postPartnerModal', check: 'active', fn: function(el) { closePostPartnerModal(); } },
        { id: 'newMessageModal', check: 'active', fn: function(el) { closeNewMessageModal(); } },
        { id: 'modal', check: 'active', fn: function(el) { closeModal(); } },
        { id: 'forgotPasswordModal', check: 'display', fn: function(el) { closeForgotPassword(); } }
      ];

      for (let i = 0; i < closeable.length; i++) {
        const entry = closeable[i];
        const el = document.getElementById(entry.id);
        if (!el) continue;
        if (entry.check === 'display') {
          if (el.style.display !== 'none' && el.style.display !== '') {
            restoreFocus(el);
            entry.fn(el);
            return;
          }
        } else if (el.classList.contains(entry.check)) {
          restoreFocus(el);
          entry.fn(el);
          return;
        }
      }

      // Catch-all: any dynamic .modal-overlay.active inside #app
      const dynamicModal = document.querySelector('#app > .modal-overlay.active');
      if (dynamicModal) {
        restoreFocus(dynamicModal);
        dynamicModal.classList.remove('active');
        setTimeout(function() { dynamicModal.remove(); }, 300);
        return;
      }
    }
  });

  // ============================================
  // ACCESSIBILITY: Focus trap for menu drawer
  // Uses shared MTC.fn.trapFocus utility
  // ============================================
  let menuTrapCleanup = null;

  // Watch for drawer open/close to activate/deactivate trap
  const menuDrawerEl = document.getElementById('menuDrawer');
  if (menuDrawerEl) {
    const observer = new MutationObserver(function() {
      if (menuDrawerEl.classList.contains('open')) {
        if (!menuTrapCleanup) {
          menuTrapCleanup = MTC.fn.trapFocus(menuDrawerEl);
        }
      } else {
        if (menuTrapCleanup) {
          menuTrapCleanup();
          menuTrapCleanup = null;
        }
      }
    });
    observer.observe(menuDrawerEl, { attributes: true, attributeFilter: ['class'] });
  }

  // ============================================
  // SWIPE NAVIGATION — swipe between main screens
  // Home(0) ↔ Schedule(1) ↔ Partners(2) ↔ Messages(3)
  // Book screen excluded (center button only)
  // ============================================
  const swipeScreens = ['home', 'schedule', 'partners', 'messages'];
  const swipeIgnore = '.courts-scroll, .filter-pills, .date-selector, .weekly-grid-body, .booking-dates, .chat-messages, .schedule-pills';
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeLocked = false;

  document.addEventListener('touchstart', function(e) {
    // Only swipe on main swipeable screens
    if (swipeScreens.indexOf(_currentScreen) === -1) return;
    // Don't swipe on inputs or horizontally-scrollable containers
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.target.closest(swipeIgnore)) return;

    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeLocked = false;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (swipeLocked || swipeStartX === 0) return;
    const dx = Math.abs(e.touches[0].clientX - swipeStartX);
    const dy = Math.abs(e.touches[0].clientY - swipeStartY);
    // If vertical scroll is dominant, cancel swipe detection
    if (dy > 20 && dy > dx) { swipeStartX = 0; }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (swipeStartX === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - swipeStartX;
    const dy = Math.abs(endY - swipeStartY);

    swipeStartX = 0;

    // Must be horizontal (dx > dy) and distance > 80px
    if (Math.abs(dx) < 80 || dy > Math.abs(dx)) return;

    const currentIndex = swipeScreens.indexOf(_currentScreen);
    if (currentIndex === -1) return;

    let nextIndex, direction;
    if (dx < 0) {
      // Swipe left → next screen
      nextIndex = currentIndex + 1;
      direction = 'left';
    } else {
      // Swipe right → prev screen
      nextIndex = currentIndex - 1;
      direction = 'right';
    }

    if (nextIndex < 0 || nextIndex >= swipeScreens.length) return;

    MTC.fn.navigateTo(swipeScreens[nextIndex], direction);
  }, { passive: true });

  /**
   * Update partner pool from Supabase API data.
   * Called by auth.js after login when API data is available.
   */
  window.updatePartnersFromAPI = function(apiPartners) {
    if (!Array.isArray(apiPartners)) return;
    // Replace the home partner pool with API data
    homePartnerPool.length = 0;
    apiPartners.forEach(function(p) {
      var levelClass = '';
      if (p.skillLevel === 'competitive') levelClass = 'competitive';
      else if (p.skillLevel === 'advanced') levelClass = 'advanced';
      else if (p.skillLevel === 'beginner') levelClass = 'beginner';
      homePartnerPool.push({
        id: p.id,
        userId: p.userId || '',
        name: p.name,
        time: p.availability || p.date + ' at ' + p.time,
        level: p.skillLevel || 'intermediate',
        levelClass: levelClass,
        matchType: p.matchType || 'singles',
        availability: p.availability || ''
      });
    });
    // Partners nav badge removed — user doesn't want notification counts for partner requests
    // Re-populate the home screen partner cards
    repopulateHomePartners();
    // Also populate the dedicated partners screen if it has been rendered
    renderPartnersScreen();
  };

  // ============================================
  // PARTNERS SCREEN — render full list from API
  // ============================================
  function renderPartnersScreen() {
    var container = document.getElementById('partnerCardsContainer');
    if (!container) return;
    var emptyState = document.getElementById('noPartners');

    // Merge API partners + user's own local requests
    var localRequests = MTC.storage.get('mtc-partner-requests', []);

    if (homePartnerPool.length === 0 && localRequests.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Get current user ID to filter own requests
    var currentUserObj = MTC.storage.get('mtc-user', null) || MTC.storage.get('mtc-current-user', null);
    var currentUserId = currentUserObj ? (currentUserObj.id || currentUserObj.email || '') : '';

    // Build cards HTML from API data — v2 redesign
    var personIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    // Ring colors cycle by match type
    var ringColorMap = { singles: 'var(--electric-blue)', mixed: 'var(--electric-blue)', mens: 'var(--coral)', womens: '#ff69b4' };

    var html = '';
    homePartnerPool.forEach(function(p) {
      var isOwnRequest = currentUserId && p.userId && p.userId === currentUserId;
      var matchType = p.matchType || 'singles';
      var matchLabel = matchType === 'mixed' ? 'Mixed Doubles' : matchType === 'mens' ? "Men's Doubles" : matchType === 'womens' ? "Women's Doubles" : 'Singles';
      var levelDisplay = p.level ? (p.level.charAt(0).toUpperCase() + p.level.slice(1)) : 'Intermediate';
      var isAvailable = p.availability && (p.availability.toLowerCase().indexOf('today') !== -1 || p.availability.toLowerCase().indexOf('now') !== -1);
      var ringColor = ringColorMap[matchType] || 'var(--electric-blue)';

      var actionBtn;
      if (isOwnRequest) {
        actionBtn =
          '<button class="partner-action-btn partner-cancel-btn ripple" data-action="cancelApiPartner" data-id="' + (p.id || '') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '<span>Cancel</span>' +
          '</button>';
      } else {
        actionBtn =
          '<button class="partner-action-btn partner-msg-btn ripple" data-action="joinPartner" data-id="' + (p.id || '') + '" data-name="' + sanitizeHTML(p.name) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>' +
            '<span>Message</span>' +
          '</button>';
      }

      // Format date for display
      var dateDisplay = '';
      if (p.date) {
        try {
          var d = new Date(p.date + 'T00:00:00');
          dateDisplay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } catch(e) { dateDisplay = p.date; }
      }

      html += '<div class="partner-card stagger-item" data-match-type="' + sanitizeHTML(matchType) + '" data-level="' + sanitizeHTML((p.level || 'intermediate').toLowerCase()) + '" data-available="' + isAvailable + '" data-partner-id="' + (p.id || '') + '">' +
        '<div class="partner-card-top">' +
          '<div class="partner-card-info">' +
            '<div class="partner-name">' + sanitizeHTML(p.name) + '</div>' +
            '<div class="partner-card-pills">' +
              '<span class="partner-match-pill ' + sanitizeHTML(matchType) + '">' + sanitizeHTML(matchLabel) + '</span>' +
              '<span class="partner-level-pill">' + sanitizeHTML(levelDisplay) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="partner-card-bottom">' +
          '<div class="partner-card-meta">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="var(--electric-blue)" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
            '<span>' + sanitizeHTML(p.time || 'Anytime') + (dateDisplay ? ' &middot; ' + sanitizeHTML(dateDisplay) : '') + '</span>' +
          '</div>' +
          '<div class="partner-action">' + actionBtn + '</div>' +
        '</div>' +
      '</div>';
    });
    container.innerHTML = html;

    // Re-insert user's own local requests from localStorage
    var localRequests = MTC.storage.get('mtc-partner-requests', []);
    var today = new Date().toISOString().split('T')[0];
    localRequests.filter(function(req) { return !req.date || req.date >= today; }).forEach(function(req) {
      if (typeof insertPartnerRequestCard === 'function') {
        insertPartnerRequestCard(req);
      }
    });
  }
  window.renderPartnersScreen = renderPartnersScreen;

  // ============================================
  // PULL TO REFRESH — home + events screens
  // ============================================
  (function initPullToRefresh() {
    var ptrScreens = ['home', 'schedule'];
    var ptrStartY = 0;
    var ptrActive = false;
    var ptrThreshold = 60;

    document.addEventListener('touchstart', function(e) {
      if (ptrScreens.indexOf(_currentScreen) === -1) return;
      var screen = document.getElementById('screen-' + _currentScreen);
      if (!screen || screen.scrollTop > 5) return;
      ptrStartY = e.touches[0].clientY;
      ptrActive = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!ptrActive) return;
      var dy = e.touches[0].clientY - ptrStartY;
      if (dy < 0) { ptrActive = false; return; }
      var indicator = document.getElementById('ptrIndicator');
      if (!indicator) return;
      if (dy > 10) {
        indicator.classList.add('visible');
        if (dy >= ptrThreshold) {
          indicator.classList.add('ready');
        } else {
          indicator.classList.remove('ready');
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', function() {
      if (!ptrActive) return;
      ptrActive = false;
      var indicator = document.getElementById('ptrIndicator');
      if (!indicator) return;
      if (indicator.classList.contains('ready')) {
        indicator.classList.remove('ready', 'visible');
        indicator.classList.add('refreshing', 'visible');
        indicator.innerHTML = '<div class="ptr-spinner"></div>';
        // Trigger data refresh
        if (typeof MTC !== 'undefined' && MTC.state && MTC.state.accessToken && typeof loadAppDataFromAPI === 'function') {
          loadAppDataFromAPI().then(function() {
            indicator.classList.remove('refreshing', 'visible');
            indicator.innerHTML = '<svg class="ptr-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
            if (typeof showToast === 'function') showToast('Refreshed');
          });
        } else {
          setTimeout(function() {
            indicator.classList.remove('refreshing', 'visible');
            indicator.innerHTML = '<svg class="ptr-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
          }, 800);
        }
      } else {
        indicator.classList.remove('visible', 'ready');
      }
    }, { passive: true });
  })();

})();
