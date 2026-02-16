const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Find ALL elements with class containing 'wave-divider'
  const waveDividers = await page.evaluate(() => {
    const divs = document.querySelectorAll('.wave-divider');
    return Array.from(divs).map((el, i) => {
      const svg = el.querySelector('svg');
      return {
        index: i,
        className: el.className,
        computedOverflow: getComputedStyle(el).overflow,
        computedOverflowX: getComputedStyle(el).overflowX,
        computedWidth: getComputedStyle(el).width,
        offsetWidth: el.offsetWidth,
        svgWidth: svg ? getComputedStyle(svg).width : null,
        svgBoundingRight: svg ? Math.round(svg.getBoundingClientRect().right) : null,
        inlineStyle: el.getAttribute('style'),
      };
    });
  });

  console.log(`Found ${waveDividers.length} .wave-divider elements:`);
  for (const wd of waveDividers) {
    console.log(`  [${wd.index}] class="${wd.className}" overflow=${wd.computedOverflow} overflowX=${wd.computedOverflowX} width=${wd.computedWidth} offsetW=${wd.offsetWidth}`);
    console.log(`      svg width=${wd.svgWidth} right=${wd.svgBoundingRight}`);
    console.log(`      inline style: ${wd.inlineStyle}`);
  }

  // Also check if any SVG with width > 770 is outside a wave-divider
  const bigSvgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('svg')).filter(svg => {
      return svg.getBoundingClientRect().width > 770;
    }).map(svg => {
      const parent = svg.parentElement;
      const grandparent = parent?.parentElement;
      return {
        svgWidth: Math.round(svg.getBoundingClientRect().width),
        parentTag: parent?.tagName,
        parentClass: (typeof parent?.className === 'string' ? parent.className : '').substring(0, 80),
        parentOverflow: parent ? getComputedStyle(parent).overflow : null,
        grandparentTag: grandparent?.tagName,
        grandparentClass: (typeof grandparent?.className === 'string' ? grandparent.className : '').substring(0, 80),
      };
    });
  });

  console.log(`\nSVGs wider than 770px:`);
  for (const svg of bigSvgs) {
    console.log(`  width=${svg.svgWidth} parent=${svg.parentTag}.${svg.parentClass} overflow=${svg.parentOverflow}`);
    console.log(`    grandparent=${svg.grandparentTag}.${svg.grandparentClass}`);
  }

  await browser.close();
})();
