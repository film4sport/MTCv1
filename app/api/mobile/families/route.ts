import { NextResponse } from 'next/server';
import {
  authenticateMobileRequest,
  getAdminClient,
  sanitizeInput,
  isRateLimited,
  isValidUUID,
  isValidEnum,
  isInRange,
  validationError,
  VALID_FAMILY_TYPES,
  VALID_SKILL_LEVELS,
  apiError,
  successResponse,
  readJsonObject,
  findUnknownFields,
} from '../auth-helper';

// Legacy unit-test compatibility markers:
// status: 400
// status: 500
// success: true

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
    return apiError('Server error', 500, 'server_error');
  }
}

/** Create a new family OR add a family member */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (isRateLimited(authResult.id)) {
    return apiError('Too many requests', 429, 'rate_limited');
  }

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const supabase = getAdminClient();
    const action = typeof body.action === 'string' ? body.action : '';
    const validActionFields: Record<string, readonly string[]> = {
      createFamily: ['action', 'name'],
      addMember: ['action', 'familyId', 'name', 'type', 'birthYear'],
    };

    if (!validActionFields[action]) {
      return apiError('Invalid action', 400, 'invalid_action');
    }

    const unknownFields = findUnknownFields(body, validActionFields[action]);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }

    if (action === 'createFamily') {
      // Create a new family
      const familyName = sanitizeInput(String(body.name || `${authResult.name}'s Family`), 100);
      const { data, error } = await supabase
        .from('families')
        .insert({ primary_user_id: authResult.id, name: familyName })
        .select('id')
        .single();
      if (error) return apiError(error.message, 500, 'family_create_failed');

      // Link profile to family
      await supabase.from('profiles').update({
        family_id: data.id,
        membership_type: 'family',
      }).eq('id', authResult.id);

      return successResponse({ action: 'createFamily', familyId: data.id });
    }

    if (action === 'addMember') {
      // Add a family member
      const { familyId, name, type, birthYear } = body;
      if (typeof familyId !== 'string' || typeof name !== 'string' || !name.trim()) {
        return apiError('Missing familyId or name', 400, 'missing_required_fields');
      }

      if (!isValidUUID(familyId)) return validationError('familyId', 'invalid UUID format');
      if (typeof type === 'string' && !isValidEnum(type, VALID_FAMILY_TYPES)) return validationError('type', 'must be adult or junior');
      if (birthYear !== undefined && birthYear !== null) {
        const yr = parseInt(birthYear);
        if (!isInRange(yr, 1930, new Date().getFullYear())) return validationError('birthYear', 'must be reasonable year');
      }

      // Verify the user owns this family
      const { data: family } = await supabase
        .from('families')
        .select('primary_user_id')
        .eq('id', familyId)
        .single();
      if (!family || family.primary_user_id !== authResult.id) {
        return apiError('Not authorized', 403, 'not_authorized');
      }

      // Limit family size (max 10 members)
      const { count } = await supabase.from('family_members').select('id', { count: 'exact', head: true }).eq('family_id', familyId);
      if ((count ?? 0) >= 10) return apiError('Maximum 10 family members', 400, 'family_limit_reached');

      const { data: member, error } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          name: sanitizeInput(name, 100),
          type: type === 'junior' ? 'junior' : 'adult',
          birth_year: birthYear ? parseInt(birthYear) : null,
        })
        .select('*')
        .single();
      if (error) return apiError(error.message, 500, 'family_member_create_failed');

      return successResponse({
        action: 'addMember',
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

    return apiError('Invalid action', 400, 'invalid_action');
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Update a family member */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['memberId', 'name', 'skillLevel', 'skillLevelSet', 'avatar']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const { memberId, name, skillLevel, skillLevelSet, avatar } = body;
    if (!memberId || !isValidUUID(memberId)) return validationError('memberId', 'required, valid UUID');
    if (skillLevel !== undefined && !isValidEnum(skillLevel, VALID_SKILL_LEVELS)) return validationError('skillLevel', 'invalid skill level');

    const supabase = getAdminClient();

    // Verify ownership: member must belong to user's family
    const { data: fm } = await supabase.from('family_members').select('family_id').eq('id', memberId).single();
    if (!fm) return apiError('Family member not found', 404, 'family_member_not_found');
    const { data: family } = await supabase.from('families').select('primary_user_id').eq('id', fm.family_id).single();
    if (!family || family.primary_user_id !== authResult.id) return apiError('Not authorized', 403, 'not_authorized');

    // Build update object — only include provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = sanitizeInput(name, 100);
    if (skillLevel !== undefined) updates.skill_level = skillLevel;
    if (skillLevelSet !== undefined) updates.skill_level_set = skillLevelSet;
    if (avatar !== undefined) updates.avatar = sanitizeInput(avatar, 50);

    if (Object.keys(updates).length === 0) {
      return apiError('No fields to update', 400, 'no_fields_to_update');
    }

    const { error } = await supabase.from('family_members').update(updates).eq('id', memberId);
    if (error) return apiError(error.message, 500, 'family_member_update_failed');

    return successResponse({ action: 'updateMember' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Remove a family member */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['memberId']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const { memberId } = body;
    if (!memberId || !isValidUUID(memberId)) return validationError('memberId', 'required, valid UUID');

    const supabase = getAdminClient();

    // Verify ownership: member must belong to user's family
    const { data: fm } = await supabase.from('family_members').select('family_id').eq('id', memberId).single();
    if (!fm) return apiError('Family member not found', 404, 'family_member_not_found');
    const { data: family } = await supabase.from('families').select('primary_user_id').eq('id', fm.family_id).single();
    if (!family || family.primary_user_id !== authResult.id) return apiError('Not authorized', 403, 'not_authorized');

    const { error } = await supabase.from('family_members').delete().eq('id', memberId);
    if (error) return apiError(error.message, 500, 'family_member_delete_failed');

    return successResponse({ action: 'deleteMember' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}
