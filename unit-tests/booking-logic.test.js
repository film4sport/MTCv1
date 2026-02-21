import { describe, it, expect } from 'vitest';
import {
  getTimeRange,
  parseTimeHour,
  isSlotBooked,
  isSlotMine,
  isCourtClosed,
  isCourtInMaintenance,
  formatDateShort,
} from '../app/dashboard/book/components/booking-utils';

describe('Booking Logic — getTimeRange', () => {
  it('returns range between consecutive time slots', () => {
    const range = getTimeRange('10:00 AM');
    expect(range).toContain('10:00 AM');
    expect(range).toContain('–');
  });

  it('returns original time if not in TIME_SLOTS', () => {
    expect(getTimeRange('3:15 XM')).toBe('3:15 XM');
  });

  it('handles last time slot gracefully', () => {
    const range = getTimeRange('10:00 PM');
    expect(range).toContain('10:00 PM');
  });
});

describe('Booking Logic — parseTimeHour', () => {
  it('parses 9:30 AM as hour 9', () => {
    expect(parseTimeHour('9:30 AM')).toBe(9);
  });

  it('parses 12:00 PM as hour 12', () => {
    expect(parseTimeHour('12:00 PM')).toBe(12);
  });

  it('parses 12:00 AM as hour 0 (midnight)', () => {
    expect(parseTimeHour('12:00 AM')).toBe(0);
  });

  it('parses 3:00 PM as hour 15', () => {
    expect(parseTimeHour('3:00 PM')).toBe(15);
  });

  it('parses 10:00 PM as hour 22', () => {
    expect(parseTimeHour('10:00 PM')).toBe(22);
  });

  it('returns 0 for invalid format', () => {
    expect(parseTimeHour('invalid')).toBe(0);
    expect(parseTimeHour('')).toBe(0);
  });
});

describe('Booking Logic — isSlotBooked', () => {
  const bookings = [
    { courtId: 1, date: '2026-06-15', time: '10:00 AM', status: 'confirmed', id: 'b1', userId: 'u1', userName: 'Test', courtName: 'Court 1', type: 'regular' },
    { courtId: 1, date: '2026-06-15', time: '11:00 AM', status: 'cancelled', id: 'b2', userId: 'u2', userName: 'Test2', courtName: 'Court 1', type: 'regular' },
    { courtId: 2, date: '2026-06-15', time: '10:00 AM', status: 'confirmed', id: 'b3', userId: 'u3', userName: 'Test3', courtName: 'Court 2', type: 'regular' },
  ];

  it('finds a confirmed booking', () => {
    expect(isSlotBooked(bookings, 1, '2026-06-15', '10:00 AM')).toBeTruthy();
  });

  it('ignores cancelled bookings', () => {
    expect(isSlotBooked(bookings, 1, '2026-06-15', '11:00 AM')).toBeFalsy();
  });

  it('does not match different court', () => {
    expect(isSlotBooked(bookings, 3, '2026-06-15', '10:00 AM')).toBeFalsy();
  });

  it('does not match different date', () => {
    expect(isSlotBooked(bookings, 1, '2026-06-16', '10:00 AM')).toBeFalsy();
  });

  it('returns undefined for empty bookings', () => {
    expect(isSlotBooked([], 1, '2026-06-15', '10:00 AM')).toBeFalsy();
  });
});

describe('Booking Logic — isSlotMine', () => {
  const bookings = [
    { courtId: 1, date: '2026-06-15', time: '10:00 AM', status: 'confirmed', id: 'b1', userId: 'user-1', userName: 'Me', courtName: 'Court 1', type: 'regular' },
  ];

  it('returns the booking when userId matches', () => {
    expect(isSlotMine(bookings, 1, '2026-06-15', '10:00 AM', 'user-1')).toBeTruthy();
  });

  it('returns falsy when userId does not match', () => {
    expect(isSlotMine(bookings, 1, '2026-06-15', '10:00 AM', 'user-2')).toBeFalsy();
  });
});

describe('Booking Logic — isCourtClosed', () => {
  it('courts 3 & 4 close at 8 PM (20:00)', () => {
    expect(isCourtClosed(3, '8:00 PM')).toBe(true);
    expect(isCourtClosed(3, '7:00 PM')).toBe(false);
    expect(isCourtClosed(4, '9:00 PM')).toBe(true);
  });

  it('courts 1 & 2 close at 10 PM (22:00)', () => {
    expect(isCourtClosed(1, '10:00 PM')).toBe(true);
    expect(isCourtClosed(1, '9:00 PM')).toBe(false);
    expect(isCourtClosed(2, '10:00 PM')).toBe(true);
  });
});

describe('Booking Logic — isCourtInMaintenance', () => {
  const courts = [
    { id: 1, name: 'Court 1', status: 'available' },
    { id: 2, name: 'Court 2', status: 'maintenance' },
  ];

  it('returns true for maintenance court', () => {
    expect(isCourtInMaintenance(courts, 2)).toBe(true);
  });

  it('returns false for available court', () => {
    expect(isCourtInMaintenance(courts, 1)).toBe(false);
  });

  it('returns false for unknown court', () => {
    expect(isCourtInMaintenance(courts, 99)).toBe(false);
  });
});

describe('Booking Logic — formatDateShort', () => {
  it('formats a Sunday correctly', () => {
    const d = new Date('2026-06-14T12:00:00'); // Sunday
    expect(formatDateShort(d)).toEqual({ day: 'Sun', date: 14 });
  });

  it('formats a Wednesday correctly', () => {
    const d = new Date('2026-06-17T12:00:00'); // Wednesday
    expect(formatDateShort(d)).toEqual({ day: 'Wed', date: 17 });
  });
});
