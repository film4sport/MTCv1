import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '../../lib/push';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** Booking rules — MUST match mobile API and BookingModal.tsx */
const BOOKING_RULES = {
  maxAdvanceDays: 7,
  slotMinutes: 30,
  courtHoursClose: { 1: 22, 2: 22, 3: 20, 4: 20 } as Record<number, number>,
  validCourts: [1, 2, 3, 4],
  singles: { durations: [2, 3], maxParticipants: 1 },
  doubles: { durations: [2, 3, 4], maxParticipants: 3 },
};

const COURT_NAMES: Record<number, string> = { 1: 'Court 1', 2: 'Court 2', 3: 'Court 3', 4: 'Court 4' };

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

// Rate limit: 10 bookings per minute per user
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(userId: string, max = 10): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

function sanitizeInput(str: string, maxLen: number): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '').trim().slice(0, maxLen);
}

/** Authenticate dashboard user via Supabase JWT */
async function authenticateDashboardRequest(request: Request): Promise<{ id: string; name: string; email: string; role: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Fetch profile
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: profile } = await adminClient.from('profiles').select('id, name, email, role').eq('id', user.id).single();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return { id: profile.id, name: profile.name, email: profile.email, role: profile.role };
}

/**
 * POST /api/dashboard/bookings — Create a booking with server-side validation
 *
 * Body: { courtId, date, time, matchType, duration, isGuest?, guestName?, participants?, bookedFor?, userName? }
 *
 * Returns: { success: true, booking: {...} } on success
 * Returns: { error: "..." } on validation failure
 */
export async function POST(request: Request) {
  const authResult = await authenticateDashboardRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (isRateLimited(authResult.id)) {
    return NextResponse.json({ error: 'Too many booking attempts. Please wait.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { courtId, date, time, matchType, duration, isGuest, guestName, participants, bookedFor, userName } = body;

    // ── Required fields ───────────────────────────────
    if (!courtId || !date || !time || !matchType || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Validate court ────────────────────────────────
    if (!BOOKING_RULES.validCourts.includes(courtId)) {
      return NextResponse.json({ error: 'Invalid court' }, { status: 400 });
    }

    // ── Validate match type ───────────────────────────
    if (matchType !== 'singles' && matchType !== 'doubles') {
      return NextResponse.json({ error: 'Invalid match type' }, { status: 400 });
    }

    // ── Validate duration ─────────────────────────────
    const rules = BOOKING_RULES[matchType as 'singles' | 'doubles'];
    if (!rules.durations.includes(duration)) {
      return NextResponse.json({ error: `Invalid duration for ${matchType}. Allowed: ${rules.durations.map(d => d * 30 + ' min').join(', ')}` }, { status: 400 });
    }

    // ── Validate date (not in past, within 7 days) ────
    const bookDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + BOOKING_RULES.maxAdvanceDays);

    if (isNaN(bookDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    if (bookDate < today) {
      return NextResponse.json({ error: 'Cannot book in the past' }, { status: 400 });
    }
    if (bookDate > maxDate) {
      return NextResponse.json({ error: `Cannot book more than ${BOOKING_RULES.maxAdvanceDays} days in advance` }, { status: 400 });
    }

    // ── Validate time format ──────────────────────────
    const timeRegex = /^(1[0-2]|[1-9]):(00|30)\s?(AM|PM)$/i;
    if (!timeRegex.test(time)) {
      return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    // ── Validate court closing time ───────────────────
    const closeHour = BOOKING_RULES.courtHoursClose[courtId] || 22;
    const timeParts = time.match(/(\d+):(\d+)\s?(AM|PM)/i);
    if (timeParts) {
      let hour = parseInt(timeParts[1]);
      const period = timeParts[3].toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      const endHour = hour + (duration * BOOKING_RULES.slotMinutes) / 60;
      if (endHour > closeHour) {
        return NextResponse.json({ error: 'Booking extends past court closing time' }, { status: 400 });
      }
    }

    // ── Validate participants ─────────────────────────
    if (participants && Array.isArray(participants)) {
      if (participants.length > rules.maxParticipants) {
        return NextResponse.json({ error: `Too many participants for ${matchType}` }, { status: 400 });
      }
    }

    // ── Validate guest name ───────────────────────────
    const cleanGuestName = isGuest && guestName ? sanitizeInput(guestName, 200) : undefined;
    if (isGuest && !cleanGuestName) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    }

    // ── Check for conflicts ───────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('id, time')
      .eq('court_id', courtId)
      .eq('date', date)
      .eq('status', 'confirmed');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      const conflict = existing.find((b: { time: string }) => b.time === time);
      if (conflict) {
        return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
      }
    }

    // ── Check for court blocks ────────────────────────
    const { data: blocks } = await supabase
      .from('court_blocks')
      .select('id, court_id, time_start, time_end, reason')
      .eq('block_date', date)
      .or(`court_id.eq.${courtId},court_id.is.null`);

    if (blocks && blocks.length > 0) {
      const blocked = blocks.find((b: { time_start: string | null; time_end: string | null }) => {
        if (!b.time_start || !b.time_end) return true; // full-day block
        return time >= b.time_start && time < b.time_end;
      });
      if (blocked) {
        return NextResponse.json({
          error: `Court is blocked: ${(blocked as { reason?: string }).reason || 'Maintenance'}`
        }, { status: 409 });
      }
    }

    // ── Create booking ────────────────────────────────
    const courtName = COURT_NAMES[courtId] || `Court ${courtId}`;
    const bookerName = userName ? sanitizeInput(userName, 200) : authResult.name || 'Member';
    const bookingId = generateId('b'); // Always server-generated — never accept client IDs

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        court_id: courtId,
        court_name: courtName,
        date,
        time,
        user_id: authResult.id,
        user_name: bookerName,
        booked_for: bookedFor ? sanitizeInput(bookedFor, 200) : null,
        match_type: matchType,
        duration,
        type: 'court',
        guest_name: cleanGuestName,
        status: 'confirmed',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'This slot was just booked by someone else' }, { status: 409 });
      }
      console.error('[dashboard-booking] Insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // ── Insert participants ───────────────────────────
    if (participants && Array.isArray(participants) && participants.length > 0) {
      const rows = participants.map((p: { id: string; name: string }) => ({
        booking_id: newBooking.id,
        participant_id: p.id,
        participant_name: sanitizeInput(p.name, 200),
      }));
      const { error: pErr } = await supabase.from('booking_participants').insert(rows);
      if (pErr) {
        console.error('[dashboard-booking] Failed to insert participants:', pErr.message);
      }
    }

    // Notifications are handled client-side by store.tsx (bell, push, message, email)
    // since the dashboard already has that logic wired up.

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err) {
    console.error('[dashboard-booking] Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/dashboard/bookings — Cancel a booking with server-side validation
 *
 * Body: { bookingId }
 */
export async function DELETE(request: Request) {
  const authResult = await authenticateDashboardRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isAdmin = authResult.role === 'admin';

    // Fetch booking to verify ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, user_id, user_name, court_name, date, time')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Non-admins can only cancel their own bookings
    if (!isAdmin && booking.user_id !== authResult.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Non-admins cannot cancel past bookings
    if (!isAdmin) {
      const timeMatch = (booking.time as string).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      let bookingDateTime: Date;
      if (timeMatch) {
        let h = parseInt(timeMatch[1]);
        const min = parseInt(timeMatch[2]);
        const isPM = timeMatch[3].toUpperCase() === 'PM';
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        bookingDateTime = new Date(`${booking.date}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
      } else {
        bookingDateTime = new Date(`${booking.date}T${booking.time}`);
      }
      if (bookingDateTime.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Cannot cancel a booking that has already started' }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notifications handled client-side by store.tsx

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[dashboard-booking] Cancel error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
