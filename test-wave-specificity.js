const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Use CDP to check all CSS rules matching the wave-divider
  const client = await page.context().newCDPSession(page);

  // Find the wave-divider element
  const waveDiv = await page.evaluate(() => {
    const el = document.querySelector('.wave-divider');
    if (!el) return null;
    // Check all applied stylesheets
    const sheets = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes('wave-divider')) {
            sheets.push({
              selector: rule.selectorText,
              overflow: rule.style.overflow,
              overflowX: rule.style.overflowX,
              sheet: sheet.href || 'inline',
            });
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return {
      className: el.className,
      overflow: getComputedStyle(el).overflow,
      sheets,
    };
  });

  console.log('Wave divider info:', JSON.stringify(waveDiv, null, 2));

  // Also check if the landing.css is loaded at all
  const cssLoaded = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === '.wave-divider' && rule.style.overflow === 'hidden') {
            return { found: true, href: sheet.href };
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return { found: false };
  });

  console.log('\nlanding.css .wave-divider rule:', JSON.stringify(cssLoaded, null, 2));

  // Check svg width rule
  const svgRule = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === '.wave-divider svg') {
            return {
              found: true,
              width: rule.style.width,
              href: sheet.href,
            };
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return { found: false };
  });

  console.log('\n.wave-divider svg rule:', JSON.stringify(svgRule, null, 2));

  await browser.close();
})();
