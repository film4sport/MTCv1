'use client';

import { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import Link from 'next/link';

export default function SchedulePage() {
  const { currentUser, bookings, events, cancelBooking, showToast, programs } = useApp();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(() => new Date());

  const myBookings = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const myEvents = events
    .filter(e => e.attendees.includes(currentUser?.name || ''))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Programs the current user is enrolled in
  const myPrograms = programs.filter(p =>
    p.status === 'active' && p.enrolledMembers.includes(currentUser?.id || '')
  );

  // Combine bookings, events, and program sessions into a unified list
  const allItems = useMemo(() => {
    const items: { id: string; type: 'booking' | 'event' | 'program'; date: string; time: string; title: string; subtitle: string; extra?: string }[] = [];
    myBookings.forEach(b => {
      const extras: string[] = [];
      if (b.guestName) extras.push(`Guest: ${b.guestName}`);
      if (b.participants && b.participants.length > 0) extras.push(`With: ${b.participants.map(p => p.name).join(', ')}`);
      items.push({
        id: b.id, type: 'booking', date: b.date, time: b.time,
        title: b.courtName, subtitle: b.time,
        extra: extras.length > 0 ? extras.join(' • ') : undefined,
      });
    });
    myEvents.forEach(e => items.push({
      id: e.id, type: 'event', date: e.date, time: e.time,
      title: e.title, subtitle: `${e.time} • ${e.location}`,
    }));
    myPrograms.forEach(p => {
      p.sessions.forEach((s, i) => items.push({
        id: `${p.id}-${i}`, type: 'program', date: s.date, time: s.time,
        title: p.title, subtitle: `${s.time} • ${p.courtName}`,
        extra: `Coach: ${p.coachName}`,
      }));
    });
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [myBookings, myEvents, myPrograms]);

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Group items by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof allItems>();
    allItems.forEach(item => {
      const existing = map.get(item.date) || [];
      existing.push(item);
      map.set(item.date, existing);
    });
    return Array.from(map.entries());
  }, [allItems]);

  // Calendar
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  }, [calMonth]);

  const dateHasItems = (d: Date) => {
    const dateStr = d.toISOString().split('T')[0];
    return {
      booking: myBookings.some(b => b.date === dateStr),
      event: myEvents.some(e => e.date === dateStr),
      program: myPrograms.some(p => p.sessions.some(s => s.date === dateStr)),
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="My Schedule" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-slideUp">

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: view === 'list' ? '#6b7a3d' : '#fff', color: view === 'list' ? '#fff' : '#2a2f1e', border: view === 'list' ? 'none' : '1px solid #e0dcd3' }}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: view === 'calendar' ? '#6b7a3d' : '#fff', color: view === 'calendar' ? '#fff' : '#2a2f1e', border: view === 'calendar' ? 'none' : '1px solid #e0dcd3' }}
          >
            Calendar
          </button>
        </div>

        {view === 'list' ? (
          <div>
            {grouped.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border animate-scaleIn" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                  <svg className="w-8 h-8" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <p className="font-medium text-sm mb-1" style={{ color: '#2a2f1e' }}>Your schedule is clear!</p>
                <p className="text-xs mb-4" style={{ color: '#6b7266' }}>Book a court or RSVP to an event to get started</p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/dashboard/book" className="px-4 py-2 rounded-xl text-sm font-medium text-white btn-press" style={{ background: '#6b7a3d' }}>Book a Court</Link>
                  <Link href="/dashboard/events" className="px-4 py-2 rounded-xl text-sm font-medium btn-press" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>Browse Events</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([date, items]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: '#6b7a3d' }}>{formatDate(date)}</h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.type === 'booking' ? 'rgba(107, 122, 61, 0.1)' : item.type === 'program' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(212, 225, 87, 0.2)' }}>
                            <svg className="w-5 h-5" fill="none" stroke={item.type === 'booking' ? '#6b7a3d' : item.type === 'program' ? '#d97706' : '#8b8f24'} viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d={item.type === 'booking' ? 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' : item.type === 'program' ? 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' : 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{item.title}</p>
                            <p className="text-xs" style={{ color: '#6b7266' }}>{item.subtitle}</p>
                            {item.extra && <p className="text-xs mt-0.5" style={{ color: '#d97706' }}>{item.extra}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: item.type === 'booking' ? 'rgba(107, 122, 61, 0.1)' : item.type === 'program' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(212, 225, 87, 0.15)', color: item.type === 'booking' ? '#6b7a3d' : item.type === 'program' ? '#d97706' : '#8b8f24' }}>
                              {item.type === 'booking' ? 'Court' : item.type === 'program' ? 'Program' : 'Event'}
                            </span>
                            {item.type === 'booking' && (
                              <button
                                onClick={() => { cancelBooking(item.id); showToast('Booking cancelled'); }}
                                className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                style={{ color: '#ef4444' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Calendar */
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e0dcd3' }}>
                <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span className="font-semibold" style={{ color: '#2a2f1e' }}>{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e0dcd3' }}>
                <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium py-2" style={{ color: '#6b7266' }}>{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const today = isToday(day);
                const items = dateHasItems(day);
                return (
                  <div key={day.toISOString()} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5" style={{ background: today ? 'rgba(107, 122, 61, 0.08)' : 'transparent' }}>
                    <span className="text-sm font-medium" style={{ color: today ? '#6b7a3d' : '#2a2f1e' }}>{day.getDate()}</span>
                    <div className="flex gap-0.5">
                      {items.booking && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b7a3d' }} />}
                      {items.event && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4e157' }} />}
                      {items.program && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t text-xs" style={{ borderColor: '#f0ede6', color: '#6b7266' }}>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#6b7a3d' }} /> Booking</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#d4e157' }} /> Event</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> Program</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
