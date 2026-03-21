import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, isRateLimited, sanitizeInput, cachedJson, SETTINGS_KEY_WHITELIST, apiError, readJsonObject, successResponse, findUnknownFields } from '../auth-helper';

function isMissingAnnouncementsColumn(message?: string) {
  return typeof message === 'string' && message.toLowerCase().includes('announcements');
}

/** Get club settings */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('club_settings').select('key, value');
    if (error) return apiError(error.message, 500, 'settings_fetch_failed');

    // Convert to key-value object
    const settings: Record<string, string> = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    return cachedJson(settings, 300, { swr: 60 });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Get or update notification preferences for the current user */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const action = typeof body.action === 'string' ? body.action : '';
    const validActionFields: Record<string, readonly string[]> = {
      getNotifPrefs: ['action'],
      setNotifPrefs: ['action', 'prefs'],
      setInterclubTeam: ['action', 'team'],
    };
    if (!validActionFields[action]) {
      return apiError('Invalid action', 400, 'invalid_action');
    }
    const unknownFields = findUnknownFields(body, validActionFields[action]);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }

    if (action === 'getNotifPrefs') {
      // Fetch notification preferences
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', authResult.id)
        .single();

      if (!data) {
        return NextResponse.json({ bookings: true, events: true, partners: true, announcements: true, messages: true, programs: true });
      }
      return NextResponse.json({
        bookings: data.bookings ?? true,
        events: data.events ?? true,
        partners: data.partners ?? true,
        announcements: data.announcements ?? true,
        messages: data.messages ?? true,
        programs: data.programs ?? true,
      });
    }

    if (action === 'setNotifPrefs') {
      const prefs = body.prefs;
      if (!prefs || typeof prefs !== 'object') {
        return apiError('Missing prefs object', 400, 'missing_prefs');
      }
      const prefsRecord = prefs as Record<string, unknown>;
      const unknownPrefKeys = Object.keys(prefsRecord).filter((key) => !['bookings', 'events', 'partners', 'announcements', 'messages', 'programs'].includes(key));
      if (unknownPrefKeys.length > 0) {
        return apiError(`Unknown prefs key(s): ${unknownPrefKeys.join(', ')}`, 400, 'unknown_pref_keys');
      }

      const basePrefs = {
        user_id: authResult.id,
        bookings: prefsRecord.bookings !== undefined ? !!prefsRecord.bookings : true,
        events: prefsRecord.events !== undefined ? !!prefsRecord.events : true,
        partners: prefsRecord.partners !== undefined ? !!prefsRecord.partners : true,
        messages: prefsRecord.messages !== undefined ? !!prefsRecord.messages : true,
        programs: prefsRecord.programs !== undefined ? !!prefsRecord.programs : true,
      };

      const withAnnouncements = {
        ...basePrefs,
        announcements: prefsRecord.announcements !== undefined ? !!prefsRecord.announcements : true,
      };

      let { error } = await supabase.from('notification_preferences').upsert(withAnnouncements, { onConflict: 'user_id' });
      if (error && isMissingAnnouncementsColumn(error.message)) {
        const retry = await supabase.from('notification_preferences').upsert(basePrefs, { onConflict: 'user_id' });
        error = retry.error;
      }

      if (error) return apiError(error.message, 500, 'notification_prefs_update_failed');
      return successResponse({ action: 'setNotifPrefs' });
    }

    if (action === 'setInterclubTeam') {
      const team = typeof body.team === 'string' ? body.team : '';
      const validTeams = ['none', 'a', 'b'];
      if (!validTeams.includes(team)) {
        return apiError('Invalid team value', 400, 'invalid_team');
      }
      const { error } = await supabase.from('profiles').update({ interclub_team: team }).eq('id', authResult.id);
      if (error) return apiError(error.message, 500, 'interclub_team_update_failed');
      return successResponse({ action: 'setInterclubTeam' });
    }

    return apiError('Invalid action', 400, 'invalid_action');
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Update club settings (admin only) */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return apiError('Admin only', 403, 'admin_only');
  }

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['settings', 'clientRequestId']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const settings = body.settings;
    const clientRequestId = typeof body.clientRequestId === 'string' ? body.clientRequestId : undefined;
    if (!settings || typeof settings !== 'object') {
      return apiError('Missing settings object', 400, 'missing_settings');
    }
    const settingsRecord = settings as Record<string, unknown>;

    if (isRateLimited(authResult.id, 20)) {
      return apiError('Too many requests', 429, 'rate_limited');
    }

    const supabase = getAdminClient();

    // Validate keys against whitelist (allow event_tasks_ prefix for task management)
    const allowedKeys = Object.keys(settingsRecord).filter(k =>
      (SETTINGS_KEY_WHITELIST as readonly string[]).includes(k) || k.startsWith('event_tasks_')
    );
    const rejectedKeys = Object.keys(settingsRecord).filter(k => !allowedKeys.includes(k));
    if (rejectedKeys.length > 0) {
      return apiError(`Invalid setting keys: ${rejectedKeys.join(', ')}`, 400, 'invalid_setting_keys');
    }

    // Upsert each setting (with value length limit)
    for (const key of allowedKeys) {
      const value = sanitizeInput(String(settingsRecord[key]), 5000);
      const { error } = await supabase.from('club_settings').upsert(
        { key, value, updated_at: new Date().toISOString(), updated_by: authResult.id },
        { onConflict: 'key' }
      );
      if (error) return apiError(error.message, 500, 'settings_update_failed');
    }

    return successResponse({ action: 'updateSettings', requestKey: typeof clientRequestId === 'string' ? clientRequestId : undefined });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}
