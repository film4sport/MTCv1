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
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // Sort: most recent message first
    keys.sort(function(a, b) {
      var msgsA = conversations[a] || [];
      var msgsB = conversations[b] || [];
      // Put conversations with messages first, empty ones last
      if (msgsA.length === 0 && msgsB.length > 0) return 1;
      if (msgsB.length === 0 && msgsA.length > 0) return -1;
      return 0; // preserve insertion order otherwise
    });

    var avatars = MTC.state.avatarSVGs || {};
    var clubIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"></circle><path d="M12 13v8"></path><path d="M9 18h6"></path></svg>';

    var html = '';
    keys.forEach(function(memberId) {
      var msgs = conversations[memberId] || [];
      var member = MTC.state.clubMembers.find(function(m) { return m.id === memberId; });
      var name = member ? member.name : memberId;
      var lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      var preview = lastMsg ? lastMsg.text : 'No messages yet';
      var time = lastMsg ? (lastMsg.time || '') : '';
      var isClub = (memberId === 'club');
      var avatarHtml;

      if (isClub) {
        avatarHtml = '<div class="message-avatar-wrap club-avatar">' + clubIcon + '</div>';
      } else {
        var avatarKey = member ? member.avatar : 'default';
        var svg = avatars[avatarKey] || avatars['default'] || '';
        avatarHtml = '<div class="message-avatar-wrap">' + svg + '</div>';
      }

      // Truncate preview
      if (preview.length > 60) preview = preview.substring(0, 57) + '...';

      html += '<div class="message-item stagger-item" onclick="openConversation(\'' + sanitizeHTML(memberId) + '\')">' +
        avatarHtml +
        '<div class="message-content">' +
          '<div class="message-header">' +
            '<div class="message-name">' + sanitizeHTML(name) + '</div>' +
            '<div class="message-time">' + sanitizeHTML(time) + '</div>' +
          '</div>' +
          '<div class="message-preview">' + sanitizeHTML(preview) + '</div>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;
  };

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

  // onclick handler (index.html)
  window.openConversation = function(memberId) {
    try {
    currentConversation = memberId;
    const member = MTC.state.clubMembers.find(function(m) { return m.id === memberId; });

    if (!member) return;

    // Update header
    document.getElementById('conversationName').textContent = member.name;
    const avatarEl = document.getElementById('conversationAvatar');
    var avatars = (typeof MTC !== 'undefined' && MTC.state && MTC.state.avatarSVGs) || (typeof avatarSVGs !== 'undefined' ? avatarSVGs : {});
    if (avatarEl && avatars[member.avatar]) {
      avatarEl.innerHTML = avatars[member.avatar];
    }

    // Load messages
    renderMessages(memberId);

    // Navigate to conversation
    navigateTo('conversation');

    // Mark as read
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(function(item) {
      const onclickAttr = item.getAttribute('onclick') || '';
      if (onclickAttr.includes(memberId)) {
        const unread = item.querySelector('.message-unread');
        if (unread) unread.remove();
      }
    });

    // Update message badge count
    updateMessageBadge();
    } catch(e) { MTC.warn('openConversation error:', e); }
  };

  // Private helper
  function updateMessageBadge() {
    const unreadCount = document.querySelectorAll('.message-unread').length;
    const badge = document.getElementById('navMessageBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
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

      html += '<div class="chat-bubble ' + (msg.sent ? 'sent' : 'received') + '">' + sanitizeHTML(msg.text) + '</div>';
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
    } catch(e) { MTC.warn('renderMessages error:', e); }
  }

  // onclick handler (index.html)
  window.sendMessage = function() {
    try {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();

    if (!text || !currentConversation) return;

    if (!conversations[currentConversation]) {
      conversations[currentConversation] = [];
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic: add to local state immediately
    conversations[currentConversation].push({
      text: text,
      sent: true,
      time: time
    });

    MTC.fn.saveConversations();
    input.value = '';
    renderMessages(currentConversation);

    // Persist to Supabase via API
    var token = MTC.getToken();
    if (token && typeof MTC.fn.apiRequest === 'function') {
      MTC.fn.apiRequest('/mobile/conversations', {
        method: 'POST',
        body: JSON.stringify({ toId: currentConversation, text: text })
      }).then(function(res) {
        if (!res.ok) {
          MTC.warn('[MTC] Message send failed:', res.data);
          if (typeof showToast === 'function') showToast('Message may not have been saved');
        }
      }).catch(function() {
        if (typeof showToast === 'function') showToast('Message may not have been saved');
      });
    }

    } catch(e) { MTC.warn('sendMessage error:', e); }
  };

  // simulateReply removed — real messages come via Supabase API

  // onclick handler (index.html)
  window.showNewMessageModal = function() {
    document.getElementById('newMessageModal').classList.add('active');
    document.getElementById('memberSearchInput').value = '';
    showAllMembers();
  };

  // onclick handler (index.html)
  window.closeNewMessageModal = function() {
    document.getElementById('newMessageModal').classList.remove('active');
  };

  function showAllMembers() {
    const container = document.getElementById('memberSearchResults');
    container.innerHTML = MTC.state.clubMembers
      .filter(function(m) { return m.id !== 'club'; })
      .map(function(member) {
        return '<div class="member-result-item" data-action="startConversation" data-id="' + sanitizeHTML(member.id) + '">' +
          '<div class="member-result-avatar">' +
            (avatarSVGs[member.avatar] || avatarSVGs['default']) +
          '</div>' +
          '<div class="member-result-info">' +
            '<div class="member-result-name">' + sanitizeHTML(member.name) + '</div>' +
            '<div class="member-result-skill">' + sanitizeHTML(member.skill) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
  }

  function searchMembers(query) {
    const container = document.getElementById('memberSearchResults');
    query = query.toLowerCase();

    if (!query) {
      showAllMembers();
      return;
    }

    const results = MTC.state.clubMembers.filter(function(m) {
      return m.id !== 'club' &&
        (m.name.toLowerCase().includes(query) || m.skill.toLowerCase().includes(query));
    });

    if (results.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">No members found</div>';
      return;
    }

    container.innerHTML = results.map(function(member) {
      return '<div class="member-result-item" data-action="startConversation" data-id="' + sanitizeHTML(member.id) + '">' +
        '<div class="member-result-avatar">' +
          (avatarSVGs[member.avatar] || avatarSVGs['default']) +
        '</div>' +
        '<div class="member-result-info">' +
          '<div class="member-result-name">' + sanitizeHTML(member.name) + '</div>' +
          '<div class="member-result-skill">' + sanitizeHTML(member.skill) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
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
        skill: skillLabel,
        avatar: m.avatar || 'man-1'
      };
    });
    // Replace the clubMembers array in-place (other modules hold references)
    MTC.state.clubMembers.length = 0;
    newMembers.forEach(function(m) { MTC.state.clubMembers.push(m); });
    window.clubMembers = MTC.state.clubMembers;
  };

  /**
   * Update conversations from Supabase API.
   * Called by auth.js after login when API data is available.
   */
  window.updateConversationsFromAPI = function(apiConvos) {
    if (!Array.isArray(apiConvos)) return;
    var userId = MTC.state.currentUser ? MTC.state.currentUser.id : null;
    apiConvos.forEach(function(conv) {
      var key = conv.otherUserId || conv.id;
      conversations[key] = (conv.messages || []).map(function(m) {
        return {
          text: m.text,
          sent: m.fromId === userId,
          time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        };
      });
    });
    MTC.fn.saveConversations();
    // Re-render conversation list if messages screen is visible
    if (typeof renderConversationsList === 'function') renderConversationsList();
  };
})();
