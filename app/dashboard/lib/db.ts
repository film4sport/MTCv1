import { supabase } from '../../lib/supabase';
import type { Booking, ClubEvent, Partner, Conversation, Message, Announcement, Notification, MemberPayment, PaymentEntry, CoachingProgram, NotificationPreferences, User } from './types';

// ─── Profiles ───────────────────────────────────────────

export async function fetchMembers(): Promise<User[]> {
  const { data } = await supabase.from('profiles').select('*').order('name');
  if (!data) return [];
  return data.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as User['role'],
    ntrp: p.ntrp ?? undefined,
    memberSince: p.member_since ?? undefined,
    avatar: p.avatar ?? undefined,
  }));
}

// ─── Bookings ───────────────────────────────────────────

export async function fetchBookings(): Promise<Booking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('*, booking_participants(*)')
    .order('date', { ascending: true });
  if (!data) return [];
  return data.map(b => ({
    id: b.id,
    courtId: b.court_id,
    courtName: b.court_name,
    date: b.date,
    time: b.time,
    userId: b.user_id,
    userName: b.user_name,
    guestName: b.guest_name ?? undefined,
    participants: b.booking_participants?.map((p: { participant_id: string; participant_name: string }) => ({
      id: p.participant_id,
      name: p.participant_name,
    })),
    status: b.status as Booking['status'],
    type: b.type as Booking['type'],
    programId: b.program_id ?? undefined,
  }));
}

export async function createBooking(booking: Booking): Promise<void> {
  await supabase.from('bookings').insert({
    id: booking.id,
    court_id: booking.courtId,
    court_name: booking.courtName,
    date: booking.date,
    time: booking.time,
    user_id: booking.userId,
    user_name: booking.userName,
    guest_name: booking.guestName || null,
    status: booking.status,
    type: booking.type,
    program_id: booking.programId || null,
  });

  // Insert participants
  if (booking.participants?.length) {
    await supabase.from('booking_participants').insert(
      booking.participants.map(p => ({
        booking_id: booking.id,
        participant_id: p.id,
        participant_name: p.name,
      }))
    );
  }
}

export async function cancelBooking(id: string): Promise<void> {
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
}

// ─── Events ─────────────────────────────────────────────

export async function fetchEvents(): Promise<ClubEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('*, event_attendees(*)')
    .order('date', { ascending: true });
  if (!data) return [];
  return data.map(e => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    location: e.location,
    badge: e.badge as ClubEvent['badge'],
    price: e.price,
    spotsTotal: e.spots_total ?? undefined,
    spotsTaken: e.spots_taken ?? undefined,
    description: e.description,
    attendees: e.event_attendees?.map((a: { user_name: string }) => a.user_name) || [],
    type: e.type as ClubEvent['type'],
  }));
}

export async function toggleEventRsvp(eventId: string, userName: string): Promise<void> {
  // Check if already attending
  const { data: existing } = await supabase
    .from('event_attendees')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_name', userName)
    .single();

  if (existing) {
    await supabase.from('event_attendees').delete().eq('id', existing.id);
  } else {
    await supabase.from('event_attendees').insert({ event_id: eventId, user_name: userName });
  }
}

// ─── Partners ───────────────────────────────────────────

export async function fetchPartners(): Promise<Partner[]> {
  const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(p => ({
    id: p.id,
    name: p.name,
    ntrp: p.ntrp,
    availability: p.availability,
    matchType: p.match_type as Partner['matchType'],
    date: p.date,
    time: p.time,
    avatar: p.avatar ?? undefined,
    status: p.status as Partner['status'],
  }));
}

// ─── Conversations & Messages ───────────────────────────

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .or(`member_a.eq.${userId},member_b.eq.${userId}`)
    .order('last_timestamp', { ascending: false });

  if (!data) return [];

  return data.map(c => {
    const otherMemberId = c.member_a === userId ? c.member_b : c.member_a;
    const messages: Message[] = (c.messages || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      from: m.from_name as string,
      fromId: m.from_id as string,
      to: m.to_name as string,
      toId: m.to_id as string,
      text: m.text as string,
      timestamp: m.timestamp as string,
      read: m.read as boolean,
    }));
    const unread = messages.filter(m => m.toId === userId && !m.read).length;

    return {
      memberId: otherMemberId,
      memberName: messages.length > 0
        ? (messages[0].fromId === userId ? messages[0].to : messages[0].from)
        : '',
      lastMessage: c.last_message || '',
      lastTimestamp: c.last_timestamp || '',
      unread,
      messages,
    };
  });
}

export async function sendMessageByUsers(message: {
  id: string; fromId: string; fromName: string; toId: string; toName: string; text: string;
}): Promise<void> {
  const timestamp = new Date().toISOString();

  // Find existing conversation between these two users (order-agnostic)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(member_a.eq.${message.fromId},member_b.eq.${message.toId}),and(member_a.eq.${message.toId},member_b.eq.${message.fromId})`)
    .single();

  let conversationId: number;

  if (conv) {
    conversationId = conv.id;
  } else {
    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ member_a: message.fromId, member_b: message.toId, last_message: message.text, last_timestamp: timestamp })
      .select('id')
      .single();
    if (!newConv) return;
    conversationId = newConv.id;
  }

  await supabase.from('messages').insert({
    id: message.id,
    conversation_id: conversationId,
    from_id: message.fromId,
    from_name: message.fromName,
    to_id: message.toId,
    to_name: message.toName,
    text: message.text,
    timestamp,
    read: false,
  });

  // Update conversation's last message
  await supabase.from('conversations').update({
    last_message: message.text,
    last_timestamp: timestamp,
  }).eq('id', conversationId);
}

// ─── Announcements ──────────────────────────────────────

export async function fetchAnnouncements(userId: string): Promise<Announcement[]> {
  const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false });
  const { data: dismissals } = await supabase
    .from('announcement_dismissals')
    .select('announcement_id')
    .eq('user_id', userId);

  if (!data) return [];
  const dismissedIds = new Set((dismissals || []).map((d: { announcement_id: string }) => d.announcement_id));

  return data.map(a => ({
    id: a.id,
    text: a.text,
    type: a.type as Announcement['type'],
    date: a.date,
    dismissedBy: dismissedIds.has(a.id) ? [userId] : [],
  }));
}

export async function dismissAnnouncement(announcementId: string, userId: string): Promise<void> {
  await supabase.from('announcement_dismissals').insert({
    announcement_id: announcementId,
    user_id: userId,
  });
}

// ─── Notifications ──────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (!data) return [];
  return data.map(n => ({
    id: n.id,
    type: n.type as Notification['type'],
    title: n.title,
    body: n.body,
    timestamp: n.timestamp,
    read: n.read,
  }));
}

export async function createNotification(userId: string, notification: Omit<Notification, 'read'>): Promise<void> {
  await supabase.from('notifications').insert({
    id: notification.id,
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    timestamp: notification.timestamp,
    read: false,
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function clearNotifications(userId: string): Promise<void> {
  await supabase.from('notifications').delete().eq('user_id', userId);
}

// ─── Payments ───────────────────────────────────────────

export async function fetchPayments(userId: string): Promise<MemberPayment | null> {
  const { data } = await supabase
    .from('payments')
    .select('*, payment_entries(*)')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  return {
    memberId: data.user_id,
    memberName: data.user_name,
    balance: data.balance,
    history: (data.payment_entries || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      date: e.date as string,
      description: e.description as string,
      amount: e.amount as number,
      type: e.type as PaymentEntry['type'],
    })),
  };
}

// ─── Coaching Programs ──────────────────────────────────

export async function fetchPrograms(): Promise<CoachingProgram[]> {
  const { data } = await supabase
    .from('coaching_programs')
    .select('*, program_sessions(*), program_enrollments(*)')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(p => ({
    id: p.id,
    title: p.title,
    type: p.type as CoachingProgram['type'],
    coachId: p.coach_id,
    coachName: p.coach_name,
    description: p.description,
    courtId: p.court_id,
    courtName: p.court_name,
    sessions: (p.program_sessions || []).map((s: Record<string, unknown>) => ({
      date: s.date as string,
      time: s.time as string,
      duration: s.duration as number,
    })),
    fee: p.fee,
    spotsTotal: p.spots_total,
    enrolledMembers: (p.program_enrollments || []).map((e: { member_id: string }) => e.member_id),
    status: p.status as CoachingProgram['status'],
  }));
}

export async function createProgram(program: CoachingProgram): Promise<void> {
  await supabase.from('coaching_programs').insert({
    id: program.id,
    title: program.title,
    type: program.type,
    coach_id: program.coachId,
    coach_name: program.coachName,
    description: program.description,
    court_id: program.courtId,
    court_name: program.courtName,
    fee: program.fee,
    spots_total: program.spotsTotal,
    status: program.status,
  });

  if (program.sessions.length) {
    await supabase.from('program_sessions').insert(
      program.sessions.map(s => ({
        program_id: program.id,
        date: s.date,
        time: s.time,
        duration: s.duration,
      }))
    );
  }
}

export async function cancelProgram(programId: string): Promise<void> {
  await supabase.from('coaching_programs').update({ status: 'cancelled' }).eq('id', programId);
}

export async function enrollInProgram(programId: string, memberId: string): Promise<void> {
  await supabase.from('program_enrollments').insert({
    program_id: programId,
    member_id: memberId,
  });
}

export async function withdrawFromProgram(programId: string, memberId: string): Promise<void> {
  await supabase.from('program_enrollments')
    .delete()
    .eq('program_id', programId)
    .eq('member_id', memberId);
}

// ─── Notification Preferences ───────────────────────────

export async function fetchNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  return {
    bookings: data.bookings,
    events: data.events,
    payments: data.payments,
    partners: data.partners,
    messages: data.messages,
    programs: data.programs,
  };
}

export async function updateNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
  await supabase.from('notification_preferences').upsert({
    user_id: userId,
    ...prefs,
  });
}
