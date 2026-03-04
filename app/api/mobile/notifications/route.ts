import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

/** Fetch all notifications for the authenticated user */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authResult.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const result = (data || []).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      timestamp: n.timestamp,
      read: n.read,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Mark notification(s) as read */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id, markAll } = await request.json();
    const supabase = getAdminClient();

    if (markAll) {
      // Mark all unread notifications as read for this user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', authResult.id)
        .eq('read', false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (id) {
      // Mark a single notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', authResult.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Provide id or markAll' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
