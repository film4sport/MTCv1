import { NextResponse } from 'next/server';
import { withAuth, isValidDate, isValidTime, isInRange, isValidEnum, sanitizeInput, validationError, VALID_BLOCK_REASONS } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';

/** Parse "9:30 AM" or "6:00 PM" → minutes since midnight */
function parseTimeMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/** Find and cancel bookings that conflict with a court block */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cancelConflictingBookings(
  supabase: any,
  block: { court_id: number | null; block_date: string; time_start: string | null; time_end: string | null; reason: string },
  adminName: string
) {
  // Find confirmed bookings on this date
  let query = supabase
    .from('bookings')
    .select('id, court_id, court_name, date, time, user_id, user_name')
    .eq('date', block.block_date)
    .eq('status', 'confirmed');

  // If blocking a specific court, filter to that court only
  if (block.court_id !== null) {
    query = query.eq('court_id', block.court_id);
  }

  const { data: bookings, error } = await query;
  if (error || !bookings || bookings.length === 0) return [];

  // Filter by time range if not full-day
  const affected = bookings.filter((b: { time: string }) => {
    if (!block.time_start && !block.time_end) return true; // full-day → all bookings
    const slotMins = parseTimeMinutes(b.time);
    const startMins = block.time_start ? parseTimeMinutes(block.time_start) : 0;
    const endMins = block.time_end ? parseTimeMinutes(block.time_end) : 1440;
    return slotMins >= startMins && slotMins < endMins;
  });

  if (affected.length === 0) return [];

  // Cancel all affected bookings
  const affectedIds = affected.map((b: { id: string }) => b.id);
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .in('id', affectedIds);

  if (cancelError) {
    console.error('[court-blocks] Failed to cancel bookings:', cancelError.message);
    return [];
  }

  // Notify each affected user (bell + push, fire-and-forget)
  const notifiedUsers = new Set<string>();
  for (const booking of affected) {
    if (notifiedUsers.has(booking.user_id)) continue;
    notifiedUsers.add(booking.user_id);

    const courtLabel = booking.court_name || 'Court';
    const notifBody = `Your booking on ${courtLabel} at ${booking.time} on ${booking.date} was cancelled: ${block.reason}`;

    // Bell notification
    supabase.from('notifications').insert({
      id: `notif-block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: booking.user_id,
      type: 'booking',
      title: 'Booking cancelled — court blocked',
      body: notifBody,
      timestamp: new Date().toISOString(),
      read: false,
    }).then(({ error: e }: { error: { message: string } | null }) => { if (e) console.error('[court-blocks] notification insert error:', e.message); });

    // Push notification
    sendPushToUser(supabase, booking.user_id, {
      title: 'Booking Cancelled',
      body: notifBody,
      tag: `block-cancel-${booking.id}`,
      url: '/mobile-app/index.html#book',
    }).catch(() => { /* best-effort */ });
  }

  return affected;
}

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
// Auto-cancels conflicting bookings and notifies affected users
export const POST = withAuth(async (user, request, supabase) => {
  const body = await request.json();

  const { court_id, block_date, time_start, time_end, reason, notes } = body;
  if (!block_date) {
    return NextResponse.json({ error: 'block_date is required' }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  // Validate inputs
  if (!isValidDate(block_date)) return validationError('block_date', 'must be YYYY-MM-DD');
  if (court_id !== null && court_id !== undefined && !isInRange(Number(court_id), 1, 4)) return validationError('court_id', 'must be 1–4');
  if (!isValidEnum(reason, VALID_BLOCK_REASONS)) return validationError('reason', 'must be one of: ' + VALID_BLOCK_REASONS.join(', '));
  if (time_start && !isValidTime(time_start)) return validationError('time_start', 'invalid time format');
  if (time_end && !isValidTime(time_end)) return validationError('time_end', 'invalid time format');

  const { data, error } = await supabase
    .from('court_blocks')
    .insert({
      court_id: court_id || null,
      block_date,
      time_start: time_start || null,
      time_end: time_end || null,
      reason: sanitizeInput(reason, 100),
      notes: notes ? sanitizeInput(notes, 500) : null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('[court-blocks] Insert error:', error);
    return NextResponse.json({ error: 'Failed to create court block' }, { status: 500 });
  }

  // Auto-cancel conflicting bookings and notify affected users
  const cancelled = await cancelConflictingBookings(supabase, {
    court_id: court_id || null,
    block_date,
    time_start: time_start || null,
    time_end: time_end || null,
    reason: reason || 'Maintenance',
  }, user.name);

  return NextResponse.json({
    block: data,
    cancelledBookings: cancelled.length,
    cancelledDetails: cancelled.map((b: { id: string; user_name: string; time: string; court_name: string }) => ({ id: b.id, userName: b.user_name, time: b.time, court: b.court_name })),
  });
}, { role: 'admin' });

// DELETE /api/mobile/court-blocks — delete court block(s) (admin only)
// Supports: ?id=... (single), or body { ids: [...] } (bulk), or body { courtId, from, to } (range)
export const DELETE = withAuth(async (user, request, supabase) => {
  const url = new URL(request.url);
  const singleId = url.searchParams.get('id');

  // Single delete via query param (existing behavior)
  if (singleId) {
    const { error } = await supabase
      .from('court_blocks')
      .delete()
      .eq('id', singleId);

    if (error) {
      console.error('[court-blocks] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete court block' }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: 1 });
  }

  // Bulk delete via request body
  let body: { ids?: string[]; courtId?: number | null; from?: string; to?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'id query param or JSON body required' }, { status: 400 });
  }

  // Option 1: Delete by specific IDs
  if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    const { data, error } = await supabase
      .from('court_blocks')
      .delete()
      .in('id', body.ids)
      .select('id');

    if (error) {
      console.error('[court-blocks] Bulk delete error:', error);
      return NextResponse.json({ error: 'Failed to delete court blocks' }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: data?.length || 0 });
  }

  // Option 2: Delete by date range (+ optional court filter)
  if (body.from) {
    let query = supabase
      .from('court_blocks')
      .delete()
      .gte('block_date', body.from);

    if (body.to) query = query.lte('block_date', body.to);
    if (body.courtId !== undefined && body.courtId !== null) {
      query = query.eq('court_id', body.courtId);
    }

    const { data, error } = await query.select('id');

    if (error) {
      console.error('[court-blocks] Range delete error:', error);
      return NextResponse.json({ error: 'Failed to delete court blocks' }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: data?.length || 0 });
  }

  return NextResponse.json({ error: 'Provide id param, ids array, or from/to date range' }, { status: 400 });
}, { role: 'admin' });
