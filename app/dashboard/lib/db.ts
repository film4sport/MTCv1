import { supabase } from '../../lib/supabase';
import { reportError } from '../../lib/errorReporter';
import type { Booking, ClubEvent, Court, Partner, Conversation, Message, Announcement, AnnouncementAudience, Notification, CoachingProgram, NotificationPreferences, User, SkillLevel, FamilyMember, MatchLineup, LineupEntry, LineupStatus } from './types';

// ─── Profiles ───────────────────────────────────────────

export async function fetchMembers(): Promise<User[]> {
  const { data } = await supabase.from('profiles').select('*').order('name');
  if (!data) return [];
  return data.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as User['role'],
    status: (p.status as User['status']) || 'active',
    ntrp: p.ntrp ?? undefined,
    skillLevel: (p.skill_level as SkillLevel) ?? undefined,
    skillLevelSet: p.skill_level_set ?? false,
    membershipType: (p.membership_type as User['membershipType']) ?? undefined,
    familyId: p.family_id ?? undefined,
    memberSince: p.member_since ?? undefined,
    avatar: p.avatar ?? undefined,
    residence: (p.residence as User['residence']) ?? 'mono',
    interclubTeam: (p.interclub_team as User['interclubTeam']) ?? 'none',
    interclubCaptain: p.interclub_captain ?? false,
  }));
}

export async function updateProfile(userId: string, updates: { ntrp?: number; name?: string; skill_level?: string; skill_level_set?: boolean; membership_type?: string; family_id?: string; avatar?: string; preferences?: Record<string, unknown>; interclub_team?: string; interclub_captain?: boolean }): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

// ─── Bookings ───────────────────────────────────────────

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, booking_participants(*)')
    .order('date', { ascending: true });
  if (error) { reportError(new Error(error.message), 'fetchBookings'); throw error; }
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
    participants: b.booking_participants?.map((p: { participant_id: string; participant_name: string; confirmed_at: string | null; confirmed_via: string | null }) => ({
      id: p.participant_id,
      name: p.participant_name,
      confirmedAt: p.confirmed_at ?? undefined,
      confirmedVia: (p.confirmed_via as 'email' | 'dashboard' | 'mobile') ?? undefined,
    })),
    status: b.status as Booking['status'],
    type: b.type as Booking['type'],
    programId: b.program_id ?? undefined,
    matchType: (b.match_type as Booking['matchType']) ?? undefined,
    duration: b.duration ?? undefined,
    bookedFor: b.booked_for ?? undefined,
  }));
}

export async function createBooking(booking: Booking): Promise<void> {
  const { error } = await supabase.from('bookings').insert({
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
    match_type: booking.matchType || null,
    duration: booking.duration || null,
    booked_for: booking.bookedFor || null,
  });
  if (error) throw error;

  // Insert participants
  if (booking.participants?.length) {
    const { error: pErr } = await supabase.from('booking_participants').insert(
      booking.participants.map(p => ({
        booking_id: booking.id,
        participant_id: p.id,
        participant_name: p.name,
      }))
    );
    if (pErr) throw pErr;
  }
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
  if (error) throw error;
}

export async function confirmParticipant(bookingId: string, participantId: string, via: 'dashboard' | 'mobile'): Promise<void> {
  const { error } = await supabase
    .from('booking_participants')
    .update({ confirmed_at: new Date().toISOString(), confirmed_via: via })
    .eq('booking_id', bookingId)
    .eq('participant_id', participantId);
  if (error) throw error;
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
    spotsTaken: (e.event_attendees?.length ?? e.spots_taken) ?? undefined,
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
    const { error } = await supabase.from('event_attendees').delete().eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_name: userName });
    if (error) throw error;
  }
}

// ─── Partners ───────────────────────────────────────────

export async function fetchPartners(): Promise<Partner[]> {
  // Auto-expire: only return requests where the requested play date hasn't passed
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('partners').select('*').gte('date', today).order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(p => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    ntrp: p.ntrp,
    skillLevel: (p.skill_level as SkillLevel) ?? undefined,
    availability: p.availability,
    matchType: p.match_type as Partner['matchType'],
    date: p.date,
    time: p.time,
    avatar: p.avatar ?? undefined,
    message: p.message ?? undefined,
    status: p.status as Partner['status'],
  }));
}

export async function createPartner(partner: Partner): Promise<void> {
  const { error } = await supabase.from('partners').insert({
    id: partner.id,
    user_id: partner.userId,
    name: partner.name,
    ntrp: partner.ntrp,
    skill_level: partner.skillLevel || 'intermediate',
    availability: partner.availability,
    match_type: partner.matchType,
    date: partner.date,
    time: partner.time,
    avatar: partner.avatar || null,
    message: partner.message || null,
    status: partner.status,
  });
  if (error) throw error;
}

export async function deletePartner(partnerId: string): Promise<void> {
  const { error } = await supabase.from('partners').delete().eq('id', partnerId);
  if (error) throw error;
}

export async function markMessagesRead(conversationId: number, userId: string): Promise<void> {
  // Only mark messages received before this call (prevents marking newly-arriving messages as read)
  const cutoff = new Date().toISOString();
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('to_id', userId)
    .eq('read', false)
    .lte('created_at', cutoff);
  if (error) throw error;
}

// ─── Conversations & Messages ───────────────────────────

export async function fetchConversations(userId: string, limit = 20): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .or(`member_a.eq.${userId},member_b.eq.${userId}`)
    .order('last_timestamp', { ascending: false })
    .range(0, limit - 1);

  if (!data) return [];

  // Collect all other-member IDs so we can batch-check for admins
  const otherMemberIds = data.map(c => c.member_a === userId ? c.member_b : c.member_a);
  const uniqueIds = Array.from(new Set(otherMemberIds));

  // Batch fetch roles — admins display as "Mono Tennis Club"
  const adminIds = new Set<string>();
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', uniqueIds);
    if (profiles) {
      profiles.forEach(p => { if (p.role === 'admin') adminIds.add(p.id); });
    }
  }

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

    // Admins always display as "Mono Tennis Club" regardless of profile name
    let memberName = messages.length > 0
      ? (messages[0].fromId === userId ? messages[0].to : messages[0].from)
      : '';
    if (adminIds.has(otherMemberId)) {
      memberName = 'Mono Tennis Club';
    }

    return {
      id: c.id,
      memberId: otherMemberId,
      memberName,
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

  const { error: msgErr } = await supabase.from('messages').insert({
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
  if (msgErr) throw msgErr;

  // Update conversation's last message
  const { error: convErr } = await supabase.from('conversations').update({
    last_message: message.text,
    last_timestamp: timestamp,
  }).eq('id', conversationId);
  if (convErr) throw convErr;
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
    audience: (a.audience as AnnouncementAudience) || 'all',
    date: a.date,
    dismissedBy: dismissedIds.has(a.id) ? [userId] : [],
  }));
}

export async function dismissAnnouncement(announcementId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('announcement_dismissals').insert({
    announcement_id: announcementId,
    user_id: userId,
  });
  if (error) throw error;
}

export async function createAnnouncement(announcement: Announcement): Promise<void> {
  const { error } = await supabase.from('announcements').insert({
    id: announcement.id,
    text: announcement.text,
    type: announcement.type,
    audience: announcement.audience || 'all',
    date: announcement.date,
  });
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  // Delete dismissals first (FK), then the announcement
  const { error: dErr } = await supabase.from('announcement_dismissals').delete().eq('announcement_id', id);
  if (dErr) throw dErr;
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// ─── Courts ─────────────────────────────────────────────

export async function fetchCourts(): Promise<Court[]> {
  const { data } = await supabase.from('courts').select('*').order('id');
  if (!data) return [];
  return data.map(c => ({
    id: c.id,
    name: c.name,
    floodlight: c.floodlight,
    status: c.status as Court['status'],
  }));
}

export async function updateCourtStatus(courtId: number, status: string): Promise<void> {
  const { error } = await supabase.from('courts').update({ status }).eq('id', courtId);
  if (error) throw error;
}

// ─── Court Blocks ──────────────────────────────────────

export interface CourtBlock {
  id: string;
  court_id: number | null;
  block_date: string;
  time_start: string | null;
  time_end: string | null;
  reason: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export async function fetchCourtBlocks(): Promise<CourtBlock[]> {
  const { data } = await supabase
    .from('court_blocks')
    .select('*')
    .gte('block_date', new Date().toISOString().split('T')[0])
    .order('block_date', { ascending: true });
  return data || [];
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
  const { error } = await supabase.from('notifications').insert({
    id: notification.id,
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    timestamp: notification.timestamp,
    read: false,
  });
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function clearNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
}

export async function deleteReadNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId).eq('read', true);
  if (error) throw error;
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
  const { error } = await supabase.from('coaching_programs').insert({
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
  if (error) throw error;

  if (program.sessions.length) {
    const { error: sErr } = await supabase.from('program_sessions').insert(
      program.sessions.map(s => ({
        program_id: program.id,
        date: s.date,
        time: s.time,
        duration: s.duration,
      }))
    );
    if (sErr) throw sErr;
  }
}

export async function cancelProgram(programId: string): Promise<void> {
  const { error } = await supabase.from('coaching_programs').update({ status: 'cancelled' }).eq('id', programId);
  if (error) throw error;
}

export async function enrollInProgram(programId: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('program_enrollments').insert({
    program_id: programId,
    member_id: memberId,
  });
  if (error) throw error;
}

export async function withdrawFromProgram(programId: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('program_enrollments')
    .delete()
    .eq('program_id', programId)
    .eq('member_id', memberId);
  if (error) throw error;
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
    partners: data.partners,
    announcements: data.announcements ?? true,
    messages: data.messages,
    programs: data.programs,
  };
}

export async function updateNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
  const { error } = await supabase.from('notification_preferences').upsert({
    user_id: userId,
    ...prefs,
  });
  if (error) throw error;
}

// ─── Member Management (Admin) ──────────────────────────

export async function pauseMember(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'paused' }).eq('id', userId);
  if (error) throw error;
}

export async function unpauseMember(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
  if (error) throw error;
}

export async function deleteMember(userId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_member', { target_user_id: userId });
  if (error) reportError(error, 'deleteMember');
}

// ─── Club Settings (Gate Code) ──────────────────────────

export async function getGateCode(): Promise<string | null> {
  const { data } = await supabase
    .from('club_settings')
    .select('value')
    .eq('key', 'gate_code')
    .single();
  return data?.value ?? null;
}

export async function updateGateCode(code: string, adminId: string): Promise<void> {
  const { error } = await supabase.from('club_settings').upsert({
    key: 'gate_code',
    value: code,
    updated_at: new Date().toISOString(),
    updated_by: adminId,
  });
  if (error) throw error;
}

// ─── Family Management ──────────────────────────────────

export async function createFamily(primaryUserId: string, familyName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('families')
    .insert({ primary_user_id: primaryUserId, name: familyName })
    .select('id')
    .single();
  if (error) { reportError(error, 'createFamily'); return null; }
  // Link the primary user's profile to this family
  await supabase.from('profiles').update({ family_id: data.id, membership_type: 'family' }).eq('id', primaryUserId);
  return data.id;
}

export async function fetchFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data } = await supabase.from('family_members').select('*').eq('family_id', familyId).order('created_at');
  if (!data) return [];
  return data.map(m => ({
    id: m.id,
    familyId: m.family_id,
    name: m.name,
    type: m.type as 'adult' | 'junior',
    skillLevel: (m.skill_level as SkillLevel) ?? undefined,
    skillLevelSet: m.skill_level_set ?? false,
    avatar: m.avatar ?? 'tennis-male-1',
    birthYear: m.birth_year ?? undefined,
  }));
}

export async function addFamilyMember(familyId: string, member: { name: string; type: 'adult' | 'junior'; birthYear?: number }): Promise<FamilyMember | null> {
  const { data, error } = await supabase
    .from('family_members')
    .insert({ family_id: familyId, name: member.name, type: member.type, birth_year: member.birthYear ?? null })
    .select('*')
    .single();
  if (error) { reportError(error, 'addFamilyMember'); return null; }
  return {
    id: data.id,
    familyId: data.family_id,
    name: data.name,
    type: data.type as 'adult' | 'junior',
    skillLevel: (data.skill_level as SkillLevel) ?? undefined,
    skillLevelSet: data.skill_level_set ?? false,
    avatar: data.avatar ?? 'tennis-male-1',
    birthYear: data.birth_year ?? undefined,
  };
}

export async function updateFamilyMember(memberId: string, updates: { name?: string; skill_level?: string; skill_level_set?: boolean; avatar?: string }): Promise<void> {
  const { error } = await supabase.from('family_members').update(updates).eq('id', memberId);
  if (error) reportError(error, 'updateFamilyMember');
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('id', memberId);
  if (error) reportError(error, 'removeFamilyMember');
}

// ─── Match Lineups (Interclub) ───────────────────────────

export async function fetchLineups(team: 'a' | 'b'): Promise<MatchLineup[]> {
  const { data, error } = await supabase
    .from('match_lineups')
    .select('*')
    .eq('team', team)
    .gte('match_date', new Date().toISOString().split('T')[0])
    .order('match_date');
  if (error) { reportError(error, 'fetchLineups'); return []; }
  if (!data || data.length === 0) return [];

  // Fetch entries for all lineups
  const lineupIds = data.map(l => l.id);
  const { data: entries } = await supabase
    .from('lineup_entries')
    .select('*')
    .in('lineup_id', lineupIds);

  // Fetch member names for entries
  const memberIds = Array.from(new Set((entries || []).map(e => e.member_id)));
  const memberMap: Record<string, { name: string; skill_level?: string; avatar?: string }> = {};
  if (memberIds.length > 0) {
    const { data: members } = await supabase.from('profiles').select('id, name, skill_level, avatar').in('id', memberIds);
    if (members) members.forEach(m => { memberMap[m.id] = { name: m.name, skill_level: m.skill_level, avatar: m.avatar }; });
  }

  return data.map(l => ({
    id: l.id,
    team: l.team as 'a' | 'b',
    matchDate: l.match_date,
    matchTime: l.match_time || undefined,
    opponent: l.opponent || undefined,
    location: l.location || undefined,
    notes: l.notes || undefined,
    createdBy: l.created_by,
    createdAt: l.created_at,
    entries: (entries || [])
      .filter(e => e.lineup_id === l.id)
      .map(e => ({
        id: e.id,
        lineupId: e.lineup_id,
        memberId: e.member_id,
        memberName: memberMap[e.member_id]?.name,
        memberSkillLevel: memberMap[e.member_id]?.skill_level as SkillLevel | undefined,
        memberAvatar: memberMap[e.member_id]?.avatar || undefined,
        status: e.status as LineupStatus,
        position: e.position || undefined,
        notes: e.notes || undefined,
        updatedAt: e.updated_at,
      })),
  }));
}

export async function createLineup(lineup: { team: 'a' | 'b'; matchDate: string; matchTime?: string; opponent?: string; location?: string; notes?: string; createdBy: string }): Promise<string | null> {
  const { data, error } = await supabase
    .from('match_lineups')
    .insert({
      team: lineup.team,
      match_date: lineup.matchDate,
      match_time: lineup.matchTime || null,
      opponent: lineup.opponent || null,
      location: lineup.location || null,
      notes: lineup.notes || null,
      created_by: lineup.createdBy,
    })
    .select('id')
    .single();
  if (error) throw error;
  const lineupId = data.id;

  // Auto-create entries for all team members
  const { data: teamMembers } = await supabase.from('profiles').select('id').eq('interclub_team', lineup.team);
  if (teamMembers && teamMembers.length > 0) {
    const entries = teamMembers.map(m => ({ lineup_id: lineupId, member_id: m.id, status: 'pending' }));
    const { error: entryError } = await supabase.from('lineup_entries').insert(entries);
    if (entryError) reportError(entryError, 'createLineup:entries');
  }

  return lineupId;
}

export async function updateLineupEntry(lineupId: string, memberId: string, updates: { status?: LineupStatus; position?: string; notes?: string }): Promise<void> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.position !== undefined) dbUpdates.position = updates.position;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  const { error } = await supabase.from('lineup_entries').update(dbUpdates).eq('lineup_id', lineupId).eq('member_id', memberId);
  if (error) throw error;
}

export async function deleteLineup(lineupId: string): Promise<void> {
  const { error } = await supabase.from('match_lineups').delete().eq('id', lineupId);
  if (error) throw error;
}

// ─── Welcome Message — REMOVED ──────────────────────────
// send_welcome_message RPC removed. New members get a welcome notification instead.
