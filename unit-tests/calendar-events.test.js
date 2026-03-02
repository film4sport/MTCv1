import { describe, it, expect } from 'vitest';

const SEASON_START_MONTH = 4; // May
const SEASON_END_MONTH = 9; // October

const specialEvents = [
  { date: '2026-05-09', title: 'Opening Day BBQ & Meet the Pros', time: '1:00 - 3:00 PM', type: 'special' },
  { date: '2026-07-26', title: '95+ Mixed Doubles Tournament (Day 1)', time: 'All Day', type: 'tournament' },
  { date: '2026-07-27', title: '95+ Mixed Doubles Tournament (Day 2)', time: 'All Day', type: 'tournament' },
];

const recurringEvents = [
  { day: 2, title: "Men's Round Robin", time: '9:00 - 11:00 AM', type: 'social' },
  { day: 4, title: 'Freedom 55 League', time: 'Morning', type: 'social' },
  { day: 4, title: 'Interclub Competitive League (A & B)', time: '7:00 - 9:30 PM', type: 'match' },
  { day: 5, title: "Ladies Round Robin", time: '9:00 - 11:00 AM', type: 'social' },
  { day: 5, title: 'Friday Night Mixed Round Robin', time: '6:00 - 9:00 PM', type: 'social' },
];

function getEventsForDate(year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  const events = [];

  specialEvents.forEach((e) => {
    if (e.date === dateStr) events.push(e);
  });

  const openingDay = new Date(2026, 4, 9);
  if (month >= SEASON_START_MONTH && month <= SEASON_END_MONTH && date > openingDay) {
    recurringEvents.forEach((e) => {
      if (e.day === dayOfWeek) events.push(e);
    });
  }

  return events;
}

describe('Calendar Events', () => {
  it('should return Opening Day BBQ on May 9, 2026', () => {
    const events = getEventsForDate(2026, 4, 9); // May 9
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Opening Day BBQ & Meet the Pros');
    expect(events[0].type).toBe('special');
  });

  it('should return no events before Opening Day', () => {
    const events = getEventsForDate(2026, 4, 1); // May 1
    expect(events).toHaveLength(0);
  });

  it('should return recurring events after Opening Day during season', () => {
    // May 12, 2026 is a Tuesday (day 2) — after opening day
    const events = getEventsForDate(2026, 4, 12);
    const menRR = events.find((e) => e.title === "Men's Round Robin");
    expect(menRR).toBeTruthy();
  });

  it('should return no recurring events outside season', () => {
    // January 6, 2026 is a Tuesday — outside season
    const events = getEventsForDate(2026, 0, 6);
    expect(events).toHaveLength(0);
  });

  it('should return tournament events on correct dates', () => {
    const day1 = getEventsForDate(2026, 6, 26); // July 26
    const day2 = getEventsForDate(2026, 6, 27); // July 27
    expect(day1.some((e) => e.type === 'tournament')).toBe(true);
    expect(day2.some((e) => e.type === 'tournament')).toBe(true);
  });

  it('should not have camp events on calendar (dates TBC)', () => {
    for (let day = 28; day <= 31; day++) {
      const events = getEventsForDate(2026, 6, day); // July 28-31
      expect(events.some((e) => e.type === 'camp')).toBe(false);
    }
    const aug1 = getEventsForDate(2026, 7, 1); // Aug 1
    expect(aug1.some((e) => e.type === 'camp')).toBe(false);
  });

  it('special event dates should have correct format', () => {
    specialEvents.forEach((e) => {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('recurring events should have valid day-of-week', () => {
    recurringEvents.forEach((e) => {
      expect(e.day).toBeGreaterThanOrEqual(0);
      expect(e.day).toBeLessThanOrEqual(6);
    });
  });

  it('all events should have valid types', () => {
    const validTypes = ['social', 'match', 'tournament', 'camp', 'special'];
    [...specialEvents, ...recurringEvents].forEach((e) => {
      expect(validTypes).toContain(e.type);
    });
  });
});
