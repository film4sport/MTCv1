const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Search through all rules for anything matching wave-divider
  const waveRules = await page.evaluate(() => {
    const results = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const text = rule.cssText || '';
          if (text.includes('wave-divider') || (rule.selectorText && rule.selectorText.includes('wave-divider'))) {
            results.push({
              selector: rule.selectorText,
              cssText: text.substring(0, 200),
            });
          }
        }
      } catch (e) {}
    }
    return results;
  });

  console.log(`CSS rules mentioning 'wave-divider': ${waveRules.length}`);
  for (const r of waveRules) {
    console.log(`  ${r.selector}: ${r.cssText}`);
  }

  // Also search for 'gallery-slide'
  const galleryRules = await page.evaluate(() => {
    const results = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const text = rule.cssText || '';
          if (text.includes('gallery-slide')) {
            results.push({
              selector: rule.selectorText,
              cssText: text.substring(0, 200),
            });
          }
        }
      } catch (e) {}
    }
    return results;
  });

  console.log(`\nCSS rules mentioning 'gallery-slide': ${galleryRules.length}`);
  for (const r of galleryRules) {
    console.log(`  ${r.selector}: ${r.cssText}`);
  }

  // Search for 'loader'
  const loaderRules = await page.evaluate(() => {
    const results = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const text = rule.cssText || '';
          if (rule.selectorText && rule.selectorText.includes('.loader')) {
            results.push({
              selector: rule.selectorText,
              cssText: text.substring(0, 200),
            });
          }
        }
      } catch (e) {}
    }
    return results;
  });

  console.log(`\nCSS rules for '.loader': ${loaderRules.length}`);
  for (const r of loaderRules) {
    console.log(`  ${r.selector}: ${r.cssText}`);
  }

  await browser.close();
})();
