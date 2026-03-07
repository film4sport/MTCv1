import { NextResponse } from 'next/server';
import { withAuth } from '../auth-helper';

// GET /api/mobile/court-blocks — list court blocks (optionally filter by date range)
export const GET = withAuth(async (user, request, supabase) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from'); // YYYY-MM-DD
  const to = url.searchParams.get('to');     // YYYY-MM-DD

  let query = supabase
    .from('court_blocks')
    .select('*')
    .order('block_date', { ascending: true });

  if (from) query = query.gte('block_date', from);
  if (to) query = query.lte('block_date', to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch court blocks' }, { status: 500 });
  }
  return NextResponse.json({ blocks: data || [] });
});

// POST /api/mobile/court-blocks — create a new court block (admin only)
export const POST = withAuth(async (user, request, supabase) => {
  const body = await request.json();

  const { court_id, block_date, time_start, time_end, reason, notes } = body;
  if (!block_date) {
    return NextResponse.json({ error: 'block_date is required' }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('court_blocks')
    .insert({
      court_id: court_id || null,
      block_date,
      time_start: time_start || null,
      time_end: time_end || null,
      reason,
      notes: notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('[court-blocks] Insert error:', error);
    return NextResponse.json({ error: 'Failed to create court block' }, { status: 500 });
  }
  return NextResponse.json({ block: data });
}, { role: 'admin' });

// DELETE /api/mobile/court-blocks?id=... — delete a court block (admin only)
export const DELETE = withAuth(async (user, request, supabase) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('court_blocks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[court-blocks] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete court block' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}, { role: 'admin' });
