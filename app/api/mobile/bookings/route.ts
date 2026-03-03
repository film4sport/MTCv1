import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited } from '../auth-helper';
import type { BookingRules } from '../types';

const BOOKING_RULES: BookingRules = {
  maxAdvanceDays: 7,
  slotMinutes: 30,
  courtHoursClose: { 1: 22, 2: 22, 3: 20, 4: 20 },
  validCourts: [1, 2, 3, 4],
  singles: { durations: [2, 3], maxParticipants: 1 },
  doubles: { durations: [2, 3, 4], maxParticipants: 3 },
};

const COURT_NAMES: Record<number, string> = { 1: 'Court 1', 2: 'Court 2', 3: 'Court 3', 4: 'Court 4' };

/** GET — Fetch all confirmed bookings (for calendar grid) */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .order('date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Fetch participants for all bookings
    const bookingIds = (bookings || []).map(b => b.id);
    const { data: participants } = await supabase
      .from('booking_participants')
      .select('booking_id, participant_name')
      .in('booking_id', bookingIds.length > 0 ? bookingIds : ['__none__']);

    const participantMap: Record<string, string[]> = {};
    (participants || []).forEach(p => {
      if (!participantMap[p.booking_id]) participantMap[p.booking_id] = [];
      participantMap[p.booking_id].push(p.participant_name);
    });

    const result = (bookings || []).map(b => ({
      id: b.id,
      courtId: b.court_id,
      courtName: b.court_name,
      date: b.date,
      time: b.time,
      userId: b.user_id,
      userName: b.user_name,
      guestName: b.guest_name,
      type: b.type,
      matchType: b.match_type,
      duration: b.duration,
      participants: participantMap[b.id] || [],
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** POST — Create a new booking (with server-side validation) */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  if (isRateLimited(authResult.id, 10)) {
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
      return NextResponse.json({ error: 'Invalid duration for match type' }, { status: 400 });
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

    // ── Check for conflicts & create booking ──────────
    const supabase = getAdminClient();

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

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        court_id: courtId,
        court_name: COURT_NAMES[courtId] || `Court ${courtId}`,
        date,
        time,
        user_id: authResult.id,
        user_name: userName ? sanitizeInput(userName, 200) : authResult.name || 'Member',
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
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking: newBooking });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** DELETE — Cancel a booking (admin can cancel any; members can cancel own with 24h rule) */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const isAdmin = authResult.role === 'admin';

    // Fetch booking to verify ownership / check cancellation window
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id, date, time')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Non-admins can only cancel their own bookings
    if (!isAdmin && booking.user_id !== authResult.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Non-admins must respect the 24-hour cancellation window
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
      const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24) {
        return NextResponse.json({ error: 'Cannot cancel within 24 hours of booking time' }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
