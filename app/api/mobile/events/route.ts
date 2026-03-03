import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited } from '../auth-helper';
import type { EventUpdate } from '../types';

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

/** Create a new event (admin/coach only) */
export async function PUT(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin' && authResult.role !== 'coach') {
    return NextResponse.json({ error: 'Admin or coach only' }, { status: 403 });
  }

  try {
    const { title, type, date, time, location, spotsTotal, price, description } = await request.json();
    if (!title?.trim() || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (isRateLimited(authResult.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const id = `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Map mobile PWA types to schema-valid types
    const typeMap: Record<string, string> = {
      clinic: 'lesson', tournament: 'tournament', social: 'social',
      roundrobin: 'roundrobin', camp: 'social', match: 'match', lesson: 'lesson',
    };
    const dbType = typeMap[type] || 'social';
    const badge = (!price || price.toLowerCase() === 'free') ? 'free' : 'paid';

    const { error } = await supabase.from('events').insert({
      id, title: sanitizeInput(title), date, time, location: sanitizeInput(location || 'All Courts'),
      badge, price: sanitizeInput(price || 'Free', 50), spots_total: parseInt(spotsTotal) || 16,
      spots_taken: 0, description: sanitizeInput(description || '', 2000), type: dbType,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Edit an existing event (admin only) */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin' && authResult.role !== 'coach') {
    return NextResponse.json({ error: 'Admin or coach only' }, { status: 403 });
  }

  try {
    const { id, title, type, date, time, location, spotsTotal, price, description } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });

    const supabase = getAdminClient();

    const typeMap: Record<string, string> = {
      clinic: 'lesson', tournament: 'tournament', social: 'social',
      roundrobin: 'roundrobin', camp: 'social', match: 'match', lesson: 'lesson',
    };

    // Build update object with only provided fields
    const updates: EventUpdate = {};
    if (title !== undefined) updates.title = sanitizeInput(title);
    if (type !== undefined) updates.type = typeMap[type] || type;
    if (date !== undefined) updates.date = date;
    if (time !== undefined) updates.time = time;
    if (location !== undefined) updates.location = sanitizeInput(location);
    if (spotsTotal !== undefined) updates.spots_total = parseInt(spotsTotal) || 16;
    if (price !== undefined) {
      updates.price = sanitizeInput(price || 'Free', 50);
      updates.badge = (!price || price.toLowerCase() === 'free') ? 'free' : 'paid';
    }
    if (description !== undefined) updates.description = sanitizeInput(description, 2000);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase.from('events').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Delete an event (admin only) */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });

    const supabase = getAdminClient();

    // Delete attendees first (FK constraint)
    await supabase.from('event_attendees').delete().eq('event_id', id);

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
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

    if (isRateLimited(authResult.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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
