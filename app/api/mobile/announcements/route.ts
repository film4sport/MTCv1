import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    // Check which announcements this user has dismissed
    const { data: dismissals } = await supabase
      .from('announcement_dismissals')
      .select('announcement_id')
      .eq('user_id', authResult.id);

    const dismissedIds = new Set((dismissals || []).map(d => d.announcement_id));

    const result = (announcements || []).map(a => ({
      id: a.id,
      text: a.text,
      type: a.type,
      date: a.date,
      dismissed: dismissedIds.has(a.id),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
