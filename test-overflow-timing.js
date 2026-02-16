const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });

  // Check scrollWidth at different times
  for (let wait = 0; wait <= 5000; wait += 500) {
    if (wait > 0) await page.waitForTimeout(500);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  t=${wait}ms: scrollWidth=${sw}`);
  }

  // Now scroll through
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const swAfterScroll = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`  After scroll to bottom: scrollWidth=${swAfterScroll}`);

  // Check all SVGs
  const svgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('svg')).map(svg => {
      const rect = svg.getBoundingClientRect();
      const parent = svg.parentElement;
      return {
        width: Math.round(rect.width),
        right: Math.round(rect.right),
        parentClass: (typeof parent.className === 'string' ? parent.className : '').substring(0, 60),
        parentOverflow: getComputedStyle(parent).overflow,
        parentWidth: parent.offsetWidth,
        svgCSSWidth: getComputedStyle(svg).width,
      };
    });
  });
  console.log('\nAll SVGs:');
  for (const svg of svgs) {
    console.log(`  parent=.${svg.parentClass.substring(0, 40)} w=${svg.width} right=${svg.right} parentOverflow=${svg.parentOverflow} parentW=${svg.parentWidth} cssW=${svg.svgCSSWidth}`);
  }

  await browser.close();
})();
