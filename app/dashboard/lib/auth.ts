import type { User, SkillLevel } from './types';

// ── Session Token Management ─────────────────────────────
// Session token is stored in localStorage. All API calls use it as Bearer token.

const SESSION_KEY = 'mtc-session-token';
const USER_KEY = 'mtc-current-user';

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Helper for authenticated API calls.
 * Attaches the session token as Bearer header.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

// ── mapProfileToUser ─────────────────────────────────────
// Maps API response shape to dashboard User type
function mapProfileToUser(p: Record<string, unknown>): User {
  return {
    id: p.id as string,
    name: p.name as string,
    email: p.email as string,
    role: (p.role as User['role']) || 'member',
    status: (p.status as User['status']) || 'active',
    ntrp: (p.ntrp as number) ?? undefined,
    skillLevel: (p.skillLevel as SkillLevel) ?? undefined,
    skillLevelSet: (p.skillLevelSet as boolean) ?? false,
    membershipType: (p.membershipType as User['membershipType']) ?? undefined,
    familyId: (p.familyId as string) ?? undefined,
    memberSince: (p.memberSince as string) ?? undefined,
    avatar: (p.avatar as string) ?? undefined,
    residence: (p.residence as User['residence']) ?? 'mono',
    interclubTeam: (p.interclubTeam as User['interclubTeam']) ?? 'none',
    interclubCaptain: (p.interclubCaptain as boolean) ?? false,
    preferences: (p.preferences as Record<string, unknown>) ?? {},
  };
}

// ── PIN Login ────────────────────────────────────────────

/**
 * Login with email + 4-digit PIN.
 * Returns User on success, error message on failure.
 */
export async function pinLogin(
  email: string,
  pin: string
): Promise<{ user: User | null; error: string | null; needsPinSetup?: boolean; attemptsRemaining?: number }> {
  try {
    const res = await fetch('/api/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), pin }),
    });
    const data = await res.json();

    if (!res.ok) {
      return {
        user: null,
        error: data.error || 'Login failed',
        needsPinSetup: data.needsPinSetup,
        attemptsRemaining: data.attemptsRemaining,
      };
    }

    const user = mapProfileToUser(data.user);
    setSession(data.token, user);
    return { user, error: null };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

// ── PIN Setup (migration / first-time) ───────────────────

/**
 * Set PIN for a user who doesn't have one yet (migration from old auth).
 */
export async function pinSetup(
  email: string,
  pin: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/pin-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), pin }),
    });
    const data = await res.json();

    if (!res.ok) return { user: null, error: data.error || 'Failed to set PIN' };

    if (data.token && data.user) {
      const user = mapProfileToUser(data.user);
      setSession(data.token, user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

// ── Forgot PIN ───────────────────────────────────────────

/**
 * Request a PIN reset code be sent via email.
 */
export async function forgotPin(email: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch('/api/auth/forgot-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Failed to send reset code' };
    return { error: null };
  } catch {
    return { error: 'Network error. Please try again.' };
  }
}

/**
 * Verify the reset code and set a new PIN. Auto-logs in on success.
 */
export async function verifyResetCode(
  email: string,
  code: string,
  newPin: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code,
        newPin,
      }),
    });
    const data = await res.json();

    if (!res.ok) return { user: null, error: data.error || 'Invalid code' };

    if (data.token && data.user) {
      const user = mapProfileToUser(data.user);
      setSession(data.token, user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

// ── Signup ───────────────────────────────────────────────

/**
 * Create a new account with name + email + PIN.
 */
export async function signUp(
  name: string,
  email: string,
  pin: string,
  membershipType?: string,
  skillLevel?: string,
  residence?: string,
): Promise<{ user: User | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        pin,
        membershipType,
        skillLevel,
        residence,
      }),
    });
    const data = await res.json();

    if (!res.ok) return { user: null, error: data.error || 'Signup failed' };

    if (data.token && data.user) {
      const user = mapProfileToUser(data.user);
      setSession(data.token, user);
      return { user, error: null };
    }

    return { user: null, error: 'Signup failed' };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

// ── Session Validation ───────────────────────────────────

/**
 * Validate the current session and return the user profile.
 * Called on page load to check if still logged in.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getSessionToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      // Token invalid or expired — clear local storage
      clearSession();
      return null;
    }

    const data = await res.json();
    if (!data.user) {
      clearSession();
      return null;
    }

    const user = mapProfileToUser(data.user);
    // Update cached user data
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    // Network error — return cached user if available (offline support)
    return getCachedUser();
  }
}

// ── Logout ───────────────────────────────────────────────

/**
 * Sign out — delete session on server and clear local storage.
 */
export async function signOut(): Promise<void> {
  const token = getSessionToken();
  if (token) {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      // Server logout failed — still clear local
    }
  }
  clearSession();
}
