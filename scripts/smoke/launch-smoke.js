const { chromium, devices } = require('playwright');

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001';
const BRAVE = process.env.BRAVE_PATH || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';

const USERS = {
  admin: { email: 'testadmin.march19@example.com', pin: '2580' },
  memberOne: { email: 'testmember1.march19@example.com', pin: '2582' },
};

function logResult(name, ok) {
  console.log(name, Boolean(ok));
}

async function loginMobile(browser, deviceName, user) {
  const context = await browser.newContext({
    ...devices[deviceName],
    viewport: devices[deviceName].viewport,
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('mtc-bypass-install-gate', 'true');
    window.localStorage.setItem('mtc-onboarding-complete', 'true');
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/mobile-app/index.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2200);
  await page.locator('#loginEmail').fill(user.email);
  await page.locator('#loginPin').fill(user.pin);
  await page.locator('#pinLoginBtn').click();
  await page.waitForTimeout(3500);
  return { context, page };
}

async function loginDesktop(browser, user) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.locator('input[type="email"]').first().fill(user.email);
  const pinCandidates = page.locator('input[type="password"], input[inputmode="numeric"], input[maxlength="4"]');
  if (await pinCandidates.count()) {
    await pinCandidates.first().fill(user.pin);
  }
  const submit = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
  if (await submit.count()) {
    await submit.click();
  }
  await page.waitForTimeout(2500);
  return { context, page };
}

async function runMobileAdminChecks(browser) {
  const admin = await loginMobile(browser, 'iPhone 14', USERS.admin);
  const { page, context } = admin;

  await page.waitForFunction(() => {
    return !!(window.MTC && MTC.state && MTC.state.currentUser && MTC.state.currentUser.role === 'admin');
  }, { timeout: 15000 });
  await page.evaluate(() => { if (window.navigateTo) window.navigateTo('admin'); });
  await page.waitForFunction(() => {
    if (!(window.MTC && MTC.state && MTC.state.currentUser && MTC.state.currentUser.role === 'admin')) {
      return false;
    }
    if (typeof window.switchAdminTab === 'function' && !document.querySelector('#adminTabDashboard .admin-overview-card')) {
      window.switchAdminTab('dashboard');
    }
    return typeof window.switchAdminTab === 'function' &&
      !!document.querySelector('#adminTabDashboard .admin-overview-card');
  }, { timeout: 20000 });

  logResult('mobile_admin_dashboard_kiss_ok', await page.evaluate(() => {
    const overview = document.querySelector('#adminTabDashboard .admin-overview-card');
    const quickLinks = document.querySelectorAll('#adminTabDashboard .admin-quick-link');
    const reports = document.getElementById('adminReportsAccordion');
    const gateCode = document.getElementById('currentGateCode');
    return !!overview && quickLinks.length === 4 && !!reports && !reports.open && !!gateCode;
  }));

  await page.evaluate(() => { if (window.switchAdminTab) window.switchAdminTab('courts'); });
  await page.waitForFunction(() => {
    return typeof window.showBlockCourtModal === 'function';
  }, { timeout: 10000 });
  await page.evaluate(() => { if (window.showBlockCourtModal) window.showBlockCourtModal(); });
  await page.locator('#blockCourtModal .admin-block-modal').waitFor({ state: 'visible', timeout: 10000 });

  logResult('mobile_admin_block_modal_ok', await page.evaluate(() => {
    const modal = document.querySelector('#blockCourtModal .admin-block-modal');
    const title = document.querySelector('#blockCourtModal .admin-block-modal-title');
    const fullDay = document.getElementById('blockFullDay');
    const dateInput = document.getElementById('blockDate');
    return !!modal && !!title && !!fullDay && !!dateInput;
  }));

  await page.evaluate(() => { if (window.closeBlockCourtModal) window.closeBlockCourtModal(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { if (window.switchAdminTab) window.switchAdminTab('members'); });
  await page.locator('#adminMemberSearch').waitFor({ state: 'visible', timeout: 10000 });

  logResult('mobile_admin_search_ok', await page.evaluate(() => {
    const input = document.getElementById('adminMemberSearch');
    if (!input) return false;
    input.value = 'Test Member One';
    if (window.filterAdminMembers) window.filterAdminMembers('Test Member One');
    const list = document.getElementById('adminMembersList');
    return !!list && /Test Member One/.test(list.textContent || '');
  }));

  await page.evaluate(() => { if (window.navigateTo) window.navigateTo('messages'); });
  await page.waitForFunction(() => typeof window.showNewMessageModal === 'function', { timeout: 10000 });
  await page.evaluate(() => { if (window.showNewMessageModal) window.showNewMessageModal(); });
  await page.locator('#memberSearchInput').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#memberSearchInput').fill('Test Member One');
  await page.waitForTimeout(500);
  logResult('mobile_message_search_ok', await page.locator('#memberSearchResults').getByText('Test Member One').first().isVisible());

  await context.close();
}

async function runMobileMemberChecks(browser) {
  const member = await loginMobile(browser, 'iPhone 14', USERS.memberOne);
  const { page, context } = member;

  logResult('mobile_home_calendar_future_only_ok', await page.evaluate(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (typeof window.renderHomeCalendar === 'function') window.renderHomeCalendar();
    const days = Array.from(document.querySelectorAll('#homeCalendarGrid .calendar-day[data-date]'));
    return days.every((el) => {
      const ds = el.getAttribute('data-date');
      if (!ds) return true;
      const d = new Date(ds + 'T12:00:00');
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return true;
      return !(ds < new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0] && el.className.includes('has-event'));
    });
  }));

  await page.evaluate(() => { if (window.navigateTo) window.navigateTo('schedule'); });
  await page.waitForTimeout(1200);
  logResult('mobile_schedule_calendar_future_only_ok', await page.evaluate(() => {
    if (typeof window.generateCalendar === 'function') window.generateCalendar();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const days = Array.from(document.querySelectorAll('#calendarGrid .calendar-day'));
    return days.every((el) => {
      const onclick = el.getAttribute('onclick') || '';
      const match = onclick.match(/showDayEvents\('([^']+)'\)/);
      if (!match) return true;
      const ds = match[1];
      const d = new Date(ds + 'T12:00:00');
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return true;
      return !(ds < todayStr && /has-event|has-events-2|has-events-3|has-events-many/.test(el.className));
    });
  }));

  await page.evaluate(() => { if (window.switchScheduleTab) window.switchScheduleTab('past'); });
  await page.waitForTimeout(500);
  logResult('mobile_schedule_fake_past_removed_ok', await page.evaluate(() => {
    const past = document.getElementById('schedulePastBookings');
    const text = (document.getElementById('pastContent') || {}).textContent || '';
    return !!past && !/Singles Match/.test(text) && !/Doubles Practice/.test(text) && !/Club Lesson/.test(text);
  }));

  await page.evaluate(() => { if (window.navigateTo) window.navigateTo('book'); });
  await page.waitForTimeout(1800);
  await page.locator('.weekly-slot.available').first().click();
  await page.waitForTimeout(900);
  await page.evaluate(() => { if (window.selectMatchType) window.selectMatchType('doubles'); });
  await page.waitForTimeout(500);
  await page.locator('#addPlayerBtn').click();
  await page.waitForTimeout(700);
  logResult('mobile_booking_search_ok', await page.evaluate(() => {
    const input = document.getElementById('playerSearchInput');
    if (!input) return false;
    input.value = 'Test Member Two';
    if (window.filterPlayerList) window.filterPlayerList('Test Member Two');
    return Array.from(document.querySelectorAll('#playerPickerList .player-picker-item')).some((el) =>
      getComputedStyle(el).display !== 'none' && (el.getAttribute('data-name') || '').includes('Test Member Two')
    );
  }));

  await context.close();
}

async function runIphone6Checks(browser) {
  const iphone6 = await loginMobile(browser, 'iPhone 6', USERS.memberOne);
  const { page, context } = iphone6;

  await page.evaluate(() => { if (window.navigateTo) window.navigateTo('book'); });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { if (window.switchBookingView) window.switchBookingView('calendar'); });
  await page.waitForTimeout(800);
  await page.locator('#calendarDays .calendar-day:not(.other-month):not(.past)').first().click();
  await page.waitForTimeout(700);

  logResult('iphone6_booking_calendar_layout_ok', await page.evaluate(() => {
    const slots = document.getElementById('dayTimeSlotsContainer');
    const grid = document.getElementById('dayTimeSlotsGrid');
    if (!slots || !grid) return false;
    const slotsRect = slots.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    return slotsRect.top < window.innerHeight &&
      slotsRect.bottom > 0 &&
      gridRect.bottom <= window.innerHeight &&
      grid.scrollHeight >= grid.clientHeight;
  }));

  await context.close();
}

async function clickFirstDesktopBookableSlot(page) {
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('table tbody td button'));
    const candidate = buttons.find((button) => {
      if (!(button instanceof HTMLButtonElement)) return false;
      if (button.disabled) return false;
      const text = (button.textContent || '').trim().toLowerCase();
      if (text === 'you' || text === 'booked' || text === 'taken' || text === 'lesson' || text === 'program') return false;
      return true;
    });
    if (!candidate) return false;
    candidate.click();
    return true;
  });
  return clicked;
}

async function runDesktopMemberChecks(browser) {
  const member = await loginDesktop(browser, USERS.memberOne);
  const { page, context } = member;

  await page.goto(`${BASE}/dashboard/schedule`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  logResult('desktop_schedule_calendar_future_only_ok', await page.evaluate(() => {
    const dots = Array.from(document.querySelectorAll('.calendar-dot-bounce'));
    const cells = dots.map((dot) => dot.closest('div.aspect-square, button.aspect-square, .aspect-square')).filter(Boolean);
    return cells.every((cell) => {
      const day = parseInt((cell.textContent || '').trim(), 10);
      if (!day) return true;
      const now = new Date();
      const cellDate = new Date(now.getFullYear(), now.getMonth(), day);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return cellDate >= today;
    });
  }));

  await page.goto(`${BASE}/dashboard/events`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  logResult('desktop_events_calendar_future_only_ok', await page.evaluate(() => {
    const dots = Array.from(document.querySelectorAll('.calendar-dot-bounce'));
    const cells = dots.map((dot) => dot.closest('button')).filter(Boolean);
    return cells.every((button) => {
      const day = parseInt((button.textContent || '').trim(), 10);
      if (!day) return true;
      const now = new Date();
      const cellDate = new Date(now.getFullYear(), now.getMonth(), day);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return cellDate >= today;
    });
  }));

  await page.goto(`${BASE}/dashboard/messages`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("New Message")').first().click();
  await page.waitForTimeout(500);
  const messageSearch = page.locator('input[aria-label="Search members to message"]').first();
  await messageSearch.fill('Test Member Two');
  await page.waitForTimeout(400);
  logResult('desktop_message_search_ok', await page.locator('#member-search-listbox').getByText('Test Member Two').first().isVisible());

  await page.goto(`${BASE}/dashboard/book`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1800);
  if (!(await clickFirstDesktopBookableSlot(page))) {
    throw new Error('No desktop booking slot available for smoke check');
  }
  await page.waitForTimeout(700);
  await page.locator('button:has-text("Doubles")').first().click();
  await page.waitForTimeout(300);
  const participantSearch = page.locator('input[aria-label="Search members to add as participants"]').first();
  await participantSearch.fill('Test Member Two');
  await page.waitForTimeout(400);
  logResult('desktop_booking_search_ok', await page.locator('#participant-listbox').getByText('Test Member Two').first().isVisible());

  await context.close();
}

async function runDesktopAdminChecks(browser) {
  const admin = await loginDesktop(browser, USERS.admin);
  const { page, context } = admin;

  await page.goto(`${BASE}/dashboard/admin`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.locator('button[role="tab"]:has-text("Members")').first().click();
  await page.waitForTimeout(600);
  const searchInput = page.locator('input[aria-label="Search members"]').first();
  await searchInput.fill('Test Member One');
  await page.waitForTimeout(500);
  logResult('desktop_admin_search_ok', await page.getByText('Test Member One').first().isVisible());

  await context.close();
}

async function run() {
  const browser = await chromium.launch({ executablePath: BRAVE, headless: true });
  try {
    await runMobileAdminChecks(browser);
    await runMobileMemberChecks(browser);
    await runIphone6Checks(browser);
    await runDesktopMemberChecks(browser);
    await runDesktopAdminChecks(browser);
  } finally {
    await browser.close();
  }
}

module.exports = { run };

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
