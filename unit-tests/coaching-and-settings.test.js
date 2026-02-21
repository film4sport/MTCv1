import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const infoFile = readFileSync(join(__dirname, '..', 'app', 'info', 'page.tsx'), 'utf-8');
const settingsFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'settings', 'page.tsx'), 'utf-8');

// ─── Coaching tab: email replaced with dashboard link ───
describe('Coaching tab — no exposed email', () => {
  it('should not contain Mark Taylor personal email', () => {
    expect(infoFile).not.toContain('Taylor.Mark.Tennis@gmail.com');
  });

  it('coaching section should not have any mailto: links', () => {
    // Extract the coaching tab section (between coaching tab marker and FAQ tab marker)
    const coachingSection = infoFile.match(/coaching tab[\s\S]*?FAQ TAB/i);
    expect(coachingSection).toBeTruthy();
    expect(coachingSection[0]).not.toContain('mailto:');
  });

  it('should link to /dashboard/messages instead', () => {
    // Find the coaching registration section
    const registerSection = infoFile.match(/Register for Coaching[\s\S]*?<\/div>/);
    expect(registerSection).toBeTruthy();
    expect(registerSection[0]).toContain('/dashboard/messages');
  });

  it('should say "message Coach Mark" not "email Mark"', () => {
    expect(infoFile).toContain('message Coach Mark');
    expect(infoFile).not.toContain('email Mark');
  });

  it('should still link to /dashboard/events for registration', () => {
    const registerSection = infoFile.match(/Register for Coaching[\s\S]*?<\/div>/);
    expect(registerSection).toBeTruthy();
    expect(registerSection[0]).toContain('/dashboard/events');
  });

  it('should mention "through the dashboard" for context', () => {
    expect(infoFile).toContain('through the dashboard');
  });
});

// ─── Settings: Install MTC App — no alert() ─────────────
describe('Settings — Install MTC App uses inline tip, not alert()', () => {
  it('should not use alert() anywhere in settings', () => {
    // Match alert( but not aria-label or other valid uses
    const alertCalls = settingsFile.match(/\balert\s*\(/g);
    expect(alertCalls).toBeNull();
  });

  it('should have showInstallTip state', () => {
    expect(settingsFile).toContain('useState(false)');
    expect(settingsFile).toContain('showInstallTip');
    expect(settingsFile).toContain('setShowInstallTip');
  });

  it('should call setShowInstallTip(true) when PWA prompt unavailable', () => {
    expect(settingsFile).toContain('setShowInstallTip(true)');
  });

  it('should render inline install tip with instructions', () => {
    expect(settingsFile).toContain('showInstallTip &&');
    expect(settingsFile).toContain('Add to Home Screen');
    expect(settingsFile).toContain('Share');
  });

  it('should have dismiss button for install tip', () => {
    expect(settingsFile).toContain('setShowInstallTip(false)');
    expect(settingsFile).toContain('aria-label="Dismiss"');
  });

  it('should still attempt PWA install prompt first', () => {
    expect(settingsFile).toContain('__pwaInstallPrompt');
    expect(settingsFile).toContain('.prompt()');
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
