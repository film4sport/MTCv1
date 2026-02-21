'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import { downloadICS } from '../lib/calendar';

type EventFilter = 'all' | 'social' | 'match' | 'roundrobin' | 'lesson' | 'tournament';
type ViewMode = 'calendar' | 'list';
type PageView = 'events' | 'programs';

export default function EventsPage() {
  const { currentUser, events, toggleRsvp, showToast, programs, enrollInProgram, withdrawFromProgram, members } = useApp();
  const [pageView, setPageView] = useState<PageView>('events');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [enrollConfirm, setEnrollConfirm] = useState<string | null>(null);
  const [justEnrolled, setJustEnrolled] = useState<string | null>(null);

  const filtered = events
    .filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Events for calendar view filtered by selected day
  const dayFiltered = selectedDay
    ? filtered.filter(e => e.date === selectedDay)
    : filtered;

  const badgeColors: Record<string, { bg: string; color: string }> = {
    free: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' },
    members: { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' },
    paid: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
  };

  const typeLabels: Record<string, string> = {
    social: 'Social', match: 'Match', roundrobin: 'Round Robin', lesson: 'Lesson', tournament: 'Tournament',
  };

  const detail = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

  // Calendar helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get event dates for this month (for dots)
  const eventDatesThisMonth = new Set(
    filtered
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(e => new Date(e.date + 'T00:00:00').getDate())
  );

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(selectedDay === dateStr ? null : dateStr);
  };

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const eventsToShow = viewMode === 'calendar' ? dayFiltered : filtered;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Club Events" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-slideUp">

        {/* Events / Programs toggle */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
          <button
            onClick={() => setPageView('events')}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: pageView === 'events' ? '#6b7a3d' : 'transparent', color: pageView === 'events' ? '#fff' : '#6b7266' }}
          >
            Events
          </button>
          <button
            onClick={() => setPageView('programs')}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: pageView === 'programs' ? '#6b7a3d' : 'transparent', color: pageView === 'programs' ? '#fff' : '#6b7266' }}
          >
            Programs
          </button>
        </div>

        {pageView === 'events' && (<>

        {/* View Toggle + Filter pills */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
            <button
              onClick={() => setViewMode('calendar')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: viewMode === 'calendar' ? '#6b7a3d' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : '#6b7266',
              }}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Calendar
              </span>
            </button>
            <button
              onClick={() => { setViewMode('list'); setSelectedDay(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: viewMode === 'list' ? '#6b7a3d' : 'transparent',
                color: viewMode === 'list' ? '#fff' : '#6b7266',
              }}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                List
              </span>
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'social', 'roundrobin', 'match', 'tournament', 'lesson'] as EventFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: filter === f ? '#6b7a3d' : '#fff',
                color: filter === f ? '#fff' : '#2a2f1e',
                border: filter === f ? 'none' : '1px solid #e0dcd3',
              }}
            >
              {f === 'all' ? 'All Events' : typeLabels[f] || f}
            </button>
          ))}
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="rounded-2xl border p-5 mb-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{monthName}</h3>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[0.65rem] font-semibold py-1" style={{ color: '#6b7266' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = eventDatesThisMonth.has(day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className="relative flex flex-col items-center justify-center py-2 rounded-xl transition-all hover:bg-gray-50"
                    style={{
                      background: isSelected ? '#6b7a3d' : isToday ? '#f5f2eb' : 'transparent',
                      color: isSelected ? '#fff' : '#2a2f1e',
                    }}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {hasEvent && (
                      <span
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: isSelected ? '#fff' : '#d4e157' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day label */}
            {selectedDay && (
              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #f0ede6' }}>
                <p className="text-xs font-medium" style={{ color: '#6b7266' }}>
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' '}&bull; {dayFiltered.length} event{dayFiltered.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#6b7a3d' }}
                >
                  Show All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Event Cards */}
        {eventsToShow.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm" style={{ color: '#6b7266' }}>
              {selectedDay ? 'No events on this day' : 'No events found'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 stagger-children">
            {eventsToShow.map(ev => {
              const bc = badgeColors[ev.badge] || badgeColors['members'];
              const attending = ev.attendees.includes(currentUser?.name || '');
              const isPast = new Date(ev.date + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl border p-5 card-hover cursor-pointer"
                  style={{ background: '#fff', borderColor: '#e0dcd3', opacity: isPast ? 0.6 : 1 }}
                  onClick={() => setSelectedEvent(ev.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: '#f5f2eb' }}>
                        <span className="text-[0.6rem] font-semibold uppercase" style={{ color: '#6b7266' }}>
                          {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold leading-none" style={{ color: '#2a2f1e' }}>
                          {new Date(ev.date + 'T00:00:00').getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{ev.title}</p>
                        <p className="text-xs" style={{ color: '#6b7266' }}>{ev.time}</p>
                      </div>
                    </div>
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: bc.bg, color: bc.color }}>
                      {ev.price}
                    </span>
                  </div>

                  <p className="text-xs mb-3" style={{ color: '#6b7266' }}>{ev.location}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full" style={{ background: '#f5f2eb', color: '#6b7266' }}>
                      {typeLabels[ev.type] || ev.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isPast) {
                          toggleRsvp(ev.id, currentUser?.name || '');
                          showToast(attending ? 'RSVP cancelled' : `RSVP'd to ${ev.title}`);
                        }
                      }}
                      disabled={isPast}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        background: attending ? '#6b7a3d' : 'rgba(107, 122, 61, 0.1)',
                        color: attending ? '#fff' : '#6b7a3d',
                      }}
                    >
                      {attending ? 'Going' : 'RSVP'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>)}

        {/* Programs View */}
        {pageView === 'programs' && (
          <div className="space-y-4">
            {programs.filter(p => p.status === 'active').length === 0 ? (
              <div className="text-center py-12 rounded-2xl border" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <p className="text-sm" style={{ color: '#6b7266' }}>No programs available right now</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 stagger-children">
                {programs.filter(p => p.status === 'active').map(prog => {
                  const isEnrolled = prog.enrolledMembers.includes(currentUser?.id || '');
                  const spotsFull = prog.enrolledMembers.length >= prog.spotsTotal;
                  return (
                    <div
                      key={prog.id}
                      className="rounded-2xl border p-5 card-hover cursor-pointer"
                      style={{ background: '#fff', borderColor: '#e0dcd3' }}
                      onClick={() => setSelectedProgram(prog.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: prog.type === 'clinic' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                            <svg className="w-5 h-5" fill="none" stroke={prog.type === 'clinic' ? '#6b7a3d' : '#d97706'} viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{prog.title}</p>
                            <p className="text-xs" style={{ color: '#6b7266' }}>{prog.coachName}</p>
                          </div>
                        </div>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium shrink-0" style={{
                          background: prog.type === 'clinic' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: prog.type === 'clinic' ? '#6b7a3d' : '#d97706',
                        }}>
                          {prog.type === 'clinic' ? 'Clinic' : 'Camp'}
                        </span>
                      </div>

                      <p className="text-xs mb-3" style={{ color: '#6b7266' }}>
                        {prog.sessions.length} sessions &bull; {prog.courtName} &bull; ${prog.fee}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: spotsFull ? '#ef4444' : '#6b7266' }}>
                          {prog.spotsTotal - prog.enrolledMembers.length} spot{prog.spotsTotal - prog.enrolledMembers.length !== 1 ? 's' : ''} left
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEnrolled) {
                              withdrawFromProgram(prog.id, currentUser?.id || '');
                              showToast('Withdrawn from program');
                            } else if (!spotsFull) {
                              setEnrollConfirm(prog.id);
                            }
                          }}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: isEnrolled ? '#6b7a3d' : 'rgba(107, 122, 61, 0.1)',
                            color: isEnrolled ? '#fff' : '#6b7a3d',
                          }}
                        >
                          {isEnrolled ? 'Enrolled' : 'Enroll'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enrollment Confirmation Modal */}
      {enrollConfirm && (() => {
        const prog = programs.find(p => p.id === enrollConfirm);
        if (!prog) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => { setEnrollConfirm(null); setJustEnrolled(null); }}>
            <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
              {justEnrolled === enrollConfirm ? (
                // Success state
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Enrolled!</h3>
                  <p className="text-sm mb-6" style={{ color: '#6b7266' }}>You&apos;re signed up for {prog.title}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        downloadICS(
                          prog.sessions.map(s => ({
                            title: prog.title,
                            date: s.date,
                            time: s.time,
                            duration: s.duration,
                            location: `${prog.courtName} — Mono Tennis Club`,
                            description: `Coach: ${prog.coachName}`,
                          })),
                          `${prog.title.replace(/\s+/g, '-').toLowerCase()}.ics`
                        );
                      }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add to Calendar
                    </button>
                    <button
                      onClick={() => { setEnrollConfirm(null); setJustEnrolled(null); }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
                      style={{ background: '#6b7a3d' }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                // Confirm state
                <>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: '#2a2f1e' }}>Confirm Enrollment</h3>
                  <p className="text-sm mb-4" style={{ color: '#6b7266' }}>
                    Enroll in <strong>{prog.title}</strong> with {prog.coachName}?
                  </p>
                  <div className="space-y-2 mb-6 p-4 rounded-xl" style={{ background: '#faf8f3' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6b7266' }}>Sessions</span>
                      <span className="font-medium" style={{ color: '#2a2f1e' }}>{prog.sessions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6b7266' }}>Court</span>
                      <span className="font-medium" style={{ color: '#2a2f1e' }}>{prog.courtName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6b7266' }}>Fee</span>
                      <span className="font-medium" style={{ color: '#2a2f1e' }}>${prog.fee}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setEnrollConfirm(null); }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
                      style={{ background: '#f5f2eb', color: '#2a2f1e' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        enrollInProgram(prog.id, currentUser?.id || '', currentUser?.name || '');
                        showToast(`Enrolled in ${prog.title}`);
                        setJustEnrolled(prog.id);
                      }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
                      style={{ background: '#6b7a3d' }}
                    >
                      Confirm — ${prog.fee}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Program Detail Modal */}
      {selectedProgram && (() => {
        const prog = programs.find(p => p.id === selectedProgram);
        if (!prog) return null;
        const isEnrolled = prog.enrolledMembers.includes(currentUser?.id || '');
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedProgram(null)}>
            <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg" style={{ color: '#2a2f1e' }}>{prog.title}</h3>
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{
                      background: prog.type === 'clinic' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: prog.type === 'clinic' ? '#6b7a3d' : '#d97706',
                    }}>
                      {prog.type === 'clinic' ? 'Clinic' : 'Camp'}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#6b7266' }}>Coach: {prog.coachName}</p>
                </div>
                <button onClick={() => setSelectedProgram(null)} className="p-1 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <p className="text-sm mb-4" style={{ color: '#2a2f1e' }}>{prog.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex gap-2 text-sm" style={{ color: '#6b7266' }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {prog.courtName} &bull; ${prog.fee}
                </div>
              </div>

              {/* Sessions list */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Sessions</p>
                <div className="space-y-1.5">
                  {prog.sessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: '#faf8f3' }}>
                      <span className="font-medium" style={{ color: '#2a2f1e' }}>
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ color: '#6b7266' }}>{s.time} &bull; {s.duration}min</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrolled members */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>
                  Enrolled ({prog.enrolledMembers.length}/{prog.spotsTotal})
                </p>
                <div className="flex flex-wrap gap-2">
                  {prog.enrolledMembers.map(mId => {
                    const member = members.find(m => m.id === mId);
                    return (
                      <span key={mId} className="text-xs px-3 py-1 rounded-full" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>
                        {member?.name || mId}
                      </span>
                    );
                  })}
                  {prog.enrolledMembers.length === 0 && (
                    <p className="text-xs" style={{ color: '#6b7266' }}>No members enrolled yet</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (isEnrolled) {
                    withdrawFromProgram(prog.id, currentUser?.id || '');
                    showToast('Withdrawn from program');
                    setSelectedProgram(null);
                  } else {
                    setSelectedProgram(null);
                    setEnrollConfirm(prog.id);
                  }
                }}
                className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isEnrolled ? '#ef4444' : '#6b7a3d',
                  color: '#fff',
                }}
              >
                {isEnrolled ? 'Withdraw' : `Enroll — $${prog.fee}`}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Event Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedEvent(null)}>
          <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2a2f1e' }}>{detail.title}</h3>
                <p className="text-sm mt-1" style={{ color: '#6b7266' }}>
                  {new Date(detail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex gap-2 text-sm" style={{ color: '#6b7266' }}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {detail.time}
              </div>
              <div className="flex gap-2 text-sm" style={{ color: '#6b7266' }}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {detail.location}
              </div>
              <p className="text-sm" style={{ color: '#2a2f1e' }}>{detail.description}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>
                Attendees
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.attendees.map(name => (
                  <span key={name} className="text-xs px-3 py-1 rounded-full" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>
                    {name}
                  </span>
                ))}
                {detail.attendees.length === 0 && (
                  <p className="text-xs" style={{ color: '#6b7266' }}>No attendees yet</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                const wasAttending = detail.attendees.includes(currentUser?.name || '');
                toggleRsvp(detail.id, currentUser?.name || '');
                showToast(wasAttending ? 'RSVP cancelled' : `RSVP'd to ${detail.title}`);
              }}
              className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: detail.attendees.includes(currentUser?.name || '') ? '#ef4444' : '#6b7a3d',
                color: '#fff',
              }}
            >
              {detail.attendees.includes(currentUser?.name || '') ? 'Cancel RSVP' : 'RSVP to Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
