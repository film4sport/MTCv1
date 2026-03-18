import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const infoFile = readFileSync(join(__dirname, '..', 'app', 'info', 'page.tsx'), 'utf-8');
const coachingFile = readFileSync(join(__dirname, '..', 'app', 'info', 'components', 'CoachingTab.tsx'), 'utf-8');
const settingsFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'settings', 'page.tsx'), 'utf-8');

describe('Coaching tab - coach contact info', () => {
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

describe('Settings - redundant mobile app promo removed', () => {
  it('should not use alert() anywhere in settings', () => {
    const alertCalls = settingsFile.match(/\balert\s*\(/g);
    expect(alertCalls).toBeNull();
  });

  it('should not include the old mobile app promo card', () => {
    expect(settingsFile).not.toContain('/mobile-app/');
    expect(settingsFile).not.toContain('Open MTC Court App');
  });

  it('should not have old PWA install prompt logic', () => {
    expect(settingsFile).not.toContain('__pwaInstallPrompt');
    expect(settingsFile).not.toContain('showInstallTip');
  });
});

describe('Settings - notification toggle integrity', () => {
  it('should have exactly 6 notification toggle entries', () => {
    const toggleKeys = settingsFile.match(/key:\s*'[a-z]+'\s*as\s*const/g);
    expect(toggleKeys).toBeTruthy();
    expect(toggleKeys).toHaveLength(6);
  });

  it('toggle keys should include announcements and programs', () => {
    const toggleKeys = settingsFile
      .match(/key:\s*'([a-z]+)'\s*as\s*const/g)
      .map(m => m.match(/key:\s*'([a-z]+)'/)[1]);
    expect(toggleKeys).toEqual(['bookings', 'events', 'partners', 'messages', 'announcements', 'programs']);
  });

  it('should not have a payments toggle', () => {
    expect(settingsFile).not.toContain("key: 'payments'");
    expect(settingsFile).not.toMatch(/Payments\s*&\s*Billing/);
  });
});

describe('Info page wiring still exists', () => {
  it('info page still includes coaching tab route support', () => {
    expect(infoFile).toContain('coaching');
  });
});
