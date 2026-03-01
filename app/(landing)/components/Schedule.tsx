'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const specialEvents = [
  { date: '2026-03-14', title: 'Euchre Tournament', time: 'Evening', type: 'social' },
  { date: '2026-05-09', title: 'Opening Day BBQ & Round Robin', time: '12:30 - 3:00 PM', type: 'special' },
  { date: '2026-06-07', title: 'French Open Round Robin Social', time: '1:00 - 4:00 PM', type: 'social' },
  { date: '2026-07-12', title: 'Wimbledon Open Round Robin', time: '1:00 - 4:00 PM', type: 'social' },
  { date: '2026-07-18', title: '95+ Mixed Doubles Tournament (Day 1)', time: 'All Day', type: 'tournament' },
  { date: '2026-07-19', title: '95+ Mixed Doubles Tournament (Day 2)', time: 'All Day', type: 'tournament' },
  { date: '2026-07-28', title: 'Summer Tennis Camp (Day 1)', time: '8:30 AM - 3:30 PM', type: 'camp' },
  { date: '2026-07-29', title: 'Summer Tennis Camp (Day 2)', time: '8:30 AM - 3:30 PM', type: 'camp' },
  { date: '2026-07-30', title: 'Summer Tennis Camp (Day 3)', time: '8:30 AM - 3:30 PM', type: 'camp' },
  { date: '2026-07-31', title: 'Summer Tennis Camp (Day 4)', time: '8:30 AM - 3:30 PM', type: 'camp' },
  { date: '2026-08-01', title: 'Summer Tennis Camp (Day 5)', time: '8:30 AM - 3:30 PM', type: 'camp' },
];

const recurringEvents = [
  { day: 2, title: "Men's Round Robin", time: '9:00 - 11:00 AM', type: 'social' },
  { day: 4, title: 'Freedom 55 League', time: 'Morning', type: 'social' },
  { day: 4, title: 'Interclub Competitive League (A & B)', time: '7:00 - 9:30 PM', type: 'match' },
  { day: 5, title: "Ladies Round Robin", time: '9:00 - 11:00 AM', type: 'social' },
  { day: 5, title: 'Friday Night Mixed Round Robin', time: '6:00 - 9:00 PM', type: 'social' },
];

interface CalEvent {
  title: string;
  time: string;
  type: string;
  date?: string;
  day?: number;
}

interface BookingSlot {
  court: string;
  time: string;
}

function getEventsForDate(year: number, month: number, day: number): CalEvent[] {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  const events: CalEvent[] = [];

  specialEvents.forEach((e) => {
    if (e.date === dateStr) events.push(e);
  });

  // Recurring events only during club season (May 9th – October)
  const openingDay = new Date(year, 4, 9); // May 9
  if (month >= 4 && month <= 9 && date >= openingDay) {
    recurringEvents.forEach((e) => {
      if (e.day === dayOfWeek) events.push(e);
    });
  }

  return events;
}

const dotColors: Record<string, string> = {
  social: '#6b7a3d',
  match: '#d97706',
  tournament: '#dc2626',
  camp: '#2563eb',
  special: '#d4e157',
  booking: '#8b95a5',
};

const bgColors: Record<string, string> = {
  social: 'rgba(107,122,61,0.15)',
  match: 'rgba(217,119,6,0.15)',
  tournament: 'rgba(220,38,38,0.15)',
  camp: 'rgba(37,99,235,0.15)',
  special: 'rgba(212,225,87,0.15)',
  booking: 'rgba(139,149,165,0.15)',
};

export default function Schedule() {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState<Record<string, BookingSlot[]>>({});
  const sectionRef = useRef<HTMLElement>(null);

  // Fetch live booking slots for current month
  const fetchBookings = useCallback(async (year: number, month: number) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/public-calendar?year=${year}&month=${month + 1}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setBookingData(data);
      }
      // Non-OK responses: calendar still shows events without booking data
    } catch {
      // Network error or timeout: calendar still shows events without booking data
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    fetchBookings(calYear, calMonth);
  }, [calYear, calMonth, fetchBookings]);

  const changeMonth = (delta: number) => {
    let newMonth = calMonth + delta;
    let newYear = calYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCalMonth(newMonth);
    setCalYear(newYear);
    setSelectedDay(null);
  };

  const goToToday = () => {
    const t = new Date();
    setCalYear(t.getFullYear());
    setCalMonth(t.getMonth());
    setSelectedDay(t.getDate());
  };

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const selectedEvents = selectedDay ? getEventsForDate(calYear, calMonth, selectedDay) : [];
  const selectedDateStr = selectedDay
    ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : '';
  const selectedSlots: BookingSlot[] = selectedDateStr ? (bookingData[selectedDateStr] || []) : [];

  return (
    <section id="schedule" className="py-20 lg:py-28" style={{ backgroundColor: '#22271a' }} ref={sectionRef}>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="text-center mb-12 fade-in">
          <span className="section-label section-label-light">// Schedule</span>
          <h2
            className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6"
            style={{ color: '#e8e4d9' }}
          >
            Club&apos;s Calendar
          </h2>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 fade-in">
          {Object.entries(dotColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span className="text-xs capitalize" style={{ color: 'rgba(232,228,217,0.5)' }}>
                {type === 'booking' ? 'court bookings' : type}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6 fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="cal-nav-btn w-10 h-10 rounded-full border flex items-center justify-center hover:bg-[rgba(232,228,217,0.08)]"
              style={{ borderColor: 'rgba(232, 228, 217, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#e8e4d9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-bold text-xl" style={{ color: '#e8e4d9' }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="cal-nav-btn w-10 h-10 rounded-full border flex items-center justify-center hover:bg-[rgba(232,228,217,0.08)]"
              style={{ borderColor: 'rgba(232, 228, 217, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#e8e4d9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            aria-label="Go to today"
            className="cal-nav-btn px-4 py-2 rounded-lg border text-sm font-medium hover:bg-[rgba(232,228,217,0.08)]"
            style={{ borderColor: 'rgba(232, 228, 217, 0.2)', color: '#e8e4d9' }}
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="fade-in">
          <div className="cal-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="cal-header">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="cal-day empty" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const events = getEventsForDate(calYear, calMonth, day);
              const isToday =
                today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
              const isSelected = selectedDay === day;

              // Check for bookings on this day
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySlots = bookingData[dateStr];
              const hasBookings = daySlots && daySlots.length > 0;

              // Deduplicate dots by event type
              const uniqueTypes = Array.from(new Set(events.map(e => e.type)));
              if (hasBookings) uniqueTypes.push('booking');

              const eventCount = events.length + (hasBookings ? 1 : 0);

              return (
                <div
                  key={day}
                  className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${MONTH_NAMES[calMonth]} ${day}, ${calYear}${eventCount > 0 ? `, ${eventCount} event${eventCount > 1 ? 's' : ''}` : ''}`}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDay(day)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDay(day); } }}
                >
                  <div className="cal-day-num">{day}</div>
                  {uniqueTypes.length > 0 && (
                    <>
                      <div>
                        {uniqueTypes.slice(0, 4).map((type) => (
                          <span key={type} className={`cal-dot ${type}`} />
                        ))}
                      </div>
                      {events.map((ev, idx) => (
                        <span key={idx} className={`cal-event-label ${ev.type}`}>
                          {ev.title}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Panel */}
        {selectedDay && (selectedEvents.length > 0 || selectedSlots.length > 0) && (
          <div className="mt-6 cal-detail-panel" key={`${calMonth}-${selectedDay}`}>
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(232, 228, 217, 0.05)',
                border: '1px solid rgba(232, 228, 217, 0.1)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <h4 className="font-bold text-lg mb-4" style={{ color: '#e8e4d9' }}>
                {MONTH_NAMES[calMonth]} {selectedDay}, {calYear}
                {selectedEvents.length > 0 && (
                  <span className="ml-3 text-xs font-normal px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,225,87,0.15)', color: '#d4e157' }}>
                    {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''}
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {/* Club events */}
                {selectedEvents.map((e, i) => (
                  <div
                    key={i}
                    className="cal-event-row flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: bgColors[e.type] || 'rgba(232,228,217,0.06)',
                      border: '1px solid rgba(232,228,217,0.08)',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColors[e.type] || '#6b7280', boxShadow: `0 0 8px ${dotColors[e.type] || '#6b7280'}80` }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#e8e4d9' }}>
                        {e.title}
                      </p>
                      <p className="text-sm" style={{ color: 'rgba(232,228,217,0.5)' }}>
                        {e.time}
                      </p>
                    </div>
                    <a
                      href="/login"
                      className="text-xs px-4 py-2 rounded-full font-semibold transition-all hover:scale-105 flex-shrink-0"
                      style={{ background: 'rgba(212,225,87,0.2)', color: '#d4e157', border: '1px solid rgba(212,225,87,0.3)', boxShadow: '0 0 12px rgba(212,225,87,0.1)' }}
                    >
                      RSVP →
                    </a>
                  </div>
                ))}

                {/* Court bookings — shown exactly like members see them */}
                {selectedSlots.map((slot, i) => (
                  <div
                    key={`booking-${i}`}
                    className="cal-event-row flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: bgColors.booking,
                      border: '1px solid rgba(232,228,217,0.08)',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColors.booking, boxShadow: `0 0 8px ${dotColors.booking}80` }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#e8e4d9' }}>
                        {slot.court}
                      </p>
                      <p className="text-sm" style={{ color: 'rgba(232,228,217,0.5)' }}>
                        {slot.time}
                      </p>
                    </div>
                    <span
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: 'rgba(139,149,165,0.2)', color: '#8b95a5' }}
                    >
                      Booked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
