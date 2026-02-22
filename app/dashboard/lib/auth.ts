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
    memberSince: profile.member_since ?? undefined,
    avatar: profile.avatar ?? undefined,
  };
}

/**
 * Sign up a new member with Supabase Auth.
 * Profile row is auto-created by the database trigger.
 * Returns the User or an error message.
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  membershipType?: string,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'member', membership_type: membershipType || 'single' } },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Signup failed' };

  return {
    user: {
      id: data.user.id,
      name,
      email,
      role: 'member',
      memberSince: new Date().toISOString().slice(0, 7),
    },
    error: null,
  };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Send a password reset email via Supabase Auth.
 * Returns an error message or null on success.
 */
export async function resetPassword(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
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
    memberSince: profile.member_since ?? undefined,
    avatar: profile.avatar ?? undefined,
  };
}
