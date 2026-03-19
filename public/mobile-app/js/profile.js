/* profile.js - MTC Court */
// ============================================
// PROFILE DATA & EDITING
// ============================================
(function() {
  'use strict';

  // Shared state (read by events-registration.js)
  // Default profile — synced from currentUser on login, persisted in localStorage
  MTC.state.profileData = {
    name: '',
    email: '',
    skill: 'Not set',
    skillClass: '',
    // skillNTRP removed — using skillClass only (matches desktop)
    availability: [],
    playstyle: []
  };
  // Backward-compat alias
  window.profileData = MTC.state.profileData;

  // Load from localStorage on init
  (function loadProfile() {
    const saved = MTC.storage.get('mtc-profile');
    if (saved) {
      Object.assign(MTC.state.profileData, saved);
    }
  })();

  // Private helper — save locally + sync to Supabase
  function saveProfileToStorage() {
    MTC.storage.set('mtc-profile', MTC.state.profileData);
    // Sync to Supabase via PATCH /mobile/members
    if (MTC.fn && MTC.fn.apiRequest) {
      var data = MTC.state.profileData;
      var body = { preferences: { availability: data.availability, playstyle: data.playstyle } };
      // Map skill display value to DB fields
      var skillOpt = profileFieldConfigs.skill.options.find(function(o) { return o.value === data.skill; });
      if (skillOpt) {
        body.skillLevel = skillOpt.cls;
        body.skillLevelSet = true;
      }
      MTC.fn.apiRequest('/mobile/members', {
        method: 'PATCH',
        body: JSON.stringify(body)
      }).catch(function() { MTC.warn('Profile sync failed'); });
    }
  }

  // Private helper
  function getUserSkillClass() {
    return MTC.state.profileData.skillClass || 'intermediate';
  }

  // Private state
  let currentEditField = null;

  // ============================================
  // FIELD CONFIGS
  // ============================================
  const profileFieldConfigs = {
    name: {
      title: 'EDIT NAME',
      type: 'text',
      placeholder: 'Enter your full name',
      getValue: function() { return MTC.state.profileData.name; },
      save: function(val) {
        MTC.state.profileData.name = val;
        updateProfileDisplay('name');
        const nameEl = document.getElementById('profileName');
        if (nameEl) nameEl.textContent = val.toUpperCase();
        saveProfileToStorage();
      }
    },
    email: {
      title: 'EDIT EMAIL',
      type: 'email',
      placeholder: 'Enter your email address',
      getValue: function() { return MTC.state.profileData.email; },
      save: function(val) {
        MTC.state.profileData.email = val;
        updateProfileDisplay('email');
        saveProfileToStorage();
      }
    },
    skill: {
      title: 'PLAYER RATING',
      type: 'select',
      options: [
        { value: 'Beginner', label: 'Beginner', cls: 'beginner', level: 'BEGINNER' },
        { value: 'Intermediate', label: 'Intermediate', cls: 'intermediate', level: 'INTERMEDIATE' },
        { value: 'Advanced', label: 'Advanced', cls: 'advanced', level: 'ADVANCED' },
        { value: 'Competitive', label: 'Competitive', cls: 'competitive', level: 'COMPETITIVE' }
      ],
      getValue: function() { return MTC.state.profileData.skill; },
      save: function(val) {
        MTC.state.profileData.skill = val;
        const opt = profileFieldConfigs.skill.options.find(function(o) { return o.value === val; });
        if (opt) {
          MTC.state.profileData.skillClass = opt.cls;
        }
        updateProfileDisplay('skill');
        saveProfileToStorage();
      }
    },
    availability: {
      title: 'PREFERRED TIMES',
      type: 'multi',
      options: [
        'Weekday Mornings',
        'Weekday Afternoons',
        'Weekday Evenings',
        'Weekends',
        'Weekend Mornings',
        'Weekend Afternoons'
      ],
      getValue: function() { return MTC.state.profileData.availability; },
      save: function(val) {
        MTC.state.profileData.availability = val;
        updateProfileDisplay('availability');
        saveProfileToStorage();
      }
    },
    playstyle: {
      title: 'PLAY STYLE',
      type: 'multi',
      options: [
        'Singles',
        'Doubles',
        'Mixed Doubles',
        'Rally / Practice',
        'Competitive',
        'Social / Casual'
      ],
      getValue: function() { return MTC.state.profileData.playstyle; },
      save: function(val) {
        MTC.state.profileData.playstyle = val;
        updateProfileDisplay('playstyle');
        saveProfileToStorage();
      }
    }
  };

  // ============================================
  // EDIT MODAL
  // ============================================
  // onclick handler (index.html)
  window.editProfileField = function(field) {
    try {
    const config = profileFieldConfigs[field];
    if (!config) return;

    currentEditField = field;

    const titleEl = document.getElementById('profileEditTitle');
    const bodyEl = document.getElementById('profileEditBody');
    if (!titleEl || !bodyEl) return;

    titleEl.textContent = config.title;

    let html = '';

    if (config.type === 'text' || config.type === 'email' || config.type === 'tel') {
      html = '<div class="profile-edit-input-wrap">' +
        '<input type="' + config.type + '" class="profile-edit-input" id="profileEditInput" ' +
        'placeholder="' + config.placeholder + '" value="' + sanitizeHTML(config.getValue()) + '" autocomplete="off">' +
        '</div>';
    } else if (config.type === 'select') {
      const currentVal = config.getValue();
      html = '<div class="profile-edit-options">';
      config.options.forEach(function(opt) {
        const isActive = (opt.value === currentVal) ? ' active' : '';
        html += '<button class="profile-edit-option' + isActive + '" data-value="' + opt.value + '" onclick="selectProfileOption(this)">' +
          '<span class="skill-badge-large ' + opt.cls + '">' + opt.label + '</span>' +
          '<div class="profile-edit-check">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
          '</div>' +
          '</button>';
      });
      html += '</div>';
    } else if (config.type === 'multi') {
      const currentVals = config.getValue();
      html = '<div class="profile-edit-options">';
      config.options.forEach(function(opt) {
        const isActive = currentVals.indexOf(opt) > -1 ? ' active' : '';
        html += '<button class="profile-edit-option multi' + isActive + '" data-value="' + opt + '" onclick="toggleProfileMulti(this)">' +
          '<span class="profile-edit-option-text">' + opt + '</span>' +
          '<div class="profile-edit-check">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
          '</div>' +
          '</button>';
      });
      html += '</div>';
    }

    bodyEl.innerHTML = html;

    // Open modal
    const modal = document.getElementById('profileEditModal');
    if (modal) {
      modal.classList.add('active');
      if (config.type === 'text' || config.type === 'email' || config.type === 'tel') {
        setTimeout(function() {
          const input = document.getElementById('profileEditInput');
          if (input) input.focus();
        }, 300);
      }
    }
    } catch(e) { MTC.warn('editProfileField error:', e); }
  };

  // onclick handler (index.html)
  window.closeProfileEdit = function() {
    const modal = document.getElementById('profileEditModal');
    if (modal) modal.classList.remove('active');
    currentEditField = null;
  };

  // onclick handler (generated HTML)
  window.selectProfileOption = function(btn) {
    btn.parentElement.querySelectorAll('.profile-edit-option').forEach(function(o) {
      o.classList.remove('active');
    });
    btn.classList.add('active');
  };

  // onclick handler (generated HTML)
  window.toggleProfileMulti = function(btn) {
    btn.classList.toggle('active');
  };

  // onclick handler (index.html)
  window.saveProfileEdit = function() {
    try {
    if (!currentEditField) return;
    const config = profileFieldConfigs[currentEditField];
    if (!config) return;

    let value;

    if (config.type === 'text' || config.type === 'email' || config.type === 'tel') {
      const input = document.getElementById('profileEditInput');
      if (!input || !input.value.trim()) {
        showToast('Please enter a value');
        return;
      }
      value = input.value.trim();
    } else if (config.type === 'select') {
      const active = document.querySelector('.profile-edit-option.active');
      if (!active) {
        showToast('Please select an option');
        return;
      }
      value = active.dataset.value;
    } else if (config.type === 'multi') {
      const actives = document.querySelectorAll('.profile-edit-option.multi.active');
      if (actives.length === 0) {
        showToast('Please select at least one option');
        return;
      }
      value = [];
      actives.forEach(function(a) { value.push(a.dataset.value); });
    }

    config.save(value);
    closeProfileEdit();
    showToast('Profile updated \u2713');
    } catch(e) { MTC.warn('saveProfileEdit error:', e); }
  };

  // ============================================
  // UPDATE DISPLAY
  // ============================================
  const chevronSvg = ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';

  function updateProfileDisplay(field) {
    try {
    let el;
    switch (field) {
      case 'name':
        el = document.getElementById('profileFieldName');
        if (el) el.innerHTML = sanitizeHTML(MTC.state.profileData.name) + chevronSvg;
        break;
      case 'email':
        el = document.getElementById('profileFieldEmail');
        if (el) el.innerHTML = sanitizeHTML(MTC.state.profileData.email) + chevronSvg;
        break;
      case 'skill':
        const skillOpt = profileFieldConfigs.skill.options.find(function(o) { return o.value === MTC.state.profileData.skill; });
        if (skillOpt) {
          const levelEl = document.getElementById('playerRatingLevel');
          if (levelEl) {
            levelEl.textContent = skillOpt.level;
            levelEl.className = 'player-rating-level ' + skillOpt.cls;
          }
        }
        break;
      case 'availability':
        el = document.getElementById('profileFieldAvailability');
        if (el) el.innerHTML = sanitizeHTML(MTC.state.profileData.availability.join(', ')) + chevronSvg;
        break;
      case 'playstyle':
        el = document.getElementById('profileFieldPlaystyle');
        if (el) el.innerHTML = sanitizeHTML(MTC.state.profileData.playstyle.join(' & ')) + chevronSvg;
        break;
    }
    } catch(e) { MTC.warn('updateProfileDisplay error:', e); }
  }

  // Initialize profile display on page load
  function initProfileDisplay() {
    try {
    updateProfileDisplay('name');
    updateProfileDisplay('email');
    updateProfileDisplay('skill');
    updateProfileDisplay('availability');
    updateProfileDisplay('playstyle');

    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = MTC.state.profileData.name.toUpperCase();
    } catch(e) { MTC.warn('initProfileDisplay error:', e); }
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileDisplay);
  } else {
    initProfileDisplay();
  }

  // ============================================
  // FAMILY PROFILE SWITCHER
  // ============================================
  // Initialize family state
  MTC.state.familyMembers = MTC.state.familyMembers || [];
  MTC.state.activeFamilyMember = MTC.state.activeFamilyMember || null;

  function getActiveDisplayName() {
    if (MTC.state.activeFamilyMember) return MTC.state.activeFamilyMember.name;
    return MTC.state.currentUser ? MTC.state.currentUser.name : '';
  }

  window.switchFamilyProfile = function(memberId) {
    if (!memberId || memberId === 'primary') {
      MTC.state.activeFamilyMember = null;
      MTC.storage.remove('mtc-active-family-member');
    } else {
      var member = (MTC.state.familyMembers || []).find(function(m) { return m.id === memberId; });
      if (member) {
        MTC.state.activeFamilyMember = member;
        MTC.storage.set('mtc-active-family-member', member);
      }
    }
    // Sync active profile to Supabase
    if (MTC.fn && MTC.fn.apiRequest) {
      var activeProfile = memberId && memberId !== 'primary'
        ? { type: 'family_member', memberId: memberId }
        : { type: 'primary' };
      MTC.fn.apiRequest('/mobile/members', {
        method: 'PATCH',
        body: JSON.stringify({ preferences: { activeProfile: activeProfile } })
      }).catch(function() { MTC.warn('Active profile sync failed'); });
    }
    renderFamilySwitcher();
    showToast('Switched to ' + getActiveDisplayName());
  };

  function renderFamilySwitcher() {
    var container = document.getElementById('familySwitcher');
    if (!container) return;
    var members = MTC.state.familyMembers || [];
    var user = MTC.state.currentUser;
    if (!user || user.membershipType !== 'family' || members.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    var active = MTC.state.activeFamilyMember;
    var html = '<div class="family-switcher-label">Playing as:</div><div class="family-switcher-pills">';
    // Primary account
    html += '<button class="family-pill' + (!active ? ' active' : '') + '" onclick="switchFamilyProfile(\'primary\')">';
    html += sanitizeHTML(user.name) + '</button>';
    // Family members
    members.forEach(function(m) {
      var isActive = active && active.id === m.id;
      html += '<button class="family-pill' + (isActive ? ' active' : '') + '" onclick="switchFamilyProfile(\'' + m.id + '\')">';
      html += '<span class="family-pill-type">' + (m.type === 'junior' ? 'Jr' : '') + '</span>';
      html += sanitizeHTML(m.name) + '</button>';
    });
    html += '</div>';
    container.innerHTML = html;

    // Update profile name display
    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = getActiveDisplayName().toUpperCase();
  }

  // ── Active profile derived properties ──
  window.getActiveAvatar = function() {
    if (MTC.state.activeFamilyMember && MTC.state.activeFamilyMember.avatar) {
      return MTC.state.activeFamilyMember.avatar;
    }
    return MTC.storage.get('mtc-avatar', 'default');
  };
  window.getActiveSkillLevel = function() {
    if (MTC.state.activeFamilyMember && MTC.state.activeFamilyMember.skillLevel) {
      return MTC.state.activeFamilyMember.skillLevel;
    }
    var user = MTC.state.currentUser;
    return user ? (user.skillLevel || 'intermediate') : 'intermediate';
  };

  // ── Family Members Management ──
  var _newFamilyType = 'adult';

  window.selectFamilyType = function(type, btn) {
    _newFamilyType = type;
    document.querySelectorAll('.family-type-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var byField = document.getElementById('familyBirthYearField');
    if (byField) byField.style.display = type === 'junior' ? 'block' : 'none';
  };

  window.showAddFamilyMemberModal = function() {
    _newFamilyType = 'adult';
    var modal = document.getElementById('addFamilyMemberModal');
    if (modal) { modal.style.display = 'flex'; }
    var nameInput = document.getElementById('familyMemberNameInput');
    if (nameInput) { nameInput.value = ''; nameInput.focus(); }
    var byInput = document.getElementById('familyMemberBirthYear');
    if (byInput) byInput.value = '';
    document.querySelectorAll('.family-type-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.type === 'adult');
    });
    var byField = document.getElementById('familyBirthYearField');
    if (byField) byField.style.display = 'none';
  };

  window.closeAddFamilyMemberModal = function() {
    var modal = document.getElementById('addFamilyMemberModal');
    if (modal) modal.style.display = 'none';
  };

  window.addFamilyMember = function() {
    var nameInput = document.getElementById('familyMemberNameInput');
    var name = (nameInput && nameInput.value || '').trim();
    if (!name) { showToast('Please enter a name', 'error'); if (nameInput) nameInput.focus(); return; }
    var birthYear = _newFamilyType === 'junior' ? parseInt(document.getElementById('familyMemberBirthYear').value) || null : null;

    // Limits: max 2 adults, max 4 juniors
    var members = MTC.state.familyMembers || [];
    var adultCount = members.filter(function(m) { return m.type === 'adult'; }).length;
    var juniorCount = members.filter(function(m) { return m.type === 'junior'; }).length;
    if (_newFamilyType === 'adult' && adultCount >= 2) { showToast('Maximum 2 adults per family', 'error'); return; }
    if (_newFamilyType === 'junior' && juniorCount >= 4) { showToast('Maximum 4 juniors per family', 'error'); return; }

    var newMember = { name: name, type: _newFamilyType, birthYear: birthYear };

    // Get user's familyId (stored in profile or create family first)
    var user = MTC.state.currentUser;
    var familyId = user && user.familyId;
    var addMemberRequest = function(fId) {
      return MTC.fn.apiRequest('/mobile/families', {
        method: 'POST',
        body: JSON.stringify({ action: 'addMember', familyId: fId, name: name, type: _newFamilyType, birthYear: birthYear })
      });
    };

    var p;
    if (familyId) {
      p = addMemberRequest(familyId);
    } else {
      // Create family first, then add member
      p = MTC.fn.apiRequest('/mobile/families', {
        method: 'POST',
        body: JSON.stringify({ action: 'createFamily', name: (user ? user.name : '') + "'s Family" })
      }).then(function(res) {
        if (res && res.familyId) {
          if (user) user.familyId = res.familyId;
          return addMemberRequest(res.familyId);
        }
        throw new Error('Failed to create family');
      });
    }
    p.then(function(res) {
      if (res && res.member) {
        MTC.state.familyMembers.push(res.member);
        MTC.storage.set('mtc-family-members', MTC.state.familyMembers);
        renderFamilyMembers();
        renderFamilySwitcher();
        closeAddFamilyMemberModal();
        showToast(name + ' added to your family!');
      }
    }).catch(function() {
      showToast('Failed to add family member', 'error');
    });
  };

  window.removeFamilyMember = function(memberId) {
    var member = (MTC.state.familyMembers || []).find(function(m) { return m.id === memberId; });
    if (!member) return;
    if (!confirm('Remove ' + member.name + ' from your family?')) return;

    MTC.fn.apiRequest('/mobile/families', {
      method: 'DELETE',
      body: JSON.stringify({ memberId: memberId })
    }).then(function() {
      MTC.state.familyMembers = MTC.state.familyMembers.filter(function(m) { return m.id !== memberId; });
      MTC.storage.set('mtc-family-members', MTC.state.familyMembers);
      // If active profile was this member, switch back to primary
      if (MTC.state.activeFamilyMember && MTC.state.activeFamilyMember.id === memberId) {
        switchFamilyProfile('primary');
      }
      renderFamilyMembers();
      renderFamilySwitcher();
      showToast(member.name + ' removed');
    }).catch(function() {
      showToast('Failed to remove family member', 'error');
    });
  };

  function renderFamilyMembers() {
    var section = document.getElementById('familyMembersSection');
    var list = document.getElementById('familyMembersList');
    if (!section || !list) return;
    var members = MTC.state.familyMembers || [];
    var user = MTC.state.currentUser;
    if (!user || user.membershipType !== 'family') {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    if (members.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:16px 0;color:var(--text-muted);font-size:13px;">No family members added yet. Add one above to manage bookings for them here.</div>';
      return;
    }
    var html = '';
    members.forEach(function(m) {
      var typeLabel = m.type === 'junior' ? '<span class="family-member-type junior">Junior</span>' : '<span class="family-member-type adult">Adult</span>';
      var skillLabel = m.skillLevel ? m.skillLevel.charAt(0).toUpperCase() + m.skillLevel.slice(1) : 'Not set';
      html += '<div class="family-member-card">' +
        '<div class="family-member-info">' +
          '<div class="family-member-name">' + sanitizeHTML(m.name) + ' ' + typeLabel + '</div>' +
          '<div class="family-member-skill">Skill: ' + sanitizeHTML(skillLabel) + '</div>' +
        '</div>' +
        '<button class="family-member-remove" onclick="removeFamilyMember(\'' + m.id + '\')" aria-label="Remove ' + sanitizeHTML(m.name) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
      '</div>';
    });
    list.innerHTML = html;
  }
  window.renderFamilyMembers = renderFamilyMembers;

  // Expose for other modules
  window.getActiveDisplayName = getActiveDisplayName;
  window.renderFamilySwitcher = renderFamilySwitcher;

  // Render on init if family data exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { renderFamilySwitcher(); renderFamilyMembers(); });
  } else {
    renderFamilySwitcher();
    renderFamilyMembers();
  }

  // ============================================
  // INTERCLUB TEAM SELECTION
  // ============================================
  window.selectInterclubTeam = function(team, btnEl) {
    // Update button visuals
    var allBtns = document.querySelectorAll('#interclubTeamBtns .interclub-team-btn');
    allBtns.forEach(function(b) {
      b.classList.remove('active');
      b.style.background = 'var(--bg-secondary)';
      b.style.color = b.getAttribute('data-team') === 'none' ? 'var(--text-muted)' : 'var(--text-primary)';
      b.style.borderColor = 'var(--border-color)';
    });
    if (btnEl) {
      btnEl.classList.add('active');
      btnEl.style.background = 'var(--volt)';
      btnEl.style.color = '#000';
      btnEl.style.borderColor = 'var(--volt)';
    }

    // Save to localStorage
    var user = MTC.storage.get('mtc-user', null) || MTC.storage.get('mtc-current-user', null);
    if (user) {
      user.interclubTeam = team;
      MTC.storage.set('mtc-user', user);
      MTC.storage.set('mtc-current-user', user);
    }

    // Sync to Supabase
    if (MTC.fn && MTC.fn.apiRequest) {
      MTC.fn.apiRequest('/mobile/settings', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'setInterclubTeam', team: team })
      }).then(function() {
        showToast(team === 'none' ? 'Removed from interclub team' : 'Set to Interclub ' + team.toUpperCase() + ' Team');
      }).catch(function() {
        showToast('Failed to update team', 'error');
      });
    }
  };

  // Initialize interclub team + gate code on profile screen load
  window.initProfileExtras = function() {
    // Set interclub team button state
    var user = MTC.storage.get('mtc-user', null) || MTC.storage.get('mtc-current-user', null);
    var team = (user && user.interclubTeam) ? user.interclubTeam : 'none';
    var allBtns = document.querySelectorAll('#interclubTeamBtns .interclub-team-btn');
    allBtns.forEach(function(b) {
      var btnTeam = b.getAttribute('data-team');
      if (btnTeam === team) {
        b.classList.add('active');
        b.style.background = 'var(--volt)';
        b.style.color = '#000';
        b.style.borderColor = 'var(--volt)';
      } else {
        b.classList.remove('active');
        b.style.background = 'var(--bg-secondary)';
        b.style.color = btnTeam === 'none' ? 'var(--text-muted)' : 'var(--text-primary)';
        b.style.borderColor = 'var(--border-color)';
      }
    });

    // Show gate code from club settings
    var settings = MTC.storage.get('mtc-club-settings', null);
    var gateSection = document.getElementById('gateCodeSection');
    var gateValue = document.getElementById('gateCodeValue');
    if (settings && settings.gate_code && gateSection && gateValue) {
      gateValue.textContent = settings.gate_code;
      gateSection.style.display = 'block';
    }
  };
})();
