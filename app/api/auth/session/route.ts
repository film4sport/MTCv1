import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS, createAdminClient, resolveSession } from '@/app/lib/session';

/**
 * GET /api/auth/session
 * Validate a session token and return the user profile.
 * Used on page load to check if user is still logged in.
 * Auth: secure cookie preferred, Bearer token also supported for legacy clients
 */
export async function GET(request: Request) {
  try {
    const { token, session } = await resolveSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Update last_used timestamp
    await supabase
      .from('sessions')
      .update({ last_used: new Date().toISOString() })
      .eq('token', token);

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, skill_level, skill_level_set, membership_type, family_id, avatar, residence, interclub_team, interclub_captain, member_since, preferences')
      .eq('id', session.user_id)
      .single();

    if (!profile) {
      // Session exists but user deleted — clean up session
      await supabase.from('sessions').delete().eq('token', token);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (profile.status === 'paused') {
      return NextResponse.json({ error: 'Account paused' }, { status: 403 });
    }

    // Fetch family members if applicable
    let familyMembers: Array<{ id: string; name: string; type: string; skillLevel: string; avatar: string }> = [];
    if (profile.family_id) {
      const { data: members } = await supabase
        .from('family_members')
        .select('id, name, type, skill_level, avatar')
        .eq('family_id', profile.family_id)
        .order('name');
      if (members) {
        familyMembers = members.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          skillLevel: m.skill_level,
          avatar: m.avatar || 'tennis-male-1',
        }));
      }
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        skillLevel: profile.skill_level,
        skillLevelSet: profile.skill_level_set,
        membershipType: profile.membership_type,
        familyId: profile.family_id,
        avatar: profile.avatar,
        residence: profile.residence,
        interclubTeam: profile.interclub_team || 'none',
        interclubCaptain: profile.interclub_captain || false,
        memberSince: profile.member_since,
        preferences: profile.preferences || {},
        familyMembers,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/session
 * Logout — delete the session.
 * Auth: secure cookie preferred, Bearer token also supported for legacy clients
 */
export async function DELETE(request: Request) {
  try {
    const { token, session } = await resolveSession(request);
    if (!token || !session) {
      return NextResponse.json({ error: 'Missing or invalid session' }, { status: 401 });
    }

    const supabase = createAdminClient();

    await supabase.from('sessions').delete().eq('token', token);

    // Clear session cookie on logout
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
