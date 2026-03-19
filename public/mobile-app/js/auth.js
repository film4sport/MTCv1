/* auth.js - MTC Court — PIN-Based Auth */
// ============================================
// LOGIN / LOGOUT / SIGN UP (email + 4-digit PIN)
// ============================================
(function() {
  'use strict';

  // Shared state (read by navigation.js, booking.js, interactive.js, confirm-modal.js)
  MTC.state.currentUser = null;
  window.currentUser = null; // Backward-compat alias (reassigned on login)

  // GUEST_ALLOWED_SCREENS is in config.js

  // Private state

  // Inline field error helpers
  function showFieldError(input, message) {
    input.classList.add('input-error');
    clearFieldErrors(input);
    const err = document.createElement('div');
    err.className = 'field-error';
    err.textContent = message;
    input.parentElement.appendChild(err);
  }

  function clearFieldErrors(input) {
    if (!input || !input.parentElement) return;
    const existing = input.parentElement.querySelectorAll('.field-error');
    existing.forEach(function(el) { el.remove(); });
  }

  // ============================================
  // SUPABASE CLIENT (for Realtime only — NOT for auth)
  // ============================================
  var _supabaseClient = null;

  /** Fetch with retry — retries up to `retries` times with exponential backoff */
  function fetchWithRetry(url, retries, delay) {
    return fetch(url).then(function(r) {
      if (!r.ok && retries > 0) {
        return new Promise(function(resolve) { setTimeout(resolve, delay); })
          .then(function() { return fetchWithRetry(url, retries - 1, delay * 2); });
      }
      return r;
    }).catch(function(err) {
      if (retries > 0) {
        return new Promise(function(resolve) { setTimeout(resolve, delay); })
          .then(function() { return fetchWithRetry(url, retries - 1, delay * 2); });
      }
      throw err;
    });
  }

  /** Wait for window.supabase to be defined (local fallback script may still be loading) */
  function waitForSupabaseLib(timeout) {
    if (window.supabase) return Promise.resolve(true);
    return new Promise(function(resolve) {
      var elapsed = 0;
      var interval = setInterval(function() {
        elapsed += 100;
        if (window.supabase) { clearInterval(interval); resolve(true); }
        else if (elapsed >= timeout) { clearInterval(interval); resolve(false); }
      }, 200);
    });
  }

  // Track eager init state
  var _supabaseInitPromise = null;

  function initSupabase() {
    if (_supabaseClient) return Promise.resolve(_supabaseClient);
    if (_supabaseInitPromise) return _supabaseInitPromise;
    _supabaseInitPromise = fetchWithRetry('/api/mobile-auth/config', 2, 1000)
      .then(function(r) { return r.json(); })
      .then(function(cfg) {
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
          _supabaseInitPromise = null;
          return null;
        }
        return waitForSupabaseLib(8000).then(function(loaded) {
          if (loaded && window.supabase) {
            _supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
            MTC.state._supabaseClient = _supabaseClient; // Expose for realtime-sync.js
          } else {
            _supabaseInitPromise = null;
          }
          return _supabaseClient;
        });
      })
      .catch(function() {
        _supabaseInitPromise = null;
        return null;
      });
    return _supabaseInitPromise;
  }

  // ============================================
  // PIN LOGIN
  // ============================================
  window.handlePinLogin = function() {
    var emailInput = document.getElementById('loginEmail');
    var pinInput = document.getElementById('loginPin');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    var pin = pinInput ? pinInput.value.trim() : '';

    if (emailInput) { emailInput.classList.remove('input-error'); clearFieldErrors(emailInput); }
    if (pinInput) { pinInput.classList.remove('input-error'); clearFieldErrors(pinInput); }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, 'Enter a valid email address');
      return;
    }
    if (!pin || !/^\d{4}$/.test(pin)) {
      showFieldError(pinInput, 'Enter your 4-digit PIN');
      return;
    }

    var btn = document.getElementById('pinLoginBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

    fetch('/api/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, pin: pin })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(result) {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }

      if (!result.ok) {
        if (result.data.needsPinSetup) {
          // Existing member without PIN — show PIN setup screen
          showPinSetupScreen(email, result.data.name || '');
          return;
        }
        var msg = result.data.error || 'Login failed';
        if (result.data.attemptsRemaining !== undefined) {
          msg += ' (' + result.data.attemptsRemaining + ' attempts left)';
        }
        showToast(msg);
        if (pinInput) pinInput.value = '';
        return;
      }

      // Success — store token and finish login
      finishLogin(email, {
        name: result.data.user.name,
        email: result.data.user.email,
        role: result.data.user.role,
        userId: result.data.user.id,
        accessToken: result.data.token,
        membershipType: result.data.user.membershipType || 'adult',
        familyId: result.data.user.familyId || null,
        residence: result.data.user.residence || 'mono',
        interclubTeam: result.data.user.interclubTeam || 'none',
        interclubCaptain: result.data.user.interclubCaptain === true,
        familyMembers: result.data.user.familyMembers || []
      });

      // Remember email for next login
      try { localStorage.setItem('mtc-remembered-email', email); } catch(e) {}
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
      showToast('Network error. Please try again.');
    });
  };

  // ============================================
  // PIN SETUP (migration from old auth)
  // ============================================
  var _pinSetupEmail = '';

  function showPinSetupScreen(email, name) {
    _pinSetupEmail = email;
    var loginCard = document.querySelector('.login-card:not(.signup-card)');
    var setupCard = document.getElementById('pinSetupCard');
    if (loginCard) loginCard.style.display = 'none';
    if (setupCard) {
      setupCard.style.display = '';
      var nameEl = setupCard.querySelector('.pin-setup-name');
      if (nameEl) nameEl.textContent = name ? ('Welcome back, ' + name.split(' ')[0] + '!') : 'Welcome back!';
    }
  }
  // Expose for interactive.js (auto-migration of old auth sessions)
  window.showPinSetupScreen = showPinSetupScreen;

  window.handlePinSetup = function() {
    var pinInput = document.getElementById('setupPin');
    var confirmInput = document.getElementById('setupPinConfirm');
    var pin = pinInput ? pinInput.value.trim() : '';
    var confirm = confirmInput ? confirmInput.value.trim() : '';

    if (pinInput) { pinInput.classList.remove('input-error'); clearFieldErrors(pinInput); }
    if (confirmInput) { confirmInput.classList.remove('input-error'); clearFieldErrors(confirmInput); }

    if (!pin || !/^\d{4}$/.test(pin)) {
      showFieldError(pinInput, 'Enter a 4-digit PIN');
      return;
    }
    if (pin !== confirm) {
      showFieldError(confirmInput, 'PINs do not match');
      return;
    }

    var btn = document.getElementById('pinSetupBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Setting up...'; }

    fetch('/api/auth/pin-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _pinSetupEmail, pin: pin })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(result) {
      if (btn) { btn.disabled = false; btn.textContent = 'Set PIN & Sign In'; }

      if (!result.ok) {
        showToast(result.data.error || 'Failed to set PIN');
        return;
      }

      if (result.data.token && result.data.user) {
        finishLogin(_pinSetupEmail, {
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role,
          userId: result.data.user.id,
          accessToken: result.data.token,
          membershipType: result.data.user.membershipType || 'adult',
          familyId: result.data.user.familyId || null,
          residence: result.data.user.residence || 'mono',
          interclubTeam: result.data.user.interclubTeam || 'none',
          interclubCaptain: result.data.user.interclubCaptain === true,
          familyMembers: result.data.user.familyMembers || []
        });
        try { localStorage.setItem('mtc-remembered-email', _pinSetupEmail); } catch(e) {}
      } else {
        // PIN was set but no session returned — auto-login with the new PIN
        fetch('/api/auth/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: _pinSetupEmail, pin: pin })
        })
        .then(function(r2) { return r2.json().then(function(d2) { return { ok: r2.ok, data: d2 }; }); })
        .then(function(loginResult) {
          if (loginResult.ok && loginResult.data.token && loginResult.data.user) {
            finishLogin(_pinSetupEmail, {
              name: loginResult.data.user.name,
              email: loginResult.data.user.email,
              role: loginResult.data.user.role,
              userId: loginResult.data.user.id,
              accessToken: loginResult.data.token,
              membershipType: loginResult.data.user.membershipType || 'adult',
              familyId: loginResult.data.user.familyId || null,
              residence: loginResult.data.user.residence || 'mono',
              interclubTeam: loginResult.data.user.interclubTeam || 'none',
              interclubCaptain: loginResult.data.user.interclubCaptain === true,
              familyMembers: loginResult.data.user.familyMembers || []
            });
            try { localStorage.setItem('mtc-remembered-email', _pinSetupEmail); } catch(e) {}
          } else {
            showToast('PIN set. Please sign in with your new PIN.');
            backFromPinSetup();
          }
        })
        .catch(function() {
          showToast('PIN set. Please sign in with your new PIN.');
          backFromPinSetup();
        });
      }
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Set PIN & Sign In'; }
      showToast('Network error. Please try again.');
    });
  };

  window.backFromPinSetup = function() {
    var loginCard = document.querySelector('.login-card:not(.signup-card)');
    var setupCard = document.getElementById('pinSetupCard');
    if (loginCard) loginCard.style.display = '';
    if (setupCard) setupCard.style.display = 'none';
  };

  // ============================================
  // FORGOT PIN
  // ============================================
  window.showForgotPinScreen = function() {
    var loginCard = document.querySelector('.login-card:not(.signup-card)');
    var forgotCard = document.getElementById('forgotPinCard');
    if (loginCard) loginCard.style.display = 'none';
    if (forgotCard) forgotCard.style.display = '';
    // Pre-fill email if remembered
    var emailInput = document.getElementById('forgotPinEmail');
    var remembered = null;
    try { remembered = localStorage.getItem('mtc-remembered-email'); } catch(e) {}
    if (emailInput && remembered) emailInput.value = remembered;
  };

  window.handleForgotPin = function() {
    var emailInput = document.getElementById('forgotPinEmail');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, 'Enter your email address');
      return;
    }

    var btn = document.getElementById('forgotPinBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending code...'; }

    fetch('/api/auth/forgot-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Send Reset Code'; }
      showToast('If an account exists, a reset code has been sent to your email.');
      // Show verify code form
      showVerifyCodeScreen(email);
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Send Reset Code'; }
      showToast('Network error. Please try again.');
    });
  };

  function showVerifyCodeScreen(email) {
    var forgotCard = document.getElementById('forgotPinCard');
    var verifyCard = document.getElementById('verifyCodeCard');
    if (forgotCard) forgotCard.style.display = 'none';
    if (verifyCard) {
      verifyCard.style.display = '';
      verifyCard.dataset.email = email;
    }
  }

  window.handleVerifyCode = function() {
    var verifyCard = document.getElementById('verifyCodeCard');
    var email = verifyCard ? verifyCard.dataset.email : '';
    var codeInput = document.getElementById('resetCode');
    var newPinInput = document.getElementById('newPin');
    var confirmInput = document.getElementById('newPinConfirm');

    var code = codeInput ? codeInput.value.trim() : '';
    var newPin = newPinInput ? newPinInput.value.trim() : '';
    var confirm = confirmInput ? confirmInput.value.trim() : '';

    if (!code || !/^\d{4}$/.test(code)) {
      showFieldError(codeInput, 'Enter the 4-digit code from your email');
      return;
    }
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      showFieldError(newPinInput, 'Enter a new 4-digit PIN');
      return;
    }
    if (newPin !== confirm) {
      showFieldError(confirmInput, 'PINs do not match');
      return;
    }

    var btn = document.getElementById('verifyCodeBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Verifying...'; }

    fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, code: code, newPin: newPin })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(result) {
      if (btn) { btn.disabled = false; btn.textContent = 'Reset PIN & Sign In'; }

      if (!result.ok) {
        showToast(result.data.error || 'Invalid code');
        return;
      }

      if (result.data.token && result.data.user) {
        finishLogin(email, {
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role,
          userId: result.data.user.id,
          accessToken: result.data.token,
          membershipType: result.data.user.membershipType || 'adult',
          familyId: result.data.user.familyId || null,
          residence: result.data.user.residence || 'mono',
          interclubTeam: result.data.user.interclubTeam || 'none',
          interclubCaptain: result.data.user.interclubCaptain === true,
          familyMembers: []
        });
        try { localStorage.setItem('mtc-remembered-email', email); } catch(e) {}
        showToast('PIN reset successful!');
      }
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Reset PIN & Sign In'; }
      showToast('Network error. Please try again.');
    });
  };

  window.backFromForgotPin = function() {
    var loginCard = document.querySelector('.login-card:not(.signup-card)');
    var forgotCard = document.getElementById('forgotPinCard');
    var verifyCard = document.getElementById('verifyCodeCard');
    if (loginCard) loginCard.style.display = '';
    if (forgotCard) forgotCard.style.display = 'none';
    if (verifyCard) verifyCard.style.display = 'none';
  };

  // ============================================
  // FINISH LOGIN (shared by all auth methods)
  // ============================================
  function finishLogin(loginEmail, matchedLogin) {
    try {
      var storedUser = MTC.storage.get('mtc-user', null);
      if (storedUser && !matchedLogin) {
        currentUser = storedUser;
        MTC.state.currentUser = currentUser;
        if (loginEmail && loginEmail !== currentUser.email) {
          currentUser.email = loginEmail;
          currentUser.name = loginEmail.split('@')[0];
        }
        var storedFamily = MTC.storage.get('mtc-family-members', []);
        if (storedFamily && storedFamily.length > 0) {
          MTC.state.familyMembers = storedFamily;
        }
        var storedActiveMember = MTC.storage.get('mtc-active-family-member', null);
        if (storedActiveMember) {
          MTC.state.activeFamilyMember = storedActiveMember;
        }
      } else if (matchedLogin) {
        currentUser = {
          name: matchedLogin.name,
          email: (loginEmail || '').toLowerCase(),
          role: matchedLogin.role,
          id: matchedLogin.userId || null,
          isMember: true,
          membershipType: matchedLogin.membershipType || 'adult',
          familyId: matchedLogin.familyId || null,
          residence: matchedLogin.residence || 'mono',
          interclubTeam: matchedLogin.interclubTeam || 'none',
          interclubCaptain: matchedLogin.interclubCaptain === true
        };
        MTC.state.currentUser = currentUser;
        window.currentUser = currentUser;
        if (matchedLogin.familyMembers && matchedLogin.familyMembers.length > 0) {
          MTC.storage.set('mtc-family-members', matchedLogin.familyMembers);
          MTC.state.familyMembers = matchedLogin.familyMembers;
        }
        currentRole = matchedLogin.role;
      }

      if (matchedLogin && matchedLogin.accessToken) {
        MTC.setToken(matchedLogin.accessToken);
      }

      MTC.storage.set('mtc-user', currentUser);
      MTC.storage.set('mtc-session-time', Date.now());

      completeLogin();
    } catch (error) {
      MTC.warn('Login error:', error);
      showToast('Login failed. Please try again.');
    }
  }

  // Legacy handler
  window.handleLogin = function() {
    return window.handlePinLogin();
  };

  function completeLogin() {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.classList.remove('active');
      loginScreen.style.display = 'none';
    }

    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'block';

    // Show/hide admin menu item based on role
    const adminMenuItem = document.getElementById('menuAdminItem');
    if (adminMenuItem) {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'coach')) {
        adminMenuItem.classList.remove('admin-hidden');
      } else {
        adminMenuItem.classList.add('admin-hidden');
      }
    }

    // Show/hide captain/team menu item based on interclub team
    const captainMenuItem = document.getElementById('menuCaptainItem');
    if (captainMenuItem) {
      if (currentUser && currentUser.interclubTeam && currentUser.interclubTeam !== 'none') {
        captainMenuItem.classList.remove('admin-hidden');
      } else {
        captainMenuItem.classList.add('admin-hidden');
      }
    }

    // Apply guest restrictions
    applyGuestRestrictions();

    // Sync profile data from currentUser (prefills settings screen with name/email)
    if (currentUser && MTC.state.profileData) {
      if (currentUser.name && !MTC.state.profileData.name) {
        MTC.state.profileData.name = currentUser.name;
      }
      if (currentUser.email && !MTC.state.profileData.email) {
        MTC.state.profileData.email = currentUser.email;
      }
      if (currentUser.skillLevel && !MTC.state.profileData.skill) {
        MTC.state.profileData.skill = currentUser.skillLevel;
      }
      MTC.storage.set('mtc-profile', MTC.state.profileData);
      // Update display elements
      var nameEl = document.getElementById('profileName');
      if (nameEl && currentUser.name) nameEl.textContent = currentUser.name.toUpperCase();
      if (typeof window.updateProfileDisplay === 'function') {
        window.updateProfileDisplay('name');
        window.updateProfileDisplay('email');
      }
    }

    // Navigate to appropriate start screen
    if (currentUser.isMember === false) {
      navigateTo('book');
    } else {
      navigateTo('home');
    }

    fetchWeather();
    scheduleWelcomeNotifications();

    // Load data from Supabase API (non-blocking, falls back to cached data)
    loadAppDataFromAPI();

    // Initialize Supabase client for Realtime (not for auth)
    initSupabase().then(function() {
      // Start realtime sync (Supabase Realtime + heartbeat fallback)
      if (typeof MTC.fn.startRealtimeSync === 'function') {
        MTC.fn.startRealtimeSync();
      }
      // Start typing indicator (Supabase Realtime broadcast)
      if (typeof MTC.fn.startTypingIndicator === 'function') {
        MTC.fn.startTypingIndicator();
      }
    });

    // Register push notifications (best-effort, non-blocking)
    registerPushNotifications();
    if (MTC.fn.checkOnboarding) {
      setTimeout(function() {
        MTC.fn.checkOnboarding();
      }, 700);
    }

  }

  // onclick handler (index.html)
  window.handleLogout = function() {
    // Delete session on server
    fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin'
    }).catch(function() {});

    currentUser = null;
    MTC.state.currentUser = null;
    window.currentUser = null;
    MTC.clearToken();
    MTC.clearAllTimers();
    if (typeof MTC.fn.stopRealtimeSync === 'function') MTC.fn.stopRealtimeSync();
    ['mtc-user', 'mtc-session-time', 'mtc-session-hash', 'mtc-access-token',
     'mtc-bookings', 'mtc-conversations', 'mtc-notifications',
     'mtc-rsvps', 'mtc-profile', 'mtc-partner-joins', 'mtc-settings',
     'mtc-onboarding-done', 'mtc-api-events', 'mtc-api-members', 'mtc-api-partners',
     'mtc-api-announcements', 'mtc-api-bookings', 'mtc-family-members', 'mtc-active-family-member'].forEach(function(key) { MTC.storage.remove(key); });
    MTC.state.familyMembers = [];
    MTC.state.activeFamilyMember = null;

    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('bottomNav').style.display = 'none';

    removeGuestRestrictions();

    showLoginScreen();
    document.getElementById('login-screen').classList.add('active');

    closeMenu();
    showToast('Logged out successfully');
  };

  // ============================================
  // GUEST RESTRICTIONS
  // ============================================
  function applyGuestRestrictions() {
    const isGuest = currentUser && currentUser.isMember === false;
    const nav = document.getElementById('bottomNav');
    if (!nav) return;

    const navItems = nav.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
      const id = item.id || '';
      if (id === 'nav-book') {
        item.style.display = '';
        item.classList.remove('guest-locked');
      } else if (isGuest) {
        item.style.display = 'none';
      } else {
        item.style.display = '';
      }
    });
  }
  window.applyGuestRestrictions = applyGuestRestrictions;

  function removeGuestRestrictions() {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(function(item) {
      item.style.display = '';
    });
  }

  // Guard navigation for guests
  let _originalNavigateTo = null;

  function installGuestNavigationGuard() {
    if (_originalNavigateTo) return;
    _originalNavigateTo = window.navigateTo;

    window.navigateTo = function(screen) {
      if (currentUser && currentUser.isMember === false) {
        if (GUEST_ALLOWED_SCREENS.indexOf(screen) === -1) {
          showToast('Members only - sign up as a member for full access');
          return;
        }
      }
      _originalNavigateTo(screen);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(installGuestNavigationGuard, 100);
    });
  } else {
    setTimeout(installGuestNavigationGuard, 100);
  }

  window.showLoginScreen = function() {
    var loginScreen = document.getElementById('login-screen');
    var loginCard = document.getElementById('loginCard');
    var pinSetupCard = document.getElementById('pinSetupCard');
    var forgotPinCard = document.getElementById('forgotPinCard');
    var verifyCodeCard = document.getElementById('verifyCodeCard');
    if (loginScreen) loginScreen.style.display = '';
    if (loginCard) loginCard.style.display = '';
    if (pinSetupCard) pinSetupCard.style.display = 'none';
    if (forgotPinCard) forgotPinCard.style.display = 'none';
    if (verifyCodeCard) verifyCodeCard.style.display = 'none';
  };


  // ============================================
  // LOAD APP DATA FROM SUPABASE API
  // ============================================
  function loadAppDataFromAPI() {
    if (!MTC.fn.loadFromAPI) return;
    var token = MTC.getToken();
    if (!token) return;

    MTC.fn.loadFromAPI('/mobile/events', 'mtc-api-events', null).then(function(events) {
      if (Array.isArray(events) && typeof window.updateEventsFromAPI === 'function') {
        window.updateEventsFromAPI(events);
      }
    });

    MTC.fn.loadFromAPI('/mobile/members', 'mtc-api-members', null).then(function(members) {
      if (Array.isArray(members) && typeof window.updateMembersFromAPI === 'function') {
        window.updateMembersFromAPI(members);
      }
      return MTC.fn.loadFromAPI('/mobile/conversations', 'mtc-api-conversations', null);
    }).then(function(conversations) {
      if (conversations && typeof window.updateConversationsFromAPI === 'function') {
        window.updateConversationsFromAPI(conversations);
      }
    }).catch(function(err) {
      MTC.warn('[MTC] Members/conversations load error:', err);
      MTC.fn.loadFromAPI('/mobile/conversations', 'mtc-api-conversations', null).then(function(conversations) {
        if (conversations && typeof window.updateConversationsFromAPI === 'function') {
          window.updateConversationsFromAPI(conversations);
        }
      });
    });

    MTC.fn.loadFromAPI('/mobile/partners', 'mtc-api-partners', null).then(function(partners) {
      if (Array.isArray(partners) && typeof window.updatePartnersFromAPI === 'function') {
        window.updatePartnersFromAPI(partners);
      }
    });

    MTC.fn.loadFromAPI('/mobile/announcements', 'mtc-api-announcements', null).then(function(announcements) {
      if (Array.isArray(announcements) && typeof window.updateAnnouncementsFromAPI === 'function') {
        window.updateAnnouncementsFromAPI(announcements);
      }
    });

    MTC.fn.loadFromAPI('/mobile/bookings', 'mtc-api-bookings', null).then(function(bookings) {
      if (Array.isArray(bookings) && typeof window.updateBookingsFromAPI === 'function') {
        window.updateBookingsFromAPI(bookings);
      }
    });

    MTC.fn.loadFromAPI('/mobile/courts', 'mtc-api-courts', null).then(function(courts) {
      if (Array.isArray(courts) && typeof window.updateCourtsFromAPI === 'function') {
        window.updateCourtsFromAPI(courts);
      }
    });

    MTC.fn.loadFromAPI('/mobile/court-blocks', 'mtc-api-court-blocks', null).then(function(blocks) {
      if (Array.isArray(blocks) && typeof window.updateCourtBlocksFromAPI === 'function') {
        window.updateCourtBlocksFromAPI(blocks);
      }
    });

    MTC.fn.loadFromAPI('/mobile/notifications', 'mtc-api-notifications', null).then(function(notifications) {
      if (Array.isArray(notifications) && typeof window.updateNotificationsFromAPI === 'function') {
        window.updateNotificationsFromAPI(notifications);
      }
    });

    MTC.fn.loadFromAPI('/mobile/families', 'mtc-api-families', null).then(function(familyData) {
      if (familyData && typeof window.updateFamiliesFromAPI === 'function') {
        window.updateFamiliesFromAPI(familyData);
      }
    });

    MTC.fn.loadFromAPI('/mobile/settings', 'mtc-club-settings', null);

    MTC.fn.apiRequest('/mobile/settings', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'getNotifPrefs' })
    }).then(function(prefs) {
      if (prefs && typeof window.updateNotifPrefsFromAPI === 'function') {
        window.updateNotifPrefsFromAPI(prefs);
      }
    }).catch(function() {});

    MTC.fn.loadFromAPI('/mobile/programs', 'mtc-api-programs', null).then(function(programs) {
      if (Array.isArray(programs) && typeof window.updateProgramsFromAPI === 'function') {
        window.updateProgramsFromAPI(programs);
      }
    });

    MTC.fn.loadFromAPI('/mobile/members', 'mtc-api-members', null).then(function(members) {
      if (!members || !Array.isArray(members)) return;
      var userId = MTC.storage.get('mtc-user-id');
      var me = members.find(function(m) { return m.id === userId; });
      if (me && me.preferences) {
        if (me.preferences.privacy) {
          MTC.storage.set('mtc-privacy', me.preferences.privacy);
        }
        if (me.preferences.courtPrefs) {
          MTC.storage.set('mtc-court-prefs', me.preferences.courtPrefs);
        }
        if (me.preferences.availability || me.preferences.playstyle) {
          var profile = MTC.storage.get('mtc-profile', {});
          if (me.preferences.availability) profile.availability = me.preferences.availability;
          if (me.preferences.playstyle) profile.playstyle = me.preferences.playstyle;
          MTC.storage.set('mtc-profile', profile);
          Object.assign(MTC.state.profileData || {}, profile);
        }
        if (me.preferences.activeProfile && me.preferences.activeProfile.type === 'family_member') {
          var memberId = me.preferences.activeProfile.memberId;
          if (memberId && typeof window.switchFamilyProfile === 'function') {
            setTimeout(function() { window.switchFamilyProfile(memberId); }, 500);
          }
        }
        if (me.avatar) {
          MTC.storage.set('mtc-avatar', me.avatar);
          if (typeof window.loadSavedAvatar === 'function') window.loadSavedAvatar();
        }
      }
    });
  }

  window.updateFamiliesFromAPI = function(data) {
    if (!data) return;
    if (data.family) {
      MTC.state.familyId = data.family.id;
      if (currentUser) currentUser.familyId = data.family.id;
    }
    if (data.members && Array.isArray(data.members)) {
      MTC.state.familyMembers = data.members;
      MTC.storage.set('mtc-family-members', data.members);
    }
  };

  // ============================================
  // Push notification registration
  // ============================================
  function registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!currentUser || !currentUser.id) return;
    if (Notification.permission === 'denied') return;

    if (Notification.permission === 'default') {
      setTimeout(function() {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') subscribeToPush();
        });
      }, 3000);
    } else if (Notification.permission === 'granted') {
      subscribeToPush();
    }
  }

  function subscribeToPush() {
    navigator.serviceWorker.ready.then(function(registration) {
      var vapidPublicKey = window.MTC_VAPID_PUBLIC_KEY || '';
      if (!vapidPublicKey) {
        MTC.warn('[Push] No VAPID public key configured');
        return;
      }

      var padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
      var base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      var rawData = atob(base64);
      var outputArray = new Uint8Array(rawData.length);
      for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);

      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      }).then(function(subscription) {
        fetch('/api/push-subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            userId: currentUser.id,
            subscription: subscription.toJSON()
          })
        }).catch(function() {});
      }).catch(function(err) {
        MTC.warn('[Push] Subscribe failed:', err.message);
      });
    });
  }

  window.registerPushNotifications = registerPushNotifications;

  // ============================================
  MTC.state.currentRole = 'member';
  window.currentRole = 'member';

  // Hide admin + captain + coach menu items on initial load
  document.addEventListener('DOMContentLoaded', function() {
    const adminMenuItem = document.getElementById('menuAdminItem');
    if (adminMenuItem) adminMenuItem.classList.add('admin-hidden');
    const captainMenuItem = document.getElementById('menuCaptainItem');
    if (captainMenuItem) captainMenuItem.classList.add('admin-hidden');

    // Pre-fill remembered email
    var emailInput = document.getElementById('loginEmail');
    try {
      var remembered = localStorage.getItem('mtc-remembered-email');
      if (emailInput && remembered) emailInput.value = remembered;
    } catch(e) {}

    // Clear validation error styling when user focuses an input
    document.addEventListener('focusin', function(e) {
      if (e.target && e.target.classList && e.target.classList.contains('input-error')) {
        e.target.classList.remove('input-error');
        clearFieldErrors(e.target);
      }
    });
  });
})();
