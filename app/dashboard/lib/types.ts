// Dashboard TypeScript interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'coach' | 'admin' | 'guest';
  phone?: string;
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
  status: 'confirmed' | 'cancelled';
  type: 'court' | 'partner' | 'ball-machine';
}

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  badge: 'free' | 'members' | 'paid';
  price: string;
  spotsTotal: number;
  spotsTaken: number;
  description: string;
  attendees: string[];
  type: 'social' | 'match' | 'roundrobin' | 'lesson' | 'tournament';
}

export interface Partner {
  id: string;
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
  type: 'booking' | 'event' | 'partner' | 'message' | 'payment' | 'announcement';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

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
  courtUtilization: { court: string; utilization: number }[];
}

// Config constants
export const COURTS_CONFIG = [
  { id: 1, name: 'Court 1', floodlight: true },
  { id: 2, name: 'Court 2', floodlight: true },
  { id: 3, name: 'Court 3', floodlight: false },
  { id: 4, name: 'Court 4', floodlight: false },
] as const;

export const TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '11:00 AM', '12:00 PM',
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

export const CREDENTIALS: Record<string, { password: string; role: User['role']; name: string }> = {
  'member@mtc.ca': { password: 'member123', role: 'member', name: 'Alex Thompson' },
  'coach@mtc.ca': { password: 'coach123', role: 'coach', name: 'Mark Taylor' },
  'admin@mtc.ca': { password: 'admin123', role: 'admin', name: 'Admin' },
};
