/* auth.js - MTC Court */
// ============================================
// LOGIN / LOGOUT / SIGN UP
// ============================================
(function() {
  'use strict';

  // Shared state (read by navigation.js, payments.js, booking.js, interactive.js, confirm-modal.js)
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
  // LOGIN
  // ============================================
  // onclick handler (index.html)
  window.handleLogin = function() {
    try {
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const rememberCheckbox = document.getElementById('rememberMe');
      const remember = rememberCheckbox ? rememberCheckbox.checked : false;

      emailInput.classList.remove('input-error');
      passwordInput.classList.remove('input-error');
      clearFieldErrors(emailInput);
      clearFieldErrors(passwordInput);

      // Validate required fields
      const errors = [];
      if (!email) { showFieldError(emailInput, 'Email is required'); errors.push('email'); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(emailInput, 'Enter a valid email address'); errors.push('email format'); }
      if (!password) { showFieldError(passwordInput, 'Password is required'); errors.push('password'); }

      if (errors.length > 0) {
        const loginCard = document.querySelector('.login-card:not(.signup-card)');
        if (loginCard) { loginCard.style.animation='none'; loginCard.offsetHeight; loginCard.style.animation='shakeX 0.4s ease'; }
        showToast('Please enter a valid ' + errors[0]);
        return;
      }

      // Validate via server-side API (passwords never stored client-side)
      var loginBtn = document.querySelector('.login-btn');
      if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Signing in...'; }

        fetch('/api/mobile-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), password: password })
        })
        .then(function(resp) { return resp.json().then(function(data) { return { ok: resp.ok, data: data }; }); })
        .then(function(result) {
          if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Sign In'; }
          if (!result.ok) {
            if (result.data.error === 'invalid_password') {
              showFieldError(passwordInput, 'Incorrect password');
              showToast('Incorrect password');
            } else if (result.data.error === 'unknown_account') {
              showFieldError(emailInput, 'Account not found');
              showToast('Account not found');
            } else {
              showToast('Login failed');
            }
            var lc = document.querySelector('.login-card:not(.signup-card)');
            if (lc) { lc.style.animation='none'; lc.offsetHeight; lc.style.animation='shakeX 0.4s ease'; }
            return;
          }
          // Server returned valid credentials
          finishLogin(email, result.data);
        })
        .catch(function() {
          if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Sign In'; }
          // Offline fallback: only resume a previously authenticated session
          // Requires: valid Supabase access token stored + email match + session not expired (24 hours)
          // No password-based offline check — we only resume sessions authenticated by the server
          var stored = MTC.storage.get('mtc-user', null);
          var sessionTime = MTC.storage.get('mtc-session-time', 0);
          var sessionAge = Date.now() - sessionTime;
          var hasToken = !!MTC.getToken();
          var MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
          if (stored && hasToken && stored.email === email.toLowerCase() && sessionAge < MAX_SESSION_AGE) {
            showToast('Offline — resuming cached session');
            finishLogin(email, stored);
          } else {
            if (sessionAge >= MAX_SESSION_AGE || !hasToken) {
              MTC.storage.remove('mtc-user');
              MTC.storage.remove('mtc-session-time');
              MTC.clearToken();
              MTC.storage.remove('mtc-session-hash');
            }
            showToast('Cannot connect to server. Please try again when online.');
          }
        });
        return; // async — exit handleLogin, finishLogin continues

      function finishLogin(loginEmail, matchedLogin) {
        // Check for stored user
        var storedUser = MTC.storage.get('mtc-user', null);
        if (storedUser && !matchedLogin) {
          currentUser = storedUser;
          MTC.state.currentUser = currentUser;
          if (loginEmail && loginEmail !== currentUser.email) {
            currentUser.email = loginEmail;
            currentUser.name = loginEmail.split('@')[0];
          }
          // Restore family state from localStorage
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
            email: loginEmail.toLowerCase(),
            role: matchedLogin.role,
            id: matchedLogin.userId || null,
            isMember: true,
            membershipType: matchedLogin.membershipType || 'adult',
            familyId: matchedLogin.familyId || null,
            interclubTeam: matchedLogin.interclubTeam || 'none'
          };
          MTC.state.currentUser = currentUser;
          window.currentUser = currentUser;
          // Store family members if present
          if (matchedLogin.familyMembers && matchedLogin.familyMembers.length > 0) {
            MTC.storage.set('mtc-family-members', matchedLogin.familyMembers);
            MTC.state.familyMembers = matchedLogin.familyMembers;
          }
          currentRole = matchedLogin.role;
        }

        // Store Supabase access token for API calls (returned by mobile-auth)
        if (matchedLogin && matchedLogin.accessToken) {
          MTC.setToken(matchedLogin.accessToken);
        }

        // Always persist session + timestamp for offline expiry
        MTC.storage.set('mtc-user', currentUser);
        MTC.storage.set('mtc-session-time', Date.now());
        // Offline re-authentication relies on the Supabase access token (stored above)
        // No password hash is stored — server-authenticated session token is the only credential

        // Sync membership status to payment data
        if (typeof memberPaymentData !== 'undefined') {
          memberPaymentData.currentUser.name = currentUser.name;
          memberPaymentData.currentUser.email = currentUser.email;
          memberPaymentData.currentUser.isMember = currentUser.isMember !== false;
        }

        completeLogin();
      }
    } catch (error) {
      MTC.warn('Login error:', error);
      showToast('Login failed. Please try again.');
    }
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

    // Register push notifications (best-effort, non-blocking)
    registerPushNotifications();
  }

  // onclick handler (index.html)
  window.handleLogout = function() {
    currentUser = null;
    MTC.state.currentUser = null;
    window.currentUser = null;
    // Clear all app-related data on logout (prevents data leaks on shared devices)
    MTC.clearToken(); // Clear memory-cached token first
    MTC.clearAllTimers(); // Clear any tracked timers
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
    const passwordInput = document.getElementById('signupPassword');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;

    [nameInput, emailInput, phoneInput, passwordInput].forEach(function(el) { el.classList.remove('input-error'); clearFieldErrors(el); });

    const errors = [];
    if (!name || name.length < 2) { showFieldError(nameInput, 'Name must be at least 2 characters'); errors.push('name (min 2 chars)'); }
    if (!email) { showFieldError(emailInput, 'Email is required'); errors.push('valid email'); }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(emailInput, 'Enter a valid email address'); errors.push('valid email'); }
    if (phone && !/^[\d\s\-\+\(\)]{7,15}$/.test(phone)) { showFieldError(phoneInput, 'Enter a valid phone number'); errors.push('valid phone number'); }
    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) { showFieldError(passwordInput, 'Password must be 8+ chars with uppercase, lowercase & number'); errors.push('stronger password (min 8 chars, mixed case + number)'); }

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

    // Sync to payment data
    if (typeof memberPaymentData !== 'undefined') {
      memberPaymentData.currentUser.name = name;
      memberPaymentData.currentUser.email = email;
      memberPaymentData.currentUser.isMember = isMember;
    }

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

  // Hide admin menu item on initial load (member by default)
  document.addEventListener('DOMContentLoaded', function() {
    const adminMenuItem = document.getElementById('menuAdminItem');
    if (adminMenuItem) adminMenuItem.classList.add('admin-hidden');

    // Clear validation error styling when user focuses an input
    document.addEventListener('focusin', function(e) {
      if (e.target && e.target.classList && e.target.classList.contains('input-error')) {
        e.target.classList.remove('input-error');
        clearFieldErrors(e.target);
      }
    });
  });
})();
