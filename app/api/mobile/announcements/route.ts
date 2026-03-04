import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited } from '../auth-helper';

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

/** Create an announcement (admin only) and notify all members */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { text, type, title } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    if (isRateLimited(authResult.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sanitizedText = sanitizeInput(text, 1000);
    const announcementType = type || 'info';

    const { error } = await supabase.from('announcements').insert({
      id,
      text: sanitizedText,
      type: announcementType,
      date: new Date().toISOString().split('T')[0],
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create a notification for every member so they see it in their bell icon
    const { data: allMembers } = await supabase.from('profiles').select('id');
    if (allMembers && allMembers.length > 0) {
      const now = new Date().toISOString();
      const typeEmoji = announcementType === 'urgent' ? '🔴' : announcementType === 'warning' ? '⚠️' : '📢';
      const notifTitle = title ? sanitizeInput(title, 200) : `${typeEmoji} Club Announcement`;
      const notifications = allMembers.map(member => ({
        id: `notif-ann-${id}-${member.id.slice(0, 8)}`,
        user_id: member.id,
        type: 'announcement',
        title: notifTitle,
        body: sanitizedText,
        timestamp: now,
        read: false,
      }));
      // Batch insert (Supabase handles up to 1000 rows per insert)
      const { error: notifErr } = await supabase.from('notifications').insert(notifications);
      if (notifErr) {
        // Log but don't fail the announcement creation
        console.error('Failed to create announcement notifications:', notifErr.message);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Dismiss or undismiss an announcement for the current user */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { announcementId, dismiss } = await request.json();
    if (!announcementId) return NextResponse.json({ error: 'Missing announcementId' }, { status: 400 });

    const supabase = getAdminClient();
    const userId = authResult.id;

    if (dismiss === false) {
      // Undismiss
      await supabase.from('announcement_dismissals').delete()
        .eq('announcement_id', announcementId)
        .eq('user_id', userId);
    } else {
      // Dismiss (upsert to avoid duplicates)
      const { error } = await supabase.from('announcement_dismissals').upsert(
        { announcement_id: announcementId, user_id: userId },
        { onConflict: 'announcement_id,user_id' }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Delete an announcement (admin only) */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = getAdminClient();
    // Delete dismissals first (FK), then the announcement
    await supabase.from('announcement_dismissals').delete().eq('announcement_id', id);
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
