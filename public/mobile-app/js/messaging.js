/* messaging.js - MTC Court */
// ============================================
// MESSAGING SYSTEM
// ============================================
(function() {
  'use strict';

  // Shared state (read by events-registration.js)
  // Populated from API via updateMembersFromAPI() after login
  MTC.state.clubMembers = [
    { id: 'club', name: 'MTC Club', skill: 'Club Announcements', avatar: 'tennis-1' }
  ];
  // Backward-compat alias
  window.clubMembers = MTC.state.clubMembers;

  // Conversation history (populated from API via updateConversationsFromAPI() after login)
  const defaultConversations = {};

  // Private state
  let conversations = JSON.parse(JSON.stringify(defaultConversations));
  let conversationIdMap = {}; // memberId → server conversationId
  let conversationMetaMap = {}; // memberId → { name, avatar } from API (fallback for clubMembers timing)
  let currentConversation = null;

  // Cross-file function (called from enhancements.js)
  /** Persists all conversations to localStorage */
  MTC.fn.saveConversations = function() {
    MTC.storage.set('mtc-conversations', conversations);
  };
  // Backward-compat alias
  window.saveConversations = MTC.fn.saveConversations;

  // Cross-file function (called from interactive.js)
  /** Restores conversations from localStorage */
  MTC.fn.loadSavedConversations = function() {
    const parsed = MTC.storage.get('mtc-conversations', {});
    let hadCorrupted = false;
    for (const key in parsed) {
      // Skip corrupted entries with numeric keys (array index artifacts)
      if (/^\d+$/.test(key)) { hadCorrupted = true; continue; }
      conversations[key] = parsed[key];
    }
    // Clean up corrupted localStorage
    if (hadCorrupted) MTC.fn.saveConversations();
  };
  // Backward-compat alias
  window.loadSavedConversations = MTC.fn.loadSavedConversations;

  // Debounced search wrappers (used by index.html oninput)
  window.debouncedFilterConversations = MTC.debounce(filterConversations, 250);
  window.debouncedSearchMembers = MTC.debounce(searchMembers, 250);

  // ============================================
  // DYNAMIC CONVERSATION LIST RENDERER
  // ============================================
  /** Renders the conversation list from actual data (no hardcoded items) */
  window.renderConversationsList = function() {
    var container = document.getElementById('conversationsList');
    var emptyState = document.getElementById('noConversations');
    if (!container) return;

    var keys = Object.keys(conversations);

    if (keys.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
        var titleEl = emptyState.querySelector('.empty-state-title');
        var textEl = emptyState.querySelector('.empty-state-text');
        if (titleEl && textEl) {
          titleEl.textContent = 'NO CONVERSATIONS FOUND';
          textEl.textContent = 'Try a different search term or start a new conversation with a club member.';
        }
      }
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // Sort: most recent message first (by last message timestamp)
    keys.sort(function(a, b) {
      var msgsA = conversations[a] || [];
      var msgsB = conversations[b] || [];
      // Empty conversations go last
      if (msgsA.length === 0 && msgsB.length > 0) return 1;
      if (msgsB.length === 0 && msgsA.length > 0) return -1;
      if (msgsA.length === 0 && msgsB.length === 0) return 0;
      // Compare by last message timestamp (most recent first)
      var lastA = msgsA[msgsA.length - 1];
      var lastB = msgsB[msgsB.length - 1];
      var timeA = lastA.timestamp ? new Date(lastA.timestamp).getTime() : 0;
      var timeB = lastB.timestamp ? new Date(lastB.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    var avatars = MTC.state.avatarSVGs || {};
    var clubIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"></circle><path d="M12 13v8"></path><path d="M9 18h6"></path></svg>';

    var html = '';
    var userId = MTC.state.currentUser ? MTC.state.currentUser.id : null;
    keys.forEach(function(memberId) {
      var msgs = conversations[memberId] || [];
      var member = MTC.state.clubMembers.find(function(m) { return m.id === memberId; });
      // Fallback: use API-provided name/avatar from conversationMetaMap if clubMembers lookup fails
      var meta = conversationMetaMap[memberId];
      // Admins always display as "Mono Tennis Club"
      var name = (member && member.role === 'admin') ? 'Mono Tennis Club' : (member ? member.name : (meta ? meta.name : memberId));
      var lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      var preview = lastMsg ? lastMsg.text : 'No messages yet';
      var time = lastMsg ? (lastMsg.time || '') : '';
      var isClub = (memberId === 'club');
      var avatarHtml;

      // Check for unread messages (received messages where read is false)
      var hasUnread = msgs.some(function(m) { return !m.sent && m.read === false; });

      if (isClub) {
        avatarHtml = '<div class="message-avatar-wrap club-avatar">' + clubIcon + '</div>';
      } else {
        var avatarKey = member ? member.avatar : (meta ? meta.avatar : 'default');
        var svg = avatars[avatarKey] || avatars['default'] || '';
        avatarHtml = '<div class="message-avatar-wrap">' + svg + '</div>';
      }

      // Truncate preview
      if (preview.length > 60) preview = preview.substring(0, 57) + '...';

      var unreadDot = hasUnread ? '<span class="message-unread"></span>' : '';

      html += '<div class="swipe-container" data-member-id="' + sanitizeHTML(memberId) + '">' +
        '<div class="swipe-delete-bg"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete</div>' +
        '<div class="message-item swipe-content stagger-item' + (hasUnread ? ' has-unread' : '') + '" onclick="openConversation(\'' + sanitizeHTML(memberId) + '\')">' +
          avatarHtml +
          '<div class="message-content">' +
            '<div class="message-header">' +
              '<div class="message-name">' + sanitizeHTML(name) + '</div>' +
              '<div class="message-time">' + sanitizeHTML(time) + '</div>' +
            '</div>' +
            '<div class="message-preview">' + sanitizeHTML(preview) + '</div>' +
          '</div>' +
          unreadDot +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;
    initSwipeToDelete(container);
  };

  // ============================================
  // SWIPE TO DELETE — conversation list
  // ============================================
  function initSwipeToDelete(container) {
    var swipeThreshold = 80; // px to trigger delete action
    var deleteThreshold = 140; // px to auto-delete
    container.querySelectorAll('.swipe-container').forEach(function(el) {
      var content = el.querySelector('.swipe-content');
      if (!content) return;
      var startX = 0, currentX = 0, isDragging = false;

      content.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        currentX = 0;
        isDragging = false;
        content.style.transition = 'none';
      }, { passive: true });

      content.addEventListener('touchmove', function(e) {
        var dx = e.touches[0].clientX - startX;
        if (dx > 0) dx = 0; // only swipe left
        currentX = dx;
        if (Math.abs(dx) > 10) isDragging = true;
        content.style.transform = 'translateX(' + dx + 'px)';
        // Show red bg intensity
        var bg = el.querySelector('.swipe-delete-bg');
        if (bg) bg.style.opacity = Math.min(1, Math.abs(dx) / swipeThreshold);
      }, { passive: true });

      content.addEventListener('touchend', function() {
        content.style.transition = 'transform 0.25s ease';
        if (isDragging) {
          // Prevent the onclick from firing
          content.style.pointerEvents = 'none';
          setTimeout(function() { content.style.pointerEvents = ''; }, 300);
        }
        if (Math.abs(currentX) >= deleteThreshold) {
          // Auto-delete: slide off screen
          content.style.transform = 'translateX(-100%)';
          setTimeout(function() {
            var memberId = el.getAttribute('data-member-id');
            deleteConversation(memberId, el);
          }, 250);
        } else if (Math.abs(currentX) >= swipeThreshold) {
          // Show delete button — stay swiped
          content.style.transform = 'translateX(-' + swipeThreshold + 'px)';
          // Tap the red area to delete
          var bg = el.querySelector('.swipe-delete-bg');
          if (bg) {
            bg.onclick = function() {
              content.style.transform = 'translateX(-100%)';
              content.style.transition = 'transform 0.2s ease';
              setTimeout(function() {
                var memberId = el.getAttribute('data-member-id');
                deleteConversation(memberId, el);
              }, 200);
            };
          }
        } else {
          // Snap back
          content.style.transform = 'translateX(0)';
        }
      });
    });
  }

  function deleteConversation(memberId, el) {
    var convId = conversationIdMap[memberId];

    // Save state for rollback
    var prevConv = conversations[memberId] ? conversations[memberId].slice() : null;
    var prevConvId = convId;
    var prevMeta = conversationMetaMap[memberId] || null;
    var elParent = el ? el.parentNode : null;
    var elNextSibling = el ? el.nextSibling : null;

    // Optimistic removal from local state
    delete conversations[memberId];
    delete conversationIdMap[memberId];
    delete conversationMetaMap[memberId];
    MTC.storage.set('mtc-conversations', conversations);

    // Animate out
    if (el) {
      el.style.height = el.offsetHeight + 'px';
      el.style.overflow = 'hidden';
      el.style.transition = 'height 0.2s ease, opacity 0.2s ease';
      setTimeout(function() {
        el.style.height = '0';
        el.style.opacity = '0';
        setTimeout(function() { el.remove(); }, 200);
      }, 10);
    }
    showToast('Deleting conversation...');
    updateMessageBadge();

    // Check if list is now empty
    setTimeout(function() {
      var remaining = document.querySelectorAll('#conversationsList .swipe-container');
      if (remaining.length === 0) {
        var emptyState = document.getElementById('noConversations');
        if (emptyState) emptyState.style.display = 'block';
      }
    }, 250);

    // Server-side delete with rollback
    if (convId && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/conversations', {
        method: 'DELETE',
        body: JSON.stringify({ conversationId: convId })
      }).then(function(res) {
        if (!res.ok) throw new Error((res.data && res.data.error) || 'Delete failed');
        showToast('Conversation deleted');
      }).catch(function(err) {
        // Rollback local state
        if (prevConv) conversations[memberId] = prevConv;
        if (prevConvId) conversationIdMap[memberId] = prevConvId;
        if (prevMeta) conversationMetaMap[memberId] = prevMeta;
        MTC.storage.set('mtc-conversations', conversations);
        // Restore DOM element
        if (el && elParent) {
          el.style.height = '';
          el.style.opacity = '';
          el.style.overflow = '';
          el.style.transition = '';
          if (elNextSibling) elParent.insertBefore(el, elNextSibling);
          else elParent.appendChild(el);
        }
        updateMessageBadge();
        showToast('Failed to delete conversation. Please try again.', 'error');
        MTC.warn('[MTC] deleteConversation failed:', err);
      });
    } else {
      showToast('Conversation deleted');
    }
  }

  function filterConversations(query) {
    const items = document.querySelectorAll('#conversationsList .message-item');
    const noResults = document.getElementById('noConversations');
    let found = 0;

    query = query.toLowerCase();

    items.forEach(function(item) {
      const name = item.querySelector('.message-name').textContent.toLowerCase();
      const preview = item.querySelector('.message-preview').textContent.toLowerCase();

      if (name.includes(query) || preview.includes(query)) {
        item.style.display = 'flex';
        found++;
      } else {
        item.style.display = 'none';
      }
    });

    noResults.style.display = found === 0 ? 'block' : 'none';
  }

  // ── In-conversation message search ──
  window.toggleConvoSearch = function() {
    var bar = document.getElementById('convoSearchBar');
    var input = document.getElementById('convoSearchInput');
    if (!bar) return;
    var isOpen = bar.style.display !== 'none';
    bar.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen && input) { input.value = ''; input.focus(); }
    if (isOpen) filterChatMessages(''); // clear filter
  };

  window.filterChatMessages = function(query) {
    var bubbles = document.querySelectorAll('#chatMessages .chat-bubble');
    var count = 0;
    query = (query || '').toLowerCase();
    bubbles.forEach(function(b) {
      var text = b.textContent.toLowerCase();
      if (!query) {
        b.style.opacity = '1';
      } else if (text.includes(query)) {
        b.style.opacity = '1';
        count++;
      } else {
        b.style.opacity = '0.2';
      }
    });
    var countEl = document.getElementById('convoSearchCount');
    if (countEl) countEl.textContent = query ? count + ' found' : '';
  };

  // onclick handler (index.html)
  window.openConversation = function(memberId) {
    try {
    currentConversation = memberId;
    const member = MTC.state.clubMembers.find(function(m) { return m.id === memberId; });
    // Fallback: use API-provided name/avatar from conversationMetaMap
    var meta = conversationMetaMap[memberId];
    // Admins always display as "Mono Tennis Club"
    var displayName = (member && member.role === 'admin') ? 'Mono Tennis Club' : (member ? member.name : (meta ? meta.name : 'Member'));
    var displayAvatar = member ? member.avatar : (meta ? meta.avatar : 'default');

    // Update header
    document.getElementById('conversationName').textContent = displayName;
    const avatarEl = document.getElementById('conversationAvatar');
    var avatars = (typeof MTC !== 'undefined' && MTC.state && MTC.state.avatarSVGs) || (typeof avatarSVGs !== 'undefined' ? avatarSVGs : {});
    if (avatarEl && (avatars[displayAvatar] || avatars['default'])) {
      avatarEl.innerHTML = avatars[displayAvatar] || avatars['default'];
    }

    // Load messages
    renderMessages(memberId);

    // Navigate to conversation
    navigateTo('conversation');

    // Mark messages as read locally
    var msgs = conversations[memberId] || [];
    var unreadIds = [];
    msgs.forEach(function(m) {
      if (!m.sent && m.read === false) {
        m.read = true;
        if (m.id) unreadIds.push(m.id);
      }
    });
    MTC.fn.saveConversations();

    // Remove unread dot from DOM
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(function(item) {
      const onclickAttr = item.getAttribute('onclick') || '';
      if (onclickAttr.includes(memberId)) {
        const unread = item.querySelector('.message-unread');
        if (unread) unread.remove();
        item.classList.remove('has-unread');
      }
    });

    // Update message badge count
    updateMessageBadge();

    // Tell server to mark messages read (best-effort)
    var convId = conversationIdMap[memberId];
    if (unreadIds.length > 0 && convId && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/conversations', {
        method: 'PATCH',
        body: JSON.stringify({ conversationId: convId })
      }).catch(function() { /* best-effort */ });
    }
    } catch(e) { MTC.warn('openConversation error:', e); }
  };

  // Private helper
  function updateMessageBadge() {
    // Count from data (works even when messages screen isn't rendered)
    var unreadCount = 0;
    Object.keys(conversations).forEach(function(key) {
      var msgs = conversations[key];
      if (Array.isArray(msgs) && msgs.some(function(m) { return !m.sent && m.read === false; })) {
        unreadCount++;
      }
    });
    var badge = document.getElementById('navMessageBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function renderMessages(memberId) {
    try {
    const container = document.getElementById('chatMessages');
    const msgs = conversations[memberId] || [];

    if (msgs.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:40px 20px;"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><div class="empty-state-title">START THE CONVERSATION</div><div class="empty-state-text">Type a message below to get things going</div></div>';
      return;
    }

    let html = '';
    let lastTime = '';

    msgs.forEach(function(msg, index) {
      if (msg.time && msg.time !== lastTime) {
        html += '<div class="chat-time-divider">' + sanitizeHTML(msg.time) + '</div>';
        lastTime = msg.time;
      }

      var readReceipt = '';
      if (msg.sent) {
        var checkOpacity = msg.read ? '0.8' : '0.4';
        var doubleCheck = msg.read ? '<polyline points="15 6 4 17" style="opacity:0.6"/>' : '';
        readReceipt = '<span class="chat-read-receipt" style="opacity:' + checkOpacity + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="20 6 9 17 4 12"/>' + doubleCheck + '</svg></span>';
      }

      // Parse reply-to quote: [reply:Name:quoted text]\nactual message
      var displayText = msg.text;
      var quotedHtml = '';
      var replyMatch = msg.text.match(/^\[reply:([^:]+):([^\]]*)\]\n?([\s\S]*)$/);
      if (replyMatch) {
        quotedHtml = '<div class="chat-quote"><span class="chat-quote-name">' + sanitizeHTML(replyMatch[1]) + '</span><span class="chat-quote-text">' + sanitizeHTML(replyMatch[2]) + '</span></div>';
        displayText = replyMatch[3].trim();
      }

      // Timestamp for tap-to-reveal (ISO string if available)
      var fullTimestamp = '';
      if (msg.timestamp) {
        var d = new Date(msg.timestamp);
        fullTimestamp = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      var timestampAttr = fullTimestamp ? ' data-full-time="' + sanitizeHTML(fullTimestamp) + '"' : '';

      var msgIdAttr = msg.id ? ' data-msg-id="' + sanitizeHTML(msg.id) + '"' : '';
      // Reply action data for received messages
      var replyData = '';
      if (!msg.sent && msg.id) {
        var member = MTC.state.clubMembers.find(function(m) { return m.id === memberId; });
        var meta = conversationMetaMap[memberId];
        // Admins always display as "Mono Tennis Club"
        var senderName = (member && member.role === 'admin') ? 'Mono Tennis Club' : (member ? member.name : (meta ? meta.name : 'Member'));
        replyData = ' data-reply-name="' + sanitizeHTML(senderName) + '" data-reply-text="' + sanitizeHTML(msg.text.slice(0, 80)) + '"';
      }

      var bubbleContent = quotedHtml + sanitizeHTML(displayText) + readReceipt;

      if (msg.sent && msg.id) {
        // Sent messages get swipe-to-delete wrapper
        html += '<div class="msg-swipe-container" data-msg-id="' + sanitizeHTML(msg.id) + '">' +
          '<div class="msg-swipe-delete-bg"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>' +
          '<div class="chat-bubble sent msg-swipe-content"' + timestampAttr + '>' + bubbleContent + '</div>' +
          '</div>';
      } else {
        html += '<div class="chat-bubble ' + (msg.sent ? 'sent' : 'received') + '"' + msgIdAttr + timestampAttr + replyData + '>' + bubbleContent + '</div>';
      }
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;

    // Swipe-to-delete on sent messages
    initSwipeToDeleteMessages(container, memberId);

    // Tap to show full timestamp
    container.querySelectorAll('.chat-bubble[data-full-time]').forEach(function(bubble) {
      bubble.addEventListener('click', function(e) {
        // Toggle timestamp tooltip
        var existing = bubble.querySelector('.chat-timestamp-tooltip');
        if (existing) { existing.remove(); return; }
        // Remove all other tooltips first
        container.querySelectorAll('.chat-timestamp-tooltip').forEach(function(t) { t.remove(); });
        var tip = document.createElement('div');
        tip.className = 'chat-timestamp-tooltip';
        tip.textContent = bubble.getAttribute('data-full-time');
        bubble.appendChild(tip);
        setTimeout(function() { tip.remove(); }, 3000);
      });
    });

    // Long-press on received messages to reply
    container.querySelectorAll('.chat-bubble.received[data-reply-name]').forEach(function(bubble) {
      var timer = null;
      bubble.addEventListener('touchstart', function() {
        timer = setTimeout(function() {
          var name = bubble.getAttribute('data-reply-name');
          var text = bubble.getAttribute('data-reply-text');
          var msgId = bubble.getAttribute('data-msg-id');
          if (name && text) setMessageReply(msgId || '', text, name);
        }, 500);
      }, { passive: true });
      bubble.addEventListener('touchend', function() { clearTimeout(timer); });
      bubble.addEventListener('touchmove', function() { clearTimeout(timer); });
    });

    // Show swipe hint once (first time user sees sent messages)
    var sentCount = container.querySelectorAll('.msg-swipe-container').length;
    if (sentCount > 0 && !MTC.storage.get('mtc-swipe-msg-hint')) {
      MTC.storage.set('mtc-swipe-msg-hint', true);
      var hint = document.createElement('div');
      hint.className = 'swipe-hint';
      hint.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> Swipe left on your messages to delete';
      container.appendChild(hint);
      setTimeout(function() { hint.style.opacity = '0'; setTimeout(function() { hint.remove(); }, 500); }, 4000);
    }
    } catch(e) { MTC.warn('renderMessages error:', e); }
  }

  // ============================================
  // SWIPE TO DELETE — individual messages
  // ============================================
  function initSwipeToDeleteMessages(container, memberId) {
    var swipeThreshold = 60; // px to show delete action
    var deleteThreshold = 120; // px to auto-delete
    container.querySelectorAll('.msg-swipe-container').forEach(function(el) {
      var content = el.querySelector('.msg-swipe-content');
      if (!content) return;
      var startX = 0, currentX = 0, isDragging = false;

      content.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        currentX = 0;
        isDragging = false;
        content.style.transition = 'none';
      }, { passive: true });

      content.addEventListener('touchmove', function(e) {
        var dx = e.touches[0].clientX - startX;
        if (dx > 0) dx = 0; // only swipe left
        currentX = dx;
        if (Math.abs(dx) > 10) isDragging = true;
        content.style.transform = 'translateX(' + dx + 'px)';
        var bg = el.querySelector('.msg-swipe-delete-bg');
        if (bg) bg.style.opacity = Math.min(1, Math.abs(dx) / swipeThreshold);
      }, { passive: true });

      content.addEventListener('touchend', function() {
        content.style.transition = 'transform 0.25s ease';
        if (Math.abs(currentX) >= deleteThreshold) {
          // Auto-delete: slide off
          content.style.transform = 'translateX(-100%)';
          if (navigator.vibrate) navigator.vibrate(20);
          setTimeout(function() {
            var msgId = el.getAttribute('data-msg-id');
            deleteMessage(memberId, msgId, el);
          }, 200);
        } else if (Math.abs(currentX) >= swipeThreshold) {
          // Show delete area — stay swiped
          content.style.transform = 'translateX(-' + swipeThreshold + 'px)';
          var bg = el.querySelector('.msg-swipe-delete-bg');
          if (bg) {
            bg.onclick = function() {
              content.style.transform = 'translateX(-100%)';
              content.style.transition = 'transform 0.2s ease';
              if (navigator.vibrate) navigator.vibrate(20);
              setTimeout(function() {
                var msgId = el.getAttribute('data-msg-id');
                deleteMessage(memberId, msgId, el);
              }, 200);
            };
          }
        } else {
          // Snap back
          content.style.transform = 'translateX(0)';
        }
      });
    });
  }

  function showDeleteMessageConfirm(memberId, msgId, bubble) {
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(30);

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 300px; text-align: center;">' +
        '<div class="modal-title">DELETE MESSAGE</div>' +
        '<p style="color: var(--text-secondary); font-size: 13px; margin: 12px 0 20px;">This will delete the message for everyone.</p>' +
        '<div style="display: flex; gap: 10px;">' +
          '<button id="cancelDeleteMsg" style="flex: 1; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 14px; cursor: pointer;">Cancel</button>' +
          '<button id="confirmDeleteMsg" style="flex: 1; padding: 12px; border-radius: 10px; border: none; background: var(--coral, #e74c3c); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;">Delete</button>' +
        '</div>' +
      '</div>';
    document.getElementById('app').appendChild(overlay);

    overlay.querySelector('#cancelDeleteMsg').onclick = function() { overlay.remove(); };
    overlay.querySelector('#confirmDeleteMsg').onclick = function() {
      overlay.remove();
      deleteMessage(memberId, msgId, bubble);
    };
  }

  function deleteMessage(memberId, msgId, el) {
    // Animate out — el can be .msg-swipe-container or .chat-bubble
    el.style.transition = 'opacity 0.2s ease, max-height 0.2s ease';
    el.style.opacity = '0';
    el.style.maxHeight = el.offsetHeight + 'px';
    el.style.overflow = 'hidden';
    setTimeout(function() {
      el.style.maxHeight = '0';
      setTimeout(function() { el.remove(); }, 200);
    }, 50);

    // Remove from local state
    var msgs = conversations[memberId] || [];
    conversations[memberId] = msgs.filter(function(m) { return m.id !== msgId; });
    MTC.fn.saveConversations();

    // Server-side delete
    if (typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/conversations', {
        method: 'DELETE',
        body: JSON.stringify({ messageId: msgId })
      }).then(function(res) {
        if (!res.ok) showToast('Failed to delete on server', 'warning');
      }).catch(function() {
        showToast('Failed to delete on server', 'warning');
      });
    }

    showToast('Message deleted');
    // Update conversation list preview
    renderConversationsList();
  }

  // onclick handler (index.html)
  window.sendMessage = function() {
    try {
    const input = document.getElementById('chatInput');
    var rawText = input.value.trim();

    if (!rawText || !currentConversation) return;

    // Prevent double-tap: disable send while in flight
    if (sendMessage._sending) return;
    sendMessage._sending = true;

    // Prepend reply-to quote if replying
    var text = rawText;
    var savedReplyTo = _replyTo; // Save reply context in case send fails
    if (_replyTo) {
      text = '[reply:' + _replyTo.fromName + ':' + _replyTo.text.slice(0, 80) + ']\n' + rawText;
    }

    if (!conversations[currentConversation]) {
      conversations[currentConversation] = [];
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic: add to local state immediately (with temp ID)
    var tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    var localMsg = {
      id: tempId,
      text: text,
      sent: true,
      read: true,
      time: time,
      timestamp: now.toISOString()
    };
    conversations[currentConversation].push(localMsg);

    MTC.fn.saveConversations();
    input.value = '';
    clearMessageReply();
    renderMessages(currentConversation);

    // Persist to Supabase via API
    var token = MTC.getToken();
    if (token && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/conversations', {
        method: 'POST',
        body: JSON.stringify({ toId: currentConversation, text: text })
      }).then(function(res) {
        sendMessage._sending = false;
        if (!res.ok) {
          MTC.warn('[MTC] Message send failed:', res.data);
          if (typeof showToast === 'function') showToast('Message may not have been saved');
        } else if (res.data && res.data.messageId) {
          // Update local message with server ID so delete works
          localMsg.id = res.data.messageId;
          MTC.fn.saveConversations();
        }
      }).catch(function() {
        sendMessage._sending = false;
        // Restore reply context so user can retry
        if (savedReplyTo) _replyTo = savedReplyTo;
        if (typeof showToast === 'function') showToast('Message may not have been saved');
      });
    } else {
      sendMessage._sending = false;
    }

    } catch(e) { sendMessage._sending = false; MTC.warn('sendMessage error:', e); }
  };

  // simulateReply removed — real messages come via Supabase API

  // onclick handler (index.html)
  window.showNewMessageModal = function() {
    document.getElementById('newMessageModal').classList.add('active');
    document.getElementById('memberSearchInput').value = '';
    showAllMembers();
  };

  // Local click delegation for member search results.
  // The newMessageModal's .modal has onclick="event.stopPropagation()" which blocks
  // document-level event delegation, so we need a handler directly on the container.
  var memberResults = document.getElementById('memberSearchResults');
  if (memberResults) {
    memberResults.addEventListener('click', function(e) {
      var item = e.target.closest('[data-action="startConversation"]');
      if (item && item.dataset.id) {
        e.preventDefault();
        e.stopPropagation();
        window.startConversation(item.dataset.id);
      }
    });
  }

  // onclick handler (index.html)
  window.closeNewMessageModal = function() {
    document.getElementById('newMessageModal').classList.remove('active');
  };

  // Render a member item for the search results — admins show as "Mono Tennis Club"
  function renderMemberItem(member) {
    var displayName = member.role === 'admin' ? 'Mono Tennis Club' : member.name;
    var displaySkill = member.role === 'admin' ? 'Club Admin' : (member.skill || '');
    var badge = member.role === 'admin'
      ? ' <svg style="display:inline;vertical-align:middle;opacity:0.5;margin-left:4px" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>'
      : '';
    return '<div class="member-result-item" data-action="startConversation" data-id="' + sanitizeHTML(member.id) + '">' +
      '<div class="member-result-avatar">' +
        (avatarSVGs[member.avatar] || avatarSVGs['default']) +
      '</div>' +
      '<div class="member-result-info">' +
        '<div class="member-result-name">' + sanitizeHTML(displayName) + badge + '</div>' +
        '<div class="member-result-skill">' + sanitizeHTML(displaySkill) + '</div>' +
      '</div>' +
    '</div>';
  }

  // Sort members: admins first, then alphabetical
  function sortMembersAdminFirst(list) {
    return list.slice().sort(function(a, b) {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  function showAllMembers() {
    const container = document.getElementById('memberSearchResults');
    var sorted = sortMembersAdminFirst(MTC.state.clubMembers.filter(function(m) { return m.id !== 'club'; }));
    container.innerHTML = sorted.map(renderMemberItem).join('');
  }

  function searchMembers(query) {
    const container = document.getElementById('memberSearchResults');
    query = query.toLowerCase();

    if (!query) {
      showAllMembers();
      return;
    }

    var results = MTC.state.clubMembers.filter(function(m) {
      if (m.id === 'club') return false;
      // Match admin by "mono tennis club" too
      if (m.role === 'admin' && 'mono tennis club'.includes(query)) return true;
      return (m.name || '').toLowerCase().includes(query) || (m.skill || '').toLowerCase().includes(query);
    });

    if (results.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">No members found</div>';
      return;
    }

    container.innerHTML = sortMembersAdminFirst(results).map(renderMemberItem).join('');
  }

  // onclick handler (generated HTML)
  window.startConversation = function(memberId) {
    closeNewMessageModal();
    if (!conversations[memberId]) {
      conversations[memberId] = [];
      MTC.fn.saveConversations();
    }
    openConversation(memberId);
  };

  // Cross-file function (called from notifications.js)
  /** @param {string} memberId - Club member ID @param {string} text - Message text @param {boolean} isSent - true if sent by current user */
  MTC.fn.addMessageToConversation = function(memberId, text, isSent) {
    if (!conversations[memberId]) conversations[memberId] = [];
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    conversations[memberId].push({ text: text, sent: isSent || false, time: time });
    MTC.fn.saveConversations();
  };
  // Backward-compat alias
  window.addMessageToConversation = MTC.fn.addMessageToConversation;

  /**
   * Update club members list from Supabase API.
   * Called by auth.js after login when API data is available.
   */
  window.updateMembersFromAPI = function(apiMembers) {
    if (!Array.isArray(apiMembers)) return;
    var newMembers = apiMembers.map(function(m) {
      var skillLabel = (m.skillLevel || 'intermediate');
      skillLabel = skillLabel.charAt(0).toUpperCase() + skillLabel.slice(1);
      return {
        id: m.id,
        name: m.name,
        role: m.role || 'member',
        skill: skillLabel,
        avatar: m.avatar || 'man-1'
      };
    });
    // Replace the clubMembers array in-place (other modules hold references)
    MTC.state.clubMembers.length = 0;
    newMembers.forEach(function(m) { MTC.state.clubMembers.push(m); });
    window.clubMembers = MTC.state.clubMembers;
  };

  // ============================================
  // TYPING INDICATOR — Supabase Realtime broadcast
  // ============================================
  var _typingChannel = null;
  var _typingTimeout = null;
  var _lastTypingSent = 0;

  /** Start typing indicator subscription (called after login) */
  MTC.fn.startTypingIndicator = function() {
    var sb = MTC.state._supabaseClient;
    if (!sb || _typingChannel) return;
    try {
      _typingChannel = sb.channel('typing-indicators', { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'typing' }, function(msg) {
          var payload = msg.payload;
          var userId = MTC.state.currentUser ? MTC.state.currentUser.id : null;
          if (!payload || payload.toId !== userId) return;
          // Show typing indicator if in conversation with this person
          if (currentConversation === payload.fromId) {
            showTypingIndicator();
          }
        })
        .subscribe();
    } catch (e) { MTC.warn('Typing indicator subscribe failed:', e); }
  };

  function showTypingIndicator() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    var existing = container.querySelector('.typing-indicator');
    if (!existing) {
      existing = document.createElement('div');
      existing.className = 'typing-indicator';
      existing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      container.appendChild(existing);
      container.scrollTop = container.scrollHeight;
    }
    // Clear previous timeout and set new one
    if (_typingTimeout) clearTimeout(_typingTimeout);
    _typingTimeout = setTimeout(function() {
      var el = container.querySelector('.typing-indicator');
      if (el) el.remove();
    }, 3000);
  }

  function broadcastTyping() {
    var sb = MTC.state._supabaseClient;
    var userId = MTC.state.currentUser ? MTC.state.currentUser.id : null;
    if (!sb || !_typingChannel || !currentConversation || !userId) return;
    var now = Date.now();
    if (now - _lastTypingSent < 2000) return; // Throttle
    _lastTypingSent = now;
    try {
      _typingChannel.send({ type: 'broadcast', event: 'typing', payload: { fromId: userId, toId: currentConversation } });
    } catch (e) { /* silent */ }
  }

  // Hook into chat input — broadcast typing on keypress
  document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'chatInput') broadcastTyping();
  });

  // ============================================
  // REPLY-TO-QUOTE
  // ============================================
  var _replyTo = null; // { id, text, fromName }

  /** Set reply-to context (called from long-press on received messages or swipe-right) */
  window.setMessageReply = function(msgId, text, fromName) {
    _replyTo = { id: msgId, text: text, fromName: fromName };
    var bar = document.getElementById('replyBar');
    if (!bar) {
      // Create reply bar above input
      bar = document.createElement('div');
      bar.id = 'replyBar';
      bar.className = 'reply-bar';
      var inputArea = document.querySelector('.chat-input-area');
      if (inputArea) inputArea.insertBefore(bar, inputArea.firstChild);
    }
    bar.style.display = 'flex';
    bar.innerHTML =
      '<div class="reply-bar-content">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--volt)" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>' +
        '<div class="reply-bar-text"><span class="reply-bar-name">' + sanitizeHTML(fromName) + '</span>' +
        '<span class="reply-bar-preview">' + sanitizeHTML(text.slice(0, 60)) + '</span></div>' +
      '</div>' +
      '<button class="reply-bar-close" onclick="clearMessageReply()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    // Focus input
    var input = document.getElementById('chatInput');
    if (input) input.focus();
    // Haptic
    if (navigator.vibrate) navigator.vibrate(15);
  };

  window.clearMessageReply = function() {
    _replyTo = null;
    var bar = document.getElementById('replyBar');
    if (bar) bar.style.display = 'none';
  };

  /**
   * Update conversations from Supabase API.
   * Called by auth.js after login when API data is available.
   */
  window.updateConversationsFromAPI = function(apiConvos) {
    if (!Array.isArray(apiConvos)) return;
    var userId = MTC.state.currentUser ? MTC.state.currentUser.id : null;
    var nextConversations = {};
    var nextConversationIdMap = {};
    var nextConversationMetaMap = {};
    apiConvos.forEach(function(conv) {
      var key = conv.otherUserId || conv.id;
      if (conv.id) nextConversationIdMap[key] = conv.id;
      // Cache name + avatar from API response (fallback when clubMembers hasn't loaded yet)
      if (conv.otherUserName) {
        nextConversationMetaMap[key] = {
          name: conv.otherUserName,
          avatar: conv.otherUserAvatar || 'man-1'
        };
      }
      nextConversations[key] = (conv.messages || []).map(function(m) {
        return {
          id: m.id || null,
          text: m.text,
          sent: m.fromId === userId,
          read: m.read !== false,
          time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          timestamp: m.timestamp || null
        };
      });
    });
    conversations = nextConversations;
    conversationIdMap = nextConversationIdMap;
    conversationMetaMap = nextConversationMetaMap;
    MTC.fn.saveConversations();
    // Re-render conversation list if messages screen is visible
    if (typeof renderConversationsList === 'function') renderConversationsList();
    // Update message badge on nav bar
    updateMessageBadge();
  };
})();
