import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, sanitizeInput, isRateLimited, isValidUUID, validationError } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';
import crypto from 'crypto';

// Shared utilities
import { createNotification } from '../../lib/notifications';

/** Race a promise against a timeout — returns undefined on timeout (never throws) */
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>(r => setTimeout(() => r(undefined), ms))]);
}

function isDuplicateError(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message || '';
  return error?.code === '23505' || message.includes('duplicate key value') || message.includes('unique constraint');
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
      .select('id, name, avatar, role')
      .in('id', Array.from(userIds));

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    (profiles || []).forEach(p => {
      // Admins always display as "Mono Tennis Club" in conversations
      profileMap[p.id] = { name: p.role === 'admin' ? 'Mono Tennis Club' : p.name, avatar: p.avatar };
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
    if (!isValidUUID(toId)) return validationError('toId', 'invalid UUID format');
    if (toId === authResult.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    if (isRateLimited(authResult.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const fromId = authResult.id;
    const fromName = authResult.name;
    const timestamp = new Date().toISOString();

    // Look up recipient — verify they exist
    const { data: toProfile } = await supabase.from('profiles').select('name').eq('id', toId).single();
    if (!toProfile) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    const toName = toProfile.name || 'Unknown';

    // Find or create conversation
    const fetchConversation = () => supabase
      .from('conversations')
      .select('id')
      .or(`and(member_a.eq.${fromId},member_b.eq.${toId}),and(member_a.eq.${toId},member_b.eq.${fromId})`)
      .single();

    const { data: existing } = await fetchConversation();

    let conversationId: number;
    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ member_a: fromId, member_b: toId, last_message: sanitizeInput(text, 200), last_timestamp: timestamp })
        .select('id')
        .single();
      if (newConv) {
        conversationId = newConv.id;
      } else if (isDuplicateError(convErr)) {
        const { data: racedConversation } = await fetchConversation();
        if (!racedConversation) {
          return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
        }
        conversationId = racedConversation.id;
      } else {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
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

    // Fire and forget — don't block the response (timeout prevents hung connections)
    withTimeout(Promise.allSettled([
      sendPushToUser(supabase, toId, {
        title: `Message from ${fromName}`,
        body: truncatedPreview,
        tag: `msg-${fromId}-${Date.now()}`,
        url: '/mobile-app/index.html#messages',
        type: 'message',
      }),
      createNotification(supabase, toId, {
        id: notifId,
        type: 'message',
        title: `New message from ${fromName}`,
        body: truncatedPreview,
        timestamp,
      }),
    ])).catch(() => { /* best-effort */ });

    return NextResponse.json({ success: true, messageId: msgId, conversationId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Delete a conversation (and all its messages) */
export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { conversationId, messageId, action, olderThanDays } = await request.json();
    const supabase = getAdminClient();
    const userId = authResult.id;

    // Admin-only: cleanup stale welcome-only conversations
    if (action === 'cleanup-welcomes') {
      if (authResult.role !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      }
      const days = Math.max(1, Math.min(90, olderThanDays || 7));
      const { data, error } = await supabase.rpc('cleanup_stale_welcomes', { older_than_days: days });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: data || 0 });
    }

    if (messageId) {
      // Delete a single message — only if user is the sender
      const { data: msg } = await supabase
        .from('messages')
        .select('id, from_id, conversation_id')
        .eq('id', messageId)
        .single();

      if (!msg) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      if (msg.from_id !== userId) {
        return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
      }

      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Update conversation last_message to the previous message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('text, timestamp')
        .eq('conversation_id', msg.conversation_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (lastMsg) {
        await supabase.from('conversations').update({
          last_message: lastMsg.text?.slice(0, 200),
          last_timestamp: lastMsg.timestamp,
        }).eq('id', msg.conversation_id);
      }

      return NextResponse.json({ success: true });
    }

    if (conversationId) {
      // Delete entire conversation — only if user is a participant
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, member_a, member_b')
        .eq('id', conversationId)
        .single();

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      if (conv.member_a !== userId && conv.member_b !== userId) {
        return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
      }

      // Messages cascade-delete via FK
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing conversationId or messageId' }, { status: 400 });
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

    // Verify user is a participant in this conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`member_a.eq.${userId},member_b.eq.${userId}`)
      .single();
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

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
