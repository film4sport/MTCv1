const { chromium, devices } = require('playwright');

const BASE = 'http://127.0.0.1:3001';
const BRAVE = 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';

async function login(browser, email, pin) {
  const context = await browser.newContext({
    ...devices['iPhone 14'],
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('mtc-bypass-install-gate', 'true');
    window.localStorage.setItem('mtc-onboarding-complete', 'true');
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/mobile-app/index.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2200);
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPin').fill(pin);
  await page.locator('#pinLoginBtn').click();
  await page.waitForTimeout(3500);
  return { context, page };
}

async function run() {
  const browser = await chromium.launch({ executablePath: BRAVE, headless: true });

  const admin = await login(browser, 'testadmin.march19@example.com', '2580');
  await admin.page.evaluate(() => { if (window.navigateTo) window.navigateTo('admin'); });
  await admin.page.waitForTimeout(1200);
  await admin.page.evaluate(() => { if (window.switchAdminTab) window.switchAdminTab('members'); });
  await admin.page.waitForTimeout(1200);
  const adminOk = await admin.page.evaluate(() => {
    const input = document.getElementById('adminMemberSearch');
    if (!input) return false;
    input.value = 'Test Member One';
    if (window.filterAdminMembers) window.filterAdminMembers('Test Member One');
    const list = document.getElementById('adminMembersList');
    return !!list && /Test Member One/.test(list.textContent || '');
  });
  console.log('mobile_admin_search_ok', adminOk);

  await admin.page.evaluate(() => { if (window.navigateTo) window.navigateTo('messages'); });
  await admin.page.waitForTimeout(1000);
  await admin.page.evaluate(() => { if (window.showNewMessageModal) window.showNewMessageModal(); });
  await admin.page.waitForTimeout(700);
  const msgOk = await admin.page.evaluate(() => {
    const input = document.getElementById('memberSearchInput');
    if (!input) return false;
    input.value = 'Test Member One';
    if (window.searchMembers) window.searchMembers('Test Member One');
    const results = document.getElementById('memberSearchResults');
    return !!results && /Test Member One/.test(results.textContent || '');
  });
  console.log('mobile_message_search_ok', msgOk);

  const member = await login(browser, 'testmember1.march19@example.com', '2582');
  await member.page.evaluate(() => { if (window.navigateTo) window.navigateTo('book'); });
  await member.page.waitForTimeout(1800);
  await member.page.locator('.weekly-slot.available').first().click();
  await member.page.waitForTimeout(900);
  await member.page.evaluate(() => { if (window.selectMatchType) window.selectMatchType('doubles'); });
  await member.page.waitForTimeout(500);
  await member.page.locator('#addPlayerBtn').click();
  await member.page.waitForTimeout(700);
  const bookingOk = await member.page.evaluate(() => {
    const input = document.getElementById('playerSearchInput');
    if (!input) return false;
    input.value = 'Test Member Two';
    if (window.filterPlayerList) window.filterPlayerList('Test Member Two');
    return Array.from(document.querySelectorAll('#playerPickerList .player-picker-item')).some(el => getComputedStyle(el).display !== 'none' && (el.getAttribute('data-name') || '').includes('Test Member Two'));
  });
  console.log('mobile_booking_search_ok', bookingOk);

  await admin.context.close();
  await member.context.close();
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
