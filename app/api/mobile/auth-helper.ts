import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

/**
 * Validate a Bearer token from the mobile PWA and return the authenticated user.
 * Returns the user profile or a NextResponse error.
 */
export async function authenticateMobileRequest(
  request: Request
): Promise<AuthenticatedUser | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const token = authHeader.slice(7);

  // Verify token with Supabase auth (use anon key for auth verification)
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Fetch user profile using service role (bypasses RLS)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const { data: profile } = await adminClient
    .from('profiles')
    .select('name, role, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  return {
    id: user.id,
    email: profile.email,
    role: profile.role,
    name: profile.name,
  };
}

/**
 * Get a Supabase admin client (service role, bypasses RLS).
 * Use this for server-side queries in mobile API endpoints.
 */
export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
}
