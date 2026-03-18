import type { User, SkillLevel } from './types';

const USER_KEY = 'mtc-current-user';

export function setSession(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
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

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  return fetch(url, { ...options, headers, credentials: 'same-origin' });
}

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

export async function pinLogin(
  email: string,
  pin: string
): Promise<{ user: User | null; error: string | null; needsPinSetup?: boolean; attemptsRemaining?: number }> {
  try {
    const res = await fetch('/api/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
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
    setSession(user);
    return { user, error: null };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

export async function pinSetup(
  email: string,
  pin: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/pin-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: email.trim().toLowerCase(), pin }),
    });
    const data = await res.json();

    if (!res.ok) return { user: null, error: data.error || 'Failed to set PIN' };

    if (data.user) {
      const user = mapProfileToUser(data.user);
      setSession(user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

export async function forgotPin(email: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch('/api/auth/forgot-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Failed to send reset code' };
    return { error: null };
  } catch {
    return { error: 'Network error. Please try again.' };
  }
}

export async function verifyResetCode(
  email: string,
  code: string,
  newPin: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code,
        newPin,
      }),
    });
    const data = await res.json();

    if (!res.ok) return { user: null, error: data.error || 'Invalid code' };

    if (data.user) {
      const user = mapProfileToUser(data.user);
      setSession(user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

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
      credentials: 'same-origin',
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

    if (data.user) {
      const user = mapProfileToUser(data.user);
      setSession(user);
      return { user, error: null };
    }

    return { user: null, error: 'Signup failed' };
  } catch {
    return { user: null, error: 'Network error. Please try again.' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    if (!data.user) {
      clearSession();
      return null;
    }

    const user = mapProfileToUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return getCachedUser();
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    // Server logout failed — still clear local
  }
  clearSession();
}
