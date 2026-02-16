const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll through everything
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Check overflow on html and body
  const info = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      htmlScrollWidth: html.scrollWidth,
      htmlClientWidth: html.clientWidth,
      htmlOffsetWidth: html.offsetWidth,
      htmlOverflowX: getComputedStyle(html).overflowX,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyOffsetWidth: body.offsetWidth,
      bodyOverflowX: getComputedStyle(body).overflowX,
      windowInnerWidth: window.innerWidth,
    };
  });
  console.log('HTML/Body overflow info:', JSON.stringify(info, null, 2));

  // Find the widest elements
  const widest = await page.evaluate(() => {
    const results = [];
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      if (rect.right > 770) {
        const tag = el.tagName.toLowerCase();
        const cls = (typeof el.className === 'string' ? el.className : '').substring(0, 80);
        const id = el.id || '';
        results.push({
          tag,
          id,
          cls,
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
        });
      }
    }
    // Sort by right edge
    results.sort((a, b) => b.right - a.right);
    return results.slice(0, 20);
  });
  console.log('\nElements extending beyond 770px:');
  for (const el of widest) {
    console.log(`  ${el.tag}${el.id ? '#' + el.id : ''} .${el.cls.substring(0, 50)} → right=${el.right} width=${el.width} left=${el.left}`);
  }

  await browser.close();
})();
