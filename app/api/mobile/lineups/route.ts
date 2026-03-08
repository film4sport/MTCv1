import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited, isValidDate, isValidUUID } from '../auth-helper';

/** GET — Fetch upcoming lineups for the user's team */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const team = authResult.interclubTeam;
  if (team !== 'a' && team !== 'b') {
    return NextResponse.json({ error: 'Not on a team' }, { status: 403 });
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** POST — Captain creates a new match lineup */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.interclubCaptain && authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Captain or admin only' }, { status: 403 });
  }

  const team = authResult.interclubTeam;
  if (team !== 'a' && team !== 'b') {
    return NextResponse.json({ error: 'Not on a team' }, { status: 403 });
  }

  if (isRateLimited(authResult.id)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    if (!body.matchDate || !isValidDate(body.matchDate)) {
      return NextResponse.json({ error: 'Valid match date required (YYYY-MM-DD)' }, { status: 400 });
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Auto-create entries for all team members
    const { data: teamMembers } = await supabase.from('profiles').select('id').eq('interclub_team', team);
    if (teamMembers && teamMembers.length > 0) {
      await supabase.from('lineup_entries').insert(
        teamMembers.map(m => ({ lineup_id: lineup.id, member_id: m.id, status: 'pending' }))
      );
    }

    return NextResponse.json({ id: lineup.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** PATCH — Update a lineup entry (availability) */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { lineupId, memberId, status, position, notes } = body;

    if (!lineupId || !memberId) {
      return NextResponse.json({ error: 'lineupId and memberId required' }, { status: 400 });
    }
    if (!isValidUUID(memberId)) {
      return NextResponse.json({ error: 'Invalid memberId format' }, { status: 400 });
    }

    const validStatuses = ['available', 'unavailable', 'maybe', 'pending'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Members can only update their own entry; captains can update any
    const isSelf = memberId === authResult.id;
    if (!isSelf && !authResult.interclubCaptain && authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Can only update your own availability' }, { status: 403 });
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** DELETE — Captain deletes a match lineup */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.interclubCaptain && authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Captain or admin only' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const lineupId = searchParams.get('id');
    if (!lineupId) {
      return NextResponse.json({ error: 'Lineup ID required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    // Entries cascade-delete via ON DELETE CASCADE
    const { error } = await supabase.from('match_lineups').delete().eq('id', lineupId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
