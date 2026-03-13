import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/auth/session
 * Validate a session token and return the user profile.
 * Used on page load to check if user is still logged in.
 * Authorization: Bearer <session-token>
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find session
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id, created_at')
      .eq('token', token)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

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
 * Authorization: Bearer <session-token>
 */
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('sessions').delete().eq('token', token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
