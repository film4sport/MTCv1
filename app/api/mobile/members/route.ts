import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited, isValidUUID, isValidEmail, isValidEnum, validationError, VALID_STATUSES, VALID_MEMBERSHIP_TYPES, VALID_SKILL_LEVELS, VALID_INTERCLUB_TEAMS } from '../auth-helper';
import type { ProfileUpdate } from '../types';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const isAdmin = authResult.role === 'admin';

    // Always select all fields — filter email in response based on role
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, ntrp, skill_level, avatar, member_since, status, preferences')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    // Build response in camelCase — only admins see emails
    const result = (members || []).map(m => ({
      id: m.id,
      name: m.name,
      ...(isAdmin ? { email: m.email } : {}),
      role: m.role,
      ntrp: m.ntrp,
      skillLevel: m.skill_level,
      avatar: m.avatar,
      memberSince: m.member_since,
      status: m.status,
      preferences: m.preferences || {},
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Add a new member (admin only) — creates Supabase auth user + profile */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { name, email, membershipType, skillLevel, sendWelcome } = await request.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }

    if (!isValidEmail(email.trim())) {
      return validationError('email', 'invalid email format');
    }

    if (membershipType && !isValidEnum(membershipType, VALID_MEMBERSHIP_TYPES)) {
      return validationError('membershipType', 'must be adult, family, or junior');
    }

    if (skillLevel && !isValidEnum(skillLevel, VALID_SKILL_LEVELS)) {
      return validationError('skillLevel', 'must be beginner, intermediate, advanced, or competitive');
    }

    if (isRateLimited(authResult.id, 10)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const cleanName = sanitizeInput(name, 100);
    const cleanEmail = email.trim().slice(0, 254);

    // Create auth user with a temporary password (they'll reset via email)
    const tempPassword = `MTC-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true, // auto-confirm since admin is adding them
      user_metadata: {
        name: cleanName,
        skill_level: skillLevel || 'intermediate',
        membership_type: membershipType || 'adult',
      },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    // Send password reset so they can set their own password
    if (sendWelcome && authData?.user) {
      await supabase.auth.admin.generateLink({ type: 'recovery', email: email.trim() });
    }

    return NextResponse.json({ success: true, userId: authData?.user?.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Update a member profile — members can update own profile, admins can update anyone */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const memberId = body.memberId || authResult.id; // default to self

    if (memberId !== authResult.id && !isValidUUID(memberId)) {
      return validationError('memberId', 'invalid UUID format');
    }

    const isAdmin = authResult.role === 'admin';
    const isSelf = memberId === authResult.id;

    // Captains can update interclub_team for roster management
    const isCaptain = authResult.interclubCaptain === true;
    const isCaptainRosterAction = !isSelf && isCaptain && body.interclub_team !== undefined;

    // Non-admins can only update their own profile, unless captain managing roster
    if (!isAdmin && !isSelf && !isCaptainRosterAction) {
      return NextResponse.json({ error: 'Can only update your own profile' }, { status: 403 });
    }

    const supabase = getAdminClient();
    const updates: ProfileUpdate = {};

    // Fields members can update on themselves
    if (body.avatar !== undefined) updates.avatar = sanitizeInput(body.avatar, 50);
    if (body.ntrp !== undefined) updates.ntrp = Number(body.ntrp) || 3.0;
    if (body.skillLevel !== undefined) updates.skill_level = sanitizeInput(body.skillLevel, 20);
    if (body.skillLevelSet !== undefined) updates.skill_level_set = !!body.skillLevelSet;

    // Preferences JSONB merge (court prefs, privacy, onboarding, active profile, etc.)
    if (body.preferences !== undefined && typeof body.preferences === 'object') {
      // Fetch current preferences, merge with new ones
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', memberId)
        .single();
      const currentPrefs = (currentProfile?.preferences as Record<string, unknown>) || {};
      updates.preferences = { ...currentPrefs, ...body.preferences };
    }

    // Captain roster management: can add/remove from own team only
    if (isCaptainRosterAction) {
      const captainTeam = authResult.interclubTeam;
      const targetTeam = body.interclub_team;
      // Captain can set to their team or remove (set to 'none')
      if (targetTeam !== captainTeam && targetTeam !== 'none') {
        return NextResponse.json({ error: 'Can only add to your own team or remove' }, { status: 403 });
      }
      updates.interclub_team = targetTeam;
    }

    // Fields only admins can update
    if (isAdmin) {
      if (body.name?.trim()) updates.name = sanitizeInput(body.name, 100);
      if (body.email?.trim()) {
        if (!isValidEmail(body.email.trim())) return validationError('email', 'invalid email format');
        updates.email = body.email.trim().slice(0, 254);
      }
      if (body.status?.trim()) {
        const status = sanitizeInput(body.status, 20).toLowerCase();
        if (!isValidEnum(status, VALID_STATUSES)) return validationError('status', 'must be active, paused, or inactive');
        updates.status = status;
      }
      if (body.interclub_team !== undefined) {
        if (!isValidEnum(body.interclub_team, VALID_INTERCLUB_TEAMS)) return validationError('interclub_team', 'must be none, a, or b');
        updates.interclub_team = body.interclub_team;
      }
      if (body.interclub_captain !== undefined) updates.interclub_captain = !!body.interclub_captain;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', memberId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Remove a member (admin only) — calls delete_member RPC */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { memberId } = await request.json();
    if (!memberId || !isValidUUID(memberId)) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Use the delete_member RPC which handles cascading deletes
    const { error } = await supabase.rpc('delete_member', { target_user_id: memberId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
