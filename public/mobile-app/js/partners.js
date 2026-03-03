/* partners.js - MTC Court */
// ============================================
// PARTNER FILTER / POST / PRIVACY / HELP
// ============================================
(function() {
  'use strict';

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

  // onclick handler (index.html)
  window.selectPartnerWhen = function(btn) {
    btn.parentElement.querySelectorAll('.partner-type-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
  };

  // onclick handler (index.html)
  window.submitPartnerRequest = function() {
    const typeBtn = document.querySelector('#postPartnerModal [data-type].active');
    const levelBtn = document.querySelector('#postPartnerModal [data-level].active');
    const whenBtn = document.querySelector('#postPartnerModal [data-when].active');

    const type = typeBtn ? typeBtn.getAttribute('data-type') : 'singles';
    const typeLabel = typeBtn ? typeBtn.textContent : 'Singles';
    const level = levelBtn ? levelBtn.textContent : 'Any Level';
    const when = whenBtn ? whenBtn.textContent : 'Anytime';

    closePostPartnerModal();

    let userName = 'You';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name) {
      userName = currentUser.name;
    }
    const avatarKey = MTC.storage.get('mtc-avatar', 'default');
    const avatarHtml = (typeof avatarSVGs !== 'undefined' && avatarSVGs[avatarKey]) ? avatarSVGs[avatarKey] : avatarSVGs['default'];

    var localId = 'pr-' + Date.now();
    var reqData = { id: localId, type: type, typeLabel: typeLabel, level: level, when: when, userName: userName };

    // Optimistic UI: show card immediately + save locally
    var savedRequests = MTC.storage.get('mtc-partner-requests', []);
    savedRequests.unshift(reqData);
    MTC.storage.set('mtc-partner-requests', savedRequests);
    insertPartnerRequestCard(reqData, avatarHtml);
    showToast('Posting partner request...');

    // Sync to Supabase via API
    if (MTC.fn.apiRequest && MTC.storage.get('mtc-access-token')) {
      MTC.fn.apiRequest('/mobile/partners', {
        method: 'POST',
        body: JSON.stringify({
          matchType: type,
          skillLevel: level === 'Any Level' ? undefined : level.toLowerCase(),
          availability: when,
          message: null
        })
      }).then(function(result) {
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
          showToast('Partner request posted!');
        } else {
          showToast(result.data && result.data.error ? result.data.error : 'Failed to post request', 'error');
          // Remove optimistic card
          window.removePartnerRequest(localId);
        }
      }).catch(function() {
        showToast('Request saved locally — will sync when online');
      });
    } else {
      // Offline: keep in localStorage, will be visible only to this user
      showToast('Partner request saved (offline)');
    }
  };

  // Private helper
  function insertPartnerRequestCard(req, avatarHtml) {
    if (!avatarHtml) {
      const avatarKey = MTC.storage.get('mtc-avatar', 'default');
      avatarHtml = (typeof avatarSVGs !== 'undefined' && avatarSVGs[avatarKey]) ? avatarSVGs[avatarKey] : (typeof avatarSVGs !== 'undefined' ? avatarSVGs['default'] : '');
    }

    const card = document.createElement('div');
    card.className = 'partner-card stagger-item';
    card.setAttribute('data-match-type', req.type);
    card.setAttribute('data-request-id', req.id);
    card.style.border = '2px solid var(--volt)';
    card.innerHTML =
      '<div class="partner-match-type ' + sanitizeHTML(req.type) + '">' + sanitizeHTML(req.typeLabel) + '</div>' +
      '<svg class="partner-avatar" viewBox="0 0 100 100">' + (avatarHtml || '').replace(/<\/?svg[^>]*>/g, '') + '</svg>' +
      '<div class="partner-info">' +
        '<div class="partner-name">' + sanitizeHTML(req.userName) + ' <span style="font-size: 11px; color: var(--volt); font-weight: 600;">(You)</span></div>' +
        '<div class="partner-level">' + sanitizeHTML(req.level) + '</div>' +
        '<div class="partner-availability">' + sanitizeHTML(req.when) + '</div>' +
      '</div>' +
      '<div class="partner-action">' +
        '<button class="partner-action-btn ripple" data-action="removePartnerRequest" data-req-id="' + sanitizeHTML(req.id) + '" style="background: var(--coral);">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
      '</div>';

    const firstCard = document.querySelector('#screen-partners .partner-card');
    if (firstCard) {
      firstCard.parentElement.insertBefore(card, firstCard);
    }
  }

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
    if (card) card.remove();
    const requests = MTC.storage.get('mtc-partner-requests', []).filter(function(r) { return r.id !== requestId; });
    MTC.storage.set('mtc-partner-requests', requests);
    showToast('Request removed');

    // Delete from Supabase
    if (serverId && MTC.fn.apiRequest && MTC.storage.get('mtc-access-token')) {
      MTC.fn.apiRequest('/mobile/partners', {
        method: 'DELETE',
        body: JSON.stringify({ partnerId: serverId })
      }).catch(function() { /* best effort */ });
    }
  };

  // Restore saved partner requests on page load
  document.addEventListener('DOMContentLoaded', function() {
    const requests = MTC.storage.get('mtc-partner-requests', []);
    requests.forEach(function(req) { insertPartnerRequestCard(req); });
  });

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
      btn.classList.remove('enrolled');
      btn.textContent = btn.dataset.originalText || 'Enroll Now';
      btn.style.background = '';
      btn.style.color = '';
      showToast('Enrollment cancelled for ' + name);
      if (typeof removeEventFromMyBookings === 'function') {
        removeEventFromMyBookings('program-' + name.replace(/\s/g, '-'));
      }
      // Persist withdrawal to Supabase
      var token1 = MTC.storage.get('mtc-access-token', '');
      if (token1 && typeof MTC.fn.apiRequest === 'function') {
        MTC.fn.apiRequest('/mobile/programs', {
          method: 'POST',
          body: JSON.stringify({ programId: programId, action: 'withdraw' })
        }).catch(function() { console.warn('[MTC] Withdrawal sync failed'); });
      }
    } else {
      let tabWarning = '';
      if (typeof memberPaymentData !== 'undefined' && memberPaymentData.currentUser && memberPaymentData.currentUser.tab > 0) {
        tabWarning = '\n\n\u26A0\uFE0F You have a $' + memberPaymentData.currentUser.tab + ' tab balance. Please settle up before attending.';
      }

      btn.dataset.originalText = btn.textContent;
      btn.classList.add('enrolled');
      btn.textContent = '\u2713 Enrolled';
      btn.style.background = 'var(--volt)';
      btn.style.color = '#000';

      let celebMsg = name + ' \u2014 ' + cost + '. Check My Bookings for details.';
      if (tabWarning) {
        celebMsg += tabWarning;
      }
      showCelebrationModal('ENROLLED!', celebMsg);

      if (typeof addEventToMyBookings === 'function') {
        addEventToMyBookings('program-' + name.replace(/\s/g, '-'), 'program');
      }
      // Persist enrollment to Supabase
      var token2 = MTC.storage.get('mtc-access-token', '');
      if (token2 && typeof MTC.fn.apiRequest === 'function') {
        MTC.fn.apiRequest('/mobile/programs', {
          method: 'POST',
          body: JSON.stringify({ programId: programId, action: 'enroll' })
        }).then(function(res) {
          if (!res.ok) {
            console.warn('[MTC] Enrollment sync failed:', res.data);
            showToast('Enrollment may not have been saved');
          }
        }).catch(function() { showToast('Enrollment may not have been saved'); });
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

      const modal2 = document.createElement('div');
      modal2.className = 'modal-overlay active';
      modal2.id = 'matchDetailModal';
      modal2.onclick = function(e) { if (e.target === this) this.remove(); };
      modal2.innerHTML =
        '<div class="modal" onclick="event.stopPropagation()" style="max-width: 380px;">' +
          '<div style="font-size: 40px; margin-bottom: 8px;">\uD83C\uDFBE</div>' +
          '<div class="modal-title">UPCOMING ' + sanitizeHTML(matchType) + '</div>' +
          '<div class="modal-desc">' +
            (players[0] ? sanitizeHTML(players[0].textContent) : '') + ' vs ' + (players[1] ? sanitizeHTML(players[1].textContent) : '') + '<br><br>' +
            (details[0] ? '\uD83D\uDCC5 ' + sanitizeHTML(details[0].textContent) + '<br>' : '') +
            (details[1] ? '\uD83D\uDCCD ' + sanitizeHTML(details[1].textContent) : '') +
          '</div>' +
          '<button class="modal-btn ripple" onclick="document.getElementById(\'matchDetailModal\').remove(); navigateTo(\'messages\')">MESSAGE OPPONENT</button>' +
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
            '<div style="font-size: 12px; color: var(--text-muted);">info@mtctennis.ca</div>' +
          '</div>' +
          '<div class="settings-item" onclick="showToast(\'Opening phone...\'); document.getElementById(\'helpModal\').remove();" style="cursor: pointer; padding: 14px 0; border-bottom: 1px solid var(--border-color);">' +
            '<div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">\uD83D\uDCDE Call the Club</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">(519) 555-0123</div>' +
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
