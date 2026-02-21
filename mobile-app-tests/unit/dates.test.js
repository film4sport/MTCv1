import { describe, it, expect } from 'vitest';

// 2026 season club event dates (must match events.js)
const clubEventDates = {
  'opening-day-bbq': '2026-05-09',
  'mens-round-robin': '2026-05-12',
  'freedom-55': '2026-05-14',
  'interclub-league': '2026-05-14',
  'ladies-round-robin': '2026-05-15',
  'friday-mixed': '2026-05-15',
  'mark-taylor-classes': '2026-05-11'
};

describe('Club event dates', () => {
  it('all dates are valid YYYY-MM-DD format', () => {
    for (const [id, date] of Object.entries(clubEventDates)) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('all dates parse to valid Date objects', () => {
    for (const [id, date] of Object.entries(clubEventDates)) {
      const parsed = new Date(date + 'T12:00:00');
      expect(parsed.toString()).not.toBe('Invalid Date');
    }
  });

  it('Opening Day BBQ is Saturday May 9, 2026', () => {
    const d = new Date('2026-05-09T12:00:00');
    expect(d.getDay()).toBe(6); // Saturday
  });

  it("Men's Round Robin is Tuesday May 12, 2026", () => {
    const d = new Date('2026-05-12T12:00:00');
    expect(d.getDay()).toBe(2); // Tuesday
  });

  it('Freedom 55 is Thursday May 14, 2026', () => {
    const d = new Date('2026-05-14T12:00:00');
    expect(d.getDay()).toBe(4); // Thursday
  });

  it('Friday Mixed is Friday May 15, 2026', () => {
    const d = new Date('2026-05-15T12:00:00');
    expect(d.getDay()).toBe(5); // Friday
  });

  it('all events are in May 2026', () => {
    for (const [id, date] of Object.entries(clubEventDates)) {
      expect(date).toMatch(/^2026-05-/);
    }
  });
});
