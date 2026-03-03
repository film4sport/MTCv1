import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Mobile PWA Booking Validation & Creation API
 * Validates booking rules server-side and creates bookings in Supabase.
 */

const BOOKING_RULES = {
  maxAdvanceDays: 7,
  slotMinutes: 30,
  courtHoursClose: { 1: 22, 2: 22, 3: 20, 4: 20 } as Record<number, number>,
  validCourts: [1, 2, 3, 4],
  singles: { durations: [2, 3], maxParticipants: 1 },
  doubles: { durations: [2, 3, 4], maxParticipants: 3 },
};

// In-memory rate limiter: max 10 bookings per user per hour
const bookingAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60_000; // 1 hour
const RATE_LIMIT_MAX = 10;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = bookingAttempts.get(userId);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    bookingAttempts.set(userId, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '').trim().slice(0, 200);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courtId, date, time, matchType, duration, isGuest, guestName, participants, userId, bookedFor, userName } = body;

    // ── Required fields ───────────────────────────────
    if (!courtId || !date || !time || !matchType || !duration || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Rate limit ────────────────────────────────────
    if (isRateLimited(userId)) {
      return NextResponse.json({ error: 'Too many booking attempts. Please wait.' }, { status: 429 });
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
    // Convert time to 24h for comparison
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
    const cleanGuestName = isGuest && guestName ? sanitize(guestName) : undefined;
    if (isGuest && !cleanGuestName) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    }

    // ── Supabase: check for conflicts & create booking ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing bookings in the time range (double-booking prevention)
    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('id, time')
      .eq('court_id', courtId)
      .eq('date', date)
      .eq('status', 'confirmed');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }

    // Check for time slot conflicts
    if (existing && existing.length > 0) {
      // Simple conflict check — in production, compare slot ranges
      const conflict = existing.find((b: { time: string }) => b.time === time);
      if (conflict) {
        return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
      }
    }

    // Create the booking
    // Resolve court name from ID
    const courtNames: Record<number, string> = { 1: 'Court 1', 2: 'Court 2', 3: 'Court 3', 4: 'Court 4' };

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        court_id: courtId,
        court_name: courtNames[courtId] || `Court ${courtId}`,
        date,
        time,
        user_id: userId,
        user_name: userName ? sanitize(userName) : 'Member',
        booked_for: bookedFor ? sanitize(bookedFor) : null,
        match_type: matchType,
        duration,
        type: 'court',
        guest_name: cleanGuestName,
        status: 'confirmed',
      })
      .select()
      .single();

    if (insertError) {
      // Unique constraint violation = double booking
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

/**
 * Cancel a booking.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { bookingId, userId } = await request.json();

    if (!bookingId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id, date, time')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check 24-hour cancellation window
    // Parse 12h AM/PM time (e.g. '10:00 AM') into 24h for Date constructor
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

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
