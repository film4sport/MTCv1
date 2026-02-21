'use client';

import { useState, useEffect, useRef } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const specialEvents = [
  { date: '2026-05-09', title: 'Opening Day BBQ & Meet the Pros', time: '1:00 - 3:00 PM', type: 'special' },
  { date: '2026-07-26', title: '95+ Mixed Doubles Tournament (Day 1)', time: 'All Day', type: 'tournament' },
  { date: '2026-07-27', title: '95+ Mixed Doubles Tournament (Day 2)', time: 'All Day', type: 'tournament' },
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

function getEventsForDate(year: number, month: number, day: number): CalEvent[] {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  const events: CalEvent[] = [];

  specialEvents.forEach((e) => {
    if (e.date === dateStr) events.push(e);
  });

  recurringEvents.forEach((e) => {
    if (e.day === dayOfWeek) events.push(e);
  });

  return events;
}

const dotColors: Record<string, string> = {
  social: '#6b7a3d',
  match: '#d97706',
  tournament: '#dc2626',
  camp: '#2563eb',
  special: '#d4e157',
};

const bgColors: Record<string, string> = {
  social: 'rgba(107,122,61,0.15)',
  match: 'rgba(217,119,6,0.15)',
  tournament: 'rgba(220,38,38,0.15)',
  camp: 'rgba(37,99,235,0.15)',
  special: 'rgba(212,225,87,0.15)',
};

export default function Schedule() {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
              <span className="text-xs capitalize" style={{ color: 'rgba(232,228,217,0.5)' }}>{type}</span>
            </div>
          ))}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6 fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-[rgba(232,228,217,0.08)]"
              style={{ borderColor: 'rgba(232, 228, 217, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#e8e4d9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-bold text-xl" style={{ color: '#e8e4d9' }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-[rgba(232,228,217,0.08)]"
              style={{ borderColor: 'rgba(232, 228, 217, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#e8e4d9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[rgba(232,228,217,0.08)]"
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

              // Deduplicate dots by event type so e.g. camp doesn't show 3 dots for 3 overlapping events
              const uniqueTypes = Array.from(new Set(events.map(e => e.type)));

              return (
                <div
                  key={day}
                  className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="cal-day-num">{day}</div>
                  {events.length > 0 && (
                    <>
                      <div>
                        {uniqueTypes.slice(0, 3).map((type) => (
                          <span key={type} className={`cal-dot ${type}`} />
                        ))}
                      </div>
                      <span className={`cal-event-label ${events[0].type}`}>
                        {events.length > 1 ? `${events[0].title} +${events.length - 1}` : events[0].title}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        {selectedDay && selectedEvents.length > 0 && (
          <div className="mt-6 fade-in">
            <div
              className="rounded-xl p-6"
              style={{ background: 'rgba(232, 228, 217, 0.06)', border: '1px solid rgba(232, 228, 217, 0.1)' }}
            >
              <h4 className="font-bold text-lg mb-4" style={{ color: '#e8e4d9' }}>
                {MONTH_NAMES[calMonth]} {selectedDay}, {calYear}
              </h4>
              <div className="space-y-3">
                {selectedEvents.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-lg"
                    style={{
                      background: bgColors[e.type] || 'rgba(232,228,217,0.06)',
                      border: '1px solid rgba(232,228,217,0.08)',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColors[e.type] || '#6b7280' }}
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
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80 flex-shrink-0"
                      style={{ background: 'rgba(212,225,87,0.15)', color: '#d4e157', border: '1px solid rgba(212,225,87,0.3)' }}
                    >
                      RSVP →
                    </a>
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
