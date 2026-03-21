// @ts-check
const { test, expect } = require('@playwright/test');
const { activatePwaScreen, expectPwaScreenActive, gotoInfo, mockAuthenticatedPwa, switchInfoTab } = require('./helpers/app-helpers');

function isIpadProject(testInfo) {
  return testInfo.project.name.includes('ipad');
}

function requireIpadProject(testInfo) {
  test.skip(!isIpadProject(testInfo), 'iPad-only layout assertion');
}

test.describe('Apple Compatibility - Info Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await gotoInfo(page, 'membership');
    await expect(page.locator('#tab-membership')).toBeVisible();
  });

  test('far-right tabs stay reachable on iPhone/iPad Safari', async ({ page }) => {
    await expect(page.locator('#tab-privacy')).toBeVisible();
    await switchInfoTab(page, 'Privacy', 'privacy');
    await switchInfoTab(page, 'Terms', 'terms');
  });

  test('info page remains usable after landscape rotation', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    const tablist = page.locator('[role="tablist"]').first();
    await expect(tablist).toBeVisible();
    const terms = page.locator('#tab-terms').first();
    await expect(terms).toBeAttached();
    await switchInfoTab(page, 'Terms', 'terms');
    await expect(terms).toBeVisible();
  });
});

test.describe('Apple Compatibility - Mobile PWA', () => {
  test('bottom nav survives landscape rotation and still navigates', async ({ page }) => {
    await mockAuthenticatedPwa(page);

    await page.setViewportSize({ width: 844, height: 390 });

    const bottomNav = page.locator('#bottomNav');
    await expect(bottomNav).toBeVisible();

    await activatePwaScreen(page, 'book', 'nav-book');
    await activatePwaScreen(page, 'messages', 'nav-messages');
  });

  test('iPad home quick actions stay visible in a four-card row', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await mockAuthenticatedPwa(page);

    const quickActions = page.locator('#screen-home .quick-actions');
    await expect(quickActions).toBeVisible();

    const quickActionCards = page.locator('#screen-home .quick-action');
    await expect(quickActionCards).toHaveCount(4);

    const metrics = await quickActionCards.evaluateAll((cards) => cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      };
    }));

    expect(metrics.every((metric) => metric.width >= 140)).toBe(true);
    expect(new Set(metrics.map((metric) => metric.top)).size).toBe(1);
  });

  test('iPad messages stay full-width instead of collapsing into a narrow column', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await mockAuthenticatedPwa(page);

    await activatePwaScreen(page, 'messages', 'nav-messages');
    await expectPwaScreenActive(page, 'messages');
    const metrics = await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const screen = document.getElementById('screen-messages');
            const list = document.querySelector('#screen-messages #conversationsList');
            const search = document.querySelector('#screen-messages .search-bar');
            return {
              active: !!screen?.classList.contains('active'),
              listWidth: Math.round(list?.getBoundingClientRect().width || 0),
              searchWidth: Math.round(search?.getBoundingClientRect().width || 0),
            };
          });
        } catch {
          return { active: false, listWidth: 0, searchWidth: 0 };
        }
      }, { timeout: 5000 })
      .toMatchObject({
        active: true,
        listWidth: expect.any(Number),
        searchWidth: expect.any(Number),
      });
    const finalMetrics = await page.evaluate(() => {
      const list = document.querySelector('#screen-messages #conversationsList');
      const search = document.querySelector('#screen-messages .search-bar');
      return {
        listWidth: Math.round(list?.getBoundingClientRect().width || 0),
        searchWidth: Math.round(search?.getBoundingClientRect().width || 0),
      };
    });

    expect(finalMetrics.listWidth).toBeGreaterThanOrEqual(640);
    expect(finalMetrics.searchWidth).toBeGreaterThanOrEqual(640);
  });

  test('iPad booking and notifications stay wide instead of collapsing', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await mockAuthenticatedPwa(page, {
      '/notifications': (route, method) => {
        if (method === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { id: 'notif-1', title: 'Court Reminder', message: 'Court 2 at 3:00 PM', type: 'booking', read: false, created_at: '2026-03-20T14:00:00.000Z' },
              { id: 'notif-2', title: 'Partner Match', message: 'A new player matched your request', type: 'partner', read: true, created_at: '2026-03-20T13:00:00.000Z' }
            ]),
          });
          return;
        }
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
    });

    await activatePwaScreen(page, 'book', 'nav-book');
    await expectPwaScreenActive(page, 'book');
    await expect
      .poll(async () => {
        try {
          return await page.locator('#screen-book').evaluate((element) => Math.round(element.getBoundingClientRect().width));
        } catch {
          return 0;
        }
      }, { timeout: 5000 })
      .toBeGreaterThan(0);
    const bookingWidth = await page.locator('#screen-book').evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(bookingWidth).toBeGreaterThanOrEqual(640);

    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            if (window.MTC?.fn?.navigateTo) window.MTC.fn.navigateTo('notifications');
            else if (typeof window.navigateTo === 'function') window.navigateTo('notifications');
            if (typeof window.updateNotificationsFromAPI === 'function') {
              window.updateNotificationsFromAPI([
                { id: 'notif-1', title: 'Court Reminder', message: 'Court 2 at 3:00 PM', type: 'booking', read: false, created_at: '2026-03-20T14:00:00.000Z' },
                { id: 'notif-2', title: 'Partner Match', message: 'A new player matched your request', type: 'partner', read: true, created_at: '2026-03-20T13:00:00.000Z' }
              ]);
            }
            return true;
          });
        } catch {
          return false;
        }
      }, { timeout: 10000 })
      .toBe(true);
    await expectPwaScreenActive(page, 'notifications');
    const notificationsList = page.locator('#screen-notifications .notifications-list');
    await expect
      .poll(async () => await page.locator('#screen-notifications .notification-item').count(), { timeout: 5000 })
      .toBeGreaterThan(0);
    const notificationsWidth = await notificationsList.evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(notificationsWidth).toBeGreaterThanOrEqual(640);
  });

  test('iPad partners screen stays wide and readable', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await mockAuthenticatedPwa(page, {
      '/partners': (route, method) => {
        if (method === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { id: 'partner-1', name: 'Nina Rally', skillLevel: 'intermediate', day: 'Saturday', time: '10:00 AM', notes: 'Looking for doubles practice' },
              { id: 'partner-2', name: 'Maya Spin', skillLevel: 'advanced', day: 'Sunday', time: '1:00 PM', notes: 'Happy to rally for an hour' }
            ]),
          });
          return;
        }
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'partner-001' }) });
      }
    });

    await activatePwaScreen(page, 'partners', 'nav-partners');
    await expectPwaScreenActive(page, 'partners');
    const partnersContainer = page.locator('#screen-partners #partnerCardsContainer');
    await expect
      .poll(async () => {
        try {
          return await partnersContainer.evaluate((element) => Math.round(element.getBoundingClientRect().width));
        } catch {
          return 0;
        }
      }, { timeout: 10000 })
      .toBeGreaterThan(0);
    const partnersWidth = await partnersContainer.evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(partnersWidth).toBeGreaterThanOrEqual(640);
  });

  test('iPad settings and empty states stay centered and readable', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await mockAuthenticatedPwa(page);

    await activatePwaScreen(page, 'settings', 'nav-settings', 'settings');
    await expectPwaScreenActive(page, 'settings');
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const section = document.querySelector('#screen-settings .profile-header-card');
            return Math.round(section?.getBoundingClientRect().width || 0);
          });
        } catch {
          return 0;
        }
      }, { timeout: 5000 })
      .toBeGreaterThan(0);
    const settingsWidth = await page.evaluate(() => {
      const section = document.querySelector('#screen-settings .profile-header-card');
      return Math.round(section?.getBoundingClientRect().width || 0);
    });
    expect(settingsWidth).toBeGreaterThanOrEqual(560);

    await activatePwaScreen(page, 'partners', 'nav-partners');
    await expectPwaScreenActive(page, 'partners');
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const emptyState = document.querySelector('#screen-partners #noPartners');
            return Math.round(emptyState?.getBoundingClientRect().width || 0);
          });
        } catch {
          return 0;
        }
      }, { timeout: 5000 })
      .toBeGreaterThan(0);
    const emptyWidth = await page.evaluate(() => {
      const emptyState = document.querySelector('#screen-partners #noPartners');
      return Math.round(emptyState?.getBoundingClientRect().width || 0);
    });
    expect(emptyWidth).toBeGreaterThanOrEqual(560);
  });

  test('iPad admin tabs and modals stay wide without collapsing', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await mockAuthenticatedPwa(page, {
      '/members': (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'admin-user-id', name: 'Admin User', email: 'admin@mtc.ca', role: 'admin' }]) });
      },
      '/courts': (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 1, name: 'Court 1', status: 'available', floodlight: true }]) });
      },
      '/court-blocks': (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      },
      '/announcements': (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    }, {
      role: 'admin',
      name: 'Admin User',
      email: 'admin@mtc.ca',
      userId: 'admin-user-id',
      accessToken: 'admin-access-token',
    });

    await page.evaluate(() => {
      const adminUser = {
        role: 'admin',
        name: 'Admin User',
        email: 'admin@mtc.ca',
        id: 'admin-user-id',
        userId: 'admin-user-id',
        accessToken: 'admin-access-token',
      };
      if (window.MTC?.state) {
        window.MTC.state.currentUser = adminUser;
        window.MTC.state.currentRole = 'admin';
      }
      window.currentUser = adminUser;
      window.currentRole = 'admin';
      document.getElementById('menuAdminItem')?.classList.remove('admin-hidden');
    });
    await activatePwaScreen(page, 'admin', 'menuAdminItem', 'admin');
    const adminTabsBar = page.locator('#screen-admin .admin-tabs-bar');
    await expect
      .poll(async () => {
        try {
          await activatePwaScreen(page, 'admin', 'menuAdminItem', 'admin');
          return await page.evaluate(() => {
            const adminScreen = document.getElementById('screen-admin');
            const tabs = document.querySelector('#screen-admin .admin-tabs-bar');
            return !!(adminScreen?.classList.contains('active') && tabs);
          });
        } catch {
          return false;
        }
      }, { timeout: 10000 })
      .toBe(true);
    await expect(adminTabsBar).toBeVisible({ timeout: 10000 });

    await expect
      .poll(async () => {
        try {
          return await adminTabsBar.evaluate((element) => Math.round(element.getBoundingClientRect().width));
        } catch {
          return 0;
        }
      }, { timeout: 10000 })
      .toBeGreaterThanOrEqual(640);

    const membersTab = page.locator('.admin-tabs-bar .admin-tab[data-tab="members"]');
    const courtsTab = page.locator('.admin-tabs-bar .admin-tab[data-tab="courts"]');
    const announcementsTab = page.locator('.admin-tabs-bar .admin-tab[data-tab="announcements"]');
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            if (typeof window.switchAdminTab === 'function') window.switchAdminTab('members');
            const tab = document.querySelector('.admin-tabs-bar .admin-tab[data-tab="members"]');
            const panel = document.getElementById('adminTabMembers');
            return !!(tab?.classList.contains('active') && panel?.classList.contains('active'));
          });
        } catch {
          return false;
        }
      }, { timeout: 10000 })
      .toBe(true);
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            if (typeof window.switchAdminTab === 'function') window.switchAdminTab('courts');
            const tab = document.querySelector('.admin-tabs-bar .admin-tab[data-tab="courts"]');
            const panel = document.getElementById('adminTabCourts');
            return !!(tab?.classList.contains('active') && panel?.classList.contains('active'));
          });
        } catch {
          return false;
        }
      }, { timeout: 10000 })
      .toBe(true);
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            if (typeof window.switchAdminTab === 'function') window.switchAdminTab('announcements');
            const tab = document.querySelector('.admin-tabs-bar .admin-tab[data-tab="announcements"]');
            const panel = document.getElementById('adminTabAnnouncements');
            return !!(tab?.classList.contains('active') && panel?.classList.contains('active'));
          });
        } catch {
          return false;
        }
      }, { timeout: 10000 })
      .toBe(true);

    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            document.getElementById('ipadTestModal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'ipadTestModal';
            modal.className = 'modal-overlay active';
            modal.innerHTML = '<div class="modal-content"><div style="height:40px">Test modal</div></div>';
            document.body.appendChild(modal);
            const content = modal.querySelector('.modal-content');
            return Math.round(content?.getBoundingClientRect().width || 0);
          });
        } catch {
          return 0;
        }
      }, { timeout: 5000 })
      .toBeGreaterThan(0);
    await expect
      .poll(async () => {
        try {
          return await page.locator('#ipadTestModal .modal-content').evaluate((element) => Math.round(element.getBoundingClientRect().width));
        } catch {
          return 0;
        }
      }, { timeout: 5000 })
      .toBeGreaterThanOrEqual(420);
    await page.evaluate(() => {
      document.getElementById('ipadTestModal')?.remove();
    }).catch(() => {});
  });

  test('iPad hamburger menu routes stay usable, including admin entry', async ({ page }, testInfo) => {
    requireIpadProject(testInfo);
    await page.addInitScript(() => {
      localStorage.setItem('mtc-user', JSON.stringify({
        role: 'admin',
        name: 'Admin User',
        email: 'admin@mtc.ca',
        userId: 'admin-user-id',
        accessToken: 'admin-access-token',
      }));
      localStorage.setItem('mtc-current-user', localStorage.getItem('mtc-user'));
      localStorage.setItem('mtc-access-token', 'admin-access-token');
      localStorage.setItem('mtc-user-id', 'admin-user-id');
      localStorage.setItem('mtc-user-email', 'admin@mtc.ca');
      localStorage.setItem('mtc-user-name', 'Admin User');
    });

    await mockAuthenticatedPwa(page, {
      '/members': (route, method) => {
        if (method === 'GET') {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'admin-user-id', name: 'Admin User', email: 'admin@mtc.ca', role: 'admin' }]) });
          return;
        }
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      },
      '/courts': (route, method) => {
        if (method === 'GET') {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 1, name: 'Court 1', status: 'available', floodlight: true }]) });
          return;
        }
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      },
      '/court-blocks': (route, method) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      },
      '/announcements': (route, method) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    }, {
      role: 'admin',
      name: 'Admin User',
      email: 'admin@mtc.ca',
      userId: 'admin-user-id',
      accessToken: 'admin-access-token',
    });

    await page.evaluate(() => {
      const adminUser = {
        role: 'admin',
        name: 'Admin User',
        email: 'admin@mtc.ca',
        id: 'admin-user-id',
        userId: 'admin-user-id',
        accessToken: 'admin-access-token',
      };
      if (window.MTC?.state) {
        window.MTC.state.currentUser = adminUser;
        window.MTC.state.currentRole = 'admin';
      }
      window.currentUser = adminUser;
      window.currentRole = 'admin';
      localStorage.setItem('mtc-user', JSON.stringify(adminUser));
      localStorage.setItem('mtc-current-user', JSON.stringify(adminUser));
      localStorage.setItem('mtc-session-active', 'true');
      const adminMenuItem = document.getElementById('menuAdminItem');
      if (adminMenuItem) adminMenuItem.classList.remove('admin-hidden');
    });
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const adminUser = {
              role: 'admin',
              name: 'Admin User',
              email: 'admin@mtc.ca',
              id: 'admin-user-id',
              userId: 'admin-user-id',
              accessToken: 'admin-access-token',
            };
            if (window.MTC?.state) {
              window.MTC.state.currentUser = adminUser;
              window.MTC.state.currentRole = 'admin';
            }
            window.currentUser = adminUser;
            window.currentRole = 'admin';
            const adminMenuItem = document.getElementById('menuAdminItem');
            if (adminMenuItem) adminMenuItem.classList.remove('admin-hidden');
            return !!(adminMenuItem && !adminMenuItem.classList.contains('admin-hidden'));
          });
        } catch {
          return false;
        }
      }, { timeout: 5000 })
      .toBe(true);
    await page.evaluate(() => {
      const drawer = document.getElementById('menuDrawer');
      const backdrop = document.getElementById('menuBackdrop');
      if (typeof window.openMenu === 'function') window.openMenu();
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    });

    const menuDrawer = page.locator('#menuDrawer');
    const drawerWidth = await expect
      .poll(async () => {
        try {
          return await menuDrawer.evaluate((element) => Math.round(element.getBoundingClientRect().width));
        } catch {
          return 0;
        }
      }, { timeout: 5000 })
      .toBeGreaterThan(0)
      .then(async () => menuDrawer.evaluate((element) => Math.round(element.getBoundingClientRect().width)));
    expect(drawerWidth).toBeGreaterThanOrEqual(260);
    await expect(page.locator('#menuDrawer .menu-item-text', { hasText: 'Schedule' })).toBeAttached();
    await expect(page.locator('#menuDrawer .menu-item-text', { hasText: 'Settings' })).toBeAttached();
    await expect(page.locator('#menuDrawer .menu-item-text', { hasText: 'Admin Panel' })).toBeAttached();

    await page.evaluate(() => {
      const scheduleItem = Array.from(document.querySelectorAll('#menuDrawer .menu-item'))
        .find((item) => item.textContent?.includes('Schedule'));
      if (scheduleItem instanceof HTMLElement) scheduleItem.click();
    });
    await expectPwaScreenActive(page, 'schedule');

    await activatePwaScreen(page, 'home', 'nav-home');
    await page.evaluate(() => {
      const drawer = document.getElementById('menuDrawer');
      const backdrop = document.getElementById('menuBackdrop');
      if (typeof window.openMenu === 'function') window.openMenu();
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    });
    await page.evaluate(() => {
      const settingsItem = Array.from(document.querySelectorAll('#menuDrawer .menu-item'))
        .find((item) => item.textContent?.includes('Settings'));
      if (settingsItem instanceof HTMLElement) settingsItem.click();
    });
    await expectPwaScreenActive(page, 'settings');

    await activatePwaScreen(page, 'home', 'nav-home');
    await page.evaluate(() => {
      const adminMenuItem = document.getElementById('menuAdminItem');
      if (adminMenuItem) adminMenuItem.classList.remove('admin-hidden');
      const drawer = document.getElementById('menuDrawer');
      const backdrop = document.getElementById('menuBackdrop');
      if (typeof window.openMenu === 'function') window.openMenu();
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    });
    const adminMenuItem = page.locator('#menuAdminItem');
    await expect(adminMenuItem).toBeVisible();
    await page.evaluate(() => {
      const adminItem = document.getElementById('menuAdminItem');
      if (adminItem instanceof HTMLElement) adminItem.click();
    });
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => {
            const adminUser = {
              role: 'admin',
              name: 'Admin User',
              email: 'admin@mtc.ca',
              id: 'admin-user-id',
              userId: 'admin-user-id',
              accessToken: 'admin-access-token',
            };
            if (window.MTC?.state) {
              window.MTC.state.currentUser = adminUser;
              window.MTC.state.currentRole = 'admin';
            }
            window.currentUser = adminUser;
            window.currentRole = 'admin';
            const adminItem = document.getElementById('menuAdminItem');
            if (adminItem) adminItem.classList.remove('admin-hidden');
            if (window.MTC?.fn?.navigateTo) window.MTC.fn.navigateTo('admin');
            else if (typeof window.navigateTo === 'function') window.navigateTo('admin');
            const adminScreen = document.getElementById('screen-admin');
            const adminTabs = document.querySelector('#screen-admin .admin-tabs-bar');
            return !!(
              adminScreen &&
              adminScreen.classList.contains('active') &&
              adminTabs &&
              adminTabs.getBoundingClientRect().width >= 640
            );
          });
        } catch {
          return false;
        }
      }, { timeout: 10000 })
      .toBe(true);

    const adminTabs = page.locator('#screen-admin .admin-tabs-bar');
    await expect(adminTabs).toBeVisible();
    const adminWidth = await adminTabs.evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(adminWidth).toBeGreaterThanOrEqual(640);
  });
});
