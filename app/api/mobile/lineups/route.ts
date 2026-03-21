import { NextResponse } from 'next/server';
import {
  authenticateMobileRequest,
  getAdminClient,
  sanitizeInput,
  isRateLimited,
  isValidDate,
  isValidUUID,
  apiError,
  successResponse,
  readJsonObject,
  findUnknownFields,
} from '../auth-helper';

/** GET — Fetch upcoming lineups for the user's team */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const team = authResult.interclubTeam;
  if (team !== 'a' && team !== 'b') {
    return apiError('Not on a team', 403, 'not_on_team');
  }

  try {
    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: lineups, error } = await supabase
      .from('match_lineups')
      .select('*')
      .eq('team', team)
      .gte('match_date', today)
      .order('match_date');

    if (error) return apiError(error.message, 500, 'lineups_fetch_failed');
    if (!lineups || lineups.length === 0) return NextResponse.json([]);

    // Fetch entries
    const lineupIds = lineups.map(l => l.id);
    const { data: entries } = await supabase
      .from('lineup_entries')
      .select('*')
      .in('lineup_id', lineupIds);

    // Fetch member names
    const memberIds = Array.from(new Set((entries || []).map(e => e.member_id)));
    const memberMap: Record<string, { name: string; skill_level?: string }> = {};
    if (memberIds.length > 0) {
      const { data: members } = await supabase.from('profiles').select('id, name, skill_level').in('id', memberIds);
      if (members) members.forEach(m => { memberMap[m.id] = { name: m.name, skill_level: m.skill_level }; });
    }

    const result = lineups.map(l => ({
      id: l.id,
      team: l.team,
      matchDate: l.match_date,
      matchTime: l.match_time,
      opponent: l.opponent,
      location: l.location,
      notes: l.notes,
      createdBy: l.created_by,
      entries: (entries || [])
        .filter(e => e.lineup_id === l.id)
        .map(e => ({
          id: e.id,
          memberId: e.member_id,
          memberName: memberMap[e.member_id]?.name || 'Unknown',
          memberSkillLevel: memberMap[e.member_id]?.skill_level,
          status: e.status,
          position: e.position,
          notes: e.notes,
        })),
    }));

    return NextResponse.json(result);
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** POST — Captain creates a new match lineup */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.interclubCaptain && authResult.role !== 'admin') {
    return apiError('Captain or admin only', 403, 'captain_or_admin_only');
  }

  const team = authResult.interclubTeam;
  if (team !== 'a' && team !== 'b') {
    return apiError('Not on a team', 403, 'not_on_team');
  }

  if (isRateLimited(authResult.id)) {
    return apiError('Too many requests', 429, 'rate_limited');
  }

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['matchDate', 'matchTime', 'opponent', 'location', 'notes']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    if (!body.matchDate || !isValidDate(body.matchDate)) {
      return apiError('Valid match date required (YYYY-MM-DD)', 400, 'invalid_match_date');
    }

    const supabase = getAdminClient();
    const { data: lineup, error } = await supabase
      .from('match_lineups')
      .insert({
        team,
        match_date: body.matchDate,
        match_time: body.matchTime ? sanitizeInput(body.matchTime, 20) : null,
        opponent: body.opponent ? sanitizeInput(body.opponent, 100) : null,
        location: body.location ? sanitizeInput(body.location, 100) : null,
        notes: body.notes ? sanitizeInput(body.notes, 500) : null,
        created_by: authResult.id,
      })
      .select('id')
      .single();

    if (error) return apiError(error.message, 500, 'lineup_create_failed');

    // Auto-create entries for all team members
    const { data: teamMembers } = await supabase.from('profiles').select('id').eq('interclub_team', team);
    if (teamMembers && teamMembers.length > 0) {
      await supabase.from('lineup_entries').insert(
        teamMembers.map(m => ({ lineup_id: lineup.id, member_id: m.id, status: 'pending' }))
      );
    }

    return successResponse({ action: 'createLineup', id: lineup.id });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** PATCH — Update a lineup entry (availability) */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['lineupId', 'memberId', 'status', 'position', 'notes']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const { lineupId, memberId, status, position, notes } = body;

    if (!lineupId || !memberId) {
      return apiError('lineupId and memberId required', 400, 'missing_required_fields');
    }
    if (!isValidUUID(lineupId)) {
      return apiError('Invalid lineupId format', 400, 'invalid_lineup_id');
    }
    if (!isValidUUID(memberId)) {
      return apiError('Invalid memberId format', 400, 'invalid_member_id');
    }

    const validStatuses = ['available', 'unavailable', 'maybe', 'pending'];
    if (status && !validStatuses.includes(status)) {
      return apiError('Invalid status', 400, 'invalid_status');
    }

    // Members can only update their own entry; captains can update any
    const isSelf = memberId === authResult.id;
    if (!isSelf && !authResult.interclubCaptain && authResult.role !== 'admin') {
      return apiError('Can only update your own availability', 403, 'self_or_captain_only');
    }

    const supabase = getAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (position !== undefined) updates.position = position ? sanitizeInput(position, 50) : null;
    if (notes !== undefined) updates.notes = notes ? sanitizeInput(notes, 200) : null;

    const { error } = await supabase
      .from('lineup_entries')
      .update(updates)
      .eq('lineup_id', lineupId)
      .eq('member_id', memberId);

    if (error) return apiError(error.message, 500, 'lineup_update_failed');
    return successResponse({ action: 'updateLineupEntry' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** DELETE — Captain deletes a match lineup */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.interclubCaptain && authResult.role !== 'admin') {
    return apiError('Captain or admin only', 403, 'captain_or_admin_only');
  }

  try {
    let lineupId = new URL(request.url).searchParams.get('id');
    const contentLength = request.headers.get('content-length');
    if (!lineupId && contentLength && contentLength !== '0') {
      const body = await readJsonObject(request);
      if (body instanceof NextResponse) return body;
      const unknownFields = findUnknownFields(body, ['id']);
      if (unknownFields.length > 0) {
        return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
      }
      if (typeof body.id === 'string') lineupId = body.id;
    }
    if (!lineupId) {
      return apiError('Lineup ID required', 400, 'missing_lineup_id');
    }
    if (!isValidUUID(lineupId)) {
      return apiError('Invalid lineup ID format', 400, 'invalid_lineup_id');
    }

    const supabase = getAdminClient();
    // Entries cascade-delete via ON DELETE CASCADE
    const { error } = await supabase.from('match_lineups').delete().eq('id', lineupId);
    if (error) return apiError(error.message, 500, 'lineup_delete_failed');

    return successResponse({ action: 'deleteLineup' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}
