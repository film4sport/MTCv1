/* messaging.js - MTC Court */
// ============================================
// MESSAGING SYSTEM
// ============================================
(function() {
  'use strict';

  // Shared state (read by events-registration.js)
  MTC.state.clubMembers = [
    { id: 'mike', name: 'Mike Chen', skill: 'Advanced (4.5)', avatar: 'man-2' },
    { id: 'sarah', name: 'Sarah Wilson', skill: 'Intermediate (4.0)', avatar: 'woman-1' },
    { id: 'james', name: 'James Park', skill: 'Advanced (4.5)', avatar: 'man-3' },
    { id: 'emma', name: 'Emma Davis', skill: 'Intermediate (3.5)', avatar: 'woman-4' },
    { id: 'david', name: 'David Kim', skill: 'Beginner (3.0)', avatar: 'man-1' },
    { id: 'lisa', name: 'Lisa Thompson', skill: 'Advanced (5.0)', avatar: 'woman-2' },
    { id: 'robert', name: 'Robert Garcia', skill: 'Intermediate (4.0)', avatar: 'man-5' },
    { id: 'jennifer', name: 'Jennifer Lee', skill: 'Intermediate (3.5)', avatar: 'woman-3' },
    { id: 'michael', name: 'Michael Brown', skill: 'Beginner (2.5)', avatar: 'man-6' },
    { id: 'amanda', name: 'Amanda White', skill: 'Advanced (4.5)', avatar: 'woman-5' },
    { id: 'emily', name: 'Emily Rodriguez', skill: 'Intermediate (3.0)', avatar: 'woman-3' },
    { id: 'club', name: 'MTC Club', skill: 'Club Announcements', avatar: 'tennis-1' }
  ];
  // Backward-compat alias
  window.clubMembers = MTC.state.clubMembers;

  // Default conversation history (used when no saved data exists)
  const defaultConversations = {
    'mike': [
      { text: 'Hey! Want to play this weekend?', sent: false, time: '10:30 AM' },
      { text: 'Sounds great! Saturday morning?', sent: true, time: '' },
      { text: 'Perfect! Court 2 at 9am?', sent: false, time: '' },
      { text: 'I\'ll book it now', sent: true, time: '' },
      { text: 'Ready for our match tomorrow? \uD83C\uDFBE', sent: false, time: '2:15 PM' },
      { text: 'sure', sent: true, time: '' },
      { text: 'See you on the court! \uD83C\uDFBE', sent: false, time: '03:28 PM' }
    ],
    'sarah': [
      { text: 'That was a great rally!', sent: false, time: 'Yesterday' },
      { text: 'You really improved your backhand', sent: false, time: '' },
      { text: 'Thanks! Been practicing a lot', sent: true, time: '' },
      { text: 'Great game today! Let\'s play again soon.', sent: false, time: '1 hour ago' }
    ],
    'james': [
      { text: 'Can you help me with my serve?', sent: false, time: '3 hours ago' },
      { text: 'Sure! Try tossing the ball a bit higher', sent: true, time: '' },
      { text: 'And follow through more', sent: true, time: '' },
      { text: 'Thanks for the tips on my serve!', sent: false, time: '' }
    ],
    'emma': [
      { text: 'Hi! Do you play doubles?', sent: false, time: 'Yesterday' },
      { text: 'Yes I love doubles!', sent: true, time: '' },
      { text: 'Are you free for doubles Saturday?', sent: false, time: '' }
    ],
    'club': [
      { text: '\uD83D\uDCE2 Welcome to MTC Court! Your membership is now active.', sent: false, time: 'Last week' },
      { text: '\uD83C\uDFBE Spring Tournament registration is now open!', sent: false, time: '2 days ago' },
      { text: 'Your court booking is confirmed for Court 1, Feb 10 at 10:00 AM.', sent: false, time: 'Yesterday' }
    ]
  };

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
    for (const key in parsed) {
      conversations[key] = parsed[key];
    }
  };
  // Backward-compat alias
  window.loadSavedConversations = MTC.fn.loadSavedConversations;

  // Debounced search wrappers (used by index.html oninput)
  window.debouncedFilterConversations = MTC.debounce(filterConversations, 250);
  window.debouncedSearchMembers = MTC.debounce(searchMembers, 250);

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
    if (avatarSVGs[member.avatar]) {
      avatarEl.innerHTML = avatarSVGs[member.avatar];
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
    } catch(e) { console.warn('openConversation error:', e); }
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
    } catch(e) { console.warn('renderMessages error:', e); }
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

    conversations[currentConversation].push({
      text: text,
      sent: true,
      time: time
    });

    MTC.fn.saveConversations();
    input.value = '';
    renderMessages(currentConversation);

    // Simulate reply after 2 seconds
    setTimeout(function() {
      simulateReply(currentConversation);
    }, 2000);
    } catch(e) { console.warn('sendMessage error:', e); }
  };

  function simulateReply(memberId) {
    try {
    const member = MTC.state.clubMembers.find(function(m) { return m.id === memberId; });
    if (!member || memberId === 'club') return;

    const replies = [
      'Sounds good! \uD83D\uDC4D',
      'Great idea!',
      'I\'m free this weekend',
      'Let me check my schedule',
      'Perfect!',
      'See you on the court! \uD83C\uDFBE',
      'Can\'t wait!',
      'I\'ll bring the balls',
      'What time works for you?'
    ];

    const reply = replies[Math.floor(Math.random() * replies.length)];
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    conversations[memberId].push({
      text: reply,
      sent: false,
      time: time
    });

    MTC.fn.saveConversations();

    if (currentConversation === memberId) {
      renderMessages(memberId);
      showToast(member.name + ' replied');
    } else {
      showPushNotification('New Message', member.name + ': ' + reply, '\uD83D\uDCAC');
    }
    } catch(e) { console.warn('simulateReply error:', e); }
  }

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
        return '<div class="member-result-item" onclick="startConversation(\'' + sanitizeHTML(member.id) + '\')">' +
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
      return '<div class="member-result-item" onclick="startConversation(\'' + sanitizeHTML(member.id) + '\')">' +
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
})();
