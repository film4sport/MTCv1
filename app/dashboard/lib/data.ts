// Default data for the dashboard
// In production, all data is fetched from Supabase.
// These defaults provide empty states for initial render.

import type { Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, AdminAnalytics, User, CoachingProgram, VolunteerTask } from './types';

// ─── Members ────────────────────────────────────────────
export const DEFAULT_MEMBERS: User[] = [];

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
export const DEFAULT_BOOKINGS: Booking[] = [];

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
          attendees: [],
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
    description: 'Kick off the 2026 season! BBQ, music, and meet our coaching staff including Mark Taylor. All members, families, and guests welcome.',
    attendees: [],
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
    id: 'junior-summer-camp',
    title: 'Junior Summer Camp',
    date: '2026-07-01',
    time: 'Dates TBA',
    location: 'All Courts',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 12,
    spotsTaken: 0,
    description: 'Intensive camp for juniors aged 8-14 with Mark Taylor. Daily drills, match play, fitness, and fun activities. Exact dates coming soon!',
    attendees: [],
    type: 'camp',
  },
  // ── Full-season recurring events (generated) ──
  ...generateRecurringEvents(),
];

// ─── Partner Requests ───────────────────────────────────
export const DEFAULT_PARTNERS: Partner[] = [];

// ─── Conversations ──────────────────────────────────────
export const DEFAULT_CONVERSATIONS: Conversation[] = [];

// ─── Announcements ──────────────────────────────────────
export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', text: 'Courts 3-4 resurfacing completed! Now open for booking.', type: 'info', date: '2026-03-01', dismissedBy: [] },
  { id: 'a2', text: 'Spring 2026 season begins May 1st — register now!', type: 'info', date: '2026-03-04', dismissedBy: [] },
];

// ─── Notifications ──────────────────────────────────────
export const DEFAULT_NOTIFICATIONS: Notification[] = [];

// ─── Admin Analytics ────────────────────────────────────
export const DEFAULT_ANALYTICS: AdminAnalytics = {
  totalBookingsThisMonth: 0,
  bookingsChange: 0,
  revenueThisMonth: 0,
  revenueChange: 0,
  peakTimes: [],
  courtUsage: { today: 0, thisWeek: 0, thisMonth: 0 },
  revenueBreakdown: [],
  memberActivity: {
    mostActive: [],
    newMembersThisMonth: 0,
    avgBookingsPerMember: 0,
  },
  monthlyTrends: [],
};
