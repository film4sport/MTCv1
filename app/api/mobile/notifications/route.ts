import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, apiError, readJsonObject, successResponse, findUnknownFields } from '../auth-helper';

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
      return apiError('Failed to fetch notifications', 500, 'notifications_fetch_failed');
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
    return apiError('Server error', 500, 'server_error');
  }
}

/** Mark notification(s) as read */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['id', 'markAll']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const { id, markAll } = body;
    const supabase = getAdminClient();

    if (markAll) {
      // Mark all unread notifications as read for this user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', authResult.id)
        .eq('read', false);
      if (error) return apiError(error.message, 500, 'notifications_mark_all_failed');
    } else if (id) {
      // Mark a single notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', authResult.id);
      if (error) return apiError(error.message, 500, 'notifications_mark_failed');
    } else {
      return apiError('Provide id or markAll', 400, 'missing_action');
    }

    return successResponse({ action: markAll ? 'markAllRead' : 'markRead' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Delete read notifications for the authenticated user */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    let body: Record<string, unknown> = {};
    const contentLength = request.headers.get('content-length');
    if (contentLength && contentLength !== '0') {
      const parsedBody = await readJsonObject(request);
      if (parsedBody instanceof NextResponse) return parsedBody;
      body = parsedBody;
    }
    const unknownFields = findUnknownFields(body, ['readOnly']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    if (body.readOnly !== undefined && body.readOnly !== true) {
      return apiError('readOnly must be true when provided', 400, 'invalid_read_only');
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', authResult.id)
      .eq('read', true);

    if (error) return apiError(error.message, 500, 'notifications_delete_failed');
    return successResponse({ action: 'deleteRead' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}
