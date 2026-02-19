import { describe, it, expect } from 'vitest';
import { COURTS_CONFIG, TIME_SLOTS, FEES, COURT_HOURS } from '../app/dashboard/lib/types';

describe('Courts Config', () => {
  it('should have exactly 4 courts', () => {
    expect(COURTS_CONFIG).toHaveLength(4);
  });

  it('each court should have required fields', () => {
    COURTS_CONFIG.forEach((court) => {
      expect(court.id).toBeTruthy();
      expect(court.name).toBeTruthy();
      expect(typeof court.floodlight).toBe('boolean');
    });
  });

  it('courts 1 & 2 should have floodlights', () => {
    expect(COURTS_CONFIG[0].floodlight).toBe(true);
    expect(COURTS_CONFIG[1].floodlight).toBe(true);
  });

  it('courts 3 & 4 should not have floodlights', () => {
    expect(COURTS_CONFIG[2].floodlight).toBe(false);
    expect(COURTS_CONFIG[3].floodlight).toBe(false);
  });

  it('court IDs should be unique', () => {
    const ids = COURTS_CONFIG.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Time Slots', () => {
  it('should have 14 time slots', () => {
    expect(TIME_SLOTS).toHaveLength(14);
  });

  it('should start at 9:30 AM', () => {
    expect(TIME_SLOTS[0]).toBe('9:30 AM');
  });

  it('should end at 9:00 PM', () => {
    expect(TIME_SLOTS[TIME_SLOTS.length - 1]).toBe('9:00 PM');
  });
});

describe('Court Hours', () => {
  it('courts 1 & 2 close at 22:00 (10 PM)', () => {
    expect(COURT_HOURS[1].close).toBe('22:00');
    expect(COURT_HOURS[2].close).toBe('22:00');
  });

  it('courts 3 & 4 close at 20:00 (8 PM)', () => {
    expect(COURT_HOURS[3].close).toBe('20:00');
    expect(COURT_HOURS[4].close).toBe('20:00');
  });
});

describe('Fees', () => {
  it('booking fee should be free ($0)', () => {
    expect(FEES.booking).toBe(0);
  });

  it('guest fee should be $10', () => {
    expect(FEES.guest).toBe(10);
  });

  it('tab warning threshold should be $20', () => {
    expect(FEES.tabWarning).toBe(20);
  });

  it('tab block threshold should be $30', () => {
    expect(FEES.tabBlock).toBe(30);
  });

  it('cancel window should be 24 hours', () => {
    expect(FEES.cancelWindowHours).toBe(24);
  });
});
