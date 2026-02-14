// Default mock data for the dashboard
// In production, this will be replaced with Supabase queries

import type { Court, Booking, ClubEvent, Partner, Conversation, Announcement, Notification, MemberPayment, AdminAnalytics, User } from './types';

// ─── Members ────────────────────────────────────────────
export const DEFAULT_MEMBERS: User[] = [
  { id: 'alex', name: 'Alex Thompson', email: 'member@mtc.ca', role: 'member', ntrp: 3.5, memberSince: '2025-03', phone: '+1 (555) 123-4567' },
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

// ─── Bookings ───────────────────────────────────────────
export const DEFAULT_BOOKINGS: Booking[] = [
  { id: 'b1', courtId: 2, courtName: 'Court 2', date: new Date().toISOString().split('T')[0], time: '4:00 PM', userId: 'alex', userName: 'Alex Thompson', status: 'confirmed', type: 'court' },
  { id: 'b2', courtId: 1, courtName: 'Court 1', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '10:00 AM', userId: 'alex', userName: 'Alex Thompson', status: 'confirmed', type: 'court' },
];

// ─── Club Events ────────────────────────────────────────
// Matches landing page Schedule.tsx and mtc-app events.js
export const DEFAULT_EVENTS: ClubEvent[] = [
  {
    id: 'feb-social-mixer',
    title: 'Winter Social Mixer',
    date: '2026-02-15',
    time: '2:00 PM - 4:00 PM',
    location: 'Clubhouse',
    badge: 'free',
    price: 'Free',
    description: 'Indoor social mixer with food and drinks. Great way to meet new members before the season!',
    attendees: ['Sarah Wilson', 'Mike Chen', 'Emily Rodriguez'],
    type: 'social',
  },
  {
    id: 'feb-indoor-rr',
    title: 'Indoor Round Robin',
    date: '2026-02-21',
    time: '10:00 AM - 12:00 PM',
    location: 'Courts 1-2',
    badge: 'members',
    price: 'Members',
    description: 'Pre-season indoor round robin. All skill levels welcome.',
    attendees: ['James Park', "Ryan O'Connor"],
    type: 'roundrobin',
  },
  {
    id: 'feb-agm',
    title: 'Annual General Meeting',
    date: '2026-02-28',
    time: '7:00 PM - 9:00 PM',
    location: 'Clubhouse',
    badge: 'members',
    price: 'Members',
    description: 'Annual general meeting to review the 2025 season and plan for 2026.',
    attendees: [],
    type: 'social',
  },
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
    id: 'mens-round-robin',
    title: "Men's Round Robin",
    date: '2026-05-12',
    time: '9:00 AM - 11:00 AM',
    location: 'Courts 1-2',
    badge: 'members',
    price: 'Members',
    description: "Weekly men's round robin every Tuesday morning. All skill levels welcome.",
    attendees: ['Mike Chen', 'James Park', 'David Kim', "Ryan O'Connor"],
    type: 'roundrobin',
  },
  {
    id: 'freedom-55',
    title: 'Freedom 55 League',
    date: '2026-05-14',
    time: '9:00 AM - 11:00 AM',
    location: 'Courts 1-2',
    badge: 'members',
    price: 'Members',
    description: 'Thursday morning league for the 55+ crowd. Fun and social tennis.',
    attendees: ['Lisa Thompson', 'David Kim'],
    type: 'roundrobin',
  },
  {
    id: 'interclub-league',
    title: 'Interclub Competitive League',
    date: '2026-05-14',
    time: '7:00 PM - 9:30 PM',
    location: 'Courts 1-2',
    badge: 'members',
    price: 'Team Only',
    description: 'A & B teams interclub competitive league. RSVP required.',
    attendees: ['Mike Chen', 'James Park', "Ryan O'Connor"],
    type: 'match',
  },
  {
    id: 'ladies-round-robin',
    title: "Ladies Round Robin",
    date: '2026-05-15',
    time: '9:00 AM - 11:00 AM',
    location: 'Courts 1-2',
    badge: 'members',
    price: 'Members',
    description: "Weekly ladies round robin every Friday morning. All skill levels welcome.",
    attendees: ['Sarah Wilson', 'Emily Rodriguez', 'Lisa Thompson'],
    type: 'roundrobin',
  },
  {
    id: 'friday-mixed',
    title: 'Friday Night Mixed Round Robin',
    date: '2026-05-15',
    time: '6:00 PM - 9:00 PM',
    location: 'All Courts',
    badge: 'members',
    price: 'Members',
    description: 'Mixed doubles round robin every Friday evening. Rotating partners, fun format!',
    attendees: ['Mike Chen', 'Sarah Wilson', 'James Park', 'Emily Rodriguez', 'David Kim'],
    type: 'roundrobin',
  },
  {
    id: 'mixed-doubles-tournament',
    title: '95+ Mixed Doubles Tournament',
    date: '2026-07-26',
    time: 'All Day',
    location: 'All Courts',
    badge: 'members',
    price: 'Members',
    spotsTotal: 32,
    spotsTaken: 16,
    description: '95+ combined age mixed doubles tournament. Day 1 of 2 (continues July 27).',
    attendees: [],
    type: 'tournament',
  },
  {
    id: 'summer-camp',
    title: 'Summer Tennis Camp',
    date: '2026-07-28',
    time: '8:30 AM - 3:30 PM',
    location: 'Courts 1-4',
    badge: 'paid',
    price: 'See Details',
    spotsTotal: 30,
    spotsTaken: 12,
    description: '5-day summer tennis camp (Jul 28 - Aug 1). Instruction, drills, and match play for all ages.',
    attendees: [],
    type: 'lesson',
  },
];

// ─── Partner Requests ───────────────────────────────────
export const DEFAULT_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Sarah Wilson', ntrp: 3.5, availability: 'Tomorrow, 10am', matchType: 'singles', date: 'Tomorrow', time: '10:00 AM', status: 'available' },
  { id: 'p2', name: 'Mike Chen', ntrp: 4.0, availability: 'Saturday, 2pm', matchType: 'doubles', date: 'Saturday', time: '2:00 PM', status: 'available' },
  { id: 'p3', name: 'Emily Rodriguez', ntrp: 3.0, availability: 'Sunday, 9am', matchType: 'any', date: 'Sunday', time: '9:00 AM', status: 'available' },
  { id: 'p4', name: 'David Kim', ntrp: 4.0, availability: 'Monday, 6pm', matchType: 'singles', date: 'Monday', time: '6:00 PM', status: 'available' },
  { id: 'p5', name: "Ryan O'Connor", ntrp: 3.5, availability: 'Wednesday, 4pm', matchType: 'mixed', date: 'Wednesday', time: '4:00 PM', status: 'available' },
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
  courtUtilization: [
    { court: 'Court 1', utilization: 78 },
    { court: 'Court 2', utilization: 82 },
    { court: 'Court 3', utilization: 45 },
    { court: 'Court 4', utilization: 61 },
  ],
};
