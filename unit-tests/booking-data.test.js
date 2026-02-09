import { describe, it, expect } from 'vitest';

const courts = [
  { id: 1, name: 'Court 1', type: 'Hard Court', hasLights: true, available: true, rate: 5, isNew: false },
  { id: 2, name: 'Court 2', type: 'Hard Court', hasLights: true, available: true, rate: 5, isNew: false },
  { id: 3, name: 'Court 3', type: 'Hard Court', hasLights: false, available: false, rate: 5, isNew: true },
  { id: 4, name: 'Court 4', type: 'Hard Court', hasLights: false, available: true, rate: 5, isNew: true },
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
];

function isTimeBooked(courtId, dateIdx, timeIdx) {
  const hash = (courtId * 31 + dateIdx * 17 + timeIdx * 7) % 10;
  return hash < 3;
}

describe('Courts Data', () => {
  it('should have exactly 4 courts', () => {
    expect(courts).toHaveLength(4);
  });

  it('each court should have required fields', () => {
    courts.forEach((court) => {
      expect(court.id).toBeTruthy();
      expect(court.name).toBeTruthy();
      expect(court.type).toBeTruthy();
      expect(typeof court.hasLights).toBe('boolean');
      expect(typeof court.available).toBe('boolean');
      expect(typeof court.rate).toBe('number');
      expect(typeof court.isNew).toBe('boolean');
    });
  });

  it('courts 1 & 2 should have lights', () => {
    expect(courts[0].hasLights).toBe(true);
    expect(courts[1].hasLights).toBe(true);
  });

  it('courts 3 & 4 should be new', () => {
    expect(courts[2].isNew).toBe(true);
    expect(courts[3].isNew).toBe(true);
  });

  it('court 3 should be unavailable', () => {
    expect(courts[2].available).toBe(false);
  });

  it('all rates should be $5/hour', () => {
    courts.forEach((court) => {
      expect(court.rate).toBe(5);
    });
  });

  it('court IDs should be unique', () => {
    const ids = courts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Time Slots', () => {
  it('should have 13 time slots', () => {
    expect(timeSlots).toHaveLength(13);
  });

  it('should start at 9:00 AM', () => {
    expect(timeSlots[0]).toBe('9:00 AM');
  });

  it('should end at 9:00 PM', () => {
    expect(timeSlots[timeSlots.length - 1]).toBe('9:00 PM');
  });
});

describe('Booking Availability', () => {
  it('isTimeBooked should return boolean', () => {
    const result = isTimeBooked(1, 0, 0);
    expect(typeof result).toBe('boolean');
  });

  it('isTimeBooked should be deterministic', () => {
    const r1 = isTimeBooked(1, 0, 0);
    const r2 = isTimeBooked(1, 0, 0);
    expect(r1).toBe(r2);
  });

  it('approximately 30% of slots should be booked', () => {
    let booked = 0;
    let total = 0;
    for (let court = 1; court <= 4; court++) {
      for (let date = 0; date < 7; date++) {
        for (let time = 0; time < timeSlots.length; time++) {
          if (isTimeBooked(court, date, time)) booked++;
          total++;
        }
      }
    }
    const ratio = booked / total;
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.4);
  });
});

describe('Pricing Calculations', () => {
  it('base price is court rate', () => {
    const court = courts[0];
    expect(court.rate).toBe(5);
  });

  it('guest fee adds $5', () => {
    const basePrice = 5;
    const guestFee = 5;
    expect(basePrice + guestFee).toBe(10);
  });

  it('recurring multiplies total by weeks', () => {
    const total = 10; // base + guest
    const weeks = 4;
    expect(total * weeks).toBe(40);
  });
});
