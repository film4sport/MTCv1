/* auth.js - MTC Court */
// ============================================
// LOGIN / LOGOUT / SIGN UP
// ============================================
(function() {
  'use strict';

  // Shared state (read by navigation.js, booking.js, interactive.js, confirm-modal.js)
  MTC.state.currentUser = null;
  window.currentUser = null; // Backward-compat alias (reassigned on login)

  // GUEST_ALLOWED_SCREENS is in config.js

  // Private state
  let signupAccountType = 'member';

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
  // SUPABASE CLIENT (initialized on DOMContentLoaded)
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
  var _supabaseReady = false;

  function initSupabase() {
    if (_supabaseClient) return Promise.resolve(_supabaseClient);
    // Cache the init promise so multiple callers don't create duplicate clients
    if (_supabaseInitPromise) return _supabaseInitPromise;
    _supabaseInitPromise = fetchWithRetry('/api/mobile-auth/config', 2, 1000)
      .then(function(r) { return r.json(); })
      .then(function(cfg) {
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
          _supabaseInitPromise = null;
          return null;
        }
        // Wait up to 8s for supabase lib (CDN or local fallback)
        return waitForSupabaseLib(8000).then(function(loaded) {
          if (loaded && window.supabase) {
            _supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
            MTC.state._supabaseClient = _supabaseClient; // Expose for realtime-sync.js
            _supabaseReady = true;
            enableAuthButtons();
          } else {
            _supabaseInitPromise = null; // Allow retry
          }
          return _supabaseClient;
        });
      })
      .catch(function() {
        _supabaseInitPromise = null; // Allow retry
        return null;
      });
    return _supabaseInitPromise;
  }

  /** Enable Google + Magic Link buttons once Supabase is ready */
  function enableAuthButtons() {
    var googleBtn = document.querySelector('.login-btn-google');
    var magicBtn = document.querySelector('.login-btn-magic');
    if (googleBtn) {
      googleBtn.disabled = false;
      googleBtn.style.opacity = '';
      // Remove "Loading..." text if set
      var label = googleBtn.querySelector('.google-btn-label');
      if (label && label.textContent === 'Loading...') label.textContent = 'Continue with Google';
    }
    if (magicBtn) {
      magicBtn.disabled = false;
      magicBtn.style.opacity = '';
    }
  }

  // ============================================
  // CHECK FOR AUTH CALLBACK (after OAuth / Magic Link redirect)
  // ============================================
  function checkAuthCallback() {
    // Supabase PKCE flow: after redirect, the URL has ?code=... that the
    // Supabase client auto-detects. We also check the session endpoint for
    // server-side cookie sessions (set by /auth/callback).
    initSupabase().then(function(sb) {
      if (!sb) return;
      // Let Supabase client process any auth params in the URL
      sb.auth.getSession().then(function(result) {
        if (result.data && result.data.session) {
          finishOAuthLogin(result.data.session);
          // Clean URL params
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          return;
        }
        // No client-side session — try server-side session cookies
        // (set by /auth/callback for Google OAuth)
        fetch('/api/mobile-auth/session')
          .then(function(r) { return r.ok ? r.json() : null; })
          .then(function(data) {
            if (data && data.data) {
              finishLogin(data.data.email, data.data);
            }
          })
          .catch(function() { /* no session, show login */ });
      });
    });
  }

  // Process a Supabase session (from OAuth or Magic Link)
  function finishOAuthLogin(session) {
    var user = session.user;
    var email = user.email || '';
    // Fetch full profile from server (uses cookie session set by Supabase)
    fetch('/api/mobile-auth/session')
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.data) {
          finishLogin(email, data.data);
        } else {
          // Fallback: build minimal user from session
          finishLogin(email, {
            name: user.user_metadata && user.user_metadata.name || email.split('@')[0],
            email: email,
            role: 'member',
            userId: user.id,
            accessToken: session.access_token,
            membershipType: 'individual',
            familyId: null,
            interclubTeam: '',
            interclubCaptain: false,
            familyMembers: []
          });
        }
      })
      .catch(function() {
        // Fallback
        finishLogin(email, {
          name: user.user_metadata && user.user_metadata.name || email.split('@')[0],
          email: email,
          role: 'member',
          userId: user.id,
          accessToken: session.access_token,
          membershipType: 'individual',
          familyId: null,
          interclubTeam: '',
          interclubCaptain: false,
          familyMembers: []
        });
      });
  }

  // ============================================
  // GOOGLE SIGN-IN
  // ============================================
  window.handleGoogleSignIn = function() {
    var btn = document.querySelector('.login-btn-google');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

    // Store redirect target BEFORE leaving for OAuth (survives the redirect chain)
    try { localStorage.setItem('mtc-auth-redirect', '/mobile-app/index.html'); } catch(e) {}

    initSupabase().then(function(sb) {
      if (!sb) {
        if (btn) { btn.disabled = false; btn.style.opacity = ''; }
        showToast('Cannot reach the server. Check your connection and try again.');
        return;
      }
      var origin = window.location.origin;
      sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: origin + '/auth/callback?next=' + encodeURIComponent('/mobile-app/index.html'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      }).then(function(result) {
        if (result.error) {
          if (btn) { btn.disabled = false; btn.style.opacity = ''; }
          showToast('Google sign-in failed: ' + result.error.message);
        }
        // Browser will redirect to Google...
      });
    }).catch(function() {
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      showToast('Something went wrong. Please try again.');
    });
  };

  // ============================================
  // MAGIC LINK SIGN-IN
  // ============================================
  window.handleMagicLink = function() {
    var emailInput = document.getElementById('loginEmail');
    var email = emailInput ? emailInput.value.trim().toLowerCase() : '';

    emailInput.classList.remove('input-error');
    clearFieldErrors(emailInput);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, 'Enter a valid email address');
      showToast('Enter your email to receive a sign-in link.');
      return;
    }

    var btn = document.getElementById('magicLinkBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending link...'; }

    initSupabase().then(function(sb) {
      if (!sb) {
        if (btn) { btn.disabled = false; btn.textContent = 'Sign in with Email Link'; }
        showToast('Cannot reach the server. Check your connection and try again.');
        return;
      }
      var origin = window.location.origin;
      sb.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: origin + '/auth/callback?next=' + encodeURIComponent('/mobile-app/index.html')
        }
      }).then(function(result) {
        if (btn) { btn.disabled = false; btn.textContent = 'Sign in with Email Link'; }
        if (result.error) {
          var msg = result.error.message || '';
          if (msg.toLowerCase().includes('not allowed') || msg.toLowerCase().includes('not found')) {
            showToast('No account found with this email.');
          } else {
            showToast('Failed to send link: ' + msg);
          }
          return;
        }
        // Show magic link sent overlay
        var overlay = document.getElementById('magicLinkOverlay');
        var emailEl = document.getElementById('magicLinkEmail');
        if (emailEl) emailEl.textContent = email;
        if (overlay) overlay.style.display = 'flex';
      });
    });
  };

  window.closeMagicLinkOverlay = function() {
    var overlay = document.getElementById('magicLinkOverlay');
    if (overlay) overlay.style.display = 'none';
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

  // Legacy handler kept for backward compat (signup flow still uses it)
  window.handleLogin = function() {
    showToast('Please use Google or Email Link to sign in.');
  };

  function completeLogin() {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.remove('active');

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

    // Navigate to appropriate start screen
    if (currentUser.isMember === false) {
      navigateTo('book');
    } else {
      navigateTo('home');
    }

    fetchWeather();
    showToast('Welcome, ' + currentUser.name + '!');
    scheduleWelcomeNotifications();

    // Load data from Supabase API (non-blocking, falls back to cached data)
    loadAppDataFromAPI();

    // Start realtime sync (Supabase Realtime + heartbeat fallback)
    if (typeof MTC.fn.startRealtimeSync === 'function') {
      MTC.fn.startRealtimeSync();
    }

    // Register push notifications (best-effort, non-blocking)
    registerPushNotifications();

    // ── One-time beta + opening day notifications for existing users ──
    // New users get these from /auth/callback; this catches users who signed up before they were added.
    if (currentUser && currentUser.id && new Date() < new Date('2026-05-09T00:00:00')) {
      var betaKey = 'mtc-beta-notice-sent-' + currentUser.id;
      if (!MTC.storage.get(betaKey, null)) {
        MTC.storage.set(betaKey, true);
        // Insert via Supabase client (already initialized after login)
        initSupabase().then(function(sb) {
          if (!sb) return;
          var userId = currentUser.id;
          sb.from('notifications').select('id').in('id', ['opening-day-' + userId, 'beta-notice-' + userId])
            .then(function(res) {
              var existing = ((res.data || []).map(function(n) { return n.id; }));
              var inserts = [];
              if (existing.indexOf('opening-day-' + userId) === -1) {
                inserts.push({
                  id: 'opening-day-' + userId,
                  user_id: userId, type: 'event',
                  title: 'Opening Day \u2014 May 9th!',
                  body: 'Mark your calendar! Mono Tennis Club opens for the 2026 season on May 9th. See you on the courts!',
                  timestamp: new Date().toISOString(), read: false
                });
              }
              if (existing.indexOf('beta-notice-' + userId) === -1) {
                inserts.push({
                  id: 'beta-notice-' + userId,
                  user_id: userId, type: 'info',
                  title: 'App Under Construction',
                  body: 'Our app and website are still in development. If you find any bugs or have feedback, please email monotennisclub1@gmail.com \u2014 we appreciate your help!',
                  timestamp: new Date(Date.now() + 1000).toISOString(), read: false
                });
              }
              if (inserts.length > 0) {
                sb.from('notifications').insert(inserts).then(function() {
                  // Refresh notification badge
                  if (typeof MTC.fn.updateUnreadCount === 'function') MTC.fn.updateUnreadCount();
                }, function() {});
              }
            });
        });
      }
    }
  }

  // onclick handler (index.html)
  window.handleLogout = function() {
    currentUser = null;
    MTC.state.currentUser = null;
    window.currentUser = null;
    // Clear all app-related data on logout (prevents data leaks on shared devices)
    MTC.clearToken(); // Clear memory-cached token first
    MTC.clearAllTimers(); // Clear any tracked timers
    if (typeof MTC.fn.stopRealtimeSync === 'function') MTC.fn.stopRealtimeSync(); // Stop realtime subscriptions
    ['mtc-user', 'mtc-session-time', 'mtc-session-hash',
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
  // Backward-compat alias
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
          showToast('Members only \u2014 sign up as a member for full access');
          return;
        }
      }
      _originalNavigateTo(screen);
    };
  }

  // Install guard once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(installGuestNavigationGuard, 100);
    });
  } else {
    setTimeout(installGuestNavigationGuard, 100);
  }

  // ============================================
  // SIGN UP SCREEN TOGGLE
  // ============================================
  // onclick handler (index.html)
  window.showSignUpScreen = function() {
    const loginCard = document.querySelector('.login-card:not(.signup-card)');
    const signupCard = document.getElementById('signupCard');
    if (loginCard) loginCard.style.display = 'none';
    if (signupCard) signupCard.style.display = '';
    selectSignupType('member');
  };

  // onclick handler (index.html)
  window.showLoginScreen = function() {
    const loginCard = document.querySelector('.login-card:not(.signup-card)');
    const signupCard = document.getElementById('signupCard');
    if (loginCard) loginCard.style.display = '';
    if (signupCard) signupCard.style.display = 'none';
  };

  // onclick handler (index.html)
  window.selectSignupType = function(type) {
    signupAccountType = type;
    const memberBtn = document.getElementById('signupTypeMember');
    const guestBtn = document.getElementById('signupTypeGuest');
    const descEl = document.getElementById('signupTypeDesc');

    if (memberBtn) memberBtn.classList.toggle('active', type === 'member');
    if (guestBtn) guestBtn.classList.toggle('active', type === 'guest');

    if (descEl) {
      descEl.textContent = type === 'member'
        ? 'Full access to courts, programs, partners, messaging, and all club features.'
        : 'Book courts ($10/hr) and register for programs. Upgrade to member anytime.';
    }
  };

  // ============================================
  // HANDLE SIGN UP
  // ============================================
  // onclick handler (index.html)
  window.handleSignUp = function() {
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const phoneInput = document.getElementById('signupPhone');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    [nameInput, emailInput, phoneInput].forEach(function(el) { el.classList.remove('input-error'); clearFieldErrors(el); });

    const errors = [];
    if (!name || name.length < 2) { showFieldError(nameInput, 'Name must be at least 2 characters'); errors.push('name (min 2 chars)'); }
    if (!email) { showFieldError(emailInput, 'Email is required'); errors.push('valid email'); }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(emailInput, 'Enter a valid email address'); errors.push('valid email'); }
    if (phone && !/^[\d\s\-\+\(\)]{7,15}$/.test(phone)) { showFieldError(phoneInput, 'Enter a valid phone number'); errors.push('valid phone number'); }

    if (errors.length > 0) {
      const signupCard = document.getElementById('signupCard');
      if (signupCard) { signupCard.style.animation='none'; signupCard.offsetHeight; signupCard.style.animation='shakeX 0.4s ease'; }
      showToast('Please enter a valid ' + errors[0]);
      return;
    }

    const isMember = signupAccountType === 'member';

    currentUser = {
      name: name,
      email: email,
      phone: phone,
      role: isMember ? 'member' : 'guest',
      isMember: isMember
    };
    MTC.state.currentUser = currentUser;
    window.currentUser = currentUser;

    MTC.storage.set('mtc-user', currentUser);

    completeLogin();

    if (!isMember) {
      setTimeout(function() {
        showPushNotification(
          'Guest Account Created',
          'You can book courts ($10/hr) and register for programs. Welcome!',
          '\uD83C\uDFBE'
        );
      }, 2000);
    }
  };

  // ============================================
  // LOAD APP DATA FROM SUPABASE API
  // ============================================
  function loadAppDataFromAPI() {
    if (!MTC.fn.loadFromAPI) return;
    var token = MTC.getToken();
    if (!token) return; // No token = not authenticated, skip API calls

    // Load events
    MTC.fn.loadFromAPI('/mobile/events', 'mtc-api-events', null).then(function(events) {
      if (events && events.length > 0 && typeof window.updateEventsFromAPI === 'function') {
        window.updateEventsFromAPI(events);
      }
    });

    // Load members
    MTC.fn.loadFromAPI('/mobile/members', 'mtc-api-members', null).then(function(members) {
      if (members && members.length > 0 && typeof window.updateMembersFromAPI === 'function') {
        window.updateMembersFromAPI(members);
      }
    });

    // Load partners
    MTC.fn.loadFromAPI('/mobile/partners', 'mtc-api-partners', null).then(function(partners) {
      if (partners && typeof window.updatePartnersFromAPI === 'function') {
        window.updatePartnersFromAPI(partners);
      }
    });

    // Load announcements
    MTC.fn.loadFromAPI('/mobile/announcements', 'mtc-api-announcements', null).then(function(announcements) {
      if (announcements && typeof window.updateAnnouncementsFromAPI === 'function') {
        window.updateAnnouncementsFromAPI(announcements);
      }
    });

    // Load bookings
    MTC.fn.loadFromAPI('/mobile/bookings', 'mtc-api-bookings', null).then(function(bookings) {
      if (bookings && typeof window.updateBookingsFromAPI === 'function') {
        window.updateBookingsFromAPI(bookings);
      }
    });

    // Load conversations
    MTC.fn.loadFromAPI('/mobile/conversations', 'mtc-api-conversations', null).then(function(conversations) {
      if (conversations && typeof window.updateConversationsFromAPI === 'function') {
        window.updateConversationsFromAPI(conversations);
      }
    });

    // Load court status (maintenance/available)
    MTC.fn.loadFromAPI('/mobile/courts', 'mtc-api-courts', null).then(function(courts) {
      if (courts && typeof window.updateCourtsFromAPI === 'function') {
        window.updateCourtsFromAPI(courts);
      }
    });

    // Load court blocks (admin-created blocks for specific dates/times)
    MTC.fn.loadFromAPI('/mobile/court-blocks', 'mtc-api-court-blocks', null).then(function(blocks) {
      if (blocks && typeof window.updateCourtBlocksFromAPI === 'function') {
        window.updateCourtBlocksFromAPI(blocks);
      }
    });

    // Load notifications from Supabase
    MTC.fn.loadFromAPI('/mobile/notifications', 'mtc-api-notifications', null).then(function(notifications) {
      if (notifications && typeof window.updateNotificationsFromAPI === 'function') {
        window.updateNotificationsFromAPI(notifications);
      }
    });

    // Load family members
    MTC.fn.loadFromAPI('/mobile/families', 'mtc-api-families', null).then(function(familyData) {
      if (familyData && typeof window.updateFamiliesFromAPI === 'function') {
        window.updateFamiliesFromAPI(familyData);
      }
    });

    // Load club settings (gate code, etc.)
    MTC.fn.loadFromAPI('/mobile/settings', 'mtc-club-settings', null);

    // Load notification preferences from Supabase
    MTC.fn.apiRequest('/mobile/settings', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'getNotifPrefs' })
    }).then(function(prefs) {
      if (prefs && typeof window.updateNotifPrefsFromAPI === 'function') {
        window.updateNotifPrefsFromAPI(prefs);
      }
    }).catch(function() { /* non-critical */ });

    // Load coaching programs
    MTC.fn.loadFromAPI('/mobile/programs', 'mtc-api-programs', null).then(function(programs) {
      if (programs && typeof window.updateProgramsFromAPI === 'function') {
        window.updateProgramsFromAPI(programs);
      }
    });

    // Load user preferences (privacy, court prefs, active profile, etc.) from own profile
    MTC.fn.loadFromAPI('/mobile/members', 'mtc-api-members', null).then(function(members) {
      if (!members || !Array.isArray(members)) return;
      // Find own profile
      var userId = MTC.storage.get('mtc-user-id');
      var me = members.find(function(m) { return m.id === userId; });
      if (me && me.preferences) {
        // Restore privacy settings
        if (me.preferences.privacy) {
          MTC.storage.set('mtc-privacy', me.preferences.privacy);
        }
        // Restore court preferences
        if (me.preferences.courtPrefs) {
          MTC.storage.set('mtc-court-prefs', me.preferences.courtPrefs);
        }
        // Restore availability + playstyle into profile
        if (me.preferences.availability || me.preferences.playstyle) {
          var profile = MTC.storage.get('mtc-profile', {});
          if (me.preferences.availability) profile.availability = me.preferences.availability;
          if (me.preferences.playstyle) profile.playstyle = me.preferences.playstyle;
          MTC.storage.set('mtc-profile', profile);
          Object.assign(MTC.state.profileData || {}, profile);
        }
        // Restore active family profile
        if (me.preferences.activeProfile && me.preferences.activeProfile.type === 'family_member') {
          var memberId = me.preferences.activeProfile.memberId;
          if (memberId && typeof window.switchFamilyProfile === 'function') {
            // Delay to let family data load first
            setTimeout(function() { window.switchFamilyProfile(memberId); }, 500);
          }
        }
        // Restore avatar from profile
        if (me.avatar) {
          MTC.storage.set('mtc-avatar', me.avatar);
          if (typeof window.loadSavedAvatar === 'function') window.loadSavedAvatar();
        }
      }
    });
  }

  /**
   * Update family data from Supabase API.
   * Called after login to sync family members across platforms.
   */
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
  // ROLE (set via login credentials, no FAB)
  // Push notification registration
  // ============================================
  function registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!currentUser || !currentUser.id) return;

    // Don't re-prompt if already denied
    if (Notification.permission === 'denied') return;

    // Ask permission if not granted yet
    if (Notification.permission === 'default') {
      // Delay prompt slightly so it doesn't fire during login animation
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

      // Convert base64 VAPID key to Uint8Array
      var padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
      var base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      var rawData = atob(base64);
      var outputArray = new Uint8Array(rawData.length);
      for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);

      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      }).then(function(subscription) {
        // Send subscription to server
        fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            subscription: subscription.toJSON()
          })
        }).catch(function() { /* push registration is best-effort */ });
      }).catch(function(err) {
        MTC.warn('[Push] Subscribe failed:', err.message);
      });
    });
  }

  window.registerPushNotifications = registerPushNotifications;

  // ============================================
  MTC.state.currentRole = 'member';
  window.currentRole = 'member'; // Backward-compat alias

  // Hide admin + captain menu items on initial load (member by default)
  document.addEventListener('DOMContentLoaded', function() {
    const adminMenuItem = document.getElementById('menuAdminItem');
    if (adminMenuItem) adminMenuItem.classList.add('admin-hidden');
    const captainMenuItem = document.getElementById('menuCaptainItem');
    if (captainMenuItem) captainMenuItem.classList.add('admin-hidden');

    // Disable auth buttons until Supabase is ready (prevents first-click failure)
    var googleBtn = document.querySelector('.login-btn-google');
    var magicBtn = document.querySelector('.login-btn-magic');
    if (googleBtn) { googleBtn.disabled = true; googleBtn.style.opacity = '0.6'; }
    if (magicBtn) { magicBtn.disabled = true; magicBtn.style.opacity = '0.6'; }

    // Eagerly initialize Supabase client on page load (not on first click)
    initSupabase().then(function(sb) {
      if (!sb) {
        // Still enable buttons — initSupabase will retry on click
        enableAuthButtons();
      }
    });

    // Clear validation error styling when user focuses an input
    document.addEventListener('focusin', function(e) {
      if (e.target && e.target.classList && e.target.classList.contains('input-error')) {
        e.target.classList.remove('input-error');
        clearFieldErrors(e.target);
      }
    });

    // Check if returning from Google OAuth or Magic Link redirect
    var url = new URL(window.location.href);
    if (url.searchParams.has('code') || url.hash.includes('access_token') || url.searchParams.has('auth')) {
      checkAuthCallback();
      // Clean the ?auth=callback param from URL
      if (url.searchParams.has('auth') && window.history && window.history.replaceState) {
        url.searchParams.delete('auth');
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      }
    }
  });
})();
