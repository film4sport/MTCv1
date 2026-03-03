/**
 * Shared TypeScript interfaces for mobile API routes.
 * Replaces ad-hoc Record<string, any> types with proper definitions.
 */

// ── Profile / Member ──────────────────────────────────
export interface ProfileUpdate {
  name?: string;
  email?: string;
  status?: string;
}

// ── Event ─────────────────────────────────────────────
export interface EventUpdate {
  title?: string;
  type?: string;
  date?: string;
  time?: string;
  location?: string;
  spots_total?: number;
  price?: string;
  badge?: string;
  description?: string;
}

// ── Booking ───────────────────────────────────────────
export interface BookingCreatePayload {
  courtId: number;
  date: string;
  time: string;
  matchType: 'singles' | 'doubles';
  duration: number;
  isGuest?: boolean;
  guestName?: string;
  participants?: string[];
  bookedFor?: string;
  userName?: string;
}

export interface BookingRules {
  maxAdvanceDays: number;
  slotMinutes: number;
  courtHoursClose: Record<number, number>;
  validCourts: number[];
  singles: { durations: number[]; maxParticipants: number };
  doubles: { durations: number[]; maxParticipants: number };
}

// ── Settings ──────────────────────────────────────────
export interface ClubSettings {
  [key: string]: string;
}

// ── Conversation / Message ────────────────────────────
export interface MessageResponse {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ConversationResponse {
  id: number;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastTimestamp: string;
  messages: MessageResponse[];
}
