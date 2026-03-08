import type { User, SkillLevel } from './types';
import { supabase } from '../../lib/supabase';

/**
 * Sign in with Supabase Auth.
 * Returns a User object from the profiles table if successful, null if rejected.
 */
export async function signIn(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  // Fetch profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as User['role'],
    status: (profile.status as User['status']) || 'active',
    ntrp: profile.ntrp ?? undefined,
    skillLevel: (profile.skill_level as SkillLevel) ?? undefined,
    skillLevelSet: profile.skill_level_set ?? false,
    membershipType: (profile.membership_type as User['membershipType']) ?? undefined,
    familyId: profile.family_id ?? undefined,
    memberSince: profile.member_since ?? undefined,
    avatar: profile.avatar ?? undefined,
    preferences: profile.preferences ?? {},
  };
}

/**
 * Sign up a new member with Supabase Auth (passwordless).
 * A random password is generated internally — users log in via Google or Magic Link only.
 * Profile row is auto-created by the database trigger.
 */
export async function signUp(
  email: string,
  name: string,
  membershipType?: string,
  skillLevel?: string,
  residence?: string,
): Promise<{ user: User | null; error: string | null; emailConfirmRequired?: boolean }> {
  // Generate a strong random password the user never sees (Supabase requires one)
  const randomPassword = crypto.randomUUID() + '-Aa1!';

  const { data, error } = await supabase.auth.signUp({
    email,
    password: randomPassword,
    options: {
      data: { name, role: 'member', membership_type: membershipType || 'adult', skill_level: skillLevel || undefined, skill_level_set: skillLevel ? true : false, residence: residence || 'mono' },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.monotennisclub.com'}/auth/callback`,
    },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Signup failed' };

  // Supabase returns identities=[] when email confirmation is required and
  // the email is already registered but unconfirmed. It also sets
  // session=null when confirmation is pending.
  const needsConfirmation = !data.session;

  return {
    user: {
      id: data.user.id,
      name,
      email,
      role: 'member',
      memberSince: new Date().toISOString().slice(0, 7),
    },
    error: null,
    emailConfirmRequired: needsConfirmation,
  };
}

/**
 * Sign in (or sign up) with Google OAuth.
 * Redirects to Google's consent screen. After auth, Supabase sends
 * the user back to /auth/callback with a ?next= hint so the callback
 * knows where to go (e.g. /signup for new users, /dashboard for logins).
 */
export async function signInWithGoogle(nextPath?: string): Promise<{ error: string | null }> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.monotennisclub.com';
  const redirectTo = `${origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { error: error?.message || null };
}

/**
 * Send a magic link (passwordless email login).
 * Only works for existing users — new users should go through the signup wizard.
 */
export async function signInWithMagicLink(email: string, nextPath?: string): Promise<{ error: string | null }> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.monotennisclub.com';
  const redirectTo = nextPath
    ? `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
    : `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    // Supabase returns "Signups not allowed for otp" when user doesn't exist
    if (error.message?.toLowerCase().includes('signups not allowed') || error.message?.toLowerCase().includes('user not found')) {
      return { error: 'No account found with this email. Please sign up first.' };
    }
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Complete an OAuth signup by updating the user's profile with wizard data.
 * Called after an OAuth user finishes the signup wizard steps.
 */
export async function completeOAuthProfile(
  userId: string,
  data: { membershipType: string; skillLevel?: string; name?: string; residence?: string },
): Promise<{ error: string | null }> {
  // Update user metadata in Supabase Auth
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      membership_type: data.membershipType,
      skill_level: data.skillLevel || undefined,
      skill_level_set: data.skillLevel ? true : false,
      residence: data.residence || 'mono',
      ...(data.name ? { name: data.name } : {}),
    },
  });
  if (metaError) return { error: metaError.message };

  // Update the profiles table directly
  const updateFields: Record<string, unknown> = {
    membership_type: data.membershipType,
    residence: data.residence || 'mono',
  };
  if (data.skillLevel) {
    updateFields.skill_level = data.skillLevel;
    updateFields.skill_level_set = true;
  }
  if (data.name) {
    updateFields.name = data.name;
  }
  const { error: profileError } = await supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', userId);

  return { error: profileError?.message || null };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Send a password reset email via server-side API (rate-limited).
 * Returns an error message or null on success.
 */
export async function resetPassword(email: string): Promise<string | null> {
  try {
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || 'Failed to send reset email';
    return null;
  } catch {
    return 'Network error. Please try again.';
  }
}

/**
 * Update the current user's password (used after reset link click).
 * Requires an active recovery session.
 */
export async function updatePassword(newPassword: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? error.message : null;
}

/**
 * Get the currently authenticated user's profile.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as User['role'],
    status: (profile.status as User['status']) || 'active',
    ntrp: profile.ntrp ?? undefined,
    skillLevel: (profile.skill_level as SkillLevel) ?? undefined,
    skillLevelSet: profile.skill_level_set ?? false,
    membershipType: (profile.membership_type as User['membershipType']) ?? undefined,
    familyId: profile.family_id ?? undefined,
    memberSince: profile.member_since ?? undefined,
    avatar: profile.avatar ?? undefined,
    preferences: profile.preferences ?? {},
  };
}
