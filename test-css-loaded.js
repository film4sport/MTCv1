const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();

  // Monitor network requests
  const cssRequests = [];
  page.on('response', (response) => {
    if (response.url().includes('.css')) {
      cssRequests.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('CSS responses:');
  for (const r of cssRequests) {
    console.log(`  ${r.status} ${r.url}`);
  }

  // Check link elements in the DOM
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"], link[as="style"]')).map(l => ({
      href: l.href,
      rel: l.rel,
      loaded: l.sheet ? true : false,
    }));
  });

  console.log('\nStylesheet link elements:');
  for (const l of links) {
    console.log(`  ${l.loaded ? '✅' : '❌'} ${l.rel} ${l.href}`);
  }

  // Check style elements (inline styles from Next.js)
  const styles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('style')).map((s, i) => ({
      index: i,
      content: s.textContent?.substring(0, 200) || '',
      ruleCount: s.sheet ? s.sheet.cssRules.length : 0,
    }));
  });

  console.log(`\nInline <style> elements: ${styles.length}`);
  for (const s of styles) {
    console.log(`  [${s.index}] ${s.ruleCount} rules: ${s.content.substring(0, 100)}`);
  }

  // Try to directly check if the second CSS file is accessible
  const secondCss = await page.evaluate(async () => {
    const sheets = document.styleSheets;
    const results = [];
    for (const sheet of sheets) {
      try {
        results.push({
          href: sheet.href,
          rules: sheet.cssRules.length,
          accessible: true,
        });
      } catch (e) {
        results.push({
          href: sheet.href,
          rules: 0,
          accessible: false,
          error: e.message,
        });
      }
    }
    return results;
  });

  console.log('\nStylesheet accessibility:');
  for (const s of secondCss) {
    console.log(`  ${s.accessible ? '✅' : '❌'} ${s.href} (${s.rules} rules) ${s.error || ''}`);
  }

  await browser.close();
})();
