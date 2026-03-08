import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, isRateLimited, sanitizeInput, SETTINGS_KEY_WHITELIST } from '../auth-helper';

/** Get club settings */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('club_settings').select('key, value');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Convert to key-value object
    const settings: Record<string, string> = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Get or update notification preferences for the current user */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const body = await request.json();

    if (body.action === 'getNotifPrefs') {
      // Fetch notification preferences
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', authResult.id)
        .single();

      if (!data) {
        return NextResponse.json({ bookings: true, events: true, partners: true, messages: true, programs: true });
      }
      return NextResponse.json({
        bookings: data.bookings,
        events: data.events,
        partners: data.partners,
        messages: data.messages,
        programs: data.programs,
      });
    }

    if (body.action === 'setNotifPrefs') {
      const prefs = body.prefs;
      if (!prefs || typeof prefs !== 'object') {
        return NextResponse.json({ error: 'Missing prefs object' }, { status: 400 });
      }

      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: authResult.id,
        bookings: prefs.bookings !== undefined ? !!prefs.bookings : true,
        events: prefs.events !== undefined ? !!prefs.events : true,
        partners: prefs.partners !== undefined ? !!prefs.partners : true,
        messages: prefs.messages !== undefined ? !!prefs.messages : true,
        programs: prefs.programs !== undefined ? !!prefs.programs : true,
      }, { onConflict: 'user_id' });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'setInterclubTeam') {
      const team = body.team;
      const validTeams = ['none', 'a', 'b'];
      if (!validTeams.includes(team)) {
        return NextResponse.json({ error: 'Invalid team value' }, { status: 400 });
      }
      const { error } = await supabase.from('profiles').update({ interclub_team: team }).eq('id', authResult.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Update club settings (admin only) */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Missing settings object' }, { status: 400 });
    }

    if (isRateLimited(authResult.id, 20)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();

    // Validate keys against whitelist (allow event_tasks_ prefix for task management)
    const allowedKeys = Object.keys(settings).filter(k =>
      (SETTINGS_KEY_WHITELIST as readonly string[]).includes(k) || k.startsWith('event_tasks_')
    );
    const rejectedKeys = Object.keys(settings).filter(k => !allowedKeys.includes(k));
    if (rejectedKeys.length > 0) {
      return NextResponse.json({ error: `Invalid setting keys: ${rejectedKeys.join(', ')}` }, { status: 400 });
    }

    // Upsert each setting (with value length limit)
    for (const key of allowedKeys) {
      const value = sanitizeInput(String(settings[key]), 5000);
      const { error } = await supabase.from('club_settings').upsert(
        { key, value, updated_at: new Date().toISOString(), updated_by: authResult.id },
        { onConflict: 'key' }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
