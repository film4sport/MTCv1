import { describe, it, expect } from 'vitest';
import { generateICS } from '../app/dashboard/lib/calendar';

describe('Calendar — generateICS', () => {
  it('produces valid ICS with BEGIN/END VCALENDAR', () => {
    const ics = generateICS([{
      title: 'Tennis Match',
      date: '2026-06-15',
      time: '10:00 AM',
    }]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Mono Tennis Club//MTC//EN');
  });

  it('contains a VEVENT block for each event', () => {
    const ics = generateICS([{
      title: 'Match 1',
      date: '2026-06-15',
      time: '10:00 AM',
    }]);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('SUMMARY:Match 1');
  });

  it('generates multiple VEVENT blocks for multiple events', () => {
    const ics = generateICS([
      { title: 'Match 1', date: '2026-06-15', time: '10:00 AM' },
      { title: 'Match 2', date: '2026-06-16', time: '2:00 PM' },
    ]);
    const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(veventCount).toBe(2);
    expect(ics).toContain('SUMMARY:Match 1');
    expect(ics).toContain('SUMMARY:Match 2');
  });

  it('parses AM time correctly', () => {
    const ics = generateICS([{
      title: 'Morning',
      date: '2026-03-10',
      time: '9:30 AM',
      duration: 60,
    }]);
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260310T093000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260310T103000');
  });

  it('parses PM time correctly', () => {
    const ics = generateICS([{
      title: 'Afternoon',
      date: '2026-07-20',
      time: '3:00 PM',
      duration: 60,
    }]);
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260720T150000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260720T160000');
  });

  it('handles 12:00 PM (noon) correctly', () => {
    const ics = generateICS([{
      title: 'Noon Game',
      date: '2026-01-01',
      time: '12:00 PM',
      duration: 60,
    }]);
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260101T120000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260101T130000');
  });

  it('handles 12:00 AM (midnight) correctly', () => {
    const ics = generateICS([{
      title: 'Midnight',
      date: '2026-01-01',
      time: '12:00 AM',
      duration: 60,
    }]);
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260101T000000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260101T010000');
  });

  it('defaults duration to 60 minutes when not specified', () => {
    const ics = generateICS([{
      title: 'Default Duration',
      date: '2026-05-01',
      time: '2:00 PM',
    }]);
    // 2:00 PM = 14:00, +60 min = 15:00
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260501T140000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260501T150000');
  });

  it('calculates custom duration correctly', () => {
    const ics = generateICS([{
      title: 'Long Match',
      date: '2026-05-01',
      time: '9:00 AM',
      duration: 90,
    }]);
    // 9:00 AM + 90 min = 10:30 AM
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20260501T090000');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20260501T103000');
  });

  it('includes location when provided', () => {
    const ics = generateICS([{
      title: 'Match',
      date: '2026-05-01',
      time: '10:00 AM',
      location: 'Court 1 — Mono Tennis Club',
    }]);
    expect(ics).toContain('LOCATION:Court 1 — Mono Tennis Club');
  });

  it('excludes location when not provided', () => {
    const ics = generateICS([{
      title: 'Match',
      date: '2026-05-01',
      time: '10:00 AM',
    }]);
    expect(ics).not.toContain('LOCATION:');
  });

  it('includes description when provided', () => {
    const ics = generateICS([{
      title: 'Match',
      date: '2026-05-01',
      time: '10:00 AM',
      description: 'Coach: Mark Taylor',
    }]);
    expect(ics).toContain('DESCRIPTION:Coach: Mark Taylor');
  });

  it('contains unique UID for each event', () => {
    const ics = generateICS([
      { title: 'A', date: '2026-05-01', time: '10:00 AM' },
      { title: 'B', date: '2026-05-02', time: '11:00 AM' },
    ]);
    const uids = ics.match(/UID:(.+)/g);
    expect(uids).toHaveLength(2);
    expect(uids[0]).not.toBe(uids[1]);
  });

  it('includes timezone info', () => {
    const ics = generateICS([{
      title: 'Match',
      date: '2026-05-01',
      time: '10:00 AM',
    }]);
    expect(ics).toContain('X-WR-TIMEZONE:America/Toronto');
    expect(ics).toContain('TZID=America/Toronto');
  });

  it('zero-pads single-digit hours and minutes', () => {
    const ics = generateICS([{
      title: 'Early',
      date: '2026-01-05',
      time: '9:00 AM',
      duration: 60,
    }]);
    // Hour 9 should be 09
    expect(ics).toContain('T090000');
  });

  it('returns valid structure for empty events array', () => {
    const ics = generateICS([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
