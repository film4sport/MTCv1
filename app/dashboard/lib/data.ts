// Default mock data for the dashboard
// In production, this will be replaced with Supabase queries

import type { Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, AdminAnalytics, User, CoachingProgram, VolunteerTask } from './types';

// ─── Members ────────────────────────────────────────────
export const DEFAULT_MEMBERS: User[] = [
  { id: 'alex', name: 'Alex Thompson', email: 'member@mtc.ca', role: 'member', ntrp: 3.5, skillLevel: 'intermediate', memberSince: '2025-03', avatar: 'tennis-male-1' },
  { id: 'mike', name: 'Mike Chen', email: 'mike.chen@mtc.ca', role: 'member', ntrp: 4.0, skillLevel: 'advanced', memberSince: '2024-12', avatar: 'tennis-male-2' },
  { id: 'sarah', name: 'Sarah Wilson', email: 'sarah.w@mtc.ca', role: 'member', ntrp: 3.5, skillLevel: 'intermediate', memberSince: '2024-06', avatar: 'tennis-female-1' },
  { id: 'james', name: 'James Park', email: 'james.p@mtc.ca', role: 'member', ntrp: 4.5, skillLevel: 'competitive', memberSince: '2024-09', avatar: 'tennis-male-1' },
  { id: 'emily', name: 'Emily Rodriguez', email: 'emily.r@mtc.ca', role: 'member', ntrp: 3.0, skillLevel: 'beginner', memberSince: '2025-01', avatar: 'tennis-female-2' },
  { id: 'david', name: 'David Kim', email: 'david.k@mtc.ca', role: 'member', ntrp: 4.0, skillLevel: 'advanced', memberSince: '2024-11', avatar: 'tennis-male-2' },
  { id: 'lisa', name: 'Lisa Thompson', email: 'lisa.t@mtc.ca', role: 'member', ntrp: 3.0, skillLevel: 'beginner', memberSince: '2024-08', avatar: 'tennis-female-1' },
  { id: 'ryan', name: "Ryan O'Connor", email: 'ryan.o@mtc.ca', role: 'member', ntrp: 3.5, skillLevel: 'intermediate', memberSince: '2025-02', avatar: 'tennis-male-1' },
  { id: 'mark', name: 'Mark Taylor', email: 'coach@mtc.ca', role: 'coach', ntrp: 5.0, skillLevel: 'competitive', memberSince: '2023-01', avatar: 'tennis-male-2' },
  { id: 'admin', name: 'Admin', email: 'admin@mtc.ca', role: 'admin', skillLevel: 'intermediate', memberSince: '2023-01', avatar: 'tennis-male-1' },
];

// ─── Courts ─────────────────────────────────────────────
export const DEFAULT_COURTS: Court[] = [
  { id: 1, name: 'Court 1', floodlight: true, status: 'available' },
  { id: 2, name: 'Court 2', floodlight: true, status: 'available' },
  { id: 3, name: 'Court 3', floodlight: false, status: 'available' },
  { id: 4, name: 'Court 4', floodlight: false, status: 'available' },
];

// ─── Coaching Programs ──────────────────────────────────
export const DEFAULT_PROGRAMS: CoachingProgram[] = [
  {
    id: 'prog-clinic-1',
    title: 'Beginner Group Clinic',
    type: 'clinic',
    coachId: 'mark',
    coachName: 'Mark Taylor',
    description: 'A 4-week beginner clinic covering grips, strokes, footwork, and match play basics. Perfect for new players looking to build a solid foundation.',
    courtId: 3,
    courtName: 'Court 3',
    sessions: [
      { date: '2026-03-01', time: '10:00 AM', duration: 90 },
      { date: '2026-03-08', time: '10:00 AM', duration: 90 },
      { date: '2026-03-15', time: '10:00 AM', duration: 90 },
      { date: '2026-03-22', time: '10:00 AM', duration: 90 },
    ],
    fee: 120,
    spotsTotal: 8,
    enrolledMembers: ['emily', 'lisa'],
    status: 'active',
  },
  {
    id: 'prog-camp-1',
    title: 'Junior Summer Camp Week 1',
    type: 'camp',
    coachId: 'mark',
    coachName: 'Mark Taylor',
    description: '5-day intensive camp for juniors aged 8-14. Daily drills, match play, fitness, and fun activities. All skill levels welcome.',
    courtId: 1,
    courtName: 'Court 1',
    sessions: [
      { date: '2026-07-06', time: '9:30 AM', duration: 180 },
      { date: '2026-07-07', time: '9:30 AM', duration: 180 },
      { date: '2026-07-08', time: '9:30 AM', duration: 180 },
      { date: '2026-07-09', time: '9:30 AM', duration: 180 },
      { date: '2026-07-10', time: '9:30 AM', duration: 180 },
    ],
    fee: 250,
    spotsTotal: 12,
    enrolledMembers: [],
    status: 'active',
  },
];

// ─── Bookings ───────────────────────────────────────────
export const DEFAULT_BOOKINGS: Booking[] = [
  { id: 'b1', courtId: 2, courtName: 'Court 2', date: new Date().toISOString().split('T')[0], time: '4:00 PM', userId: 'alex', userName: 'Alex Thompson', status: 'confirmed', type: 'court' },
  { id: 'b2', courtId: 1, courtName: 'Court 1', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '10:00 AM', userId: 'alex', userName: 'Alex Thompson', status: 'confirmed', type: 'court' },
  // Program-blocked bookings (Beginner Clinic — Court 3)
  { id: 'bp1', courtId: 3, courtName: 'Court 3', date: '2026-03-01', time: '10:00 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-clinic-1' },
  { id: 'bp2', courtId: 3, courtName: 'Court 3', date: '2026-03-08', time: '10:00 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-clinic-1' },
  { id: 'bp3', courtId: 3, courtName: 'Court 3', date: '2026-03-15', time: '10:00 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-clinic-1' },
  { id: 'bp4', courtId: 3, courtName: 'Court 3', date: '2026-03-22', time: '10:00 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-clinic-1' },
  // Program-blocked bookings (Junior Camp — Court 1)
  { id: 'bp5', courtId: 1, courtName: 'Court 1', date: '2026-07-06', time: '9:30 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-camp-1' },
  { id: 'bp6', courtId: 1, courtName: 'Court 1', date: '2026-07-07', time: '9:30 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-camp-1' },
  { id: 'bp7', courtId: 1, courtName: 'Court 1', date: '2026-07-08', time: '9:30 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-camp-1' },
  { id: 'bp8', courtId: 1, courtName: 'Court 1', date: '2026-07-09', time: '9:30 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-camp-1' },
  { id: 'bp9', courtId: 1, courtName: 'Court 1', date: '2026-07-10', time: '9:30 AM', userId: 'mark', userName: 'Mark Taylor', status: 'confirmed', type: 'program', programId: 'prog-camp-1' },
];

// ─── Club Events ────────────────────────────────────────
// Generate recurring events for the full season (May 9 – Oct 31, 2026)
// Matches landing page Schedule.tsx recurring events exactly

function generateRecurringEvents(): ClubEvent[] {
  const SEASON_START = new Date(2026, 4, 9); // May 9 opening day
  const SEASON_END = new Date(2026, 9, 31);  // Oct 31

  // Interclub-specific metadata
  const interclubMeta = {
    opponent: 'Orangeville TC',
    format: 'A & B Teams',
    instructions: [
      'Arrive by 6:30 PM for warm-up',
      'Post-match social at clubhouse',
    ],
    volunteersNeeded: [
      { id: 'ic-t1', name: 'Snacks & Refreshments', icon: '🍊', assigned: null },
      { id: 'ic-t2', name: 'Court Setup', icon: '🎾', assigned: null },
      { id: 'ic-t3', name: 'Clean Up', icon: '🧹', assigned: null },
    ] as VolunteerTask[],
    assignedTasks: [
      { id: 'ic-t4', name: 'Scorekeeper', icon: '📊', assigned: 'Kelly K.' },
      { id: 'ic-t5', name: 'Team Captain A', icon: '👑', assigned: 'Patti P.' },
    ] as VolunteerTask[],
  };

  // Recurring event templates (dayOfWeek: 0=Sun, 2=Tue, 4=Thu, 5=Fri)
  const templates: { dayOfWeek: number; id: string; title: string; time: string; location: string; badge: 'free' | 'members' | 'paid'; price: string; description: string; type: ClubEvent['type']; opponent?: string; format?: string; instructions?: string[]; volunteersNeeded?: VolunteerTask[]; assignedTasks?: VolunteerTask[] }[] = [
    { dayOfWeek: 2, id: 'mens-rr', title: "Men's Round Robin", time: '9:00 AM - 11:00 AM', location: 'Courts 1-2', badge: 'members', price: 'Members', description: "Weekly men's round robin every Tuesday morning. All skill levels welcome.", type: 'roundrobin' },
    { dayOfWeek: 4, id: 'freedom-55', title: 'Freedom 55 League', time: '9:00 AM - 11:00 AM', location: 'Courts 1-2', badge: 'members', price: 'Members', description: 'Thursday morning league for the 55+ crowd. Fun and social tennis.', type: 'roundrobin' },
    { dayOfWeek: 4, id: 'interclub', title: 'Interclub Competitive League', time: '7:00 PM - 9:30 PM', location: 'Courts 1-2', badge: 'members', price: 'Team Only', description: 'A & B teams interclub competitive league. RSVP required for team selection.', type: 'match', ...interclubMeta },
    { dayOfWeek: 5, id: 'ladies-rr', title: "Ladies Round Robin", time: '9:00 AM - 11:00 AM', location: 'Courts 1-2', badge: 'members', price: 'Members', description: "Weekly ladies round robin every Friday morning. All skill levels welcome.", type: 'roundrobin' },
    { dayOfWeek: 5, id: 'friday-mixed', title: 'Friday Night Mixed Round Robin', time: '6:00 PM - 9:00 PM', location: 'All Courts', badge: 'members', price: 'Members', description: 'Mixed doubles round robin every Friday evening. Rotating partners, fun format!', type: 'roundrobin' },
  ];

  const events: ClubEvent[] = [];
  const current = new Date(SEASON_START);
  // Move to the day after opening (recurring events start after May 9)
  current.setDate(current.getDate() + 1);
  while (current <= SEASON_END) {
    const dow = current.getDay();
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    for (const t of templates) {
      if (t.dayOfWeek === dow) {
        events.push({
          id: `${t.id}-${dateStr}`,
          title: t.title,
          date: dateStr,
          time: t.time,
          location: t.location,
          badge: t.badge,
          price: t.price,
          description: t.description,
          attendees: t.id === 'interclub' ? ['Kelly K.', 'Patrick M.', 'Michael H.', 'Phil P.', 'Peter G.', 'Jan H.', 'Sarah Wilson', 'Mike Chen', 'James Park'] : [],
          type: t.type,
          ...(t.opponent ? { opponent: t.opponent } : {}),
          ...(t.format ? { format: t.format } : {}),
          ...(t.instructions ? { instructions: t.instructions } : {}),
          ...(t.volunteersNeeded ? { volunteersNeeded: t.volunteersNeeded.map(v => ({ ...v })) } : {}),
          ...(t.assignedTasks ? { assignedTasks: t.assignedTasks.map(v => ({ ...v })) } : {}),
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return events;
}

// REAL club events — special one-off events + full-season recurring events
export const DEFAULT_EVENTS: ClubEvent[] = [
  // ── Special Events ──
  {
    id: 'euchre-tournament',
    title: 'Euchre Tournament',
    date: '2026-03-14',
    time: 'Evening',
    location: 'Clubhouse',
    badge: 'free',
    price: 'Free',
    description: 'Pre-season Euchre tournament! Open to members and guests. Prizes for top teams.',
    attendees: [],
    type: 'social',
  },
  {
    id: 'opening-day-bbq',
    title: 'Opening Day BBQ & Round Robin',
    date: '2026-05-09',
    time: '12:30 PM - 3:00 PM',
    location: 'All Courts & Clubhouse',
    badge: 'free',
    price: 'Free',
    description: 'Kick off the 2026 season! BBQ, music, round robin play, and meet our coaching staff. All members and families welcome.',
    attendees: ['Mike Chen', 'Sarah Wilson', 'James Park', 'Emily Rodriguez', 'Lisa Thompson'],
    type: 'social',
    instructions: ['All members and families welcome!', 'BBQ and refreshments provided', 'Casual play on all courts', 'New members meet & greet at 3 PM'],
    assignedTasks: [
      { id: 'od-t1', name: 'BBQ Grill Master', icon: '🍔', assigned: 'Patrick M.' },
      { id: 'od-t2', name: 'Drinks Station', icon: '🥤', assigned: 'Michael H.' },
      { id: 'od-t3', name: 'Welcome & Sign-in', icon: '👋', assigned: 'Kelly K.' },
      { id: 'od-t4', name: 'Clean Up Crew', icon: '🧹', assigned: 'Peter G.' },
    ],
    volunteersNeeded: [
      { id: 'od-t5', name: 'Parking Attendant', icon: '🚗', assigned: null },
    ],
  },
  {
    id: 'french-open-rr',
    title: 'French Open Round Robin Social',
    date: '2026-06-07',
    time: '1:00 PM - 4:00 PM',
    location: 'All Courts',
    badge: 'free',
    price: 'Free',
    description: 'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.',
    attendees: [],
    type: 'social',
  },
  {
    id: 'wimbledon-rr',
    title: 'Wimbledon Open Round Robin',
    date: '2026-07-12',
    time: '1:00 PM - 4:00 PM',
    location: 'All Courts',
    badge: 'free',
    price: 'Free',
    description: 'Wimbledon-themed round robin! Whites encouraged. Mixed doubles play, strawberries & cream, and great prizes.',
    attendees: [],
    type: 'social',
  },
  {
    id: 'mixed-doubles-tournament-day1',
    title: '95+ Mixed Doubles Tournament (Day 1)',
    date: '2026-07-18',
    time: 'All Day',
    location: 'All Courts',
    badge: 'members',
    price: 'Members',
    spotsTotal: 32,
    spotsTaken: 16,
    description: '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 1 of 2.',
    attendees: [],
    type: 'tournament',
  },
  {
    id: 'mixed-doubles-tournament-day2',
    title: '95+ Mixed Doubles Tournament (Day 2)',
    date: '2026-07-19',
    time: 'All Day',
    location: 'All Courts',
    badge: 'members',
    price: 'Members',
    spotsTotal: 32,
    spotsTaken: 16,
    description: '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 2 of 2.',
    attendees: [],
    type: 'tournament',
  },
  {
    id: 'summer-camp-day1',
    title: 'Summer Tennis Camp (Day 1)',
    date: '2026-07-28',
    time: '8:30 AM - 3:30 PM',
    location: 'Courts 1-4',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 30,
    spotsTaken: 12,
    description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
    attendees: [],
    type: 'lesson',
  },
  {
    id: 'summer-camp-day2',
    title: 'Summer Tennis Camp (Day 2)',
    date: '2026-07-29',
    time: '8:30 AM - 3:30 PM',
    location: 'Courts 1-4',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 30,
    spotsTaken: 12,
    description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
    attendees: [],
    type: 'lesson',
  },
  {
    id: 'summer-camp-day3',
    title: 'Summer Tennis Camp (Day 3)',
    date: '2026-07-30',
    time: '8:30 AM - 3:30 PM',
    location: 'Courts 1-4',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 30,
    spotsTaken: 12,
    description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
    attendees: [],
    type: 'lesson',
  },
  {
    id: 'summer-camp-day4',
    title: 'Summer Tennis Camp (Day 4)',
    date: '2026-07-31',
    time: '8:30 AM - 3:30 PM',
    location: 'Courts 1-4',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 30,
    spotsTaken: 12,
    description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
    attendees: [],
    type: 'lesson',
  },
  {
    id: 'summer-camp-day5',
    title: 'Summer Tennis Camp (Day 5)',
    date: '2026-08-01',
    time: '8:30 AM - 3:30 PM',
    location: 'Courts 1-4',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 30,
    spotsTaken: 12,
    description: '5-day summer tennis camp. Instruction, drills, and match play for all ages.',
    attendees: [],
    type: 'lesson',
  },
  // ── Full-season recurring events (generated) ──
  ...generateRecurringEvents(),
];

// ─── Partner Requests ───────────────────────────────────
export const DEFAULT_PARTNERS: Partner[] = [
  { id: 'p1', userId: 'sarah', name: 'Sarah Wilson', ntrp: 3.5, skillLevel: 'intermediate', availability: 'Tomorrow, 10am', matchType: 'singles', date: 'Tomorrow', time: '10:00 AM', avatar: 'tennis-female-1', message: 'Looking for a practice partner before league night!', status: 'available' },
  { id: 'p2', userId: 'mike', name: 'Mike Chen', ntrp: 4.0, skillLevel: 'advanced', availability: 'Saturday, 2pm', matchType: 'doubles', date: 'Saturday', time: '2:00 PM', avatar: 'tennis-male-2', status: 'available' },
  { id: 'p3', userId: 'emily', name: 'Emily Rodriguez', ntrp: 3.0, availability: 'Sunday, 9am', matchType: 'any', date: 'Sunday', time: '9:00 AM', avatar: 'tennis-female-2', message: 'New to the club, happy to play with anyone!', status: 'available' },
  { id: 'p4', userId: 'david', name: 'David Kim', ntrp: 4.0, skillLevel: 'advanced', availability: 'Monday, 6pm', matchType: 'singles', date: 'Monday', time: '6:00 PM', avatar: 'tennis-male-2', status: 'available' },
  { id: 'p5', userId: 'ryan', name: "Ryan O'Connor", ntrp: 3.5, skillLevel: 'intermediate', availability: 'Wednesday, 4pm', matchType: 'mixed', date: 'Wednesday', time: '4:00 PM', avatar: 'tennis-male-1', status: 'available' },
];

// ─── Conversations ──────────────────────────────────────
export const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    memberId: 'sarah',
    memberName: 'Sarah Wilson',
    lastMessage: 'Hey! Want to play doubles this weekend?',
    lastTimestamp: '2026-02-10T10:30:00',
    unread: 1,
    messages: [
      { id: 'm1', from: 'Sarah Wilson', fromId: 'sarah', to: 'Alex Thompson', toId: 'alex', text: 'Hey! Want to play doubles this weekend?', timestamp: '2026-02-10T10:30:00', read: false },
    ],
  },
  {
    memberId: 'admin',
    memberName: 'Admin',
    lastMessage: 'Welcome to Mono Tennis Club! Let us know if you have any questions.',
    lastTimestamp: '2026-02-09T09:00:00',
    unread: 0,
    messages: [
      { id: 'm2', from: 'Admin', fromId: 'admin', to: 'Alex Thompson', toId: 'alex', text: 'Welcome to Mono Tennis Club! Let us know if you have any questions.', timestamp: '2026-02-09T09:00:00', read: true },
    ],
  },
  {
    memberId: 'mike',
    memberName: 'Mike Chen',
    lastMessage: 'Good game today! Same time next week?',
    lastTimestamp: '2026-02-08T16:45:00',
    unread: 0,
    messages: [
      { id: 'm3', from: 'Mike Chen', fromId: 'mike', to: 'Alex Thompson', toId: 'alex', text: 'Good game today! Same time next week?', timestamp: '2026-02-08T16:45:00', read: true },
      { id: 'm4', from: 'Alex Thompson', fromId: 'alex', to: 'Mike Chen', toId: 'mike', text: "Absolutely! I'll book Court 2.", timestamp: '2026-02-08T16:50:00', read: true },
    ],
  },
];

// ─── Announcements ──────────────────────────────────────
export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', text: 'Courts 3-4 resurfacing completed! Now open for booking.', type: 'info', date: '2026-02-01', dismissedBy: [] },
  { id: 'a2', text: 'Spring membership registration opens March 1st.', type: 'info', date: '2026-02-05', dismissedBy: [] },
];

// ─── Notifications ──────────────────────────────────────
export const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'booking', title: 'Booking Confirmed', body: 'Court 2 reserved for today at 4:00 PM.', timestamp: '2026-02-10T08:00:00', read: false },
  { id: 'n2', type: 'event', title: 'Opening Day BBQ', body: 'Don\'t forget to RSVP for Opening Day BBQ on May 9th!', timestamp: '2026-02-09T12:00:00', read: false },
  { id: 'n3', type: 'message', title: 'New Message', body: 'Sarah Wilson sent you a message.', timestamp: '2026-02-10T10:30:00', read: false },
];

// ─── Admin Analytics ────────────────────────────────────
export const DEFAULT_ANALYTICS: AdminAnalytics = {
  totalBookingsThisMonth: 156,
  bookingsChange: 12,
  revenueThisMonth: 780,
  revenueChange: 8,
  peakTimes: [
    { day: 'Saturday', time: '10:00 AM', bookings: 24 },
    { day: 'Sunday', time: '9:00 AM', bookings: 22 },
    { day: 'Wednesday', time: '6:00 PM', bookings: 18 },
  ],
  courtUsage: { today: 12, thisWeek: 68, thisMonth: 156 },
  revenueBreakdown: [
    { category: 'Membership Fees', amount: 520, percentage: 67 },
    { category: 'Guest Fees', amount: 150, percentage: 19 },
    { category: 'Lesson Fees', amount: 110, percentage: 14 },
  ],
  memberActivity: {
    mostActive: [
      { name: 'Mike Chen', bookings: 18 },
      { name: 'James Park', bookings: 15 },
      { name: 'Sarah Wilson', bookings: 14 },
      { name: "Ryan O'Connor", bookings: 12 },
      { name: 'David Kim', bookings: 10 },
    ],
    newMembersThisMonth: 3,
    avgBookingsPerMember: 5.2,
  },
  monthlyTrends: [
    { month: 'Sep', bookings: 142, revenue: 680 },
    { month: 'Oct', bookings: 98, revenue: 490 },
    { month: 'Nov', bookings: 45, revenue: 220 },
    { month: 'Dec', bookings: 28, revenue: 140 },
    { month: 'Jan', bookings: 38, revenue: 190 },
    { month: 'Feb', bookings: 156, revenue: 780 },
  ],
};
