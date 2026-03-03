import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const isAdmin = authResult.role === 'admin';

    // Always select all fields — filter email in response based on role
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, ntrp, skill_level, avatar, member_since, status')
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

    const supabase = getAdminClient();

    // Create auth user with a temporary password (they'll reset via email)
    const tempPassword = `MTC-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: true, // auto-confirm since admin is adding them
      user_metadata: {
        name: name.trim(),
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

/** Update a member profile (admin only) */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { memberId, name, email, status } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.trim();
    if (status?.trim()) updates.status = status.trim().toLowerCase();

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
