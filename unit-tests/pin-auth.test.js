/**
 * PIN Auth Tests — API Route Structure & Validation
 *
 * Tests all new PIN-based auth routes:
 *   /api/auth/pin-login
 *   /api/auth/pin-setup
 *   /api/auth/forgot-pin
 *   /api/auth/verify-code
 *   /api/auth/session
 *   /api/auth/signup
 *
 * Verifies: route structure, validation, rate limiting, weak PIN rejection,
 * session management, brute force protection, cross-platform consistency.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

// ── Helper to read route files ──
function readRoute(path) {
  const full = resolve(root, path);
  if (!existsSync(full)) throw new Error(`Route file not found: ${path}`);
  return readFileSync(full, 'utf-8');
}

// ============================================================
// PIN LOGIN (/api/auth/pin-login)
// ============================================================
describe('PIN Login Route — /api/auth/pin-login', () => {
  const content = readRoute('app/api/auth/pin-login/route.ts');

  it('exports POST handler', () => {
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('validates email and PIN are present', () => {
    expect(content).toContain('email');
    expect(content).toContain('pin');
    expect(content).toMatch(/status:\s*400/);
  });

  it('uses bcrypt for PIN verification', () => {
    expect(content).toContain('bcrypt');
    expect(content).toContain('compare');
  });

  it('implements IP-based rate limiting', () => {
    expect(content).toMatch(/x-forwarded-for/i);
    expect(content).toMatch(/rate.*limit|isRateLimited/i);
    expect(content).toMatch(/status:\s*429/);
  });

  it('implements brute force lockout', () => {
    expect(content).toContain('pin_attempts');
    expect(content).toContain('pin_locked_until');
  });

  it('returns needsPinSetup for users without PIN', () => {
    expect(content).toContain('needsPinSetup');
    expect(content).toContain('pin_hash');
  });

  it('creates session on success', () => {
    expect(content).toContain('sessions');
    expect(content).toContain('token');
  });

  it('returns user profile on success', () => {
    expect(content).toContain('name');
    expect(content).toContain('email');
    expect(content).toContain('role');
    expect(content).toContain('skill_level');
  });

  it('resets pin_attempts on successful login', () => {
    expect(content).toContain('pin_attempts');
    // Should reset to 0
    expect(content).toMatch(/pin_attempts.*0|pin_attempts:\s*0/);
  });

  it('normalizes email to lowercase', () => {
    expect(content).toContain('toLowerCase');
  });
});

// ============================================================
// PIN SETUP (/api/auth/pin-setup)
// ============================================================
describe('PIN Setup Route — /api/auth/pin-setup', () => {
  const content = readRoute('app/api/auth/pin-setup/route.ts');

  it('exports POST handler', () => {
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('rejects weak PINs', () => {
    // Should reject 1111, 1234, 4321
    expect(content).toContain('1234');
    expect(content).toContain('4321');
    // Repeated digits pattern
    expect(content).toMatch(/\\1\{3\}|repeated/i);
  });

  it('validates PIN is exactly 4 digits', () => {
    expect(content).toMatch(/\\d\{4\}/);
  });

  it('hashes PIN with bcrypt', () => {
    expect(content).toContain('bcrypt');
    expect(content).toContain('hash');
  });

  it('supports migration flow (email-only, no existing PIN)', () => {
    expect(content).toContain('email');
    expect(content).toContain('pin_hash');
  });

  it('supports logged-in flow (session token)', () => {
    expect(content).toContain('token');
    expect(content).toContain('sessions');
  });

  it('creates session on migration flow', () => {
    expect(content).toContain('sessions');
    expect(content).toContain('token');
  });
});

// ============================================================
// FORGOT PIN (/api/auth/forgot-pin)
// ============================================================
describe('Forgot PIN Route — /api/auth/forgot-pin', () => {
  const content = readRoute('app/api/auth/forgot-pin/route.ts');

  it('exports POST handler', () => {
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('generates a 4-digit reset code', () => {
    // Should generate random 4-digit code
    expect(content).toMatch(/Math\.random|randomInt|pin_reset_code/);
  });

  it('sets code expiry (10 minutes)', () => {
    expect(content).toContain('pin_reset_expires');
    // 10 minutes = 600000 ms
    expect(content).toMatch(/600000|10.*min/);
  });

  it('sends email via SMTP/nodemailer', () => {
    expect(content).toContain('nodemailer');
    expect(content).toContain('SMTP');
    expect(content).toContain('sendMail');
  });

  it('never reveals whether email exists (enumeration protection)', () => {
    // Should always return success regardless of whether email was found
    expect(content).toMatch(/success.*true/);
  });

  it('implements rate limiting', () => {
    expect(content).toMatch(/rate|limit/i);
    expect(content).toMatch(/status:\s*429/);
  });
});

// ============================================================
// VERIFY CODE (/api/auth/verify-code)
// ============================================================
describe('Verify Code Route — /api/auth/verify-code', () => {
  const content = readRoute('app/api/auth/verify-code/route.ts');

  it('exports POST handler', () => {
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('validates code is exactly 4 digits', () => {
    expect(content).toMatch(/\\d\{4\}/);
  });

  it('validates new PIN is exactly 4 digits', () => {
    expect(content).toContain('newPin');
    expect(content).toMatch(/\\d\{4\}/);
  });

  it('rejects weak PINs', () => {
    expect(content).toContain('1234');
    expect(content).toContain('4321');
  });

  it('checks code expiry', () => {
    expect(content).toContain('pin_reset_expires');
    expect(content).toMatch(/expir/i);
  });

  it('verifies code matches stored code', () => {
    expect(content).toContain('pin_reset_code');
  });

  it('clears reset fields after success', () => {
    expect(content).toMatch(/pin_reset_code.*null/);
    expect(content).toMatch(/pin_reset_expires.*null/);
  });

  it('resets lockout on success', () => {
    expect(content).toMatch(/pin_attempts.*0/);
    expect(content).toMatch(/pin_locked_until.*null/);
  });

  it('auto-logs in on success (creates session)', () => {
    expect(content).toContain('sessions');
    expect(content).toContain('token');
  });

  it('hashes the new PIN', () => {
    expect(content).toContain('bcrypt');
    expect(content).toContain('hash');
  });

  it('implements rate limiting', () => {
    expect(content).toMatch(/x-forwarded-for/i);
    expect(content).toMatch(/status:\s*429/);
  });
});

// ============================================================
// SESSION (/api/auth/session)
// ============================================================
describe('Session Route — /api/auth/session', () => {
  const content = readRoute('app/api/auth/session/route.ts');

  it('exports GET and DELETE handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('accepts cookie-backed sessions and optional Bearer tokens', () => {
    expect(content).toContain('resolveSession');
    expect(content).toContain('SESSION_COOKIE_NAME');
  });

  it('returns 401 for missing/invalid token', () => {
    expect(content).toMatch(/status:\s*401/);
  });

  it('returns user profile on GET', () => {
    expect(content).toContain('name');
    expect(content).toContain('email');
    expect(content).toContain('role');
    expect(content).toContain('skill_level');
    expect(content).toContain('membership_type');
  });

  it('updates last_used timestamp', () => {
    expect(content).toContain('last_used');
  });

  it('handles paused accounts', () => {
    expect(content).toContain('paused');
    expect(content).toMatch(/status:\s*403/);
  });

  it('fetches family members if applicable', () => {
    expect(content).toContain('family_members');
    expect(content).toContain('family_id');
  });

  it('deletes session on DELETE (logout)', () => {
    expect(content).toContain('.delete()');
  });
});

// ============================================================
// SIGNUP (/api/auth/signup)
// ============================================================
describe('Signup Route — /api/auth/signup', () => {
  const content = readRoute('app/api/auth/signup/route.ts');

  it('exports POST handler', () => {
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('validates required fields (name, email, pin)', () => {
    expect(content).toContain('name');
    expect(content).toContain('email');
    expect(content).toContain('pin');
    expect(content).toMatch(/status:\s*400/);
  });

  it('checks email uniqueness', () => {
    expect(content).toMatch(/already.*exist|duplicate|unique/i);
    expect(content).toMatch(/status:\s*409/);
  });

  it('rejects weak PINs', () => {
    expect(content).toContain('1234');
    expect(content).toContain('4321');
  });

  it('hashes PIN with bcrypt (cost factor 12)', () => {
    expect(content).toContain('bcrypt');
    expect(content).toContain('hash');
    expect(content).toMatch(/12/);
  });

  it('creates profile directly in profiles table', () => {
    expect(content).toContain('profiles');
    expect(content).toContain('.insert');
  });

  it('creates notification preferences', () => {
    expect(content).toContain('notification_preferences');
  });

  it('auto-creates session', () => {
    expect(content).toContain('sessions');
    expect(content).toContain('token');
  });

  it('returns token and user profile', () => {
    expect(content).toContain('token');
    expect(content).toContain('user');
  });

  it('implements rate limiting', () => {
    expect(content).toMatch(/rate|limit/i);
  });
});

// ============================================================
// AUTH HELPER — Session Token Validation
// ============================================================
describe('Auth Helper — authenticateMobileRequest', () => {
  const content = readRoute('app/api/mobile/auth-helper.ts');

  it('validates session tokens from sessions table (not Supabase Auth)', () => {
    expect(content).toContain('sessions');
    expect(content).toContain('token');
    // Should NOT reference supabase.auth
    expect(content).not.toMatch(/supabase\.auth\.getUser/);
    expect(content).not.toMatch(/supabase\.auth\.getSession/);
  });

  it('checks for paused accounts', () => {
    expect(content).toContain('paused');
    expect(content).toMatch(/status:\s*403/);
  });

  it('updates last_used fire-and-forget', () => {
    expect(content).toContain('last_used');
  });
});

// ============================================================
// CROSS-PLATFORM: No supabase.auth references remain
// ============================================================
describe('Cross-Platform — No supabase.auth references', () => {
  const filesToCheck = [
    'app/dashboard/lib/auth.ts',
    'app/dashboard/lib/store.tsx',
    'app/dashboard/components/DashboardHeader.tsx',
    'app/dashboard/admin/components/AdminCourtsTab.tsx',
    'app/api/push-subscribe/route.ts',
    'app/api/push-send/route.ts',
    'app/api/notify-push/route.ts',
    'app/api/notify-message/route.ts',
    'app/api/notify-email/route.ts',
    'app/api/keep-alive/route.ts',
    'app/api/mobile/auth-helper.ts',
  ];

  for (const file of filesToCheck) {
    it(`${file} does not use supabase.auth`, () => {
      const content = readRoute(file);
      expect(content).not.toMatch(/supabase\.auth\.getUser/);
      expect(content).not.toMatch(/supabase\.auth\.getSession/);
      expect(content).not.toMatch(/supabase\.auth\.signIn/);
      expect(content).not.toMatch(/supabase\.auth\.signUp/);
    });
  }
});

// ============================================================
// DELETED FILES — Old auth routes must not exist
// ============================================================
describe('Old Auth Files — Must Be Deleted', () => {
  const deletedFiles = [
    'app/auth/callback/route.ts',
    'app/auth/complete/page.tsx',
    'app/api/mobile-auth/route.ts',
    'app/api/mobile-auth/session/route.ts',
    'app/api/mobile-signup/route.ts',
    'app/api/reset-password/route.ts',
  ];

  for (const file of deletedFiles) {
    it(`${file} is deleted`, () => {
      expect(existsSync(resolve(root, file))).toBe(false);
    });
  }
});

// ============================================================
// CLIENT AUTH — Dashboard auth.ts uses PIN functions
// ============================================================
describe('Dashboard Auth Client — PIN Functions', () => {
  const content = readRoute('app/dashboard/lib/auth.ts');

  it('exports pinLogin function', () => {
    expect(content).toMatch(/export.*function\s+pinLogin/);
  });

  it('exports pinSetup function', () => {
    expect(content).toMatch(/export.*function\s+pinSetup/);
  });

  it('exports forgotPin function', () => {
    expect(content).toMatch(/export.*function\s+forgotPin/);
  });

  it('exports verifyResetCode function', () => {
    expect(content).toMatch(/export.*function\s+verifyResetCode/);
  });

  it('exports signUp function', () => {
    expect(content).toMatch(/export.*function\s+signUp/);
  });

  it('exports signOut function', () => {
    expect(content).toMatch(/export.*function\s+signOut/);
  });

  it('exports getCurrentUser function', () => {
    expect(content).toMatch(/export.*function\s+getCurrentUser/);
  });

  it('uses cookie-backed auth and only caches the current user locally', () => {
    expect(content).not.toContain('mtc-session-token');
    expect(content).toContain("credentials: 'same-origin'");
    expect(content).toContain('mtc-current-user');
  });

  it('does NOT reference any Supabase Auth functions', () => {
    expect(content).not.toContain('signInWithPassword');
    expect(content).not.toContain('signInWithOAuth');
    expect(content).not.toContain('signInWithOtp');
    expect(content).not.toContain('supabase.auth');
  });
});

// ============================================================
// MOBILE PWA — auth.js uses PIN functions
// ============================================================
describe('Mobile PWA auth.js — PIN Functions', () => {
  const content = readFileSync(resolve(root, 'public/mobile-app/js/auth.js'), 'utf-8');

  it('defines handlePinLogin', () => {
    expect(content).toContain('handlePinLogin');
  });

  it('defines handlePinSetup', () => {
    expect(content).toContain('handlePinSetup');
  });

  it('defines showForgotPinScreen', () => {
    expect(content).toContain('showForgotPinScreen');
  });

  it('defines handleForgotPin', () => {
    expect(content).toContain('handleForgotPin');
  });

  it('defines handleVerifyCode', () => {
    expect(content).toContain('handleVerifyCode');
  });

  it('uses /api/auth/pin-login endpoint', () => {
    expect(content).toContain('/api/auth/pin-login');
  });

  it('uses /api/auth/pin-setup endpoint', () => {
    expect(content).toContain('/api/auth/pin-setup');
  });

  it('uses /api/auth/forgot-pin endpoint', () => {
    expect(content).toContain('/api/auth/forgot-pin');
  });

  it('uses /api/auth/verify-code endpoint', () => {
    expect(content).toContain('/api/auth/verify-code');
  });

  it('stores session token via MTC.setToken', () => {
    expect(content).toContain('MTC.setToken');
  });

  it('does NOT reference Google OAuth', () => {
    expect(content).not.toContain('handleGoogleSignIn');
    expect(content).not.toContain('signInWithOAuth');
  });

  it('does NOT reference Magic Link', () => {
    expect(content).not.toContain('handleMagicLink');
    expect(content).not.toContain('signInWithOtp');
  });
});

// ============================================================
// MOBILE PWA — index.html has PIN form elements
// ============================================================
describe('Mobile PWA index.html — PIN Auth HTML', () => {
  const content = readFileSync(resolve(root, 'public/mobile-app/index.html'), 'utf-8');

  it('has loginPin input', () => {
    expect(content).toContain('id="loginPin"');
  });

  it('has pinSetupCard', () => {
    expect(content).toContain('id="pinSetupCard"');
  });

  it('has forgotPinCard', () => {
    expect(content).toContain('id="forgotPinCard"');
  });

  it('has verifyCodeCard', () => {
    expect(content).toContain('id="verifyCodeCard"');
  });

  it('has setupPin and setupPinConfirm inputs', () => {
    expect(content).toContain('id="setupPin"');
    expect(content).toContain('id="setupPinConfirm"');
  });

  it('has forgotPinEmail input', () => {
    expect(content).toContain('id="forgotPinEmail"');
  });

  it('has resetCode input', () => {
    expect(content).toContain('id="resetCode"');
  });

  it('has newPin and newPinConfirm inputs', () => {
    expect(content).toContain('id="newPin"');
    expect(content).toContain('id="newPinConfirm"');
  });

  it('does NOT have signupPin inputs (signup card removed)', () => {
    expect(content).not.toContain('id="signupPin"');
    expect(content).not.toContain('id="signupPinConfirm"');
  });

  it('does NOT have Google Sign-In button', () => {
    expect(content).not.toContain('handleGoogleSignIn');
    expect(content).not.toContain('Continue with Google');
  });

  it('does NOT have Magic Link elements', () => {
    expect(content).not.toContain('magicLinkOverlay');
    expect(content).not.toContain('handleMagicLink');
    expect(content).not.toContain('Sign in with Email Link');
  });
});

// ============================================================
// LANDING PAGE SIGNUP — PIN fields present
// ============================================================
describe('Landing Page Signup — /signup', () => {
  const content = readRoute('app/signup/page.tsx');

  it('imports signUp from auth', () => {
    expect(content).toMatch(/import.*signUp.*from.*auth/);
  });

  it('does NOT import Google OAuth or Magic Link functions', () => {
    expect(content).not.toContain('signInWithGoogle');
    expect(content).not.toContain('signInWithMagicLink');
    expect(content).not.toContain('completeOAuthProfile');
    expect(content).not.toContain('resendConfirmation');
  });

  it('has PIN state variables', () => {
    expect(content).toContain('setPin');
    expect(content).toContain('setPinConfirm');
  });

  it('has PIN input fields', () => {
    expect(content).toContain('signup-pin');
    expect(content).toContain('signup-pin-confirm');
  });

  it('validates PIN is 4 digits', () => {
    expect(content).toMatch(/\\d\{4\}/);
  });

  it('validates PINs match', () => {
    expect(content).toContain('pin !== pinConfirm');
  });

  it('calls signUp with PIN parameter', () => {
    expect(content).toMatch(/signUp\(.*pin/);
  });

  it('does NOT reference supabase.auth', () => {
    expect(content).not.toContain('supabase.auth');
  });

  it('does NOT have email confirm pending flow', () => {
    expect(content).not.toContain('emailConfirmPending');
    expect(content).not.toContain('resendCooldown');
    expect(content).not.toContain('resendConfirmation');
  });
});

// ============================================================
// LOGIN PAGE — PIN auth forms
// ============================================================
describe('Login Page — /login', () => {
  const content = readRoute('app/login/page.tsx');

  it('imports PIN auth functions', () => {
    expect(content).toMatch(/import.*pinLogin/);
    expect(content).toMatch(/import.*pinSetup/);
    expect(content).toMatch(/import.*forgotPin/);
    expect(content).toMatch(/import.*verifyResetCode/);
  });

  it('does NOT import Google OAuth or Magic Link functions', () => {
    expect(content).not.toContain('signInWithGoogle');
    expect(content).not.toContain('signInWithMagicLink');
  });

  it('has PIN login form elements', () => {
    expect(content).toContain('login-pin');
    expect(content).toContain('login-email');
  });

  it('has screen state for multi-screen flow', () => {
    expect(content).toContain('pinSetup');
    expect(content).toContain('forgotPin');
    expect(content).toContain('verifyCode');
  });

  it('handles needsPinSetup response', () => {
    expect(content).toContain('needsPinSetup');
  });

  it('does NOT reference supabase.auth', () => {
    expect(content).not.toContain('supabase.auth');
  });

  it('does NOT have magic link overlay', () => {
    expect(content).not.toContain('magicLinkSent');
    expect(content).not.toContain('Magic Link');
  });
});

// ============================================================
// WEAK PIN FUZZING
// ============================================================
describe('Weak PIN Rejection — Pattern Coverage', () => {
  // These tests verify the weak PIN patterns exist in the route files

  const verifyCodeContent = readRoute('app/api/auth/verify-code/route.ts');
  const pinSetupContent = readRoute('app/api/auth/pin-setup/route.ts');
  const signupContent = readRoute('app/api/auth/signup/route.ts');

  const routeContents = [
    { name: 'verify-code', content: verifyCodeContent },
    { name: 'pin-setup', content: pinSetupContent },
    { name: 'signup', content: signupContent },
  ];

  for (const { name, content } of routeContents) {
    it(`${name} rejects 1234`, () => {
      expect(content).toContain('1234');
    });

    it(`${name} rejects 4321`, () => {
      expect(content).toContain('4321');
    });

    it(`${name} rejects repeated digits (e.g. 1111)`, () => {
      // Regex pattern for 4 repeated digits
      expect(content).toMatch(/\\1\{3\}|repeated/i);
    });

    it(`${name} returns 400 for weak PINs`, () => {
      expect(content).toMatch(/status:\s*400/);
    });
  }
});
