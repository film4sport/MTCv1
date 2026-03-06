import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/mobile-auth/session
 *
 * Reads the Supabase session from cookies (set by /auth/callback after
 * Google OAuth or Magic Link) and returns user data + access token
 * in the same format as the existing /api/mobile-auth POST endpoint.
 * This lets the mobile PWA pick up the session after an OAuth redirect.
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'config' }, { status: 500 });
  }

  // Create a server client that can read session cookies
  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }

  // Use service role to fetch profile (bypasses RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminSupabase = serviceKey
    ? createClient(supabaseUrl, serviceKey)
    : createClient(supabaseUrl, supabaseAnonKey);

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('name, role, membership_type, family_id, interclub_team, interclub_captain')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'no_profile' }, { status: 404 });
  }

  // Fetch family members if applicable
  let familyMembers: Array<Record<string, unknown>> = [];
  if (profile.family_id) {
    const { data: members } = await adminSupabase
      .from('family_members')
      .select('id, name, type, skill_level, avatar, birth_year')
      .eq('family_id', profile.family_id);
    familyMembers = (members || []).map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      skillLevel: m.skill_level,
      avatar: m.avatar,
      birthYear: m.birth_year,
    }));
  }

  // Return same format as existing /api/mobile-auth POST
  return NextResponse.json({
    data: {
      role: profile.role || 'member',
      name: profile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Member',
      email: session.user.email,
      userId: session.user.id,
      accessToken: session.access_token,
      membershipType: profile.membership_type || 'individual',
      familyId: profile.family_id || null,
      interclubTeam: profile.interclub_team || '',
      interclubCaptain: profile.interclub_captain || false,
      familyMembers,
    },
  });
}
