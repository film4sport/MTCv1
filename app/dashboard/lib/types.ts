// Dashboard TypeScript interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'coach' | 'admin';
  status?: 'active' | 'paused'; // undefined treated as 'active'
  ntrp?: number; // skill rating 1.0 - 7.0
  memberSince?: string;
  avatar?: string;
}

export interface Court {
  id: number;
  name: string;
  floodlight: boolean;
  status: 'available' | 'in-use' | 'reserved' | 'maintenance';
  currentUser?: string;
  endsAt?: string;
  startsIn?: number;
}

export interface Booking {
  id: string;
  courtId: number;
  courtName: string;
  date: string; // ISO date string
  time: string;
  userId: string;
  userName: string;
  guestName?: string;
  participants?: { id: string; name: string }[];
  status: 'confirmed' | 'cancelled';
  type: 'court' | 'partner' | 'ball-machine' | 'program' | 'lesson';
  programId?: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  badge: 'free' | 'members' | 'paid';
  price: string;
  spotsTotal?: number;
  spotsTaken?: number;
  description: string;
  attendees: string[];
  type: 'social' | 'match' | 'roundrobin' | 'lesson' | 'tournament';
}

export interface Partner {
  id: string;
  userId: string;
  name: string;
  ntrp: number;
  availability: string;
  matchType: 'singles' | 'doubles' | 'mixed' | 'any';
  date: string;
  time: string;
  avatar?: string;
  status: 'available' | 'matched';
}

export interface Message {
  id: string;
  from: string;
  fromId: string;
  to: string;
  toId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  memberId: string;
  memberName: string;
  lastMessage: string;
  lastTimestamp: string;
  unread: number;
  messages: Message[];
}

export interface Announcement {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'urgent';
  date: string;
  dismissedBy: string[];
}

export interface Notification {
  id: string;
  type: 'booking' | 'event' | 'partner' | 'message' | 'payment' | 'announcement' | 'program';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationPreferences {
  bookings: boolean;
  events: boolean;
  payments: boolean;
  partners: boolean;
  messages: boolean;
  programs: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  bookings: true,
  events: true,
  payments: true,
  partners: true,
  messages: true,
  programs: true,
};

export interface WeatherData {
  tempC: number;
  tempF: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  wind: number;
  humidity: number;
  description: string;
  lastUpdated: string | null;
}

export interface MemberPayment {
  memberId: string;
  memberName: string;
  balance: number;
  history: PaymentEntry[];
}

export interface PaymentEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'charge' | 'payment';
}

export interface AdminAnalytics {
  totalBookingsThisMonth: number;
  bookingsChange: number;
  revenueThisMonth: number;
  revenueChange: number;
  peakTimes: { day: string; time: string; bookings: number }[];
  courtUsage: { today: number; thisWeek: number; thisMonth: number };
  revenueBreakdown: { category: string; amount: number; percentage: number }[];
  memberActivity: { mostActive: { name: string; bookings: number }[]; newMembersThisMonth: number; avgBookingsPerMember: number };
  monthlyTrends: { month: string; bookings: number; revenue: number }[];
}

export interface CoachingProgram {
  id: string;
  title: string;
  type: 'clinic' | 'camp';
  coachId: string;
  coachName: string;
  description: string;
  courtId: number;
  courtName: string;
  sessions: { date: string; time: string; duration: number }[];
  fee: number;
  spotsTotal: number;
  enrolledMembers: string[];
  status: 'active' | 'cancelled' | 'completed';
}

// Config constants
export const COURTS_CONFIG = [
  { id: 1, name: 'Court 1', floodlight: true },
  { id: 2, name: 'Court 2', floodlight: true },
  { id: 3, name: 'Court 3', floodlight: false },
  { id: 4, name: 'Court 4', floodlight: false },
] as const;

export const TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
] as const;

export const COURT_HOURS: Record<number, { close: string }> = {
  1: { close: '22:00' },
  2: { close: '22:00' },
  3: { close: '20:00' },
  4: { close: '20:00' },
};

export const FEES = {
  booking: 0,
  guest: 10,
  tabWarning: 20,
  tabBlock: 30,
  cancelWindowHours: 24,
} as const;

export const CLUB_LOCATION = {
  lat: 44.0167,
  lon: -80.0667,
  name: 'Mono, Ontario',
} as const;
