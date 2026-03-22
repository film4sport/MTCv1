/**
 * api-client.js - MTC Court
 * IIFE Module: API client with optimistic rollback for booking and messaging.
 * Provides helpers for mobile PWA to call backend APIs with retry + rollback.
 */
(function() {
  'use strict';

  var API_BASE = '/api';

  /**
   * Make an API request with timeout and error handling.
   * @param {string} endpoint - API path (e.g., '/mobile/bookings')
   * @param {Object} options - fetch options
   * @param {number} [timeoutMs=10000] - timeout in ms
   * @returns {Promise<{ok: boolean, data: Object, status: number}>}
   */
  function apiRequest(endpoint, options, timeoutMs?) {
    timeoutMs = timeoutMs || 10000;

    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, timeoutMs);

    // Auto-include auth token if available
    var headers = { 'Content-Type': 'application/json' };
    var token = MTC.getToken();
    if (endpoint.indexOf('/mobile') === 0 && !token) {
      clearTimeout(timer);
      return Promise.resolve({ ok: false, data: { error: 'Not authenticated' }, status: 401 });
    }
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    return fetch(API_BASE + endpoint, Object.assign({
      signal: controller.signal,
      headers: headers,
      credentials: 'same-origin'
    }, options))
    .then(function(res) {
      clearTimeout(timer);
      return res.json().then(function(data) {
        return { ok: res.ok, data: data, status: res.status };
      });
    })
    .catch(function(err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return { ok: false, data: { error: 'Request timed out' }, status: 0 };
      }
      return { ok: false, data: { error: 'Network error' }, status: 0 };
    });
  }

  /**
   * Optimistic action pattern:
   * 1. Apply the change immediately (optimistic UI)
   * 2. Call the API in the background
   * 3. If API fails, rollback the UI change and show error
   *
   * @param {Object} opts
   * @param {Function} opts.apply - Function to apply optimistic change (returns rollback data)
   * @param {Function} opts.apiCall - Function that returns a Promise<{ok, data}>
   * @param {Function} opts.rollback - Function called with rollback data on failure
   * @param {Function} [opts.onSuccess] - Called on API success with response data
   * @param {Function} [opts.onError] - Called on API failure with error message
   */
  function optimisticAction(opts) {
    // Step 1: Apply optimistic change
    var rollbackData;
    try {
      rollbackData = opts.apply();
    } catch(e) {
      if (opts.onError) opts.onError('Failed to apply change');
      return;
    }

    // Step 2: Call API
    opts.apiCall().then(function(result) {
      if (result.ok) {
        // Step 3a: Success — keep the optimistic change
        if (opts.onSuccess) opts.onSuccess(result.data);
      } else {
        // Step 3b: Failure — rollback
        try {
          opts.rollback(rollbackData);
        } catch(e) {
          console.warn('Rollback failed:', e);
        }
        if (opts.onError) opts.onError(result.data.error || 'Request failed');
      }
    });
  }

  /**
   * Create a booking with optimistic UI.
   * @param {Object} bookingData - { courtId, date, time, matchType, duration, isGuest, guestName }
   * @param {Function} onSuccess - Called on success
   * @param {Function} onError - Called on failure
   */
  function createBooking(bookingData, onSuccess, onError) {
    var userData = MTC.storage.get('mtc-user', null);
    var userId = userData ? userData.id : null;
    if (!userId) {
      if (onError) onError(new Error('Not logged in'));
      if (typeof showToast === 'function') showToast('Please log in to book a court');
      return;
    }
    var clientRequestId = bookingData && bookingData.clientRequestId;
    if (!clientRequestId) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        clientRequestId = 'booking-' + window.crypto.randomUUID();
      } else {
        clientRequestId = 'booking-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      }
    }
    var payload = Object.assign({ userId: userId, clientRequestId: clientRequestId }, bookingData);

    // If offline, queue immediately instead of attempting the request
    if (!navigator.onLine) {
      queueForSync('booking', payload);
      if (typeof showToast === 'function') showToast('You\'re offline — booking queued and will sync when connected');
      if (onSuccess) onSuccess({ queued: true });
      return;
    }

    optimisticAction({
      apply: function() {
        if (typeof showToast === 'function') {
          showToast('Booking court...');
        }
        return { bookingData: bookingData };
      },
      apiCall: function() {
        return apiRequest('/mobile/bookings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      rollback: function() {
        // Network error mid-request — queue for later sync
        if (!navigator.onLine) {
          queueForSync('booking', payload);
          if (typeof showToast === 'function') showToast('Connection lost — booking queued for sync');
        } else {
          if (typeof showToast === 'function') showToast('Booking failed — please try again', 'error');
        }
      },
      onSuccess: function(data) {
        if (onSuccess) onSuccess(data);
      },
      onError: function(err) {
        // If the error is a network error, queue for sync
        if (!navigator.onLine || (err && err.indexOf && err.indexOf('Network') >= 0)) {
          queueForSync('booking', payload);
          if (typeof showToast === 'function') showToast('Connection issue — booking queued for sync');
        } else if (onError) {
          onError(err);
        } else if (typeof showToast === 'function') {
          showToast(err, 'error');
        }
      }
    });
  }

  /**
   * Cancel a booking with optimistic UI.
   * @param {string} bookingId
   * @param {Function} onSuccess
   * @param {Function} onError
   */
  function cancelBooking(bookingId, onSuccess, onError) {
    var userData = MTC.storage.get('mtc-user', null);
    var userId = userData ? userData.id : null;
    if (!userId) {
      if (onError) onError(new Error('Not logged in'));
      if (typeof showToast === 'function') showToast('Please log in to cancel a booking');
      return;
    }
    var payload = { bookingId: bookingId, userId: userId };

    // If offline, queue the cancellation
    if (!navigator.onLine) {
      queueForSync('cancel', payload);
      if (typeof showToast === 'function') showToast('You\'re offline — cancellation queued for sync');
      if (onSuccess) onSuccess({ queued: true });
      return;
    }

    optimisticAction({
      apply: function() {
        if (typeof showToast === 'function') {
          showToast('Cancelling booking...');
        }
        return { bookingId: bookingId };
      },
      apiCall: function() {
        return apiRequest('/mobile/bookings', {
          method: 'DELETE',
          body: JSON.stringify(payload)
        });
      },
      rollback: function() {
        if (!navigator.onLine) {
          queueForSync('cancel', payload);
          if (typeof showToast === 'function') showToast('Connection lost — cancellation queued for sync');
        } else {
          if (typeof showToast === 'function') showToast('Cancel failed — please try again', 'error');
        }
      },
      onSuccess: function(data) {
        if (onSuccess) onSuccess(data);
      },
      onError: function(err) {
        if (!navigator.onLine || (err && err.indexOf && err.indexOf('Network') >= 0)) {
          queueForSync('cancel', payload);
          if (typeof showToast === 'function') showToast('Connection issue — cancellation queued for sync');
        } else if (onError) {
          onError(err);
        } else if (typeof showToast === 'function') {
          showToast(err, 'error');
        }
      }
    });
  }

  /**
   * Sign up via backend API.
   * @param {Object} signupData - { email, password, name, membershipType }
   * @param {Function} onSuccess
   * @param {Function} onError
   */
  function signup(signupData, onSuccess, onError) {
    apiRequest('/mobile-signup', {
      method: 'POST',
      body: JSON.stringify(signupData)
    }).then(function(result) {
      if (result.ok) {
        if (onSuccess) onSuccess(result.data);
      } else {
        if (onError) onError(result.data.error || 'Signup failed');
      }
    });
  }

  // ============================================
  // BACKGROUND SYNC — queue failed requests for retry when online
  // ============================================
  var pendingQueue = MTC.storage.get('mtc-pending-queue', []);
  var MAX_RETRIES = 3;
  var MAX_QUEUE_SIZE = 20;
  var isProcessingQueue = false;

  /**
   * Queue a failed request for background sync retry.
   * @param {string} type - 'booking' or 'cancel'
   * @param {Object} data - Request payload
   * @param {number} [retries] - Current retry count
   */
  function queueForSync(type, data, retries?) {
    // Enforce max queue size to prevent localStorage bloat
    if (pendingQueue.length >= MAX_QUEUE_SIZE) {
      MTC.warn('Sync queue full (' + MAX_QUEUE_SIZE + ') — dropping oldest item');
      pendingQueue.shift();
    }
    pendingQueue.push({ type: type, data: data, timestamp: Date.now(), retries: retries || 0 });
    MTC.storage.set('mtc-pending-queue', pendingQueue);

    // Request background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(function(reg) {
        return reg.sync.register('sync-' + type + 's');
      }).catch(function() {
        // SyncManager not available — will retry on next online event
      });
    }
  }

  /**
   * Process pending sync queue (called when back online or by SW message).
   * Guarded against concurrent execution.
   */
  function processPendingQueue() {
    if (pendingQueue.length === 0 || isProcessingQueue) return;
    isProcessingQueue = true;

    var queue = pendingQueue.slice(); // copy
    pendingQueue = [];
    MTC.storage.set('mtc-pending-queue', []);

    var syncCount = { ok: 0, fail: 0, dropped: 0 };
    var remaining = queue.length;

    function finishItem() {
      remaining--;
      if (remaining === 0) {
        isProcessingQueue = false;
        if (syncCount.ok > 0) {
          if (typeof showToast === 'function') showToast(syncCount.ok + ' queued action(s) synced!');
        }
        if (syncCount.dropped > 0) {
          if (typeof showToast === 'function') showToast(syncCount.dropped + ' stale action(s) expired', 'warning');
        }
      }
    }

    queue.forEach(function(item) {
      // Skip items older than 24 hours (stale bookings are unlikely valid)
      if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
        syncCount.dropped++;
        finishItem();
        return;
      }

      var endpoint = '/mobile/bookings';
      var method = item.type === 'cancel' ? 'DELETE' : 'POST';

      apiRequest(endpoint, {
        method: method,
        body: JSON.stringify(item.data)
      }).then(function(result) {
        if (result.ok) {
          syncCount.ok++;
        } else {
          syncCount.fail++;
          var retryCount = (item.retries || 0) + 1;
          // Re-queue only for server errors (5xx/network), not client errors (4xx)
          if (result.status >= 500 || result.status === 0) {
            if (retryCount < MAX_RETRIES) {
              queueForSync(item.type, item.data, retryCount);
            } else {
              if (typeof showToast === 'function') showToast('A queued ' + item.type + ' failed after ' + MAX_RETRIES + ' retries', 'error');
            }
          }
          // 4xx errors (including 409 conflict) are not retried — they won't succeed
        }
        finishItem();
      });
    });
  }

  // Listen for online event to flush queue
  window.addEventListener('online', function() {
    setTimeout(processPendingQueue, 1000);
  });

  // Listen for SW sync messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'SYNC_BOOKINGS') {
        processPendingQueue();
      }
      if (event.data && event.data.type === 'NAVIGATE') {
        // SW requested navigation (from push notification click)
        if (typeof navigateTo === 'function' && event.data.url) {
          var screen = event.data.url.replace('/mobile-app/', '').replace('#', '') || 'home';
          navigateTo(screen);
        }
      }
    });
  }

  // ============================================
  // PENDING QUEUE STATUS — expose for UI indicators
  // ============================================

  /** Get count of pending items in the offline queue */
  function getPendingQueueCount() {
    return pendingQueue.length;
  }

  /** Retry all pending items manually (triggered by user tap) */
  function retryPendingQueue() {
    if (!navigator.onLine) {
      if (typeof showToast === 'function') showToast('Still offline — will sync when connected');
      return;
    }
    processPendingQueue();
  }

  /** Show/hide the pending queue badge in the UI */
  function updateQueueBadge() {
    var badge = document.getElementById('syncQueueBadge');
    if (!badge) return;
    var count = pendingQueue.length;
    if (count > 0) {
      badge.textContent = count + ' pending';
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Update badge whenever queue changes
  var _origQueueForSync = queueForSync;
  // @ts-ignore
  queueForSync = function(type, data, retries) {
    _origQueueForSync(type, data, retries);
    updateQueueBadge();
  };

  // Also update badge after processing
  var _origProcessQueue = processPendingQueue;
  // @ts-ignore
  processPendingQueue = function() {
    _origProcessQueue();
    setTimeout(updateQueueBadge, 2000); // Delay to let processing finish
  };

  // ============================================
  // API RESPONSE VALIDATION — guards against schema drift
  // ============================================
  /**
   * Validate that API response data matches expected shape.
   * Returns the data if valid, null if invalid (logs warning in debug mode).
   * @param {*} data - Response data to validate
   * @param {string} type - Expected type: 'array' or 'object'
   * @param {string} label - Endpoint label for debug logging
   * @returns {*} The data if valid, null if invalid
   */
  function validateResponse(data, type, label) {
    if (type === 'array' && !Array.isArray(data)) {
      MTC.warn(label + ': expected array, got ' + typeof data);
      return null;
    }
    if (type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
      MTC.warn(label + ': expected object, got ' + typeof data);
      return null;
    }
    return data;
  }

  // ============================================
  // LOAD FROM API — generic data loader with localStorage cache + fallback
  // ============================================
  /**
   * Load data from a mobile API endpoint with localStorage caching.
   * Falls back to cached data if the API call fails (offline support).
   * @param {string} endpoint - API path (e.g., '/mobile/events')
   * @param {string} storageKey - localStorage key to cache under
   * @param {*} fallback - Default value if no cache and API fails
   * @returns {Promise<*>} The loaded data
   */
  function loadFromAPI(endpoint, storageKey, fallback) {
    var token = MTC.getToken();
    if (!token) {
      return Promise.resolve(MTC.storage.get(storageKey, fallback));
    }

    // When fallback is null, we don't know the expected shape — skip validation
    var expectedType = fallback === null ? null : (Array.isArray(fallback) ? 'array' : 'object');

    return apiRequest(endpoint, { method: 'GET' })
      .then(function(result) {
        if (result.ok && result.data) {
          var validated = expectedType === null ? result.data : validateResponse(result.data, expectedType, endpoint);
          if (validated !== null) {
            MTC.storage.set(storageKey, validated);
            return validated;
          }
        }
        // API failed or invalid shape — try cached data
        return MTC.storage.get(storageKey, fallback);
      })
      .catch(function() {
        return MTC.storage.get(storageKey, fallback);
      });
  }

  // ============================================
  // EXPORTS
  // ============================================
  MTC.fn.apiRequest = apiRequest;
  MTC.fn.optimisticAction = optimisticAction;
  MTC.fn.createBooking = createBooking;
  MTC.fn.cancelBooking = cancelBooking;
  MTC.fn.queueForSync = queueForSync;
  MTC.fn.signup = signup;
  MTC.fn.loadFromAPI = loadFromAPI;
  MTC.fn.validateResponse = validateResponse;
  MTC.fn.getPendingQueueCount = getPendingQueueCount;
  MTC.fn.retryPendingQueue = retryPendingQueue;

  window.apiRequest = apiRequest;
  window.optimisticAction = optimisticAction;

})();
