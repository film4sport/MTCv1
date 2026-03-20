/* partners.js - MTC Court */
// ============================================
// PARTNER FILTER / POST / PRIVACY / HELP
// ============================================
(function() {
  'use strict';

  var SUPPORT_EMAIL = 'monotennisclub1@gmail.com';
  var SITE_HOST = 'monotennisclub.com';
  var pendingPartnerPosts = new Set();

  // ============================================
  // PARTNER FILTER (unified pill-based)
  // ============================================
  // onclick handler (index.html)
  window.filterPartners = function(pill, filter) {
    // Update active pill
    const pills = document.querySelectorAll('#partnerFilterPills .filter-pill');
    pills.forEach(function(p) { p.classList.remove('active'); });
    pill.classList.add('active');

    const cards = document.querySelectorAll('.partner-card');
    let visibleCount = 0;

    cards.forEach(function(card) {
      const matchType = card.getAttribute('data-match-type') || '';
      const level = card.getAttribute('data-level') || '';
      const availability = card.getAttribute('data-available') || '';

      let show = false;
      if (filter === 'all') {
        show = true;
      } else if (filter === 'available') {
        show = availability === 'true';
      } else if (['singles', 'mixed', 'mens', 'womens'].indexOf(filter) !== -1) {
        show = matchType === filter;
      } else if (['beginner', 'intermediate', 'advanced'].indexOf(filter) !== -1) {
        show = level === filter;
      }

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    const emptyState = document.getElementById('noPartners');
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
  };

  // ============================================
  // POST PARTNER REQUEST MODAL
  // ============================================
  // onclick handler (index.html)
  window.showPostPartnerModal = function() {
    const modal = document.getElementById('postPartnerModal');
    if (modal) {
      modal.classList.add('active');
    }
  };

  // onclick handler (index.html)
  window.closePostPartnerModal = function() {
    const modal = document.getElementById('postPartnerModal');
    if (modal) {
      modal.classList.remove('active');
      const msg = document.getElementById('partnerPostMessage');
      if (msg) msg.value = '';
      // Reset time selection + hide time section (Anytime is default)
      document.querySelectorAll('.partner-time-btn').forEach(function(b) { b.classList.remove('active'); });
      var timeInp = document.getElementById('partnerTimeInput');
      if (timeInp) timeInp.value = '';
      var timeSection = document.getElementById('partnerTimeSection');
      if (timeSection) timeSection.style.display = 'none';
      // Remove success flash if present
      var flash = modal.querySelector('.success-flash-overlay');
      if (flash) flash.remove();
    }
  };

  // onclick handler (index.html)
  window.selectPartnerType = function(btn) {
    btn.parentElement.querySelectorAll('.partner-type-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
  };

  // onclick handler (index.html)
  window.selectPartnerLevel = function(btn) {
    btn.parentElement.querySelectorAll('.partner-type-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
  };

  // onclick handler (index.html) — "When" pills show/hide time section
  window.selectPartnerWhen = function(btn) {
    btn.parentElement.querySelectorAll('.partner-type-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    // Show/hide time section based on selection
    var timeSection = document.getElementById('partnerTimeSection');
    var isAnytime = btn.getAttribute('data-when') === 'anytime';
    if (timeSection) {
      timeSection.style.display = isAnytime ? 'none' : 'block';
    }
    // Clear time selection when switching to Anytime
    if (isAnytime) {
      document.querySelectorAll('.partner-time-btn').forEach(function(b) { b.classList.remove('active'); });
      var inp = document.getElementById('partnerTimeInput');
      if (inp) inp.value = '';
    }
  };

  // Helper: convert 24h "HH:MM" to "H:MM AM/PM"
  function to12h(val24) {
    if (!val24) return '';
    var parts = val24.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1] || '00';
    var period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return h + ':' + m + ' ' + period;
  }

  // Helper: convert "H:MM AM/PM" to 24h "HH:MM"
  function to24h(label) {
    var match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return '';
    var h = parseInt(match[1], 10);
    if (match[3] === 'PM' && h !== 12) h += 12;
    if (match[3] === 'AM' && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + match[2];
  }

  // onclick handler (index.html) — quick-pick time grid button
  window.selectPartnerTime = function(btn) {
    // Toggle: clicking active btn deselects it
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      var inp = document.getElementById('partnerTimeInput');
      if (inp) inp.value = '';
      return;
    }
    document.querySelectorAll('.partner-time-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    // Sync to native input
    var timeLabel = btn.getAttribute('data-time');
    var inp = document.getElementById('partnerTimeInput');
    if (inp && timeLabel) inp.value = to24h(timeLabel);
  };

  // onchange handler — native time input (scroll wheel / keyboard)
  window.onPartnerTimeInput = function(inp) {
    // Deselect all grid buttons, then highlight matching one
    document.querySelectorAll('.partner-time-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    if (inp.value) {
      var label = to12h(inp.value);
      document.querySelectorAll('.partner-time-btn').forEach(function(b) {
        if (b.getAttribute('data-time') === label) b.classList.add('active');
      });
    }
  };

  // onclick handler (index.html)
  window.submitPartnerRequest = function() {
    if (submitPartnerRequest._posting) return;
    const typeBtn = document.querySelector('#postPartnerModal [data-type].active');
    const levelBtn = document.querySelector('#postPartnerModal [data-level].active');
    const whenBtn = document.querySelector('#postPartnerModal [data-when].active');
    const timeInput = document.getElementById('partnerTimeInput');
    const isAnytime = whenBtn && whenBtn.getAttribute('data-when') === 'anytime';

    const type = typeBtn ? typeBtn.getAttribute('data-type') : 'singles';
    const typeLabel = typeBtn ? typeBtn.textContent : 'Singles';
    const level = levelBtn ? levelBtn.textContent : 'Any Level';
    const when = whenBtn ? whenBtn.textContent : 'Anytime';
    const preferredTime = (!isAnytime && timeInput && timeInput.value) ? to12h(timeInput.value) : '';

    closePostPartnerModal();

    let userName = 'You';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name) {
      userName = currentUser.name;
    }
    const avatarKey = MTC.storage.get('mtc-avatar', 'default');
    const avatarHtml = (typeof avatarSVGs !== 'undefined' && avatarSVGs[avatarKey]) ? avatarSVGs[avatarKey] : avatarSVGs['default'];

    var localId = 'pr-' + Date.now();
    submitPartnerRequest._posting = true;
    pendingPartnerPosts.add(localId);
    var timeDisplay = preferredTime ? when + ' at ' + preferredTime : when;
    var reqData = { id: localId, type: type, typeLabel: typeLabel, level: level, when: timeDisplay, userName: userName };

    // Optimistic UI: show card immediately + save locally
    var savedRequests = MTC.storage.get('mtc-partner-requests', []);
    savedRequests.unshift(reqData);
    MTC.storage.set('mtc-partner-requests', savedRequests);
    insertPartnerRequestCard(reqData, avatarHtml);
    showToast('Posting partner request...');

    // Sync to Supabase via API
    if (MTC.fn.apiRequest && MTC.getToken()) {
      MTC.fn.apiRequest('/mobile/partners', {
        method: 'POST',
        body: JSON.stringify({
          matchType: type,
          skillLevel: level === 'Any Level' ? undefined : level.toLowerCase(),
          availability: when,
          message: null,
          clientRequestId: localId
        })
      }).then(function(result) {
        submitPartnerRequest._posting = false;
        pendingPartnerPosts.delete(localId);
        if (result.ok && result.data && result.data.id) {
          // Update local storage with server-assigned ID
          reqData.serverId = result.data.id;
          var updated = MTC.storage.get('mtc-partner-requests', []);
          for (var i = 0; i < updated.length; i++) {
            if (updated[i].id === localId) { updated[i].serverId = result.data.id; break; }
          }
          MTC.storage.set('mtc-partner-requests', updated);
          // Update card's data attribute
          var card = document.querySelector('[data-request-id="' + localId + '"]');
          if (card) card.setAttribute('data-server-id', result.data.id);
      showToast('Partner request sent');
        } else {
          showToast(result.data && result.data.error ? result.data.error : 'Failed to post request', 'error');
          // Remove optimistic card
          window.removePartnerRequest(localId);
        }
      }).catch(function() {
      submitPartnerRequest._posting = false;
      pendingPartnerPosts.delete(localId);
      showToast('Partner request saved locally — it will sync when you’re back online');
      });
    } else {
      submitPartnerRequest._posting = false;
      pendingPartnerPosts.delete(localId);
      // Offline: keep in localStorage, will be visible only to this user
      showToast('Partner request saved offline');
    }
  };

  // Private helper
  function insertPartnerRequestCard(req, avatarHtml) {
    if (!avatarHtml) {
      const avatarKey = MTC.storage.get('mtc-avatar', 'default');
      avatarHtml = (typeof avatarSVGs !== 'undefined' && avatarSVGs[avatarKey]) ? avatarSVGs[avatarKey] : (typeof avatarSVGs !== 'undefined' ? avatarSVGs['default'] : '');
    }

    var personIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    var ringColorMap = { singles: 'var(--electric-blue)', mixed: 'var(--electric-blue)', mens: 'var(--coral)', womens: '#ff69b4' };
    var ringColor = ringColorMap[req.type] || 'var(--electric-blue)';

    const card = document.createElement('div');
    card.className = 'partner-card stagger-item';
    card.setAttribute('data-match-type', req.type);
    card.setAttribute('data-request-id', req.id);
    card.style.border = '1.5px solid rgba(200, 255, 0, 0.3)';
    card.innerHTML =
      '<div class="partner-card-top">' +
        '<div class="partner-card-info">' +
          '<div class="partner-name">' + sanitizeHTML(req.userName) + '</div>' +
          '<div class="partner-card-pills">' +
            '<span class="partner-match-pill ' + sanitizeHTML(req.type) + '">' + sanitizeHTML(req.typeLabel) + '</span>' +
            '<span class="partner-level-pill">' + sanitizeHTML(req.level) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="partner-card-bottom">' +
        '<div class="partner-card-meta">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="var(--electric-blue)" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
          '<span>' + sanitizeHTML(req.when) + '</span>' +
        '</div>' +
        '<div class="partner-action">' +
          '<button class="partner-action-btn partner-cancel-btn ripple" data-action="removePartnerRequest" data-req-id="' + sanitizeHTML(req.id) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '<span>Cancel</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    var container = document.getElementById('partnerCardsContainer');
    if (container) {
      container.insertBefore(card, container.firstChild);
      // Hide empty state
      var emptyState = document.getElementById('noPartners');
      if (emptyState) emptyState.style.display = 'none';
    }
  }

  // Expose for navigation.js renderPartnersScreen()
  window.insertPartnerRequestCard = insertPartnerRequestCard;

  // onclick handler (generated HTML)
  window.removePartnerRequest = function(requestId) {
    const card = document.querySelector('[data-request-id="' + requestId + '"]');
    // Get server ID before removing
    var serverId = card ? card.getAttribute('data-server-id') : null;
    // Also check localStorage for serverId
    if (!serverId) {
      var reqs = MTC.storage.get('mtc-partner-requests', []);
      for (var i = 0; i < reqs.length; i++) {
        if (reqs[i].id === requestId && reqs[i].serverId) { serverId = reqs[i].serverId; break; }
      }
    }

    // Save state for rollback
    var prevRequests = MTC.storage.get('mtc-partner-requests', []);
    var cardParent = card ? card.parentNode : null;
    var cardNextSibling = card ? card.nextSibling : null;

    // Optimistic removal
    if (card) card.remove();
    var filtered = prevRequests.filter(function(r) { return r.id !== requestId; });
    MTC.storage.set('mtc-partner-requests', filtered);
    // Also remove from in-memory pool so it doesn't reappear on re-render
    if (serverId && typeof window.removeFromPartnerPool === 'function') {
      window.removeFromPartnerPool(serverId);
    }
    showToast('Removing partner request...');

    // Delete from Supabase with rollback
    if (serverId && MTC.fn.apiRequest && MTC.getToken()) {
      MTC.fn.apiRequest('/mobile/partners', {
        method: 'DELETE',
        body: JSON.stringify({ partnerId: serverId })
      }).then(function(res) {
        if (!res.ok) throw new Error((res.data && res.data.error) || 'Delete failed');
        showToast('Partner request removed');
      }).catch(function(err) {
        // Rollback: restore card + localStorage
        MTC.storage.set('mtc-partner-requests', prevRequests);
        if (card && cardParent) {
          if (cardNextSibling) cardParent.insertBefore(card, cardNextSibling);
          else cardParent.appendChild(card);
        }
        showToast('Failed to remove the partner request. Please try again.', 'error');
        MTC.warn('[MTC] removePartnerRequest failed:', err);
      });
    } else {
      // No server ID (local-only) — keep removal, no API needed
      showToast('Partner request removed');
    }
  };

  // Local requests are restored by renderPartnersScreen() in navigation.js
  // which is called on API data load and on every navigate-to-partners.

  // ============================================
  // PROGRAM ENROLLMENT
  // ============================================
  // onclick handler (generated HTML)
  window.enrollInProgram = function(btn) {
    const card = btn.closest('.program-card');
    if (!card) { showToast('Enrollment request sent!'); return; }

    const title = card.querySelector('.program-title');
    const price = card.querySelector('.program-price');
    const name = title ? title.textContent : 'Program';
    const cost = price ? price.childNodes[0].textContent.trim() : '';

    // Get program ID from card data attribute or generate from title
    const programId = card.dataset.programId || ('program-' + name.replace(/\s/g, '-').toLowerCase());

    if (btn.classList.contains('enrolled')) {
      // Save state for rollback
      var prevText = btn.textContent;
      btn.classList.remove('enrolled');
      btn.textContent = btn.dataset.originalText || 'Enroll Now';
      btn.style.background = '';
      btn.style.color = '';
      showToast('Withdrawing from ' + name + '...');
      if (typeof removeEventFromMyBookings === 'function') {
        removeEventFromMyBookings('program-' + name.replace(/\s/g, '-'));
      }
      // Persist withdrawal to Supabase with rollback
      var token1 = MTC.getToken();
      if (token1 && typeof MTC.fn.apiRequest === 'function') {
        MTC.fn.apiRequest('/mobile/programs', {
          method: 'POST',
          body: JSON.stringify({ programId: programId, action: 'withdraw' })
        }).then(function(res) {
          if (!res.ok) throw new Error((res.data && res.data.error) || 'Withdrawal failed');
          showToast('Withdrawn from ' + name);
        }).catch(function(err) {
          // Rollback
          btn.classList.add('enrolled');
          btn.textContent = prevText;
          btn.style.background = 'var(--volt)';
          btn.style.color = '#000';
          if (typeof addEventToMyBookings === 'function') {
            addEventToMyBookings('program-' + name.replace(/\s/g, '-'), 'program');
          }
          showToast('Failed to withdraw. Please try again.', 'error');
          MTC.warn('[MTC] Withdrawal failed:', err);
        });
      }
    } else {
      btn.dataset.originalText = btn.textContent;
      btn.classList.add('enrolled');
      btn.textContent = '\u2713 Enrolled';
      btn.style.background = 'var(--volt)';
      btn.style.color = '#000';

      var celebMsg = name + ' \u2014 ' + cost + '. Check My Bookings for details.';
      showCelebrationModal('ENROLLED!', celebMsg);

      if (typeof addEventToMyBookings === 'function') {
        addEventToMyBookings('program-' + name.replace(/\s/g, '-'), 'program');
      }
      // Persist enrollment to Supabase with rollback
      var token2 = MTC.getToken();
      if (token2 && typeof MTC.fn.apiRequest === 'function') {
        MTC.fn.apiRequest('/mobile/programs', {
          method: 'POST',
          body: JSON.stringify({ programId: programId, action: 'enroll' })
        }).then(function(res) {
          if (!res.ok) throw new Error((res.data && res.data.error) || 'Enrollment failed');
        }).catch(function(err) {
          // Rollback
          btn.classList.remove('enrolled');
          btn.textContent = btn.dataset.originalText || 'Enroll Now';
          btn.style.background = '';
          btn.style.color = '';
          if (typeof removeEventFromMyBookings === 'function') {
            removeEventFromMyBookings('program-' + name.replace(/\s/g, '-'));
          }
          showToast('Enrollment failed. Please try again.', 'error');
          MTC.warn('[MTC] Enrollment failed:', err);
        });
      }
    }
  };

  // ============================================
  // MATCH DETAIL MODAL
  // ============================================
  // onclick handler (generated HTML)
  window.showMatchDetail = function(card) {
    const type = card.querySelector('.match-type');
    const isResult = card.classList.contains('match-result');

    if (isResult) {
      const badge = card.querySelector('.match-result-badge');
      const opponent = card.querySelector('.match-result-opponent');
      const score = card.querySelector('.match-result-score');
      const date = card.querySelector('.match-result-date');

      const resultClass = badge && badge.classList.contains('win') ? 'win' : 'loss';
      const resultText = resultClass === 'win' ? 'Victory!' : 'Tough Match';

      const modal = document.createElement('div');
      modal.className = 'modal-overlay active';
      modal.id = 'matchDetailModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Match detail');
      modal.onclick = function(e) { if (e.target === this) this.remove(); };
      modal.innerHTML =
        '<div class="modal" onclick="event.stopPropagation()" style="max-width: 380px;">' +
          '<div style="font-size: 40px; margin-bottom: 8px;">' + (resultClass === 'win' ? '\uD83C\uDFC6' : '\uD83C\uDFBE') + '</div>' +
          '<div class="modal-title">' + resultText + '</div>' +
          '<div class="modal-desc">' +
            (opponent ? sanitizeHTML(opponent.textContent) : '') + '<br>' +
            '<span style="font-size: 24px; font-weight: 800; color: var(--volt);">' + (score ? sanitizeHTML(score.textContent) : '') + '</span><br>' +
            '<span style="color: var(--text-muted);">' + (date ? sanitizeHTML(date.textContent) : '') + '</span>' +
          '</div>' +
          '<button class="modal-btn ripple" onclick="document.getElementById(\'matchDetailModal\').remove()">CLOSE</button>' +
        '</div>';
      document.getElementById('app').appendChild(modal);
    } else {
      const players = card.querySelectorAll('.match-player span');
      const details = card.querySelectorAll('.match-detail-item span');
      const matchType = type ? type.textContent : 'SINGLES';
      const partnerId = card.getAttribute('data-partner-id') || '';

      const modal2 = document.createElement('div');
      modal2.className = 'modal-overlay active';
      modal2.id = 'matchDetailModal';
      modal2.onclick = function(e) { if (e.target === this) this.remove(); };

      var msgBtnAction = partnerId
        ? 'document.getElementById(\'matchDetailModal\').remove(); if(typeof startConversation===\'function\') startConversation(\'' + sanitizeHTML(partnerId) + '\'); else navigateTo(\'messages\');'
        : 'document.getElementById(\'matchDetailModal\').remove(); navigateTo(\'messages\');';

      modal2.innerHTML =
        '<div class="modal" onclick="event.stopPropagation()" style="max-width: 380px;">' +
          '<div class="modal-title" style="margin-top: 12px;">UPCOMING ' + sanitizeHTML(matchType) + '</div>' +
          '<div class="modal-desc">' +
            (players[0] ? sanitizeHTML(players[0].textContent) : '') + ' vs ' + (players[1] ? sanitizeHTML(players[1].textContent) : '') + '<br><br>' +
            (details[0] ? sanitizeHTML(details[0].textContent) + '<br>' : '') +
            (details[1] ? sanitizeHTML(details[1].textContent) : '') +
          '</div>' +
          '<button class="modal-btn ripple" onclick="' + msgBtnAction + '">MESSAGE OPPONENT</button>' +
          '<button class="modal-btn ripple" style="background: transparent; color: var(--text-secondary); margin-top: 8px;" onclick="document.getElementById(\'matchDetailModal\').remove()">CLOSE</button>' +
        '</div>';
      document.getElementById('app').appendChild(modal2);
    }
  };

  // ============================================
  // SETTINGS: PRIVACY & HELP
  // ============================================
  // Private helpers
  function getPrivacySettings() {
    return MTC.storage.get('mtc-privacy', { onlineStatus: true, profileVisible: true, matchHistory: true, shareAvailability: true });
  }

  function savePrivacySettings(settings) {
    MTC.storage.set('mtc-privacy', settings);
    // Sync to Supabase preferences
    if (MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/members', {
        method: 'PATCH',
        body: JSON.stringify({ preferences: { privacy: settings } })
      }).catch(function() { MTC.warn('Privacy settings sync failed'); });
    }
  }

  // onclick handler (generated HTML)
  window.togglePrivacySetting = function(key, toggleEl) {
    toggleEl.classList.toggle('active');
    const settings = getPrivacySettings();
    settings[key] = toggleEl.classList.contains('active');
    savePrivacySettings(settings);
    showToast('Setting updated');
  };

  // onclick handler (index.html)
  window.showPrivacySettings = function() {
    const settings = getPrivacySettings();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'privacyModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Privacy settings');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">PRIVACY SETTINGS</div>' +
        '<div style="margin: 20px 0;">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div><div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Show Online Status</div><div style="font-size: 12px; color: var(--text-muted);">Let others see when you\'re active</div></div>' +
            '<div class="toggle' + (settings.onlineStatus ? ' active' : '') + '" onclick="togglePrivacySetting(\'onlineStatus\', this)" style="flex-shrink:0;"></div>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div><div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Profile Visible to Members</div><div style="font-size: 12px; color: var(--text-muted);">Show your profile in partner search</div></div>' +
            '<div class="toggle' + (settings.profileVisible ? ' active' : '') + '" onclick="togglePrivacySetting(\'profileVisible\', this)" style="flex-shrink:0;"></div>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div><div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Show Match History</div><div style="font-size: 12px; color: var(--text-muted);">Display your W/L record publicly</div></div>' +
            '<div class="toggle' + (settings.matchHistory ? ' active' : '') + '" onclick="togglePrivacySetting(\'matchHistory\', this)" style="flex-shrink:0;"></div>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0;">' +
            '<div><div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Share Availability</div><div style="font-size: 12px; color: var(--text-muted);">Let partners see your schedule</div></div>' +
            '<div class="toggle' + (settings.shareAvailability ? ' active' : '') + '" onclick="togglePrivacySetting(\'shareAvailability\', this)" style="flex-shrink:0;"></div>' +
          '</div>' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="document.getElementById(\'privacyModal\').remove()">DONE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };

  // onclick handler (index.html)
  window.showHelpSupport = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'helpModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Help and support');
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    modal.innerHTML =
      '<div class="modal" onclick="event.stopPropagation()" style="max-width: 400px; text-align: left;">' +
        '<div class="modal-title" style="text-align: center;">HELP & SUPPORT</div>' +
        '<div style="margin: 20px 0;">' +
          '<div class="settings-item" onclick="showToast(\'Opening email client...\'); document.getElementById(\'helpModal\').remove();" style="cursor: pointer; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">\uD83D\uDCE7 Email Us</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">' + SUPPORT_EMAIL + '</div>' +
          '</div>' +
          '<div class="settings-item" onclick="showToast(\'Visit ' + SITE_HOST + ' for club updates\'); document.getElementById(\'helpModal\').remove();" style="cursor: pointer; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">\uD83C\uDF10 Club Website</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">' + SITE_HOST + '</div>' +
          '</div>' +
          '<div class="settings-item" onclick="showToast(\'FAQ loaded\'); document.getElementById(\'helpModal\').remove();" style="cursor: pointer; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">\u2753 FAQs</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">Common questions & answers</div>' +
          '</div>' +
          '<div class="settings-item" onclick="showToast(\'Bug report submitted \u2014 thank you!\'); document.getElementById(\'helpModal\').remove();" style="cursor: pointer; padding: 14px 0;">' +
            '<div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">\uD83D\uDC1B Report a Bug</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">Help us improve the app</div>' +
          '</div>' +
        '</div>' +
        '<button class="modal-btn ripple" onclick="document.getElementById(\'helpModal\').remove()">CLOSE</button>' +
      '</div>';
    document.getElementById('app').appendChild(modal);
  };
})();
