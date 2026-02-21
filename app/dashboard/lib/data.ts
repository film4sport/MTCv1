// Default mock data for the dashboard
// In production, this will be replaced with Supabase queries

import type { Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, MemberPayment, AdminAnalytics, User, CoachingProgram } from './types';

// ─── Members ────────────────────────────────────────────
export const DEFAULT_MEMBERS: User[] = [
  { id: 'alex', name: 'Alex Thompson', email: 'member@mtc.ca', role: 'member', ntrp: 3.5, memberSince: '2025-03' },
  { id: 'mike', name: 'Mike Chen', email: 'mike.chen@mtc.ca', role: 'member', ntrp: 4.0, memberSince: '2024-12' },
  { id: 'sarah', name: 'Sarah Wilson', email: 'sarah.w@mtc.ca', role: 'member', ntrp: 3.5, memberSince: '2024-06' },
  { id: 'james', name: 'James Park', email: 'james.p@mtc.ca', role: 'member', ntrp: 4.5, memberSince: '2024-09' },
  { id: 'emily', name: 'Emily Rodriguez', email: 'emily.r@mtc.ca', role: 'member', ntrp: 3.0, memberSince: '2025-01' },
  { id: 'david', name: 'David Kim', email: 'david.k@mtc.ca', role: 'member', ntrp: 4.0, memberSince: '2024-11' },
  { id: 'lisa', name: 'Lisa Thompson', email: 'lisa.t@mtc.ca', role: 'member', ntrp: 3.0, memberSince: '2024-08' },
  { id: 'ryan', name: "Ryan O'Connor", email: 'ryan.o@mtc.ca', role: 'member', ntrp: 3.5, memberSince: '2025-02' },
  { id: 'mark', name: 'Mark Taylor', email: 'coach@mtc.ca', role: 'coach', ntrp: 5.0, memberSince: '2023-01' },
  { id: 'admin', name: 'Admin', email: 'admin@mtc.ca', role: 'admin', memberSince: '2023-01' },
];

// ─── Courts ─────────────────────────────────────────────
export const DEFAULT_COURTS: Court[] = [
  { id: 1, name: 'Court 1', floodlight: true, status: 'in-use', currentUser: 'Mike Chen', endsAt: '3:00 PM' },
  { id: 2, name: 'Court 2', floodlight: true, status: 'available' },
  { id: 3, name: 'Court 3', floodlight: false, status: 'reserved', startsIn: 30 },
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

  // Recurring event templates (dayOfWeek: 0=Sun, 2=Tue, 4=Thu, 5=Fri)
  const templates: { dayOfWeek: number; id: string; title: string; time: string; location: string; badge: 'free' | 'members' | 'paid'; price: string; description: string; type: ClubEvent['type'] }[] = [
    { dayOfWeek: 2, id: 'mens-rr', title: "Men's Round Robin", time: '9:00 AM - 11:00 AM', location: 'Courts 1-2', badge: 'members', price: 'Members', description: "Weekly men's round robin every Tuesday morning. All skill levels welcome.", type: 'roundrobin' },
    { dayOfWeek: 4, id: 'freedom-55', title: 'Freedom 55 League', time: '9:00 AM - 11:00 AM', location: 'Courts 1-2', badge: 'members', price: 'Members', description: 'Thursday morning league for the 55+ crowd. Fun and social tennis.', type: 'roundrobin' },
    { dayOfWeek: 4, id: 'interclub', title: 'Interclub Competitive League', time: '7:00 PM - 9:30 PM', location: 'Courts 1-2', badge: 'members', price: 'Team Only', description: 'A & B teams interclub competitive league. RSVP required for team selection.', type: 'match' },
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
          attendees: [],
          type: t.type,
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
    id: 'opening-day-bbq',
    title: 'Opening Day BBQ & Meet the Pros',
    date: '2026-05-09',
    time: '1:00 PM - 3:00 PM',
    location: 'All Courts & Clubhouse',
    badge: 'free',
    price: 'Free',
    description: 'Kick off the 2026 season! BBQ, music, and meet our coaching staff.',
    attendees: ['Mike Chen', 'Sarah Wilson', 'James Park', 'Emily Rodriguez', 'Lisa Thompson'],
    type: 'social',
  },
  {
    id: 'mixed-doubles-tournament-day1',
    title: '95+ Mixed Doubles Tournament (Day 1)',
    date: '2026-07-26',
    time: 'All Day',
    location: 'All Courts',
    badge: 'members',
    price: 'Members',
    spotsTotal: 32,
    spotsTaken: 16,
    description: '95+ combined age mixed doubles tournament. Day 1 of 2.',
    attendees: [],
    type: 'tournament',
  },
  {
    id: 'mixed-doubles-tournament-day2',
    title: '95+ Mixed Doubles Tournament (Day 2)',
    date: '2026-07-27',
    time: 'All Day',
    location: 'All Courts',
    badge: 'members',
    price: 'Members',
    spotsTotal: 32,
    spotsTaken: 16,
    description: '95+ combined age mixed doubles tournament. Day 2 of 2.',
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
  { id: 'p1', userId: 'sarah', name: 'Sarah Wilson', ntrp: 3.5, availability: 'Tomorrow, 10am', matchType: 'singles', date: 'Tomorrow', time: '10:00 AM', status: 'available' },
  { id: 'p2', userId: 'mike', name: 'Mike Chen', ntrp: 4.0, availability: 'Saturday, 2pm', matchType: 'doubles', date: 'Saturday', time: '2:00 PM', status: 'available' },
  { id: 'p3', userId: 'emily', name: 'Emily Rodriguez', ntrp: 3.0, availability: 'Sunday, 9am', matchType: 'any', date: 'Sunday', time: '9:00 AM', status: 'available' },
  { id: 'p4', userId: 'david', name: 'David Kim', ntrp: 4.0, availability: 'Monday, 6pm', matchType: 'singles', date: 'Monday', time: '6:00 PM', status: 'available' },
  { id: 'p5', userId: 'ryan', name: "Ryan O'Connor", ntrp: 3.5, availability: 'Wednesday, 4pm', matchType: 'mixed', date: 'Wednesday', time: '4:00 PM', status: 'available' },
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

// ─── Payments ───────────────────────────────────────────
export const DEFAULT_PAYMENTS: MemberPayment[] = [
  {
    memberId: 'alex',
    memberName: 'Alex Thompson',
    balance: 10,
    history: [
      { id: 'pay1', date: '2026-02-08', description: 'Guest fee - Court 2', amount: 10, type: 'charge' },
    ],
  },
  {
    memberId: 'mike',
    memberName: 'Mike Chen',
    balance: 0,
    history: [
      { id: 'pay2', date: '2026-02-05', description: 'Guest fee - Court 1', amount: 10, type: 'charge' },
      { id: 'pay3', date: '2026-02-06', description: 'E-transfer payment', amount: -10, type: 'payment' },
    ],
  },
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
