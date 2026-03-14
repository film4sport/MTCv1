import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const infoFile = readFileSync(join(__dirname, '..', 'app', 'info', 'page.tsx'), 'utf-8');
const coachingFile = readFileSync(join(__dirname, '..', 'app', 'info', 'components', 'CoachingTab.tsx'), 'utf-8');
const settingsFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'settings', 'page.tsx'), 'utf-8');

// ─── Coaching tab: contact section has real coach emails ───
describe('Coaching tab — coach contact info', () => {
  it('should contain Suzanne Taylor signup email', () => {
    expect(coachingFile).toContain('Taylor.suzanne.tennis@gmail.com');
  });

  it('should contain Mark Taylor contact email', () => {
    expect(coachingFile).toContain('Taylor.mark.tennis@gmail.com');
  });

  it('should have a registration section', () => {
    expect(coachingFile).toContain('Ready to Register');
  });

  it('should have mailto: links for coach emails', () => {
    expect(coachingFile).toContain('mailto:Taylor.suzanne.tennis@gmail.com');
    expect(coachingFile).toContain('mailto:Taylor.mark.tennis@gmail.com');
  });

  it('should mention Head Pro title', () => {
    expect(coachingFile).toContain('Head Professional');
  });

  it('should mention summer camp dates TBC', () => {
    expect(coachingFile).toContain('Coming soon');
  });
});

// ─── Settings: Mobile App link ─────────────
describe('Settings — Mobile App links to /mobile-app/', () => {
  it('should not use alert() anywhere in settings', () => {
    // Match alert( but not aria-label or other valid uses
    const alertCalls = settingsFile.match(/\balert\s*\(/g);
    expect(alertCalls).toBeNull();
  });

  it('should link to /mobile-app/ instead of PWA install prompt', () => {
    expect(settingsFile).toContain('/mobile-app/');
    expect(settingsFile).toContain('Open MTC Court App');
  });

  it('should not have old PWA install prompt logic', () => {
    expect(settingsFile).not.toContain('__pwaInstallPrompt');
    expect(settingsFile).not.toContain('showInstallTip');
  });
});

// ─── Settings: no stale payment toggle ──────────────────
describe('Settings — notification toggle integrity', () => {
  it('should have exactly 4 notification toggle entries (programs removed)', () => {
    // Count the key: '...' as const patterns in the toggles array
    const toggleKeys = settingsFile.match(/key:\s*'[a-z]+'\s*as\s*const/g);
    expect(toggleKeys).toBeTruthy();
    expect(toggleKeys).toHaveLength(4);
  });

  it('toggle keys should be bookings, events, partners, messages', () => {
    const toggleKeys = settingsFile.match(/key:\s*'([a-z]+)'\s*as\s*const/g)
      .map(m => m.match(/key:\s*'([a-z]+)'/)[1]);
    expect(toggleKeys).toEqual(['bookings', 'events', 'partners', 'messages']);
  });

  it('should not have a payments toggle', () => {
    expect(settingsFile).not.toContain("key: 'payments'");
    expect(settingsFile).not.toMatch(/Payments\s*&\s*Billing/);
  });
});
