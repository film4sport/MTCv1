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
    skillNTRP: '',
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

  // Private helper
  function saveProfileToStorage() {
    MTC.storage.set('mtc-profile', MTC.state.profileData);
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
        { value: 'Beginner (2.0)', label: 'Beginner (2.0)', cls: 'beginner', ntrp: '2.0', level: 'BEGINNER' },
        { value: 'Beginner+ (2.5)', label: 'Beginner+ (2.5)', cls: 'beginner', ntrp: '2.5', level: 'BEGINNER' },
        { value: 'Intermediate (3.0)', label: 'Intermediate (3.0)', cls: 'intermediate', ntrp: '3.0', level: 'INTERMEDIATE' },
        { value: 'Intermediate (3.5)', label: 'Intermediate (3.5)', cls: 'intermediate', ntrp: '3.5', level: 'INTERMEDIATE' },
        { value: 'Intermediate (4.0)', label: 'Intermediate (4.0)', cls: 'intermediate', ntrp: '4.0', level: 'INTERMEDIATE' },
        { value: 'Advanced (4.5)', label: 'Advanced (4.5)', cls: 'advanced', ntrp: '4.5', level: 'ADVANCED' },
        { value: 'Advanced (5.0)', label: 'Advanced (5.0)', cls: 'advanced', ntrp: '5.0', level: 'ADVANCED' },
        { value: 'Expert (5.5+)', label: 'Expert (5.5+)', cls: 'advanced', ntrp: '5.5+', level: 'EXPERT' }
      ],
      getValue: function() { return MTC.state.profileData.skill; },
      save: function(val) {
        MTC.state.profileData.skill = val;
        const opt = profileFieldConfigs.skill.options.find(function(o) { return o.value === val; });
        if (opt) {
          MTC.state.profileData.skillClass = opt.cls;
          MTC.state.profileData.skillNTRP = opt.ntrp;
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
    } catch(e) { console.warn('editProfileField error:', e); }
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
    } catch(e) { console.warn('saveProfileEdit error:', e); }
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
          const ntrpEl = document.getElementById('playerRatingNTRP');
          const levelEl = document.getElementById('playerRatingLevel');
          if (ntrpEl) ntrpEl.textContent = skillOpt.ntrp;
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
    } catch(e) { console.warn('updateProfileDisplay error:', e); }
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
    } catch(e) { console.warn('initProfileDisplay error:', e); }
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

  // Expose for other modules
  window.getActiveDisplayName = getActiveDisplayName;
  window.renderFamilySwitcher = renderFamilySwitcher;

  // Render on init if family data exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFamilySwitcher);
  } else {
    renderFamilySwitcher();
  }
})();
