import { TIME_SLOTS, COURT_HOURS, FEES, BOOKING_RULES } from '../../lib/types';
import type { Booking, Court } from '../../lib/types';

export type ViewMode = 'week' | 'calendar';

// Subtle court accent colors
export const COURT_COLORS: Record<number, { bg: string; accent: string; dot: string }> = {
  1: { bg: 'rgba(107, 122, 61, 0.06)', accent: '#6b7a3d', dot: '#6b7a3d' },
  2: { bg: 'rgba(107, 122, 61, 0.06)', accent: '#6b7a3d', dot: '#8b9a5d' },
  3: { bg: 'rgba(180, 140, 80, 0.06)', accent: '#b48c50', dot: '#b48c50' },
  4: { bg: 'rgba(180, 140, 80, 0.06)', accent: '#b48c50', dot: '#c4a060' },
};

/** Compute end time for a given start slot + duration in slots */
export function getTimeRange(time: string, durationSlots: number = 1): string {
  const idx = TIME_SLOTS.indexOf(time as typeof TIME_SLOTS[number]);
  const endIdx = idx + durationSlots;
  if (idx >= 0 && endIdx < TIME_SLOTS.length) {
    return `${time} – ${TIME_SLOTS[endIdx]}`;
  }
  if (idx >= 0 && endIdx >= TIME_SLOTS.length) {
    // Last slot — compute manually
    const match = TIME_SLOTS[TIME_SLOTS.length - 1].match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const pm = match[3].toUpperCase() === 'PM';
      if (pm && h !== 12) h += 12;
      if (!pm && h === 12) h = 0;
      const endMin = (h * 60 + m) + BOOKING_RULES.slotMinutes;
      const eh = Math.floor(endMin / 60);
      const em = endMin % 60;
      const eAmPm = eh >= 12 ? 'PM' : 'AM';
      const eH12 = eh > 12 ? eh - 12 : eh === 0 ? 12 : eh;
      return `${time} – ${eH12}:${em.toString().padStart(2, '0')} ${eAmPm}`;
    }
  }
  return time;
}

/** Format duration slots as human-readable string */
export function formatDuration(slots: number): string {
  const hours = (slots * BOOKING_RULES.slotMinutes) / 60;
  if (hours === 1) return '1 hour';
  if (hours === 1.5) return '1.5 hours';
  if (hours === 2) return '2 hours';
  return `${hours} hours`;
}

/** Parse time string into 24h hour number */
export function parseTimeHour(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hour = parseInt(match[1]);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour;
}

/** Parse time string into total minutes from midnight */
export function parseTimeMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hour = parseInt(match[1]);
  const min = parseInt(match[2]);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour * 60 + min;
}

/** Check if a slot is covered by any confirmed booking (including multi-slot bookings) */
export function isSlotBooked(bookings: Booking[], courtId: number, date: string, time: string) {
  const tIdx = TIME_SLOTS.indexOf(time as typeof TIME_SLOTS[number]);
  return bookings.find(b => {
    if (b.courtId !== courtId || b.date !== date || b.status !== 'confirmed') return false;
    const bIdx = TIME_SLOTS.indexOf(b.time as typeof TIME_SLOTS[number]);
    if (bIdx < 0) return false;
    const dur = b.duration || 1;
    return tIdx >= bIdx && tIdx < bIdx + dur;
  });
}

/** Check if a slot is my booking (including multi-slot bookings) */
export function isSlotMine(bookings: Booking[], courtId: number, date: string, time: string, userId?: string) {
  const tIdx = TIME_SLOTS.indexOf(time as typeof TIME_SLOTS[number]);
  return bookings.find(b => {
    if (b.courtId !== courtId || b.date !== date || b.status !== 'confirmed' || b.userId !== userId) return false;
    const bIdx = TIME_SLOTS.indexOf(b.time as typeof TIME_SLOTS[number]);
    if (bIdx < 0) return false;
    const dur = b.duration || 1;
    return tIdx >= bIdx && tIdx < bIdx + dur;
  });
}

/** Check if all consecutive slots needed for a booking are available */
export function areSlotsAvailable(bookings: Booking[], courtId: number, date: string, time: string, durationSlots: number): boolean {
  const startIdx = TIME_SLOTS.indexOf(time as typeof TIME_SLOTS[number]);
  if (startIdx < 0) return false;
  for (let i = 0; i < durationSlots; i++) {
    const slotIdx = startIdx + i;
    if (slotIdx >= TIME_SLOTS.length) return false;
    const slotTime = TIME_SLOTS[slotIdx];
    if (isSlotBooked(bookings, courtId, date, slotTime)) return false;
    if (isSlotPast(date, slotTime)) return false;
    if (isCourtClosed(courtId, slotTime)) return false;
  }
  return true;
}

/** Check if a date is within the advance booking window */
export function canBookDate(date: string): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const bookDate = new Date(date + 'T00:00:00');
  if (bookDate < now) return false;
  const maxAdvance = new Date(now);
  maxAdvance.setDate(maxAdvance.getDate() + BOOKING_RULES.maxAdvanceDays);
  return bookDate <= maxAdvance;
}

export function isSlotPast(date: string, time: string): boolean {
  const now = new Date();
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  const slotDate = new Date(date + 'T00:00:00');
  slotDate.setHours(hour, minute, 0, 0);
  return slotDate < now;
}

export function isCourtClosed(courtId: number, time: string): boolean {
  const closeHour = parseInt(COURT_HOURS[courtId]?.close || '22');
  return parseTimeHour(time) >= closeHour;
}

export function isCourtInMaintenance(courts: Court[], courtId: number): boolean {
  const court = courts.find(c => c.id === courtId);
  return court?.status === 'maintenance';
}

export function canCancel(date: string, time: string): boolean {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return true;
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  const slotDate = new Date(date + 'T00:00:00');
  slotDate.setHours(hour, minute, 0, 0);
  const hoursUntil = (slotDate.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= FEES.cancelWindowHours;
}

export function formatDateShort(d: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { day: days[d.getDay()], date: d.getDate() };
}

export function isToday(d: Date): boolean {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/** Format a Date as YYYY-MM-DD in LOCAL time (avoids UTC offset bugs from toISOString). */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
