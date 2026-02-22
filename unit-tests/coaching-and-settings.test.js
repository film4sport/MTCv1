import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const infoFile = readFileSync(join(__dirname, '..', 'app', 'info', 'page.tsx'), 'utf-8');
const coachingFile = readFileSync(join(__dirname, '..', 'app', 'info', 'components', 'CoachingTab.tsx'), 'utf-8');
const settingsFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'settings', 'page.tsx'), 'utf-8');

// ─── Coaching tab: email replaced with dashboard link ───
describe('Coaching tab — no exposed email', () => {
  it('should not contain Mark Taylor personal email', () => {
    expect(coachingFile).not.toContain('Taylor.Mark.Tennis@gmail.com');
  });

  it('coaching section should not have any mailto: links', () => {
    expect(coachingFile).not.toContain('mailto:');
  });

  it('should link to /dashboard/messages instead', () => {
    // Find the coaching registration section
    const registerSection = coachingFile.match(/Register for Coaching[\s\S]*?<\/div>/);
    expect(registerSection).toBeTruthy();
    expect(registerSection[0]).toContain('/dashboard/messages');
  });

  it('should say "message Coach Mark" not "email Mark"', () => {
    expect(coachingFile).toContain('message Coach Mark');
    expect(coachingFile).not.toContain('email Mark');
  });

  it('should still link to /dashboard/events for registration', () => {
    const registerSection = coachingFile.match(/Register for Coaching[\s\S]*?<\/div>/);
    expect(registerSection).toBeTruthy();
    expect(registerSection[0]).toContain('/dashboard/events');
  });

  it('should mention "through the dashboard" for context', () => {
    expect(coachingFile).toContain('through the dashboard');
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
  it('should have exactly 5 notification toggle entries', () => {
    // Count the key: '...' as const patterns in the toggles array
    const toggleKeys = settingsFile.match(/key:\s*'[a-z]+'\s*as\s*const/g);
    expect(toggleKeys).toBeTruthy();
    expect(toggleKeys).toHaveLength(5);
  });

  it('toggle keys should be bookings, events, partners, messages, programs', () => {
    const toggleKeys = settingsFile.match(/key:\s*'([a-z]+)'\s*as\s*const/g)
      .map(m => m.match(/key:\s*'([a-z]+)'/)[1]);
    expect(toggleKeys).toEqual(['bookings', 'events', 'partners', 'messages', 'programs']);
  });

  it('should not have a payments toggle', () => {
    expect(settingsFile).not.toContain("key: 'payments'");
    expect(settingsFile).not.toMatch(/Payments\s*&\s*Billing/);
  });
});
