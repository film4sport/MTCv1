import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Email click-through tracking endpoint.
 * Called when a recipient clicks "View Booking" in a confirmation email.
 *
 * Query params:
 *   - id: email_logs row ID
 *   - booking: booking ID (to mark participant as confirmed)
 *   - email: recipient email (to find the booking_participant row)
 *   - redirect: where to redirect after tracking (defaults to /dashboard/schedule)
 *
 * Also used by dashboard/mobile "Confirm Attendance" button:
 *   POST /api/email-track with body { bookingId, participantId, via }
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logId = searchParams.get('id');
  const bookingId = searchParams.get('booking');
  const email = searchParams.get('email');
  const redirect = searchParams.get('redirect') || '/dashboard/schedule';

  const key = supabaseServiceKey || supabaseAnonKey;
  if (supabaseUrl && key) {
    const supabase = createClient(supabaseUrl, key);

    // 1. Update email_logs: mark as opened
    if (logId) {
      await supabase.from('email_logs')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('id', logId)
        .neq('status', 'opened'); // Don't overwrite if already opened
    }

    // 2. Mark participant as confirmed in booking_participants
    if (bookingId && email) {
      // Find participant by email → profile → booking_participant
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .single();

      if (profile) {
        await supabase.from('booking_participants')
          .update({ confirmed_at: new Date().toISOString(), confirmed_via: 'email' })
          .eq('booking_id', bookingId)
          .eq('participant_id', profile.id)
          .is('confirmed_at', null); // Only if not already confirmed

        // Create notification for the booker
        const { data: booking } = await supabase
          .from('bookings')
          .select('user_id, court_name, date, time')
          .eq('id', bookingId)
          .single();

        if (booking) {
          const { data: participant } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', profile.id)
            .single();

          const participantName = participant?.name || email;
          await supabase.from('notifications').insert({
            id: `confirm-${bookingId}-${profile.id}`,
            user_id: booking.user_id,
            type: 'booking',
            title: 'Attendance Confirmed',
            body: `${participantName} confirmed for ${booking.court_name} on ${booking.date} at ${booking.time}.`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    }
  }

  // Redirect to dashboard (or wherever the link points)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.monotennisclub.com';
  return NextResponse.redirect(new URL(redirect, siteUrl));
}

/**
 * POST handler for dashboard/mobile "Confirm Attendance" button.
 * Body: { bookingId, participantId, via: 'dashboard' | 'mobile' }
 */
export async function POST(request: Request) {
  try {
    const { bookingId, participantId, via } = await request.json();

    if (!bookingId || !participantId) {
      return NextResponse.json({ error: 'Missing bookingId or participantId' }, { status: 400 });
    }

    const key = supabaseServiceKey || supabaseAnonKey;
    if (!supabaseUrl || !key) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, key);

    // Mark participant as confirmed
    const { error } = await supabase.from('booking_participants')
      .update({ confirmed_at: new Date().toISOString(), confirmed_via: via || 'dashboard' })
      .eq('booking_id', bookingId)
      .eq('participant_id', participantId)
      .is('confirmed_at', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify the booker
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id, court_name, date, time')
      .eq('id', bookingId)
      .single();

    if (booking && booking.user_id !== participantId) {
      const { data: participant } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', participantId)
        .single();

      await supabase.from('notifications').insert({
        id: `confirm-${bookingId}-${participantId}`,
        user_id: booking.user_id,
        type: 'booking',
        title: 'Attendance Confirmed',
        body: `${participant?.name || 'A participant'} confirmed for ${booking.court_name} on ${booking.date} at ${booking.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to confirm attendance' }, { status: 500 });
  }
}
