import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const infoPage = readFileSync(resolve(root, 'app/info/page.tsx'), 'utf-8');
const mobileIndex = readFileSync(resolve(root, 'public/mobile-app/index.html'), 'utf-8');
const helpers = require(resolve(root, 'tests/helpers/app-helpers.js'));

describe('Playwright Helper Contracts', () => {
  it('shared info-tab helper keys match the info page tabs', () => {
    expect(helpers.INFO_TAB_KEYS).toEqual([
      'about',
      'membership',
      'coaching',
      'faq',
      'rules',
      'privacy',
      'terms',
    ]);

    expect(infoPage).toContain("id={`tab-${t.key}`}");
    expect(infoPage).toContain("aria-controls={`tabpanel-${t.key}`}");

    for (const key of helpers.INFO_TAB_KEYS) {
      expect(infoPage).toContain(`key: '${key}'`);
      expect(infoPage).toContain(`id="tabpanel-${key}"`);
    }
  });

  it('shared PWA screen helper keys match the mobile app shell', () => {
    expect(helpers.PWA_SCREEN_IDS).toEqual([
      'home',
      'notifications',
      'book',
      'partners',
      'schedule',
      'events',
      'messages',
      'settings',
    ]);

    for (const key of helpers.PWA_SCREEN_IDS) {
      expect(mobileIndex).toContain(`id="screen-${key}"`);
    }
  });

  it('bottom-nav helper assumptions still exist for the routed screens', () => {
    expect(mobileIndex).toContain('id="nav-home"');
    expect(mobileIndex).toContain('id="nav-book"');
    expect(mobileIndex).toContain('id="nav-partners"');
    expect(mobileIndex).toContain('id="nav-schedule"');
  });

  it('authenticated PWA mock fails loudly on unknown mobile routes', () => {
    const helperSource = readFileSync(resolve(root, 'tests/helpers/app-helpers.js'), 'utf-8');
    expect(helperSource).toContain('Unhandled mock route');
    expect(helperSource).toContain('status: 501');
  });
});
