const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const sheets = await page.evaluate(() => {
    const result = [];
    for (const sheet of document.styleSheets) {
      let ruleCount = 0;
      let sampleRules = [];
      try {
        ruleCount = sheet.cssRules.length;
        for (let i = 0; i < Math.min(5, ruleCount); i++) {
          sampleRules.push(sheet.cssRules[i].selectorText || sheet.cssRules[i].cssText?.substring(0, 80));
        }
      } catch (e) { sampleRules.push('(cross-origin)'); }
      result.push({
        href: sheet.href,
        ruleCount,
        sampleRules,
      });
    }
    return result;
  });

  console.log(`Found ${sheets.length} stylesheets:`);
  for (const s of sheets) {
    console.log(`  ${s.href || 'inline'} (${s.ruleCount} rules)`);
    for (const r of s.sampleRules) {
      console.log(`    - ${r}`);
    }
  }

  // Check if the wave-divider is using an SVG with viewBox 1200
  const svgInfo = await page.evaluate(() => {
    const svg = document.querySelector('.wave-divider svg');
    if (!svg) return null;
    return {
      viewBox: svg.getAttribute('viewBox'),
      width: svg.getAttribute('width'),
      style: svg.getAttribute('style'),
      computedWidth: getComputedStyle(svg).width,
    };
  });
  console.log('\nWave divider SVG:', JSON.stringify(svgInfo, null, 2));

  await browser.close();
})();
