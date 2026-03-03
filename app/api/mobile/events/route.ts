import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    // Fetch events with attendee lists
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Fetch attendees for all events
    const eventIds = (events || []).map(e => e.id);
    const { data: attendees } = await supabase
      .from('event_attendees')
      .select('event_id, user_name')
      .in('event_id', eventIds.length > 0 ? eventIds : ['__none__']);

    // Group attendees by event
    const attendeeMap: Record<string, string[]> = {};
    (attendees || []).forEach(a => {
      if (!attendeeMap[a.event_id]) attendeeMap[a.event_id] = [];
      attendeeMap[a.event_id].push(a.user_name);
    });

    // Build response matching mobile PWA shape
    const result = (events || []).map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      badge: e.badge,
      price: e.price,
      spotsTotal: e.spots_total,
      spotsTaken: e.spots_taken,
      description: e.description,
      type: e.type,
      attendees: attendeeMap[e.id] || [],
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Toggle RSVP for an event */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const userName = authResult.name;

    // Check if already attending
    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_name', userName)
      .single();

    if (existing) {
      // Un-RSVP
      const { error } = await supabase.from('event_attendees').delete().eq('id', existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // RSVP
      const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_name: userName });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
