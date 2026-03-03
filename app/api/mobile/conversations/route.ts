import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

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

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', Array.from(userIds));

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = { name: p.name, avatar: p.avatar };
    });

    // Fetch messages for all conversations
    const convIds = conversations.map(c => c.id);
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('timestamp', { ascending: true });

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
