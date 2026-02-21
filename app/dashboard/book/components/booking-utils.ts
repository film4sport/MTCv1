import { TIME_SLOTS, COURT_HOURS, FEES } from '../../lib/types';
import type { Booking, Court } from '../../lib/types';

export type ViewMode = 'week' | 'calendar';

// Subtle court accent colors
export const COURT_COLORS: Record<number, { bg: string; accent: string; dot: string }> = {
  1: { bg: 'rgba(107, 122, 61, 0.06)', accent: '#6b7a3d', dot: '#6b7a3d' },
  2: { bg: 'rgba(107, 122, 61, 0.06)', accent: '#6b7a3d', dot: '#8b9a5d' },
  3: { bg: 'rgba(180, 140, 80, 0.06)', accent: '#b48c50', dot: '#b48c50' },
  4: { bg: 'rgba(180, 140, 80, 0.06)', accent: '#b48c50', dot: '#c4a060' },
};

/** Compute end time for a given slot (next slot or +1 hour) */
export function getTimeRange(time: string): string {
  const idx = TIME_SLOTS.indexOf(time as typeof TIME_SLOTS[number]);
  if (idx >= 0 && idx < TIME_SLOTS.length - 1) {
    return `${time} – ${TIME_SLOTS[idx + 1]}`;
  }
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time;
  let hour = parseInt(match[1]);
  const min = match[2];
  const ampm = match[3].toUpperCase();
  hour += 1;
  let newAmpm = ampm;
  if (hour === 12 && ampm === 'AM') newAmpm = 'PM';
  if (hour === 13) { hour = 1; if (ampm === 'PM') newAmpm = 'PM'; }
  if (hour > 12) hour -= 12;
  return `${time} – ${hour}:${min} ${newAmpm}`;
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

export function isSlotBooked(bookings: Booking[], courtId: number, date: string, time: string) {
  return bookings.find(b => b.courtId === courtId && b.date === date && b.time === time && b.status === 'confirmed');
}

export function isSlotMine(bookings: Booking[], courtId: number, date: string, time: string, userId?: string) {
  return bookings.find(b => b.courtId === courtId && b.date === date && b.time === time && b.status === 'confirmed' && b.userId === userId);
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
