const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Find all elements whose right edge is between 768 and 810 (the 30px overflow zone)
  const nearOverflow = await page.evaluate(() => {
    const results = [];
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      if (rect.right > 768 && rect.right <= 810) {
        const tag = el.tagName.toLowerCase();
        const cls = (typeof el.className === 'string' ? el.className : '').substring(0, 100);
        const id = el.id || '';
        const parent = el.parentElement;
        const parentCls = parent ? (typeof parent.className === 'string' ? parent.className : '').substring(0, 60) : '';
        results.push({
          tag,
          id,
          cls,
          parentTag: parent ? parent.tagName.toLowerCase() : '',
          parentCls,
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          overflow: getComputedStyle(el).overflow,
        });
      }
    }
    return results;
  });

  console.log(`Elements in the 768-810px overflow zone (${nearOverflow.length} found):`);
  for (const el of nearOverflow) {
    console.log(`  ${el.tag}${el.id ? '#' + el.id : ''} .${el.cls.substring(0, 60)}`);
    console.log(`    right=${el.right} width=${el.width} left=${el.left} overflow=${el.overflow}`);
    console.log(`    parent: ${el.parentTag}.${el.parentCls.substring(0, 40)}`);
  }

  // Also check the body and main elements
  const containers = await page.evaluate(() => {
    const body = document.body;
    const main = document.querySelector('main');
    return {
      bodyWidth: body.offsetWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyOverflow: getComputedStyle(body).overflowX,
      mainWidth: main ? main.offsetWidth : null,
      mainScrollWidth: main ? main.scrollWidth : null,
      mainOverflow: main ? getComputedStyle(main).overflowX : null,
    };
  });
  console.log('\nContainer widths:', JSON.stringify(containers, null, 2));

  await browser.close();
})();
