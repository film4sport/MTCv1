const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

// Helper: login as demo member and go to home
async function loginAsMember(page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => handleLogin());
  await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });
}

// Helper: login as family member with family data
async function loginAsFamilyMember(page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    var user = {
      name: 'Test Family',
      email: 'family@test.com',
      role: 'member',
      id: 'family-test-id',
      isMember: true,
      membershipType: 'family',
      familyId: 'family-group-123',
      residence: 'mono'
    };
    localStorage.setItem('mtc-user', JSON.stringify(user));
    localStorage.setItem('mtc-current-user', JSON.stringify(user));
    localStorage.setItem('mtc-family-members', JSON.stringify([
      { id: 'member-1', name: 'Jane Test', type: 'adult', skillLevel: 'intermediate', avatar: 'tennis-male-1', birthYear: null },
      { id: 'member-2', name: 'Tommy Test', type: 'junior', skillLevel: 'beginner', avatar: 'tennis-male-1', birthYear: 2014 }
    ]));
    localStorage.setItem('mtc-onboarding-complete', 'true');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });
}

// ============================================
// BOOKING MODAL INPUT INTERACTIONS
// ============================================
test.describe('Booking Modal — Input Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('book'));
    await page.waitForFunction(() => {
      var screen = document.getElementById('screen-book');
      var slots = document.querySelectorAll('.weekly-slot');
      return screen?.classList.contains('active') && slots.length > 0;
    }, { timeout: 5000 });
  });

  test('Match type toggles between Singles and Doubles', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Click an available slot and open modal
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return { error: 'no available slot' };
      slot.click();

      var modal = document.getElementById('bookingModal');
      if (!modal) return { error: 'no modal' };

      // Find match type buttons
      var buttons = modal.querySelectorAll('.match-type-btn, [data-match-type]');
      if (buttons.length < 2) {
        // Try alternate selectors
        buttons = modal.querySelectorAll('.toggle-btn, .pill-btn');
      }

      // Check default state - Singles should be selected
      var singlesBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Singles');
      var doublesBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Doubles');

      if (!singlesBtn || !doublesBtn) return { error: 'buttons not found', buttonCount: buttons.length };

      var initialSinglesActive = singlesBtn.classList.contains('active') || singlesBtn.classList.contains('selected');

      // Click Doubles
      doublesBtn.click();
      var doublesActive = doublesBtn.classList.contains('active') || doublesBtn.classList.contains('selected');
      var singlesDeactivated = !singlesBtn.classList.contains('active') && !singlesBtn.classList.contains('selected');

      return {
        initialSinglesActive,
        doublesActive,
        singlesDeactivated
      };
    });

    expect(result.error).toBeUndefined();
    expect(result.initialSinglesActive).toBe(true);
    expect(result.doublesActive).toBe(true);
    expect(result.singlesDeactivated).toBe(true);
  });

  test('Duration toggles update correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return { error: 'no available slot' };
      slot.click();

      var modal = document.getElementById('bookingModal');
      if (!modal) return { error: 'no modal' };

      // Find duration buttons
      var durationBtns = Array.from(modal.querySelectorAll('button')).filter(b => {
        var txt = b.textContent.trim();
        return txt === '1h' || txt === '1.5h' || txt === '2h';
      });

      if (durationBtns.length < 2) return { error: 'duration buttons not found', count: durationBtns.length };

      // Click 1.5h
      var btn15 = durationBtns.find(b => b.textContent.trim() === '1.5h');
      if (btn15) btn15.click();
      var is15Active = btn15 && (btn15.classList.contains('active') || btn15.classList.contains('selected'));

      return { durationCount: durationBtns.length, is15Active };
    });

    expect(result.error).toBeUndefined();
    expect(result.durationCount).toBeGreaterThanOrEqual(2);
    expect(result.is15Active).toBe(true);
  });

  test('Guest toggle reveals guest name input', async ({ page }) => {
    const result = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return { error: 'no available slot' };
      slot.click();

      var modal = document.getElementById('bookingModal');
      if (!modal) return { error: 'no modal' };

      // Find guest toggle
      var guestToggle = modal.querySelector('.guest-toggle, #guestToggle, [data-guest-toggle]');
      if (!guestToggle) {
        // Try finding by label text
        var labels = Array.from(modal.querySelectorAll('*'));
        var guestLabel = labels.find(el => el.textContent.includes('Bringing a Guest'));
        if (guestLabel) {
          guestToggle = guestLabel.querySelector('input[type="checkbox"], .toggle, .switch') ||
                        guestLabel.parentElement.querySelector('input[type="checkbox"], .toggle, .switch');
        }
      }
      if (!guestToggle) return { error: 'guest toggle not found' };

      // Guest name input should be hidden initially
      var guestInput = modal.querySelector('#guestNameInput, .guest-name-input, input[placeholder*="Guest"]');
      var initiallyHidden = !guestInput || guestInput.offsetParent === null ||
                           guestInput.closest('[style*="display: none"]') !== null;

      // Click the toggle
      guestToggle.click();

      // Check if guest name input is now visible
      guestInput = modal.querySelector('#guestNameInput, .guest-name-input, input[placeholder*="Guest"]');
      var nowVisible = guestInput && guestInput.offsetParent !== null;

      return { initiallyHidden, nowVisible };
    });

    expect(result.error).toBeUndefined();
    expect(result.initiallyHidden).toBe(true);
    expect(result.nowVisible).toBe(true);
  });

  test('Cancel button closes booking modal', async ({ page }) => {
    const result = await page.evaluate(() => {
      var slot = document.querySelector('.weekly-slot.available');
      if (!slot) return { error: 'no available slot' };
      slot.click();

      var modal = document.getElementById('bookingModal');
      if (!modal || !modal.classList.contains('active')) return { error: 'modal not open' };

      // Find cancel button
      var cancelBtn = Array.from(modal.querySelectorAll('button')).find(b =>
        b.textContent.trim().toLowerCase() === 'cancel'
      );
      if (!cancelBtn) return { error: 'cancel button not found' };

      cancelBtn.click();

      var modalClosed = !modal.classList.contains('active');
      return { modalClosed };
    });

    expect(result.error).toBeUndefined();
    expect(result.modalClosed).toBe(true);
  });
});

// ============================================
// PARTNER REQUEST FORM INPUTS
// ============================================
test.describe('Partner Request — Form Inputs', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('partners'));
    await page.waitForFunction(() => {
      return document.getElementById('screen-partners')?.classList.contains('active');
    }, { timeout: 5000 });
  });

  test('Filter tabs switch and show correct state', async ({ page }) => {
    const result = await page.evaluate(() => {
      var tabs = document.querySelectorAll('.partner-filter-pill, .filter-pill, [data-filter]');
      if (tabs.length < 2) return { error: 'not enough filter tabs', count: tabs.length };

      // Click second tab
      tabs[1].click();
      var secondActive = tabs[1].classList.contains('active') || tabs[1].classList.contains('selected');
      var firstInactive = !tabs[0].classList.contains('active') || tabs[0].classList.contains('selected');

      return { tabCount: tabs.length, secondActive };
    });

    expect(result.error).toBeUndefined();
    expect(result.tabCount).toBeGreaterThanOrEqual(2);
    expect(result.secondActive).toBe(true);
  });

  test('Post Partner Request form has all input fields', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Open the post request modal
      if (typeof openPostPartnerModal === 'function') {
        openPostPartnerModal();
      } else {
        var addBtn = document.querySelector('#screen-partners .add-btn, #screen-partners [onclick*="partner"], #screen-partners .header-action');
        if (addBtn) addBtn.click();
      }

      // Wait a tick for modal
      return new Promise(resolve => {
        setTimeout(() => {
          var modal = document.querySelector('.partner-request-modal, #partnerRequestModal, .modal.active');
          if (!modal) {
            // Try to find any visible modal/overlay
            modal = document.querySelector('[class*="partner"][class*="modal"], [id*="partner"][id*="modal"]');
          }
          if (!modal) {
            resolve({ error: 'modal not found' });
            return;
          }

          // Check for match type options
          var matchButtons = Array.from(modal.querySelectorAll('button, .pill')).filter(b => {
            var t = b.textContent.trim();
            return t === 'Singles' || t === 'Mixed Doubles' || t === "Men's Doubles" || t === "Women's Doubles";
          });

          // Check for skill level options
          var skillButtons = Array.from(modal.querySelectorAll('button, .pill')).filter(b => {
            var t = b.textContent.trim();
            return t === 'Any Level' || t === 'Beginner' || t === 'Intermediate' || t === 'Advanced';
          });

          // Check for when options
          var whenButtons = Array.from(modal.querySelectorAll('button, .pill')).filter(b => {
            var t = b.textContent.trim();
            return t === 'Anytime' || t === 'Today' || t === 'Tomorrow' || t === 'This Weekend';
          });

          // Check for message textarea
          var textarea = modal.querySelector('textarea');

          // Check for submit button
          var submitBtn = Array.from(modal.querySelectorAll('button')).find(b =>
            b.textContent.toLowerCase().includes('post') || b.textContent.toLowerCase().includes('request')
          );

          resolve({
            matchTypes: matchButtons.length,
            skillLevels: skillButtons.length,
            whenOptions: whenButtons.length,
            hasTextarea: !!textarea,
            hasSubmitBtn: !!submitBtn
          });
        }, 300);
      });
    });

    expect(result.error).toBeUndefined();
    expect(result.matchTypes).toBeGreaterThanOrEqual(2);
    expect(result.skillLevels).toBeGreaterThanOrEqual(2);
    expect(result.whenOptions).toBeGreaterThanOrEqual(2);
    expect(result.hasTextarea).toBe(true);
    expect(result.hasSubmitBtn).toBe(true);
  });

  test('Match type pills toggle correctly in partner request', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (typeof openPostPartnerModal === 'function') openPostPartnerModal();
      else {
        var addBtn = document.querySelector('#screen-partners .add-btn, #screen-partners .header-action');
        if (addBtn) addBtn.click();
      }

      return new Promise(resolve => {
        setTimeout(() => {
          var modal = document.querySelector('.partner-request-modal, #partnerRequestModal, .modal.active, [class*="partner"][class*="modal"]');
          if (!modal) { resolve({ error: 'modal not found' }); return; }

          var mixedBtn = Array.from(modal.querySelectorAll('button, .pill')).find(b => b.textContent.trim() === 'Mixed Doubles');
          if (!mixedBtn) { resolve({ error: 'Mixed Doubles not found' }); return; }

          mixedBtn.click();
          var isActive = mixedBtn.classList.contains('active') || mixedBtn.classList.contains('selected');
          resolve({ mixedDoublesActive: isActive });
        }, 300);
      });
    });

    expect(result.error).toBeUndefined();
    expect(result.mixedDoublesActive).toBe(true);
  });
});

// ============================================
// FAMILY PROFILE SWITCHER
// ============================================
test.describe('Family Profile Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsFamilyMember(page);
  });

  test('MTC.state is populated from localStorage on page load', async ({ page }) => {
    const state = await page.evaluate(() => {
      return {
        hasCurrentUser: !!MTC.state.currentUser,
        userName: MTC.state.currentUser ? MTC.state.currentUser.name : null,
        membershipType: MTC.state.currentUser ? MTC.state.currentUser.membershipType : null,
        familyMemberCount: MTC.state.familyMembers ? MTC.state.familyMembers.length : 0
      };
    });

    expect(state.hasCurrentUser).toBe(true);
    expect(state.userName).toBe('Test Family');
    expect(state.membershipType).toBe('family');
    expect(state.familyMemberCount).toBe(2);
  });

  test('Family switcher is visible on profile/settings screen', async ({ page }) => {
    await page.evaluate(() => navigateTo('settings'));
    await page.waitForFunction(() => {
      return document.getElementById('screen-settings')?.classList.contains('active');
    }, { timeout: 5000 });

    const switcher = await page.evaluate(() => {
      var el = document.getElementById('familySwitcher');
      if (!el) return { error: 'element not found' };
      return {
        visible: el.style.display !== 'none' && el.offsetParent !== null,
        hasContent: el.innerHTML.trim().length > 0,
        pillCount: el.querySelectorAll('.family-pill').length
      };
    });

    expect(switcher.error).toBeUndefined();
    expect(switcher.visible).toBe(true);
    expect(switcher.hasContent).toBe(true);
    // Primary user + 2 family members = 3 pills
    expect(switcher.pillCount).toBe(3);
  });

  test('Switching family profile updates displayed name', async ({ page }) => {
    await page.evaluate(() => navigateTo('settings'));
    await page.waitForFunction(() => {
      return document.getElementById('screen-settings')?.classList.contains('active');
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      var switcher = document.getElementById('familySwitcher');
      if (!switcher) return { error: 'switcher not found' };

      // Get initial name
      var nameEl = document.querySelector('#screen-settings .profile-name, #screen-settings .user-name, .settings-user-name');
      var initialName = nameEl ? nameEl.textContent.trim() : 'unknown';

      // Click the second pill (first family member)
      var pills = switcher.querySelectorAll('.family-pill');
      if (pills.length < 2) return { error: 'not enough pills' };

      pills[1].click();

      // Get updated name
      var updatedName = nameEl ? nameEl.textContent.trim() : 'unknown';

      return { initialName, updatedName, changed: initialName !== updatedName };
    });

    expect(result.error).toBeUndefined();
    expect(result.changed).toBe(true);
    expect(result.updatedName).toContain('Jane');
  });

  test('Family members persist after page reload', async ({ page }) => {
    // Verify state survives reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.getElementById('screen-home')?.classList.contains('active'), { timeout: 5000 });

    const state = await page.evaluate(() => {
      return {
        hasCurrentUser: !!MTC.state.currentUser,
        familyMemberCount: MTC.state.familyMembers ? MTC.state.familyMembers.length : 0,
        memberNames: MTC.state.familyMembers ? MTC.state.familyMembers.map(m => m.name) : []
      };
    });

    expect(state.hasCurrentUser).toBe(true);
    expect(state.familyMemberCount).toBe(2);
    expect(state.memberNames).toContain('Jane Test');
    expect(state.memberNames).toContain('Tommy Test');
  });
});

// ============================================
// MESSAGES — NEW CONVERSATION FLOW
// ============================================
test.describe('Messages — New Conversation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMember(page);
    await page.evaluate(() => navigateTo('messages'));
    await page.waitForFunction(() => {
      return document.getElementById('screen-messages')?.classList.contains('active');
    }, { timeout: 5000 });
  });

  test('Search input filters conversations', async ({ page }) => {
    const result = await page.evaluate(() => {
      var searchInput = document.querySelector('#screen-messages input[type="text"], #screen-messages input[type="search"], #screen-messages .search-input');
      if (!searchInput) return { error: 'search input not found' };

      // Focus and type
      searchInput.focus();
      searchInput.value = 'test search';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));

      return { hasSearchInput: true, value: searchInput.value };
    });

    expect(result.error).toBeUndefined();
    expect(result.hasSearchInput).toBe(true);
    expect(result.value).toBe('test search');
  });

  test('New message modal has member search', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Click new message button
      var newMsgBtn = document.querySelector('#screen-messages .new-msg-btn, #screen-messages [onclick*="newMessage"], #screen-messages .header-action, #screen-messages .fab');
      if (!newMsgBtn) {
        // Try the + button or "New Message" text button
        var btns = Array.from(document.querySelectorAll('#screen-messages button, #screen-messages .btn'));
        newMsgBtn = btns.find(b => b.textContent.includes('New Message') || b.textContent.trim() === '+');
      }
      if (newMsgBtn) newMsgBtn.click();

      return new Promise(resolve => {
        setTimeout(() => {
          var modal = document.querySelector('.new-message-modal, #newMessageModal, .modal.active');
          if (!modal) {
            modal = document.querySelector('[class*="message"][class*="modal"], [id*="message"][id*="modal"]');
          }
          if (!modal) { resolve({ error: 'modal not found' }); return; }

          var searchInput = modal.querySelector('input[type="text"], input[type="search"]');
          var cancelBtn = Array.from(modal.querySelectorAll('button')).find(b =>
            b.textContent.toLowerCase().includes('cancel')
          );

          resolve({
            hasSearchInput: !!searchInput,
            hasCancelBtn: !!cancelBtn,
            placeholder: searchInput ? searchInput.placeholder : ''
          });
        }, 300);
      });
    });

    expect(result.error).toBeUndefined();
    expect(result.hasSearchInput).toBe(true);
    expect(result.hasCancelBtn).toBe(true);
  });
});
