import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    // Fetch confirmed bookings (for calendar grid)
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

    // Build response matching mobile PWA expected shape
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
