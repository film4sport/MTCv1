/* realtime-sync.js - MTC Court */
// ============================================
// SUPABASE REALTIME SUBSCRIPTIONS + SYNC ENGINE
// Closes the Dashboard→Mobile sync gap by subscribing
// to Supabase Realtime for live updates on key tables.
// ============================================
(function() {
  'use strict';

  // Private state
  var _channel = null;
  var _syncInterval = null;
  var _lastSyncTimestamps = {};
  var HEARTBEAT_MS = 120000; // 2 minutes
  var STALE_THRESHOLD_MS = 300000; // 5 minutes
  var _isSubscribed = false;

  // Debounce helper — prevent refetch storms from rapid changes
  var _debounceTimers = {};
  function debouncedRefetch(key, fn, delay) {
    delay = delay || 1500;
    if (_debounceTimers[key]) clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(fn, delay);
  }

  // ============================================
  // REFETCH FUNCTIONS — called when Realtime triggers
  // ============================================

  function refetchBookings() {
    if (!MTC.fn.loadFromAPI) return;
    MTC.fn.loadFromAPI('/mobile/bookings', 'mtc-api-bookings', null).then(function(bookings) {
      if (bookings && typeof window.updateBookingsFromAPI === 'function') {
        window.updateBookingsFromAPI(bookings);
      }
      _lastSyncTimestamps.bookings = Date.now();
      updateStaleIndicators();
    });
  }

  function refetchPartners() {
    if (!MTC.fn.loadFromAPI) return;
    MTC.fn.loadFromAPI('/mobile/partners', 'mtc-api-partners', null).then(function(partners) {
      if (partners && typeof window.updatePartnersFromAPI === 'function') {
        window.updatePartnersFromAPI(partners);
      }
      _lastSyncTimestamps.partners = Date.now();
      updateStaleIndicators();
    });
  }

  function refetchConversations() {
    if (!MTC.fn.loadFromAPI) return;
    MTC.fn.loadFromAPI('/mobile/conversations', 'mtc-api-conversations', null).then(function(conversations) {
      if (conversations && typeof window.updateConversationsFromAPI === 'function') {
        window.updateConversationsFromAPI(conversations);
      }
      _lastSyncTimestamps.conversations = Date.now();
      updateStaleIndicators();
    });
  }

  function refetchEvents() {
    if (!MTC.fn.loadFromAPI) return;
    MTC.fn.loadFromAPI('/mobile/events', 'mtc-api-events', null).then(function(events) {
      if (events && events.length > 0 && typeof window.updateEventsFromAPI === 'function') {
        window.updateEventsFromAPI(events);
      }
      _lastSyncTimestamps.events = Date.now();
      updateStaleIndicators();
    });
  }

  function refetchNotifications() {
    if (!MTC.fn.loadFromAPI) return;
    MTC.fn.loadFromAPI('/mobile/notifications', 'mtc-api-notifications', null).then(function(notifications) {
      if (notifications && typeof window.updateNotificationsFromAPI === 'function') {
        window.updateNotificationsFromAPI(notifications);
      }
      _lastSyncTimestamps.notifications = Date.now();
    });
  }

  function refetchCourtBlocks() {
    if (!MTC.fn.loadFromAPI) return;
    MTC.fn.loadFromAPI('/mobile/court-blocks', 'mtc-api-court-blocks', null).then(function(blocks) {
      if (blocks && typeof window.updateCourtBlocksFromAPI === 'function') {
        window.updateCourtBlocksFromAPI(blocks);
      }
      _lastSyncTimestamps.courtBlocks = Date.now();
      updateStaleIndicators();
    });
  }

  /** Refetch all data types (used by heartbeat + pull-to-refresh) */
  function refetchAll() {
    refetchBookings();
    refetchPartners();
    refetchConversations();
    refetchEvents();
    refetchNotifications();
    refetchCourtBlocks();
  }

  // ============================================
  // STALE DATA INDICATOR
  // ============================================

  function updateStaleIndicators() {
    var now = Date.now();
    var indicators = document.querySelectorAll('.sync-status-dot');
    indicators.forEach(function(dot) {
      var dataType = dot.getAttribute('data-sync-type');
      var lastSync = _lastSyncTimestamps[dataType];
      if (!lastSync || (now - lastSync) > STALE_THRESHOLD_MS) {
        dot.classList.add('stale');
        dot.classList.remove('fresh');
        dot.setAttribute('title', 'Data may be outdated — pull down to refresh');
      } else {
        dot.classList.add('fresh');
        dot.classList.remove('stale');
        dot.setAttribute('title', 'Synced ' + getTimeAgo(lastSync));
      }
    });
  }

  function getTimeAgo(timestamp) {
    var diff = Math.round((Date.now() - timestamp) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
  }

  // ============================================
  // SUPABASE REALTIME SUBSCRIPTION
  // ============================================

  /**
   * Subscribe to Supabase Realtime for live table changes.
   * Called after successful login when Supabase client is available.
   */
  function startRealtimeSync() {
    if (_isSubscribed) return;

    // Get Supabase client from auth module
    var sb = MTC.state._supabaseClient;
    if (!sb) {
      // Supabase client not available — fall back to heartbeat-only sync
      startHeartbeat();
      return;
    }

    try {
      _channel = sb.channel('mobile-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, function() {
          debouncedRefetch('bookings', refetchBookings);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_participants' }, function() {
          debouncedRefetch('bookings', refetchBookings);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, function() {
          debouncedRefetch('partners', refetchPartners);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, function() {
          debouncedRefetch('conversations', refetchConversations);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, function() {
          debouncedRefetch('conversations', refetchConversations);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, function() {
          debouncedRefetch('events', refetchEvents);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, function() {
          debouncedRefetch('events', refetchEvents);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, function() {
          debouncedRefetch('notifications', refetchNotifications);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_blocks' }, function() {
          debouncedRefetch('courtBlocks', refetchCourtBlocks);
        })
        .subscribe(function(status) {
          if (status === 'SUBSCRIBED') {
            _isSubscribed = true;
            MTC.state.realtimeConnected = true;
            // Mark all data as fresh on connect
            var now = Date.now();
            _lastSyncTimestamps.bookings = now;
            _lastSyncTimestamps.partners = now;
            _lastSyncTimestamps.conversations = now;
            _lastSyncTimestamps.events = now;
            _lastSyncTimestamps.notifications = now;
            updateStaleIndicators();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            MTC.state.realtimeConnected = false;
            // Realtime failed — fall back to heartbeat
            startHeartbeat();
          }
        });
    } catch (e) {
      MTC.warn('Realtime subscription failed:', e);
      startHeartbeat();
    }

    // Always start heartbeat as a safety net (catches missed events)
    startHeartbeat();
  }

  // ============================================
  // HEARTBEAT SYNC — fallback + safety net
  // ============================================

  function startHeartbeat() {
    if (_syncInterval) return; // Already running
    _syncInterval = setInterval(function() {
      // Only sync if app is visible and online
      if (document.hidden || !navigator.onLine) return;
      // Only sync if user is logged in
      if (!MTC.getToken()) return;
      refetchAll();
    }, HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (_syncInterval) {
      clearInterval(_syncInterval);
      _syncInterval = null;
    }
  }

  // ============================================
  // SERVICE WORKER PUSH MESSAGE HANDLER
  // ============================================

  // When a push notification arrives and the app is open,
  // the SW posts a message to the client. This handler
  // auto-fetches the relevant data without user interaction.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (!event.data) return;

      if (event.data.type === 'PUSH_RECEIVED') {
        // Push notification arrived — refetch relevant data based on tag
        var tag = event.data.tag || '';
        if (tag.indexOf('booking') >= 0) {
          refetchBookings();
          refetchNotifications();
        } else if (tag.indexOf('msg') >= 0 || tag.indexOf('message') >= 0) {
          refetchConversations();
          refetchNotifications();
        } else if (tag.indexOf('partner') >= 0) {
          refetchPartners();
          refetchNotifications();
        } else {
          // Unknown tag — refetch everything
          refetchAll();
        }
      }
    });
  }

  // ============================================
  // VISIBILITY + ONLINE/OFFLINE HANDLERS
  // ============================================

  // When app becomes visible after being in background, refetch
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && navigator.onLine && MTC.getToken()) {
      // App came back to foreground — check for stale data
      var now = Date.now();
      var anyStale = Object.keys(_lastSyncTimestamps).some(function(key) {
        return (now - _lastSyncTimestamps[key]) > STALE_THRESHOLD_MS;
      });
      if (anyStale || Object.keys(_lastSyncTimestamps).length === 0) {
        refetchAll();
      }
    }
  });

  // When device comes back online, refetch + flush queue
  window.addEventListener('online', function() {
    if (MTC.getToken()) {
      setTimeout(refetchAll, 2000); // Small delay to let network stabilize
    }
  });

  // ============================================
  // CLEANUP
  // ============================================

  function stopRealtimeSync() {
    _isSubscribed = false;
    MTC.state.realtimeConnected = false;
    if (_channel) {
      try { _channel.unsubscribe(); } catch(e) { /* ignore */ }
      _channel = null;
    }
    stopHeartbeat();
    _lastSyncTimestamps = {};
  }

  // ============================================
  // EXPORTS
  // ============================================
  MTC.fn.startRealtimeSync = startRealtimeSync;
  MTC.fn.stopRealtimeSync = stopRealtimeSync;
  MTC.fn.refetchAll = refetchAll;
  MTC.fn.refetchBookings = refetchBookings;
  MTC.fn.refetchPartners = refetchPartners;
  MTC.fn.refetchConversations = refetchConversations;
  MTC.fn.refetchEvents = refetchEvents;
  MTC.fn.refetchNotifications = refetchNotifications;
  MTC.state.realtimeConnected = false;

})();
