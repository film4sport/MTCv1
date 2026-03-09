import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited, isValidDate, isValidTime, isInRange, validationError, cachedJson } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';
import type { EventUpdate } from '../types';

// Shared utilities
import { createNotification } from '../../lib/notifications';

/** Race a promise against a timeout — returns undefined on timeout (never throws) */
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>(r => setTimeout(() => r(undefined), ms))]);
}

/** Get user IDs from attendee names (for push notifications) */
async function getAttendeeUserIds(
  supabase: ReturnType<typeof getAdminClient>,
  eventId: string
): Promise<string[]> {
  const { data: attendees } = await supabase
    .from('event_attendees').select('user_name').eq('event_id', eventId);
  if (!attendees?.length) return [];

  const names = attendees.map(a => a.user_name);
  const { data: profiles } = await supabase
    .from('profiles').select('id, name').in('name', names);
  return (profiles || []).map(p => p.id);
}

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
    // Use actual attendee count as the source of truth for spotsTaken
    const result = (events || []).map(e => {
      const eventAttendees = attendeeMap[e.id] || [];
      return {
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        badge: e.badge,
        price: e.price,
        spotsTotal: e.spots_total,
        spotsTaken: eventAttendees.length,
        description: e.description,
        type: e.type,
        attendees: eventAttendees,
      };
    });

    return cachedJson(result, 300, { isPublic: true, swr: 60 });
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

    if (!isValidDate(date)) return validationError('date', 'must be YYYY-MM-DD format in valid range');
    if (!isValidTime(time)) return validationError('time', 'must be valid time format (e.g. 9:30 AM)');

    const spots = parseInt(spotsTotal) || 16;
    if (!isInRange(spots, 1, 500)) return validationError('spotsTotal', 'must be 1–500');

    if (isRateLimited(authResult.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const id = `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Map mobile PWA types to schema-valid types
    const typeMap: Record<string, string> = {
      clinic: 'lesson', tournament: 'tournament', social: 'social',
      roundrobin: 'social', camp: 'camp', match: 'match', lesson: 'lesson',
    };
    const dbType = typeMap[type] || 'social';
    const badge = (!price || price.toLowerCase() === 'free') ? 'free' : 'paid';

    const { error } = await supabase.from('events').insert({
      id, title: sanitizeInput(title), date, time, location: sanitizeInput(location || 'All Courts'),
      badge, price: sanitizeInput(price || 'Free', 50), spots_total: spots,
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
      roundrobin: 'social', camp: 'camp', match: 'match', lesson: 'lesson',
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

    // If date or time changed, notify attendees (fire-and-forget)
    if (updates.date !== undefined || updates.time !== undefined) {
      const { data: evt } = await supabase.from('events').select('title, date, time').eq('id', id).single();
      const attendeeIds = await getAttendeeUserIds(supabase, id);
      if (evt && attendeeIds.length > 0) {
        const now = new Date().toISOString();
        const changeDetail = `Now: ${evt.date} at ${evt.time}`;
        withTimeout(Promise.allSettled(
          attendeeIds.map(uid => Promise.allSettled([
            createNotification(supabase, uid, {
              id: `notif-evt-edit-${id}-${uid.slice(0, 8)}`,
              type: 'event', title: 'Event Updated',
              body: `"${evt.title}" has been rescheduled. ${changeDetail}`,
              timestamp: now,
            }),
            sendPushToUser(supabase, uid, {
              title: 'Event Updated',
              body: `"${evt.title}" rescheduled — ${changeDetail}`,
              tag: `event-edit-${id}`,
            }),
          ]))
        )).catch(() => { /* best-effort */ });
      }
    }

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

    // Get event details + attendee user IDs before deleting
    const { data: event } = await supabase.from('events').select('title, date').eq('id', id).single();
    const attendeeIds = await getAttendeeUserIds(supabase, id);

    // Delete attendees first (FK constraint)
    await supabase.from('event_attendees').delete().eq('event_id', id);

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify all attendees that the event was cancelled (fire-and-forget)
    if (event && attendeeIds.length > 0) {
      const now = new Date().toISOString();
      withTimeout(Promise.allSettled(
        attendeeIds.map(uid => Promise.allSettled([
          createNotification(supabase, uid, {
            id: `notif-evt-cancel-${id}-${uid.slice(0, 8)}`,
            type: 'event', title: 'Event Cancelled',
            body: `"${event.title}" on ${event.date} has been cancelled`,
            timestamp: now,
          }),
          sendPushToUser(supabase, uid, {
            title: 'Event Cancelled',
            body: `"${event.title}" on ${event.date} has been cancelled`,
            tag: `event-cancel-${id}`,
          }),
        ]))
      )).catch(() => { /* best-effort */ });
    }

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

      // Bell + push notification on RSVP (fire-and-forget)
      const { data: evt } = await supabase.from('events').select('title, date').eq('id', eventId).single();
      if (evt) {
        const now = new Date().toISOString();
        const notifId = `notif-rsvp-${eventId}-${authResult.id.slice(0, 8)}`;
        Promise.all([
          createNotification(supabase, authResult.id, {
            id: notifId, type: 'event', title: 'RSVP Confirmed',
            body: `You're going to "${evt.title}" on ${evt.date}`,
            timestamp: now,
          }),
          sendPushToUser(supabase, authResult.id, {
            title: 'RSVP Confirmed',
            body: `You're going to "${evt.title}" on ${evt.date}`,
            tag: `event-rsvp-${eventId}`,
          }),
        ]).catch(() => { /* best-effort */ });
      }

      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
