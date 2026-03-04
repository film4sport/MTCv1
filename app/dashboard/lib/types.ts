// Dashboard TypeScript interfaces

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'coach' | 'admin';
  status?: 'active' | 'paused'; // undefined treated as 'active'
  ntrp?: number; // legacy — kept for backwards compat
  skillLevel?: SkillLevel;
  skillLevelSet?: boolean;
  membershipType?: 'adult' | 'family' | 'junior';
  familyId?: string;
  memberSince?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  type: 'adult' | 'junior';
  skillLevel?: SkillLevel;
  skillLevelSet?: boolean;
  avatar?: string;
  birthYear?: number;
}

// Active profile: either the primary account holder or a family sub-profile
export type ActiveProfile =
  | { type: 'primary' }
  | { type: 'family_member'; member: FamilyMember };

export interface Court {
  id: number;
  name: string;
  floodlight: boolean;
  status: 'available' | 'maintenance';
}

export interface Booking {
  id: string;
  courtId: number;
  courtName: string;
  date: string; // ISO date string
  time: string;
  userId: string;
  userName: string;
  bookedFor?: string;   // family member name if booked via family profile
  guestName?: string;
  participants?: { id: string; name: string }[];
  status: 'confirmed' | 'cancelled';
  type: 'court' | 'partner' | 'program' | 'lesson';
  programId?: string;
  matchType?: 'singles' | 'doubles';
  duration?: number; // in slots (2=1h, 3=1.5h, 4=2h)
}

export interface VolunteerTask {
  id: string;
  name: string;
  icon: string;
  assigned: string | null;
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
  type: 'social' | 'match' | 'roundrobin' | 'lesson' | 'tournament' | 'camp';
  // Interclub-specific fields
  opponent?: string;
  format?: string;
  instructions?: string[];
  volunteersNeeded?: VolunteerTask[];
  assignedTasks?: VolunteerTask[];
}

export interface Partner {
  id: string;
  userId: string;
  name: string;
  ntrp: number; // legacy — kept for DB compat
  skillLevel?: SkillLevel;
  availability: string;
  matchType: 'singles' | 'doubles' | 'mixed' | 'any';
  date: string;
  time: string;
  avatar?: string;
  message?: string;
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
  type: 'booking' | 'event' | 'partner' | 'message' | 'announcement' | 'program';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationPreferences {
  bookings: boolean;
  events: boolean;
  partners: boolean;
  messages: boolean;
  programs: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  bookings: true,
  events: true,
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
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
  '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
] as const;

// Courts 1 & 2: bookable 9:30 AM - 10:00 PM (lights out at 11 PM)
// Courts 3 & 4: bookable 9:30 AM - 8:00 PM (no lights)
export const COURT_HOURS: Record<number, { close: string }> = {
  1: { close: '22:00' },
  2: { close: '22:00' },
  3: { close: '20:00' },
  4: { close: '20:00' },
};

export const FEES = {
  booking: 0,
  guest: 10,
  cancelWindowHours: 24,
} as const;

export const BOOKING_RULES = {
  maxAdvanceDays: 7,
  slotMinutes: 30,
  singles: { durations: [2, 3] as const, maxParticipants: 1 },
  doubles: { durations: [2, 3, 4] as const, maxParticipants: 3 },
} as const;

export const CLUB_LOCATION = {
  lat: 44.0167,
  lon: -80.0667,
  name: 'Mono, Ontario',
} as const;
