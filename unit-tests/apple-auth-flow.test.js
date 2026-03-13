/**
 * Apple/iOS Auth Flow Tests
 *
 * Verifies magic link and OAuth redirects work correctly for iOS devices.
 * Catches regressions where hardcoded /dashboard redirects bypass device detection.
 *
 * Related files:
 * - app/auth/complete/page.tsx (device auto-detection)
 * - app/auth/callback/route.ts (server-side redirect routing)
 * - app/login/page.tsx (magic link + Google OAuth calls)
 * - app/dashboard/components/MobileAppBanner.tsx (tablet detection)
 * - app/dashboard/components/TabletNagBanner.tsx (tablet nag)
 * - public/mobile-app/js/auth.js (mobile PWA magic link)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

// Read all relevant source files
const authComplete = readFileSync(resolve(root, 'app/auth/complete/page.tsx'), 'utf-8');
const authCallback = readFileSync(resolve(root, 'app/auth/callback/route.ts'), 'utf-8');
const loginPage = readFileSync(resolve(root, 'app/login/page.tsx'), 'utf-8');
const mobileAppBanner = readFileSync(resolve(root, 'app/dashboard/components/MobileAppBanner.tsx'), 'utf-8');
const tabletNagBanner = readFileSync(resolve(root, 'app/dashboard/components/TabletNagBanner.tsx'), 'utf-8');
const mobileAuthJs = readFileSync(resolve(root, 'public/mobile-app/js/auth.js'), 'utf-8');

// ── /auth/complete — Device Auto-Detection ──────────────────────────

describe('/auth/complete — device auto-detection', () => {
  it('checks localStorage for mtc-auth-redirect first', () => {
    expect(authComplete).toContain("localStorage.getItem('mtc-auth-redirect')");
  });

  it('removes the redirect hint after reading it', () => {
    expect(authComplete).toContain("localStorage.removeItem('mtc-auth-redirect')");
  });

  it('detects iPhone via user agent', () => {
    expect(authComplete).toMatch(/isIPhone.*\/iPhone\/.*test\(ua\)/);
  });

  it('detects iPad via user agent (includes Macintosh + touch)', () => {
    expect(authComplete).toMatch(/isIPad/);
    expect(authComplete).toContain('/iPad/.test(ua)');
    expect(authComplete).toContain("'ontouchend' in document");
  });

  it('detects Android mobile', () => {
    expect(authComplete).toMatch(/isAndroidMobile/);
  });

  it('detects Android tablet', () => {
    expect(authComplete).toMatch(/isAndroidTablet/);
  });

  it('redirects mobile/tablet to /mobile-app/index.html', () => {
    expect(authComplete).toContain("'/mobile-app/index.html?auth=callback'");
  });

  it('appends ?auth=callback hint for mobile PWA session detection', () => {
    expect(authComplete).toContain('auth=callback');
  });

  it('defaults to /dashboard only for desktop', () => {
    expect(authComplete).toContain("window.location.replace('/dashboard')");
    // The /dashboard redirect should come AFTER all device checks
    const dashboardIdx = authComplete.indexOf("'/dashboard'");
    const iphoneIdx = authComplete.indexOf('isIPhone');
    expect(dashboardIdx).toBeGreaterThan(iphoneIdx);
  });
});

// ── /auth/callback — Server-Side Routing ──────────────────────────

describe('/auth/callback — server-side routing', () => {
  it('routes to /auth/complete when no next param (default)', () => {
    expect(authCallback).toContain('/auth/complete');
  });

  it('routes mobile-app next param to /auth/complete', () => {
    expect(authCallback).toMatch(/next.*includes.*mobile-app/);
    // Should go to auth/complete, NOT directly to mobile-app
    expect(authCallback).toContain("next.includes('mobile-app')");
  });

  it('routes recovery type to /login?reset=true', () => {
    expect(authCallback).toContain("/login?reset=true");
  });
});

// ── Login Page — No Hardcoded /dashboard ──────────────────────────

describe('login page — no hardcoded /dashboard redirects', () => {
  it('signInWithMagicLink is called WITHOUT nextPath', () => {
    // Should NOT have signInWithMagicLink(email, '/dashboard')
    expect(loginPage).not.toMatch(/signInWithMagicLink\([^)]*'\/dashboard'/);
  });

  it('signInWithGoogle is called WITHOUT nextPath', () => {
    // Should NOT have signInWithGoogle('/dashboard')
    expect(loginPage).not.toMatch(/signInWithGoogle\(\s*'\/dashboard'/);
  });

  it('still imports signInWithMagicLink', () => {
    expect(loginPage).toContain('signInWithMagicLink');
  });

  it('still imports signInWithGoogle', () => {
    expect(loginPage).toContain('signInWithGoogle');
  });
});

// ── Mobile PWA — Sets Redirect Hint ──────────────────────────────

describe('mobile PWA auth.js — magic link redirect hint', () => {
  it('sets mtc-auth-redirect before sending OTP', () => {
    expect(mobileAuthJs).toContain("localStorage.setItem('mtc-auth-redirect'");
  });

  it('sets redirect to /mobile-app/index.html', () => {
    expect(mobileAuthJs).toContain("'mtc-auth-redirect', '/mobile-app/index.html'");
  });

  it('sets redirect BEFORE signInWithOtp call', () => {
    const setIdx = mobileAuthJs.indexOf("localStorage.setItem('mtc-auth-redirect'");
    const otpIdx = mobileAuthJs.indexOf('signInWithOtp');
    expect(setIdx).toBeGreaterThan(-1);
    expect(otpIdx).toBeGreaterThan(-1);
    expect(setIdx).toBeLessThan(otpIdx);
  });

  it('includes emailRedirectTo pointing to /auth/callback', () => {
    expect(mobileAuthJs).toContain("'/auth/callback?next='");
  });

  it('detects ?auth=callback param on page load for session check', () => {
    expect(mobileAuthJs).toMatch(/searchParams.*has.*auth/);
  });
});

// ── Duplicate Banner Prevention ──────────────────────────────────

describe('MobileAppBanner — tablet detection', () => {
  it('detects iPad to suppress banner', () => {
    expect(mobileAppBanner).toContain('/iPad/.test(ua)');
  });

  it('detects iPad masquerading as Macintosh', () => {
    expect(mobileAppBanner).toContain("'ontouchend' in document");
  });

  it('detects Android tablets', () => {
    expect(mobileAppBanner).toMatch(/Android.*Mobile/);
  });

  it('dismisses immediately on tablet (does not show)', () => {
    // On tablet, should call setDismissed(true) and return early
    expect(mobileAppBanner).toMatch(/isIPad.*isAndroidTablet.*setDismissed\(true\)/s);
  });
});

describe('TabletNagBanner — tablet nag still works', () => {
  it('detects iPad via user agent', () => {
    expect(tabletNagBanner).toContain('/iPad/.test(ua)');
  });

  it('detects iPad pretending to be Mac', () => {
    expect(tabletNagBanner).toContain("'ontouchend' in document");
  });

  it('uses sessionStorage (reappears each session)', () => {
    expect(tabletNagBanner).toContain('sessionStorage');
    expect(tabletNagBanner).toContain('mtc-tablet-nag-closed');
  });

  it('links to mobile PWA', () => {
    expect(tabletNagBanner).toContain('/mobile-app/index.html');
  });
});

// ── Auth Flow — End-to-End Path Consistency ──────────────────────

describe('auth flow — end-to-end path consistency', () => {
  it('/auth/complete and mobile PWA agree on the redirect key name', () => {
    // Both must use 'mtc-auth-redirect'
    expect(authComplete).toContain('mtc-auth-redirect');
    expect(mobileAuthJs).toContain('mtc-auth-redirect');
  });

  it('/auth/complete and mobile PWA agree on the auth=callback param', () => {
    expect(authComplete).toContain('auth=callback');
    expect(mobileAuthJs).toMatch(/auth.*callback/);
  });

  it('MobileAppBanner and TabletNagBanner use same iPad detection logic', () => {
    // Both should check /iPad/ and Macintosh+ontouchend
    expect(mobileAppBanner).toContain('/iPad/.test(ua)');
    expect(tabletNagBanner).toContain('/iPad/.test(ua)');
    expect(mobileAppBanner).toContain("'ontouchend' in document");
    expect(tabletNagBanner).toContain("'ontouchend' in document");
  });
});
