const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();

  const responses = [];
  page.on('response', r => {
    if (r.url().includes('.css')) {
      responses.push({ url: r.url(), status: r.status() });
    }
  });

  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('CSS responses:');
  for (const r of responses) {
    console.log(`  ${r.status} ${r.url}`);
  }

  // Check which link tags are in the HTML
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
  });
  console.log('\nLink tags:');
  for (const l of links) console.log(`  ${l}`);

  // Check actual files on disk via network
  const cssFiles = await page.evaluate(async () => {
    // Try to fetch the landing page HTML to see what CSS it references
    const resp = await fetch('/');
    const html = await resp.text();
    const cssMatches = html.match(/\/_next\/static\/css\/[^"']+/g) || [];
    return cssMatches;
  });
  console.log('\nCSS references in HTML source:');
  for (const f of cssFiles) console.log(`  ${f}`);

  // Try loading the wave-divider rules now
  const hasWaveRules = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === '.wave-divider') {
            return { found: true, overflow: rule.style.overflow, sheet: sheet.href };
          }
        }
      } catch(e) {}
    }
    return { found: false };
  });
  console.log('\nWave divider rule:', JSON.stringify(hasWaveRules));

  await browser.close();
})();
