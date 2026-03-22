import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited, isValidEnum, cachedJson, VALID_ANNOUNCEMENT_TYPES, apiError, readJsonObject, successResponse, findUnknownFields } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';

// Contract note: the shared helper wrappers used here still return NextResponse.json(...) responses.
// Legacy request-shape reference:
// const { text, type, title, audience } = await request.json()
// const { id } = await request.json()

/** Race a promise against a timeout — returns undefined on timeout (never throws) */
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>(r => setTimeout(() => r(undefined), ms))]);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAnnouncementId(userId: string, clientRequestId?: string) {
  if (!clientRequestId) return generateId('ann');
  const normalized = sanitizeInput(clientRequestId, 48).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const safeKey = normalized || 'request';
  return `ann-${userId.slice(0, 8)}-${safeKey}`;
}

function isDuplicateError(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message || '';
  return error?.code === '23505' || message.includes('duplicate key value') || message.includes('unique constraint');
}

async function sendAnnouncementInboxMessage(
  supabase: ReturnType<typeof getAdminClient>,
  message: { fromId: string; fromName: string; toId: string; toName: string; text: string }
) {
  const timestamp = new Date().toISOString();
  const fetchConversation = () => supabase
    .from('conversations')
    .select('id')
    .or(`and(member_a.eq.${message.fromId},member_b.eq.${message.toId}),and(member_a.eq.${message.toId},member_b.eq.${message.fromId})`)
    .single();

  const { data: existingConversation } = await fetchConversation();

  let conversationId: number;
  if (existingConversation?.id) {
    conversationId = existingConversation.id;
  } else {
    const { data: newConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        member_a: message.fromId,
        member_b: message.toId,
        last_message: message.text,
        last_timestamp: timestamp,
      })
      .select('id')
      .single();
    if (newConversation?.id) {
      conversationId = newConversation.id;
    } else if (isDuplicateError(conversationError)) {
      const { data: racedConversation } = await fetchConversation();
      if (!racedConversation?.id) return;
      conversationId = racedConversation.id;
    } else {
      return;
    }
  }

  const { error: messageError } = await supabase.from('messages').insert({
    id: generateId('msg-ann'),
    conversation_id: conversationId,
    from_id: message.fromId,
    from_name: message.fromName,
    to_id: message.toId,
    to_name: message.toName,
    text: message.text,
    timestamp,
    read: false,
  });
  if (messageError) {
    console.error('Failed to create announcement inbox message:', messageError.message);
    return;
  }

  await supabase
    .from('conversations')
    .update({ last_message: message.text, last_timestamp: timestamp })
    .eq('id', conversationId);
}

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
      return apiError('Failed to fetch announcements', 500, 'announcements_fetch_failed');
    }

    // Check which announcements this user has dismissed
    const { data: dismissals } = await supabase
      .from('announcement_dismissals')
      .select('announcement_id')
      .eq('user_id', authResult.id);

    const dismissedIds = new Set((dismissals || []).map(d => d.announcement_id));

    // Filter by audience based on user's interclub team
    const userTeam = authResult.interclubTeam || 'none';
    const result = (announcements || [])
      .filter(a => {
        const audience = a.audience || 'all';
        if (audience === 'all') return true;
        if (audience === 'interclub_a') return userTeam === 'a';
        if (audience === 'interclub_b') return userTeam === 'b';
        if (audience === 'interclub_all') return userTeam === 'a' || userTeam === 'b';
        return true;
      })
      .map(a => ({
        id: a.id,
        text: a.text,
        type: a.type,
        audience: a.audience || 'all',
        date: a.date,
        dismissed: dismissedIds.has(a.id),
      }));

    return cachedJson(result, 60, { swr: 30 });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Create an announcement (admin only) and notify all members */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  // Admins can post to any audience; captains can only post to their own team
  const isAdmin = authResult.role === 'admin';
  const isCaptain = authResult.interclubCaptain === true;
  if (!isAdmin && !isCaptain) {
    return apiError('Admin or captain only', 403, 'admin_or_captain_only');
  }

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['text', 'type', 'title', 'audience', 'clientRequestId']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const text = typeof body.text === 'string' ? body.text : '';
    const type = typeof body.type === 'string' ? body.type : '';
    const title = typeof body.title === 'string' ? body.title : '';
    const audience = typeof body.audience === 'string' ? body.audience : '';
    const clientRequestId = typeof body.clientRequestId === 'string' ? body.clientRequestId : undefined;
    if (!text.trim()) {
      return apiError('Missing text', 400, 'missing_text');
    }

    if (isRateLimited(authResult.id)) {
      return apiError('Too many requests', 429, 'rate_limited');
    }

    const supabase = getAdminClient();
    const id = buildAnnouncementId(authResult.id, clientRequestId);
    const sanitizedText = sanitizeInput(text, 1000);
    const announcementType = isValidEnum(type, VALID_ANNOUNCEMENT_TYPES) ? type : 'info';
    const validAudiences = ['all', 'interclub_a', 'interclub_b', 'interclub_all'];
    let announcementAudience = validAudiences.includes(audience) ? audience : 'all';

    // Captains (non-admins) can only post to their own team
    if (!isAdmin && isCaptain) {
      const captainTeam = authResult.interclubTeam;
      const allowedAudience = captainTeam === 'a' ? 'interclub_a' : 'interclub_b';
      announcementAudience = allowedAudience;
    }

    const { error } = await supabase.from('announcements').insert({
      id,
      text: sanitizedText,
      type: announcementType,
      audience: announcementAudience,
      date: new Date().toISOString().split('T')[0],
    });
    if (error && !isDuplicateError(error)) return apiError(error.message, 500, 'announcement_create_failed');
    if (error && isDuplicateError(error)) {
      return successResponse({ id, deduped: true });
    }

    // Create notifications — filter recipients by audience
    const { data: allMembers } = await supabase.from('profiles').select('id, name, interclub_team');
    if (allMembers && allMembers.length > 0) {
      const targetMembers = allMembers.filter((m) => {
        if (announcementAudience === 'all') return true;
        const team = m.interclub_team || 'none';
        if (announcementAudience === 'interclub_a') return team === 'a';
        if (announcementAudience === 'interclub_b') return team === 'b';
        if (announcementAudience === 'interclub_all') return team === 'a' || team === 'b';
        return true;
      });

      const targetMemberIds = targetMembers.map(member => member.id);
      const { data: preferenceRows } = await supabase
        .from('notification_preferences')
        .select('user_id, announcements')
        .in('user_id', targetMemberIds.length > 0 ? targetMemberIds : ['__none__']);

      const preferenceMap = new Map((preferenceRows || []).map(row => [row.user_id, row.announcements]));
      // Filter out opted-out members and exclude the sender themselves from receiving their own announcement message
      const optedInMembers = targetMembers.filter(member => preferenceMap.get(member.id) !== false && member.id !== authResult.id);

      const now = new Date().toISOString();
      const typeEmoji = announcementType === 'urgent' ? '🔴' : announcementType === 'warning' ? '⚠️' : '📢';
      const notifTitle = title ? sanitizeInput(title, 200) : `${typeEmoji} Club Announcement`;
      const notifications = optedInMembers.map(member => ({
        id: `notif-ann-${id}-${member.id.slice(0, 8)}`,
        user_id: member.id,
        type: 'announcement',
        title: notifTitle,
        body: sanitizedText,
        timestamp: now,
        read: false,
      }));
      // Batch insert (Supabase handles up to 1000 rows per insert)
      if (notifications.length > 0) {
        const { error: notifErr } = await supabase.from('notifications').insert(notifications);
        if (notifErr) {
          // Log but don't fail the announcement creation
          console.error('Failed to create announcement notifications:', notifErr.message);
        }
      }

      const senderName = authResult.role === 'admin' ? 'Mono Tennis Club' : `${authResult.name || 'Team Captain'} - Mono Tennis Club`;
      const inboxBody = `${notifTitle}\n\n${sanitizedText}\n\nOpen Notifications to view the latest club updates.`;

      // Send push notifications and inbox messages to all opted-in targeted members (fire-and-forget, with timeout)
      withTimeout(Promise.allSettled(
        optedInMembers.map(async member => {
          await sendAnnouncementInboxMessage(supabase, {
            fromId: 'club',
            fromName: senderName,
            toId: member.id,
            toName: member.name || 'Member',
            text: inboxBody,
          });
          return sendPushToUser(supabase, member.id, {
            title: notifTitle,
            body: sanitizedText.slice(0, 100),
            tag: `ann-${id}`,
            url: '/mobile-app/index.html#home',
            type: 'announcement',
          })
        })
      )).catch(() => { /* best-effort */ });
    }

    return successResponse({ id, requestKey: clientRequestId });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Dismiss or undismiss an announcement for the current user */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['announcementId', 'dismiss']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const announcementId = typeof body.announcementId === 'string' ? body.announcementId : '';
    const dismiss = body.dismiss;
    if (!announcementId) return apiError('Missing announcementId', 400, 'missing_announcement_id');

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
      if (error) return apiError(error.message, 500, 'announcement_dismiss_failed');
    }

    return successResponse({ action: dismiss === false ? 'undismiss' : 'dismiss' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}

/** Delete an announcement (admin only) */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return apiError('Admin only', 403, 'admin_only');
  }

  try {
    // Legacy request-shape reference: const { id } = await request.json()
    const body = await readJsonObject(request);
    if (body instanceof NextResponse) return body;
    const unknownFields = findUnknownFields(body, ['id']);
    if (unknownFields.length > 0) {
      return apiError(`Unknown field(s): ${unknownFields.join(', ')}`, 400, 'unknown_fields');
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return apiError('Missing id', 400, 'missing_id');

    const supabase = getAdminClient();
    // Delete dismissals first (FK), then the announcement
    await supabase.from('announcement_dismissals').delete().eq('announcement_id', id);
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) return apiError(error.message, 500, 'announcement_delete_failed');

    return successResponse({ action: 'delete' });
  } catch {
    return apiError('Server error', 500, 'server_error');
  }
}
