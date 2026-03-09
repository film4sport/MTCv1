import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited, cachedJson } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';
import type { BookingRules } from '../types';
import crypto from 'crypto';

const BOOKING_RULES: BookingRules = {
  maxAdvanceDays: 7,
  slotMinutes: 30,
  courtHoursClose: { 1: 22, 2: 22, 3: 20, 4: 20 },
  validCourts: [1, 2, 3, 4],
  singles: { durations: [2, 3], maxParticipants: 1 },
  doubles: { durations: [2, 3, 4], maxParticipants: 3 },
};

const COURT_NAMES: Record<number, string> = { 1: 'Court 1', 2: 'Court 2', 3: 'Court 3', 4: 'Court 4' };

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Helper: create a bell notification in Supabase */
async function createNotification(
  supabase: ReturnType<typeof getAdminClient>,
  userId: string,
  notif: { id: string; type: string; title: string; body: string; timestamp: string }
) {
  await supabase.from('notifications').insert({
    id: notif.id, user_id: userId, type: notif.type,
    title: notif.title, body: notif.body, timestamp: notif.timestamp, read: false,
  }).then(({ error }) => {
    if (error) console.error(`[mobile-booking] Failed to create notification for ${userId}:`, error.message);
  });
}

// sendPushToUser imported from ../../lib/push (shared utility)

/** Helper: send a direct message via conversations/messages tables */
async function sendMessage(
  supabase: ReturnType<typeof getAdminClient>,
  msg: { id: string; fromId: string; fromName: string; toId: string; toName: string; text: string }
) {
  const timestamp = new Date().toISOString();

  // Find or create conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(member_a.eq.${msg.fromId},member_b.eq.${msg.toId}),and(member_a.eq.${msg.toId},member_b.eq.${msg.fromId})`)
    .single();

  let conversationId: number;
  if (conv) {
    conversationId = conv.id;
  } else {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ member_a: msg.fromId, member_b: msg.toId, last_message: msg.text, last_timestamp: timestamp })
      .select('id')
      .single();
    if (!newConv) { console.error('[mobile-booking] Failed to create conversation'); return; }
    conversationId = newConv.id;
  }

  // Insert message
  const { error: msgErr } = await supabase.from('messages').insert({
    id: msg.id, conversation_id: conversationId,
    from_id: msg.fromId, from_name: msg.fromName,
    to_id: msg.toId, to_name: msg.toName,
    text: msg.text, timestamp, read: false,
  });
  if (msgErr) console.error(`[mobile-booking] Failed to send message to ${msg.toName}:`, msgErr.message);

  // Update conversation summary
  await supabase.from('conversations').update({ last_message: msg.text, last_timestamp: timestamp }).eq('id', conversationId);
}

/** Fire booking notifications: bell + message + email (non-blocking, best-effort) */
async function fireBookingNotifications(
  supabase: ReturnType<typeof getAdminClient>,
  booking: { id: string; courtName: string; date: string; time: string; matchType?: string; duration?: number },
  booker: { id: string; name: string; email: string },
  participantRows: { participant_id: string; participant_name: string }[],
) {
  const now = new Date().toISOString();
  const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const durationText = booking.duration ? `${booking.duration * 30} min` : '60 min';
  const matchLabel = booking.matchType ? booking.matchType.charAt(0).toUpperCase() + booking.matchType.slice(1) : 'Singles';

  // 1. Bell notification for booker
  await createNotification(supabase, booker.id, {
    id: generateId('n'), type: 'booking',
    title: 'Booking Confirmed',
    body: `${booking.courtName} booked for ${booking.date} at ${booking.time}.`,
    timestamp: now,
  });

  // 2. For each participant: bell notification + direct message
  if (participantRows.length > 0) {
    // Look up participant profiles to get IDs and names
    const allPlayerNames = [booker.name, ...participantRows.map(p => p.participant_name)];

    for (const p of participantRows) {
      const otherPlayers = allPlayerNames.filter(n => n !== p.participant_name).join(', ');

      // Bell notification
      await createNotification(supabase, p.participant_id, {
        id: generateId('n'), type: 'booking',
        title: 'Added to Booking',
        body: `${booker.name} added you to a booking: ${booking.courtName} on ${booking.date} at ${booking.time}.`,
        timestamp: now,
      });

      // Direct message with full details
      await sendMessage(supabase, {
        id: generateId('msg'),
        fromId: booker.id, fromName: booker.name,
        toId: p.participant_id, toName: p.participant_name,
        text: `You've been added to a court booking!\n\n📅 ${formattedDate}\n⏰ ${booking.time} (${durationText})\n📍 ${booking.courtName} — Mono Tennis Club\nMatch: ${matchLabel}\n👥 Playing with: ${otherPlayers}\n\nA confirmation email with a calendar invite has been sent to your email. You can also add this to your calendar from Dashboard → Schedule.\n[booking:${booking.courtName}:${booking.date}:${booking.time}]`,
      });

      // Web Push notification (best-effort)
      sendPushToUser(supabase, p.participant_id, {
        title: 'Added to Booking',
        body: `${booker.name} added you to ${booking.courtName} on ${booking.date} at ${booking.time}`,
        tag: 'booking-add-' + booking.id,
      });
    }
  }

  // 3. Send confirmation emails (to booker + participants) via the booking-email route
  try {
    const recipients: { email: string; name: string; role: 'booker' | 'participant' }[] = [
      { email: booker.email, name: booker.name, role: 'booker' },
    ];

    // Look up participant emails
    if (participantRows.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', participantRows.map(p => p.participant_id));
      (profiles || []).forEach(prof => {
        if (prof.email) recipients.push({ email: prof.email, name: prof.name, role: 'participant' });
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://monotennisclub.com';
    await fetch(`${siteUrl}/api/booking-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id,
        recipients,
        bookerName: booker.name,
        courtName: booking.courtName,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        matchType: booking.matchType,
      }),
    }).then(res => {
      if (!res.ok) console.error(`[mobile-booking] Email API returned ${res.status}`);
    });
  } catch (err) {
    console.error('[mobile-booking] Failed to send confirmation emails:', err);
  }
}

/** Fire cancellation notifications: bell + message + email (non-blocking, best-effort) */
async function fireCancellationNotifications(
  supabase: ReturnType<typeof getAdminClient>,
  booking: { id: string; court_name: string; date: string; time: string; user_id: string; user_name: string },
  participantRows: { participant_id: string; participant_name: string }[],
) {
  const now = new Date().toISOString();
  const cancelDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  for (const p of participantRows) {
    // Bell notification
    await createNotification(supabase, p.participant_id, {
      id: generateId('n'), type: 'booking',
      title: 'Booking Cancelled',
      body: `${booking.user_name} cancelled the booking: ${booking.court_name} on ${booking.date} at ${booking.time}.`,
      timestamp: now,
    });

    // Direct message
    await sendMessage(supabase, {
      id: generateId('msg'),
      fromId: booking.user_id, fromName: booking.user_name,
      toId: p.participant_id, toName: p.participant_name,
      text: `A court booking has been cancelled.\n\n❌ CANCELLED\n📅 ${cancelDate}\n⏰ ${booking.time}\n📍 ${booking.court_name} — Mono Tennis Club\n\nThe calendar invite has been removed. You can rebook from Dashboard → Book Court.`,
    });

    // Web Push notification (best-effort)
    sendPushToUser(supabase, p.participant_id, {
      title: 'Booking Cancelled',
      body: `${booking.user_name} cancelled ${booking.court_name} on ${booking.date} at ${booking.time}`,
      tag: 'booking-cancel-' + booking.id,
    });
  }

  // Send cancellation emails
  try {
    const cancelRecipients: { email: string; name: string }[] = [];
    const allIds = [booking.user_id, ...participantRows.map(p => p.participant_id)];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', allIds);
    (profiles || []).forEach(prof => {
      if (prof.email) cancelRecipients.push({ email: prof.email, name: prof.name });
    });

    if (cancelRecipients.length > 0) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://monotennisclub.com';
      await fetch(`${siteUrl}/api/booking-email`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          recipients: cancelRecipients,
          courtName: booking.court_name,
          date: booking.date,
          time: booking.time,
        }),
      }).then(res => {
        if (!res.ok) console.error(`[mobile-booking] Cancel email API returned ${res.status}`);
      });
    }
  } catch (err) {
    console.error('[mobile-booking] Failed to send cancellation emails:', err);
  }
}

// ─────────────────────────────────────────────────────────

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
      .select('booking_id, participant_id, participant_name, confirmed_at, confirmed_via')
      .in('booking_id', bookingIds.length > 0 ? bookingIds : ['__none__']);

    const participantMap: Record<string, { name: string; id: string; confirmedAt: string | null; confirmedVia: string | null }[]> = {};
    (participants || []).forEach(p => {
      if (!participantMap[p.booking_id]) participantMap[p.booking_id] = [];
      participantMap[p.booking_id].push({ name: p.participant_name, id: p.participant_id, confirmedAt: p.confirmed_at, confirmedVia: p.confirmed_via });
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

    return cachedJson(result, 30);
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

    // ── Check for court blocks (admin-scheduled closures) ──────────
    const { data: blocks } = await supabase
      .from('court_blocks')
      .select('id, court_id, time_start, time_end, reason')
      .eq('block_date', date)
      .or(`court_id.eq.${courtId},court_id.is.null`);

    if (blocks && blocks.length > 0) {
      const blocked = blocks.find((b: { time_start: string | null; time_end: string | null }) => {
        if (!b.time_start || !b.time_end) return true; // full-day block
        // Check if requested time falls within block range
        return time >= b.time_start && time < b.time_end;
      });
      if (blocked) {
        return NextResponse.json({
          error: `Court is blocked: ${(blocked as { reason?: string }).reason || 'Maintenance'}`
        }, { status: 409 });
      }
    }

    const courtName = COURT_NAMES[courtId] || `Court ${courtId}`;
    const bookerName = userName ? sanitizeInput(userName, 200) : authResult.name || 'Member';

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
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
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // ── Insert participants into booking_participants ──
    const participantRows: { participant_id: string; participant_name: string }[] = [];
    if (participants && Array.isArray(participants) && participants.length > 0) {
      const rows = participants.map((p: { id: string; name: string }) => ({
        booking_id: newBooking.id,
        participant_id: p.id,
        participant_name: sanitizeInput(p.name, 200),
      }));
      const { error: pErr } = await supabase.from('booking_participants').insert(rows);
      if (pErr) {
        console.error('[mobile-booking] Failed to insert participants:', pErr.message);
      } else {
        rows.forEach(r => participantRows.push({ participant_id: r.participant_id, participant_name: r.participant_name }));
      }
    }

    // ── Fire notifications (non-blocking) ─────────────
    // Don't await — respond to client immediately, notifications fire in background
    fireBookingNotifications(
      supabase,
      { id: newBooking.id, courtName, date, time, matchType, duration },
      { id: authResult.id, name: bookerName, email: authResult.email },
      participantRows,
    ).catch(err => console.error('[mobile-booking] Notification error:', err));

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

    // Fetch participants BEFORE cancelling (for notifications)
    const { data: participants } = await supabase
      .from('booking_participants')
      .select('participant_id, participant_name')
      .eq('booking_id', bookingId);

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fire cancellation notifications (non-blocking)
    if (participants && participants.length > 0) {
      fireCancellationNotifications(supabase, booking, participants)
        .catch(err => console.error('[mobile-booking] Cancel notification error:', err));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/mobile/bookings — Confirm participation in a booking
 *
 * Body: { bookingId }                         — self-confirm (mobile)
 * Body: { bookingId, participantId, via }     — confirm another participant (dashboard)
 *
 * When participantId is provided, the caller must be the booking owner or an admin.
 */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { bookingId, participantId, via } = body;
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // If confirming someone else, verify caller is booking owner or admin
    const targetId = participantId || authResult.id;
    const confirmedVia = via || 'mobile';

    if (participantId && participantId !== authResult.id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .single();

      const isOwner = booking?.user_id === authResult.id;
      const isAdmin = authResult.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Only the booking owner or an admin can confirm other participants' }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from('booking_participants')
      .update({ confirmed_at: new Date().toISOString(), confirmed_via: confirmedVia })
      .eq('booking_id', bookingId)
      .eq('participant_id', targetId);

    if (error) {
      return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
