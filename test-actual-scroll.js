const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll through everything to trigger gallery
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Try to scroll horizontally
  const beforeScrollX = await page.evaluate(() => window.scrollX);
  await page.evaluate(() => window.scrollBy(500, 0));
  await page.waitForTimeout(200);
  const afterScrollX = await page.evaluate(() => window.scrollX);

  console.log(`Before horizontal scroll: scrollX=${beforeScrollX}`);
  console.log(`After trying to scroll right 500px: scrollX=${afterScrollX}`);
  console.log(`Horizontal scroll blocked: ${afterScrollX === 0 ? '✅ YES' : '❌ NO'}`);

  // Also check if scrollbar is visible (overflow hidden should hide it)
  const hasScrollbar = await page.evaluate(() => {
    return window.innerWidth < document.documentElement.offsetWidth;
  });
  console.log(`Horizontal scrollbar visible: ${hasScrollbar ? '❌ YES' : '✅ NO'}`);

  // Check body overflow
  const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflowX);
  console.log(`Body overflow-x: ${bodyOverflow}`);

  // Check if the gallery section container itself has overflow hidden
  const gallerySectionOverflow = await page.evaluate(() => {
    const sections = document.querySelectorAll('section');
    for (const s of sections) {
      const text = s.textContent || '';
      if (text.includes('Gallery') || s.querySelector('.gallery-slide')) {
        return {
          tag: s.tagName,
          overflow: getComputedStyle(s).overflow,
          overflowX: getComputedStyle(s).overflowX,
          width: s.offsetWidth,
          scrollWidth: s.scrollWidth,
        };
      }
    }
    return null;
  });
  console.log('Gallery section overflow:', JSON.stringify(gallerySectionOverflow, null, 2));

  await browser.close();
})();
