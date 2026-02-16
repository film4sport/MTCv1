const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const results = [];

  // =============================================
  // TEST 1: Mobile dashboard overflow
  // =============================================
  console.log('\n=== TEST 1: Mobile Dashboard Overflow ===');
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileCtx.newPage();

  // Set up localStorage for dashboard access
  await mobilePage.goto('http://localhost:3004/login');
  await mobilePage.evaluate(() => {
    localStorage.setItem('mtc_current_user', JSON.stringify({
      id: 'test1', name: 'Test User', email: 'test@test.com', role: 'member',
      avatar: null, memberSince: '2024-01-01', membershipType: 'Adult'
    }));
  });

  const mobileDashPages = ['/dashboard', '/dashboard/book', '/dashboard/messages', '/dashboard/partners', '/dashboard/events'];
  for (const path of mobileDashPages) {
    await mobilePage.goto('http://localhost:3004' + path, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    const hasOverflow = scrollWidth > clientWidth + 2; // 2px tolerance
    const status = hasOverflow ? '❌ OVERFLOW' : '✅ OK';
    console.log(`  ${status} ${path}: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    results.push({ test: `Mobile ${path}`, pass: !hasOverflow });
  }
  await mobileCtx.close();

  // =============================================
  // TEST 2: Tablet landing page overflow (gallery)
  // =============================================
  console.log('\n=== TEST 2: Tablet Landing Page Overflow ===');
  const tabletCtx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabletPage = await tabletCtx.newPage();
  await tabletPage.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(1000);

  // Scroll through the whole page to trigger all sections
  await tabletPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await tabletPage.waitForTimeout(500);
  await tabletPage.evaluate(() => window.scrollTo(0, 0));
  await tabletPage.waitForTimeout(500);

  const tabScrollWidth = await tabletPage.evaluate(() => document.documentElement.scrollWidth);
  const tabClientWidth = await tabletPage.evaluate(() => document.documentElement.clientWidth);
  const tabHasOverflow = tabScrollWidth > tabClientWidth + 2;
  const tabStatus = tabHasOverflow ? '❌ OVERFLOW' : '✅ OK';
  console.log(`  ${tabStatus} Landing page: scrollWidth=${tabScrollWidth}, clientWidth=${tabClientWidth}`);
  results.push({ test: 'Tablet landing page', pass: !tabHasOverflow });
  await tabletCtx.close();

  // =============================================
  // TEST 3: Login maxLength
  // =============================================
  console.log('\n=== TEST 3: Login Input maxLength ===');
  const loginCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const loginPage = await loginCtx.newPage();
  await loginPage.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });

  // Check email maxLength
  const emailMaxLength = await loginPage.evaluate(() => {
    const input = document.querySelector('input[type="email"]');
    return input ? input.maxLength : null;
  });
  console.log(`  Email maxLength: ${emailMaxLength} ${emailMaxLength === 100 ? '✅' : '❌'}`);
  results.push({ test: 'Email maxLength=100', pass: emailMaxLength === 100 });

  // Check password maxLength
  const pwMaxLength = await loginPage.evaluate(() => {
    const input = document.querySelector('input[type="password"]');
    return input ? input.maxLength : null;
  });
  console.log(`  Password maxLength: ${pwMaxLength} ${pwMaxLength === 128 ? '✅' : '❌'}`);
  results.push({ test: 'Password maxLength=128', pass: pwMaxLength === 128 });

  // Try to type a very long string - verify truncation
  const longEmail = 'a'.repeat(200) + '@test.com';
  await loginPage.fill('input[type="email"]', longEmail);
  const actualValue = await loginPage.evaluate(() => document.querySelector('input[type="email"]').value);
  const truncated = actualValue.length <= 100;
  console.log(`  Typed 209 chars, got ${actualValue.length} chars ${truncated ? '✅' : '❌'}`);
  results.push({ test: 'Email truncates long input', pass: truncated });

  await loginCtx.close();

  // =============================================
  // TEST 4: Cache-Control headers
  // =============================================
  console.log('\n=== TEST 4: Cache-Control Headers ===');
  const headerCtx = await browser.newContext();
  const headerPage = await headerCtx.newPage();

  const response = await headerPage.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  const cacheControl = response.headers()['cache-control'] || '';
  const hasNoCache = cacheControl.includes('no-cache') && cacheControl.includes('no-store');
  console.log(`  Cache-Control: "${cacheControl}" ${hasNoCache ? '✅' : '❌'}`);
  results.push({ test: 'HTML Cache-Control no-cache', pass: hasNoCache });
  await headerCtx.close();

  // =============================================
  // SUMMARY
  // =============================================
  console.log('\n========== SUMMARY ==========');
  let passed = 0, failed = 0;
  for (const r of results) {
    if (r.pass) passed++;
    else failed++;
  }
  console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests`);
  if (failed > 0) {
    console.log('  Failed tests:');
    results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.test}`));
  }

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
