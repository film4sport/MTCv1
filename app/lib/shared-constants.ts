import { PAYMENT_EMAIL } from './site';

/**
 * shared-constants.ts
 *
 * Single source of truth for validation rules, limits, and enums
 * used across Dashboard (React), Mobile PWA (vanilla JS), and API routes.
 *
 * - API routes import directly
 * - Dashboard imports directly
 * - Mobile PWA: values are duplicated in JS but this file is the canonical reference.
 *   When updating a value here, grep public/mobile-app/ for the old value and update there too.
 */

// ============================================
// FIELD LENGTH LIMITS
// ============================================
export const LIMITS = {
  /** Max characters for a chat message */
  MESSAGE_TEXT: 2000,
  /** Max characters for message preview (in notifications, etc.) */
  MESSAGE_PREVIEW: 100,
  /** Max characters for partner request message */
  PARTNER_MESSAGE: 500,
  /** Max characters for partner availability */
  PARTNER_AVAILABILITY: 200,
  /** Max characters for guest name */
  GUEST_NAME: 100,
  /** Max characters for announcement body */
  ANNOUNCEMENT_BODY: 2000,
  /** Max characters for event description */
  EVENT_DESCRIPTION: 2000,
  /** Max characters for general sanitized input */
  DEFAULT_INPUT: 500,
  /** Max characters for short labels (price, badge, etc.) */
  SHORT_LABEL: 50,
  /** Max booking participants (excluding the booker) */
  MAX_PARTICIPANTS: 3,
  /** Max notifications fetched */
  MAX_NOTIFICATIONS: 100,
  /** Max conversations fetched */
  MAX_CONVERSATIONS: 20,
  /** Booking duration options (in 30-min slots) */
  DURATION_SLOTS: [2, 3, 4] as const, // 1h, 1.5h, 2h
  /** Max name length */
  NAME: 100,
  /** Max email length (RFC 5321) */
  EMAIL: 254,
} as const;

// ============================================
// VALID ENUM VALUES
// ============================================
export const VALID_STATUSES = ['active', 'paused', 'inactive'] as const;
export const VALID_MEMBERSHIP_TYPES = ['adult', 'family', 'junior'] as const;
export const VALID_SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'competitive'] as const;
export const VALID_MATCH_TYPES = ['singles', 'doubles', 'any'] as const;
export const VALID_EXTENDED_MATCH_TYPES = ['singles', 'doubles', 'mixed', 'any'] as const;
export const VALID_EVENT_TYPES = ['clinic', 'tournament', 'social', 'roundrobin', 'camp', 'interclub'] as const;
export const VALID_ANNOUNCEMENT_TYPES = ['info', 'warning', 'urgent'] as const;
export const VALID_COURT_STATUSES = ['available', 'maintenance'] as const;
export const VALID_BLOCK_REASONS = ['Maintenance', 'Tournament', 'Weather', 'Private Event', 'Club Event', 'Coaching Session', 'Other'] as const;
export const VALID_AUDIENCES = ['all', 'interclub_a', 'interclub_b', 'interclub_all'] as const;
export const VALID_FAMILY_TYPES = ['adult', 'junior'] as const;
export const VALID_INTERCLUB_TEAMS = ['none', 'a', 'b'] as const;
export const VALID_BOOKING_MATCH_TYPES = ['singles', 'doubles'] as const;
export const SETTINGS_KEY_WHITELIST = [
  'gate_code', 'etransfer_email', 'etransfer_auto_deposit', 'etransfer_message',
  'club_name', 'club_phone', 'club_email', 'season_start', 'season_end',
] as const;

// ============================================
// BOOKING RULES
// ============================================
export const BOOKING_RULES = {
  /** Hours before a booking that cancellation is free */
  CANCEL_HOURS: 24,
  /** Guest fee in dollars */
  GUEST_FEE: 10,
  /** E-transfer email for guest fees */
  GUEST_FEE_EMAIL: PAYMENT_EMAIL,
  /** Max days in advance a member can book */
  MAX_ADVANCE_DAYS: 14,
  /** Number of courts */
  COURT_COUNT: 4,
  /** First bookable time slot (hour, 24h format) */
  FIRST_SLOT_HOUR: 7,
  /** Last bookable time slot (hour, 24h format) */
  LAST_SLOT_HOUR: 21,
  /** Slot duration in minutes */
  SLOT_DURATION_MINUTES: 30,
} as const;

// ============================================
// NOTIFICATION TYPES
// ============================================
export const NOTIFICATION_TYPES = ['booking', 'message', 'partner', 'event', 'program', 'info', 'announcement'] as const;

// ============================================
// VALIDATION HELPERS (isomorphic — no Next.js dependency)
// ============================================

/** Validate UUID v4 format */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** Validate a value is one of the allowed enum values */
export function isValidEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

/** Validate ISO date format (YYYY-MM-DD) and reasonable range */
export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return false;
  const year = d.getUTCFullYear();
  return year >= 2020 && year <= 2040;
}

/** Validate a number is within bounds */
export function isInRange(num: number, min: number, max: number): boolean {
  return Number.isFinite(num) && num >= min && num <= max;
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= LIMITS.EMAIL;
}

/** Validate time format (12h: "9:30 AM" or 24h: "09:30") */
export function isValidTime(time: string): boolean {
  return /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time) || /^\d{2}:\d{2}$/.test(time);
}

/** Sanitize user input — strips HTML tags and dangerous characters, trims, limits length */
export function sanitizeInput(str: string, maxLength: number = LIMITS.DEFAULT_INPUT): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '').trim().slice(0, maxLength);
}
