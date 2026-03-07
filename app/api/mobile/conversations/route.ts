import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';
import crypto from 'crypto';

// sendPushToUser imported from ../../lib/push (shared utility)

/** Helper: create a bell notification in Supabase */
async function createNotification(
  supabase: ReturnType<typeof getAdminClient>,
  userId: string,
  notif: { id: string; type: string; title: string; body: string; timestamp: string }
) {
  await supabase.from('notifications').insert({
    id: notif.id, user_id: userId, type: notif.type,
    title: notif.title, body: notif.body, timestamp: notif.timestamp, read: false,
  }).then(({ error }) => {
    if (error) console.error(`[conversations] Failed to create notification for ${userId}:`, error.message);
  });
}

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const userId = authResult.id;

    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`member_a.eq.${userId},member_b.eq.${userId}`)
      .order('last_timestamp', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unique user IDs to fetch names
    const userIds = new Set<string>();
    conversations.forEach(c => {
      userIds.add(c.member_a);
      userIds.add(c.member_b);
    });

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', Array.from(userIds));

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = { name: p.name, avatar: p.avatar };
    });

    // Fetch messages for all conversations
    const convIds = conversations.map(c => c.id);
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Group messages by conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageMap: Record<number, any[]> = {};
    (messages || []).forEach(m => {
      if (!messageMap[m.conversation_id]) messageMap[m.conversation_id] = [];
      messageMap[m.conversation_id].push(m);
    });

    // Build response
    const result = conversations.map(c => {
      const otherUserId = c.member_a === userId ? c.member_b : c.member_a;
      const otherProfile = profileMap[otherUserId] || { name: 'Unknown', avatar: null };
      const convMessages = messageMap[c.id] || [];

      return {
        id: c.id,
        otherUserId,
        otherUserName: otherProfile.name,
        otherUserAvatar: otherProfile.avatar,
        lastMessage: c.last_message,
        lastTimestamp: c.last_timestamp,
        messages: convMessages.map(m => ({
          id: m.id,
          fromId: m.from_id,
          fromName: m.from_name,
          toId: m.to_id,
          toName: m.to_name,
          text: m.text,
          timestamp: m.timestamp,
          read: m.read,
        })),
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Send a message to another user */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { toId, text } = await request.json();
    if (!toId || !text?.trim()) {
      return NextResponse.json({ error: 'Missing toId or text' }, { status: 400 });
    }

    if (isRateLimited(authResult.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const fromId = authResult.id;
    const fromName = authResult.name;
    const timestamp = new Date().toISOString();

    // Look up recipient name
    const { data: toProfile } = await supabase.from('profiles').select('name').eq('id', toId).single();
    const toName = toProfile?.name || 'Unknown';

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(member_a.eq.${fromId},member_b.eq.${toId}),and(member_a.eq.${toId},member_b.eq.${fromId})`)
      .single();

    let conversationId: number;
    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ member_a: fromId, member_b: toId, last_message: sanitizeInput(text, 200), last_timestamp: timestamp })
        .select('id')
        .single();
      if (convErr || !newConv) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      conversationId = newConv.id;
    }

    // Insert message
    const msgId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sanitizedText = sanitizeInput(text, 2000);
    const { error: msgErr } = await supabase.from('messages').insert({
      id: msgId,
      conversation_id: conversationId,
      from_id: fromId,
      from_name: fromName,
      to_id: toId,
      to_name: toName,
      text: sanitizedText,
      timestamp,
      read: false,
    });
    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    // Update conversation last message
    const { error: updateErr } = await supabase.from('conversations').update({
      last_message: sanitizedText.slice(0, 200),
      last_timestamp: timestamp,
    }).eq('id', conversationId);

    if (updateErr) {
      // Message was sent but metadata update failed — log but don't fail
      console.error('[conversations] metadata update failed:', updateErr.message);
    }

    // Send push notification + bell notification to recipient (best-effort, non-blocking)
    const truncatedPreview = sanitizedText.slice(0, 100);
    const notifId = `notif-msg-${crypto.randomUUID().slice(0, 8)}`;

    // Fire and forget — don't block the response
    Promise.all([
      sendPushToUser(supabase, toId, {
        title: `Message from ${fromName}`,
        body: truncatedPreview,
        tag: `msg-${fromId}-${Date.now()}`,
        url: '/mobile-app/index.html#messages',
      }),
      createNotification(supabase, toId, {
        id: notifId,
        type: 'message',
        title: `New message from ${fromName}`,
        body: truncatedPreview,
        timestamp,
      }),
    ]).catch(() => { /* best-effort */ });

    return NextResponse.json({ success: true, messageId: msgId, conversationId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Mark messages as read in a conversation, or mark all notifications read */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { conversationId } = await request.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const userId = authResult.id;

    // Mark all messages sent TO this user in this conversation as read
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('to_id', userId)
      .eq('read', false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
