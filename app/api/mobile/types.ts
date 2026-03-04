/**
 * Shared TypeScript interfaces for mobile API routes.
 *
 * These are DB-facing types (snake_case fields for Supabase writes).
 * For client-facing types (camelCase), see app/dashboard/lib/types.ts.
 *
 * Re-exports common types from dashboard so both sides share one source of truth
 * for enums, constants, and client-facing shapes.
 */

// ── Re-exports from dashboard types ──────────────────────
// Use these when building API responses that match the dashboard's expected shape
export type {
  User as DashboardUser,
  Booking as DashboardBooking,
  ClubEvent as DashboardEvent,
  Partner as DashboardPartner,
  Message as DashboardMessage,
  Conversation as DashboardConversation,
  SkillLevel,
} from '@/app/dashboard/lib/types';

// ── DB Update Types (snake_case for Supabase writes) ─────

export interface ProfileUpdate {
  name?: string;
  email?: string;
  status?: string;
  avatar?: string;
  ntrp?: number;
  skill_level?: string;
  skill_level_set?: boolean;
}

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

// ── API Request Payloads ─────────────────────────────────

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

// ── Settings ──────────────────────────────────────────────

export interface ClubSettings {
  [key: string]: string;
}
