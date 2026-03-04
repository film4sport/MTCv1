import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited } from '../auth-helper';

/** Fetch family + family members for the authenticated user */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    // Get the user's profile to find their family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', authResult.id)
      .single();

    if (!profile?.family_id) {
      return NextResponse.json({ family: null, members: [] });
    }

    // Fetch family and members in parallel
    const [familyRes, membersRes] = await Promise.all([
      supabase.from('families').select('*').eq('id', profile.family_id).single(),
      supabase.from('family_members').select('*').eq('family_id', profile.family_id).order('created_at'),
    ]);

    const family = familyRes.data ? {
      id: familyRes.data.id,
      name: familyRes.data.name,
      primaryUserId: familyRes.data.primary_user_id,
    } : null;

    const members = (membersRes.data || []).map(m => ({
      id: m.id,
      familyId: m.family_id,
      name: m.name,
      type: m.type,
      skillLevel: m.skill_level,
      skillLevelSet: m.skill_level_set,
      avatar: m.avatar,
      birthYear: m.birth_year,
    }));

    return NextResponse.json({ family, members });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Create a new family OR add a family member */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (isRateLimited(authResult.id)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const supabase = getAdminClient();

    if (body.action === 'createFamily') {
      // Create a new family
      const familyName = sanitizeInput(body.name || `${authResult.name}'s Family`, 100);
      const { data, error } = await supabase
        .from('families')
        .insert({ primary_user_id: authResult.id, name: familyName })
        .select('id')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Link profile to family
      await supabase.from('profiles').update({
        family_id: data.id,
        membership_type: 'family',
      }).eq('id', authResult.id);

      return NextResponse.json({ success: true, familyId: data.id });
    }

    if (body.action === 'addMember') {
      // Add a family member
      const { familyId, name, type, birthYear } = body;
      if (!familyId || !name?.trim()) {
        return NextResponse.json({ error: 'Missing familyId or name' }, { status: 400 });
      }

      // Verify the user owns this family
      const { data: family } = await supabase
        .from('families')
        .select('primary_user_id')
        .eq('id', familyId)
        .single();
      if (!family || family.primary_user_id !== authResult.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const { data: member, error } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          name: sanitizeInput(name, 100),
          type: type === 'junior' ? 'junior' : 'adult',
          birth_year: birthYear || null,
        })
        .select('*')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({
        success: true,
        member: {
          id: member.id,
          familyId: member.family_id,
          name: member.name,
          type: member.type,
          skillLevel: member.skill_level,
          avatar: member.avatar,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Update a family member */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { memberId, name, skillLevel, skillLevelSet, avatar } = await request.json();
    if (!memberId) return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });

    const supabase = getAdminClient();

    // Build update object — only include provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = sanitizeInput(name, 100);
    if (skillLevel !== undefined) updates.skill_level = skillLevel;
    if (skillLevelSet !== undefined) updates.skill_level_set = skillLevelSet;
    if (avatar !== undefined) updates.avatar = sanitizeInput(avatar, 50);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase.from('family_members').update(updates).eq('id', memberId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Remove a family member */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { memberId } = await request.json();
    if (!memberId) return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });

    const supabase = getAdminClient();
    const { error } = await supabase.from('family_members').delete().eq('id', memberId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
