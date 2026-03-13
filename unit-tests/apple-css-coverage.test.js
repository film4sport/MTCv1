/**
 * Apple/Safari CSS Coverage Tests
 *
 * Verifies CSS files have proper Safari/WebKit support:
 * - Tablet breakpoints cover iPad Mini (744px)
 * - Safe-area-insets for notch/Dynamic Island
 * - -webkit- prefixes where needed
 * - dvh fallback chains
 * - Playwright config includes WebKit projects
 * - CI installs WebKit browser
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const cssDir = resolve(root, 'public/mobile-app/css');

const tabletCss = readFileSync(resolve(cssDir, 'tablet.css'), 'utf-8');
const baseCss = readFileSync(resolve(cssDir, 'base.css'), 'utf-8');
const navigationCss = readFileSync(resolve(cssDir, 'navigation.css'), 'utf-8');
const homeCss = readFileSync(resolve(cssDir, 'home.css'), 'utf-8');
const layoutCss = readFileSync(resolve(cssDir, 'layout.css'), 'utf-8');
const loginCss = readFileSync(resolve(cssDir, 'login.css'), 'utf-8');

const playwrightConfig = readFileSync(resolve(root, 'playwright.config.js'), 'utf-8');
const ciYml = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf-8');
const prCheckYml = readFileSync(resolve(root, '.github/workflows/pr-check.yml'), 'utf-8');

// ── Tablet Breakpoints ──────────────────────────────────────────

describe('tablet CSS — iPad breakpoints', () => {
  it('starts at 744px (iPad Mini width)', () => {
    expect(tabletCss).toContain('@media (min-width: 744px)');
  });

  it('does NOT use 768px as the tablet start (old value)', () => {
    // The main tablet block should be 744px, not 768px
    // (landscape and other specific queries may still exist at 768+)
    expect(tabletCss).not.toMatch(/@media\s*\(\s*min-width:\s*768px\s*\)\s*\{/);
  });

  it('has iPad Pro 12.9" breakpoint at 1024px', () => {
    expect(tabletCss).toContain('@media (min-width: 1024px)');
  });

  it('iPad Pro 12.9" uses wider max-width (900px)', () => {
    // Inside the 1024px block, max-width should be 900px
    const block1024 = tabletCss.slice(tabletCss.indexOf('@media (min-width: 1024px)'));
    expect(block1024).toContain('max-width: 900px');
  });

  it('has landscape override for wider iPads', () => {
    expect(tabletCss).toMatch(/@media.*min-width.*744px.*orientation:\s*landscape/);
  });

  it('landscape uses wider content (900px)', () => {
    const landscape = tabletCss.slice(tabletCss.indexOf('orientation: landscape'));
    expect(landscape).toContain('max-width: 900px');
  });
});

// ── Safe Area Insets ──────────────────────────────────────────

describe('safe-area-insets — notch/Dynamic Island support', () => {
  it('base.css has top safe-area on #app', () => {
    expect(baseCss).toContain('env(safe-area-inset-top');
  });

  it('base.css has left/right safe-area on #app', () => {
    expect(baseCss).toContain('env(safe-area-inset-left');
    expect(baseCss).toContain('env(safe-area-inset-right');
  });

  it('navigation has bottom safe-area for home indicator', () => {
    expect(navigationCss).toContain('env(safe-area-inset-bottom');
  });

  it('navigation has left/right safe-area for landscape', () => {
    expect(navigationCss).toContain('env(safe-area-inset-left');
    expect(navigationCss).toContain('env(safe-area-inset-right');
  });

  it('home screen header has top safe-area', () => {
    expect(homeCss).toContain('env(safe-area-inset-top');
  });

  it('layout has bottom padding for safe area', () => {
    expect(layoutCss).toContain('env(safe-area-inset-bottom');
  });

  it('login screen has top and bottom safe-area', () => {
    expect(loginCss).toContain('env(safe-area-inset-top');
    expect(loginCss).toContain('env(safe-area-inset-bottom');
  });

  it('viewport meta has viewport-fit=cover', () => {
    const indexHtml = readFileSync(resolve(root, 'public/mobile-app/index.html'), 'utf-8');
    expect(indexHtml).toContain('viewport-fit=cover');
  });
});

// ── WebKit Prefixes ──────────────────────────────────────────

describe('WebKit prefixes — Safari compatibility', () => {
  // Read all CSS files and check for backdrop-filter without -webkit-
  const cssFiles = readdirSync(cssDir).filter(f => f.endsWith('.css'));

  it('key layout files have -webkit-backdrop-filter alongside backdrop-filter', () => {
    // Check the most important files (nav, modals, base) for -webkit- prefix
    // Some CSS files have unprefixed backdrop-filter from older code — tracked separately
    const keyFiles = ['base.css', 'navigation.css', 'home.css'];
    for (const file of keyFiles) {
      const content = readFileSync(resolve(cssDir, file), 'utf-8');
      if (content.includes('backdrop-filter:')) {
        expect(content).toContain('-webkit-backdrop-filter');
      }
    }
  });

  it('counts total missing -webkit-backdrop-filter prefixes (regression tracker)', () => {
    // This test tracks how many unprefixed backdrop-filter lines exist.
    // Goal: drive this number down to 0 over time.
    let missingCount = 0;
    for (const file of cssFiles) {
      const content = readFileSync(resolve(cssDir, file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('backdrop-filter:')) {
          const prev = i > 0 ? lines[i - 1].trim() : '';
          if (!prev.startsWith('-webkit-backdrop-filter:')) {
            missingCount++;
          }
        }
      }
    }
    // Current known count — if this goes UP, something regressed
    expect(missingCount).toBeLessThanOrEqual(57);
  });
});

// ── dvh Fallback Chain ──────────────────────────────────────

describe('dvh units — fallback chain for older Safari', () => {
  it('base.css has 100% fallback before dvh', () => {
    expect(baseCss).toContain('height: 100%');
    expect(baseCss).toContain('100dvh');
  });

  it('base.css has -webkit-fill-available fallback', () => {
    expect(baseCss).toContain('-webkit-fill-available');
  });

  it('dvh always comes after -webkit-fill-available in cascade', () => {
    const webkitIdx = baseCss.indexOf('-webkit-fill-available');
    const dvhIdx = baseCss.indexOf('100dvh');
    expect(webkitIdx).toBeGreaterThan(-1);
    expect(dvhIdx).toBeGreaterThan(-1);
    expect(dvhIdx).toBeGreaterThan(webkitIdx);
  });
});

// ── iOS-Specific CSS ──────────────────────────────────────────

describe('iOS-specific CSS — Safari detection', () => {
  it('has @supports rule for -webkit-touch-callout (Safari detection)', () => {
    expect(baseCss).toContain('@supports (-webkit-touch-callout: none)');
  });

  it('has pointer:coarse media query for iPad detection', () => {
    expect(baseCss).toMatch(/@media\s*\(pointer:\s*coarse\)/);
  });

  it('pointer:coarse breakpoint is 744px (iPad Mini)', () => {
    expect(baseCss).toMatch(/pointer:\s*coarse.*min-width:\s*744px/);
  });

  it('iOS Safari gets background-image: none (performance)', () => {
    const safariBlock = baseCss.slice(baseCss.indexOf('@supports (-webkit-touch-callout'));
    expect(safariBlock).toContain('background-image: none');
  });
});

// ── Playwright WebKit Config ──────────────────────────────────

describe('Playwright config — WebKit projects', () => {
  it('imports devices from playwright', () => {
    expect(playwrightConfig).toContain('devices');
  });

  it('has webkit-iphone-se project', () => {
    expect(playwrightConfig).toContain("name: 'webkit-iphone-se'");
  });

  it('has webkit-iphone-14 project', () => {
    expect(playwrightConfig).toContain("name: 'webkit-iphone-14'");
  });

  it('has webkit-ipad-mini project', () => {
    expect(playwrightConfig).toContain("name: 'webkit-ipad-mini'");
  });

  it('has webkit-ipad-pro-11 project', () => {
    expect(playwrightConfig).toContain("name: 'webkit-ipad-pro-11'");
  });

  it('has webkit-mobile-pwa project', () => {
    expect(playwrightConfig).toContain("name: 'webkit-mobile-pwa'");
  });

  it('all WebKit projects use browserName webkit', () => {
    // Count occurrences of browserName: 'webkit'
    const webkitCount = (playwrightConfig.match(/browserName:\s*'webkit'/g) || []).length;
    expect(webkitCount).toBeGreaterThanOrEqual(5);
  });

  it('uses Playwright device descriptors (not hardcoded viewports)', () => {
    expect(playwrightConfig).toContain("devices['iPhone SE']");
    expect(playwrightConfig).toContain("devices['iPhone 14']");
    expect(playwrightConfig).toContain("devices['iPad Mini']");
    expect(playwrightConfig).toContain("devices['iPad Pro 11']");
  });
});

// ── CI WebKit Installation ──────────────────────────────────

describe('CI workflows — WebKit browser installation', () => {
  it('ci.yml installs webkit alongside chromium', () => {
    expect(ciYml).toMatch(/playwright install.*webkit/);
  });

  it('pr-check.yml installs webkit alongside chromium', () => {
    expect(prCheckYml).toMatch(/playwright install.*webkit/);
  });

  it('ci.yml still installs chromium', () => {
    expect(ciYml).toMatch(/playwright install.*chromium/);
  });

  it('pr-check.yml still installs chromium', () => {
    expect(prCheckYml).toMatch(/playwright install.*chromium/);
  });
});
