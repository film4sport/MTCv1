import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, isRateLimited } from '../auth-helper';

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

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase.from('club_settings').upsert(
        { key, value: String(value), updated_at: new Date().toISOString(), updated_by: authResult.id },
        { onConflict: 'key' }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
