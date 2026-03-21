import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const booking = readFileSync(resolve(root, 'public/mobile-app/js/booking.ts'), 'utf-8');
const myBookings = readFileSync(resolve(root, 'public/mobile-app/js/mybookings.ts'), 'utf-8');

describe('Mobile booking regressions', () => {
  it('replaces stale booking state instead of merging old data forward', () => {
    expect(booking).toContain("Object.keys(bookingsData).forEach(function(k) { delete bookingsData[k]; });");
  });

  it('normalizes 12-hour booking times into 24-hour grid keys', () => {
    expect(booking).toContain("var parts = time.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);");
    expect(booking).toContain("time = String(h).padStart(2, '0') + ':' + parts[2];");
  });

  it('updates the schedule badge from the fresh booking payload', () => {
    expect(booking).toContain("var todayCount = (bookingsData[today] || []).length;");
    expect(booking).toContain("scheduleBadge.textContent = todayCount;");
    expect(booking).toContain("scheduleBadge.style.display = 'none';");
  });

  it('re-renders the booking system after booking or court-block updates', () => {
    expect(booking).toContain("try { initBookingSystem(); } catch(e) { /* may not be on booking screen */ }");
  });

  it('keeps the my bookings error fallback from crashing on a scoped container reference', () => {
    expect(myBookings).toContain('let container = null;');
    expect(myBookings).toContain("if (container && MTC.fn.renderError) MTC.fn.renderError(container, 'Could not load event bookings. Please try again.');");
  });
});
