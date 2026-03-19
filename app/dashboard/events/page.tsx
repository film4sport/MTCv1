'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth, useEvents, useDerived } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { downloadICS } from '../lib/calendar';
import { useFocusTrap } from '../lib/utils';

type EventFilter = 'all' | 'social' | 'match' | 'tournament' | 'camp' | 'programs';
type ViewMode = 'calendar' | 'list';
type PageView = 'events' | 'programs';

export default function EventsPage() {
  const { currentUser } = useAuth();
  const { events, toggleRsvp, createEvent, updateEvent, deleteEvent, programs, enrollInProgram, withdrawFromProgram } = useEvents();
  const { members } = useDerived();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'coach';
  const searchParams = useSearchParams();
  const [pageView, setPageView] = useState<PageView>('events');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(searchParams.get('event'));
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [enrollConfirm, setEnrollConfirm] = useState<string | null>(null);
  const [justEnrolled, setJustEnrolled] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', type: 'social', date: '', time: '', location: 'Mono Tennis Club', spotsTotal: '16', price: 'Free', description: '' });
  const [eventFormLoading, setEventFormLoading] = useState(false);
  const enrollModalRef = useRef<HTMLDivElement>(null);
  const programModalRef = useRef<HTMLDivElement>(null);
  const eventModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(enrollModalRef, !!enrollConfirm);
  useFocusTrap(programModalRef, !!selectedProgram);
  useFocusTrap(eventModalRef, !!selectedEvent);

  // Normalize type — 'roundrobin' → 'social', 'lesson'/'special' → 'programs' for filtering
  const normalizeType = (t: string) => {
    if (t === 'roundrobin') return 'social';
    if (t === 'lesson' || t === 'special') return 'programs';
    return t;
  };
  const filtered = events
    .filter(e => {
      if (e.date < todayStr) return false;
      // Type filter
      if (filter !== 'all' && normalizeType(e.type) !== filter) return false;
      // Month filter — only show events for the displayed calendar month
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === calendarDate.getFullYear() && d.getMonth() === calendarDate.getMonth();
    })
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
    social: 'Social', match: 'Match', lesson: 'Programs', tournament: 'Tournament', camp: 'Camp', roundrobin: 'Social', special: 'Programs', programs: 'Programs',
  };

  // Event type colors — matches landing page calendar legend
  const typeColors: Record<string, string> = {
    social: '#d97706',
    match: '#9333ea',
    tournament: '#3a3a3a',
    camp: '#dc2626',
    programs: '#60a5fa',
    lesson: '#60a5fa',
    special: '#60a5fa',
  };

  const detail = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

  // Esc key closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enrollConfirm) setEnrollConfirm(null);
        else if (selectedEvent) setSelectedEvent(null);
        else if (selectedProgram) setSelectedProgram(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enrollConfirm, selectedEvent, selectedProgram]);

  // Calendar helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get event dates for this month (for colored dots per type)
  const eventTypesThisMonth = new Map<number, Set<string>>();
  filtered
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .forEach(e => {
      const day = new Date(e.date + 'T00:00:00').getDate();
      if (!eventTypesThisMonth.has(day)) eventTypesThisMonth.set(day, new Set());
      eventTypesThisMonth.get(day)!.add(normalizeType(e.type));
    });

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
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Club Events" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-slideUp">

        {/* Events / Programs toggle */}
        <div className="glass-card flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
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
          <div className="glass-card flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
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

        {/* Filter pills + Admin Add button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'social', 'match', 'tournament', 'camp', 'programs'] as EventFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors event-filter-pill ${filter === f ? 'event-filter-pill-active' : ''}`}
                style={{
                  '--pill-color': typeColors[f] || '#6b7a3d',
                } as React.CSSProperties}
              >
                {f === 'all' ? 'All Events' : typeLabels[f] || f}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setEventForm({ title: '', type: 'social', date: '', time: '', location: 'Mono Tennis Club', spotsTotal: '16', price: 'Free', description: '' });
                setShowAddEvent(true);
              }}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:shadow-md flex items-center gap-1.5"
              style={{ background: '#6b7a3d', color: '#fff' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Event
            </button>
          )}
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="glass-card rounded-2xl border p-5 mb-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
                const dayTypes = eventTypesThisMonth.get(day);
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
                    {dayTypes && dayTypes.size > 0 && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {Array.from(dayTypes).slice(0, 3).map((type, i) => (
                          <span
                            key={type}
                            className="w-1.5 h-1.5 rounded-full calendar-dot-bounce"
                            style={{
                              background: isSelected ? '#fff' : (typeColors[type] || '#6b7a3d'),
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </span>
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
          <div className="glass-card text-center py-12 rounded-2xl border" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
                  className="glass-card rounded-2xl border p-5 card-hover cursor-pointer"
                  style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)', opacity: isPast ? 0.6 : 1 }}
                  onClick={() => setSelectedEvent(ev.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
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

                  <p className="text-xs mb-3" style={{ color: '#6b7266' }}>{ev.location}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: `${typeColors[normalizeType(ev.type)] || '#6b7a3d'}15`, color: typeColors[normalizeType(ev.type)] || '#6b7266', border: `1px solid ${typeColors[normalizeType(ev.type)] || '#6b7a3d'}30` }}>
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
                      className={`rsvp-btn px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isPast ? 'opacity-50' : ''}`}
                      style={{
                        '--event-color': typeColors[normalizeType(ev.type)] || '#6b7a3d',
                        background: attending ? (typeColors[normalizeType(ev.type)] || '#d97706') : 'rgba(107, 122, 61, 0.1)',
                        color: attending ? '#fff' : '#6b7a3d',
                        border: attending ? `1.5px solid ${typeColors[normalizeType(ev.type)] || '#d97706'}` : '1.5px solid transparent',
                      } as React.CSSProperties}
                    >
                      {attending ? '✓ Going' : 'RSVP'}
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
              <div className="glass-card text-center py-12 rounded-2xl border" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
                      className="glass-card rounded-2xl border p-5 card-hover cursor-pointer"
                      style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => { setEnrollConfirm(null); setJustEnrolled(null); }} role="dialog" aria-modal="true" aria-labelledby="enroll-modal-title">
            <div ref={enrollModalRef} className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
              {justEnrolled === enrollConfirm ? (
                // Success state
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 id="enroll-modal-title" className="font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Enrolled!</h3>
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
                  <h3 id="enroll-modal-title" className="font-semibold text-lg mb-2" style={{ color: '#2a2f1e' }}>Confirm Enrollment</h3>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedProgram(null)} role="dialog" aria-modal="true" aria-labelledby="program-modal-title">
            <div ref={programModalRef} className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="program-modal-title" className="font-semibold text-lg" style={{ color: '#2a2f1e' }}>{prog.title}</h3>
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{
                      background: prog.type === 'clinic' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: prog.type === 'clinic' ? '#6b7a3d' : '#d97706',
                    }}>
                      {prog.type === 'clinic' ? 'Clinic' : 'Camp'}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#6b7266' }}>Coach: {prog.coachName}</p>
                </div>
                <button onClick={() => setSelectedProgram(null)} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
                  <svg className="w-5 h-5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
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
      {detail && (() => {
        const isInterclub = !!detail.opponent;
        const isAttending = detail.attendees.includes(currentUser?.name || '');
        const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const avatarColors = ['#6b7a3d', '#d97706', '#2563eb', '#7c3aed', '#dc2626', '#0891b2', '#4f46e5', '#059669'];
        const getAvatarColor = (name: string) => avatarColors[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedEvent(null)} role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
          <div ref={eventModalRef} className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>

            {/* Header — dark gradient for interclub, standard for others */}
            {isInterclub ? (
              <div className="relative rounded-t-2xl p-6 pb-5" style={{ background: 'linear-gradient(135deg, #1a2e0a 0%, #2a3f1a 100%)' }}>
                <button onClick={() => setSelectedEvent(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }} aria-label="Close">
                  <svg className="w-4 h-4" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <h3 id="event-modal-title" className="font-semibold text-xl text-white mb-2">{detail.title}</h3>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {new Date(detail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} &bull; {detail.time}
                </div>
              </div>
            ) : (
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 id="event-modal-title" className="font-semibold text-lg" style={{ color: '#2a2f1e' }}>{detail.title}</h3>
                    <p className="text-sm mt-1" style={{ color: '#6b7266' }}>
                      {new Date(detail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
                    <svg className="w-5 h-5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 pt-4">
              {/* Info grid — interclub shows opponent/format/team size, others show time/location */}
              {isInterclub ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Location', value: detail.location },
                    { label: 'Opponent', value: detail.opponent || '—' },
                    { label: 'Format', value: detail.format || '—' },
                    { label: 'Team Size', value: `${detail.attendees.length} confirmed` },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl" style={{ background: '#faf8f3' }}>
                      <p className="text-[0.65rem] font-medium uppercase tracking-wide mb-0.5" style={{ color: '#6b7266' }}>{item.label}</p>
                      <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 mb-5">
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
              )}

              {/* Instructions (interclub + any event with instructions) */}
              {detail.instructions && detail.instructions.length > 0 && (
                <div className="mb-5 p-4 rounded-xl" style={{ background: '#faf8f3', border: '1px solid #f0ede6' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7a3d' }}>Important</p>
                  </div>
                  <ul className="space-y-1.5">
                    {detail.instructions.map((inst, i) => (
                      <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#2a2f1e' }}>
                        <span style={{ color: '#6b7a3d' }}>&bull;</span> {inst}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Volunteer tasks — assigned + open */}
              {((detail.assignedTasks && detail.assignedTasks.length > 0) || (detail.volunteersNeeded && detail.volunteersNeeded.length > 0)) && (
                <div className="mb-5">
                  <p className="text-sm font-medium mb-3" style={{ color: '#2a2f1e' }}>Tasks & Volunteers</p>
                  <div className="space-y-2">
                    {detail.assignedTasks?.map(task => (
                      <div key={task.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: '#f5f2eb' }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{task.icon}</span>
                          <span className="text-xs font-medium" style={{ color: '#2a2f1e' }}>{task.name}</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                          {task.assigned}
                        </span>
                      </div>
                    ))}
                    {detail.volunteersNeeded?.map(task => (
                      <div key={task.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: '#fff', border: '1px dashed #e0dcd3' }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{task.icon}</span>
                          <span className="text-xs font-medium" style={{ color: '#2a2f1e' }}>{task.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            showToast(`Signed up for ${task.name}!`);
                          }}
                          className="text-[0.65rem] font-medium px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                          style={{ background: '#6b7a3d', color: '#fff' }}
                        >
                          Volunteer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendees — avatar circles */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>
                    {isInterclub ? "Who's Playing" : 'Attendees'} ({detail.attendees.length})
                  </p>
                  {isInterclub && (
                    <span className="text-xs font-medium" style={{ color: '#6b7a3d' }}>{detail.attendees.length} confirmed</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {detail.attendees.slice(0, 8).map(name => (
                    <div key={name} className="flex flex-col items-center gap-1 w-14">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                        style={{ background: getAvatarColor(name) }}
                      >
                        {getInitials(name)}
                      </div>
                      <span className="text-[0.6rem] text-center leading-tight truncate w-full" style={{ color: '#2a2f1e' }}>
                        {name.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                  {detail.attendees.length > 8 && (
                    <div className="flex flex-col items-center gap-1 w-14">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#d4e157', color: '#2a2f1e' }}>
                        +{detail.attendees.length - 8}
                      </div>
                      <span className="text-[0.6rem] text-center" style={{ color: '#6b7266' }}>more</span>
                    </div>
                  )}
                  {detail.attendees.length === 0 && (
                    <p className="text-xs" style={{ color: '#6b7266' }}>No attendees yet — be the first!</p>
                  )}
                </div>
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      setEventForm({
                        title: detail.title, type: detail.type, date: detail.date, time: detail.time,
                        location: detail.location || 'Mono Tennis Club', spotsTotal: String(detail.spotsTotal || 16),
                        price: detail.price || 'Free', description: detail.description || '',
                      });
                      setEditingEvent(detail.id);
                      setShowAddEvent(true);
                      setSelectedEvent(null);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${detail.title}"? This cannot be undone.`)) return;
                      try {
                        await deleteEvent(detail.id);
                        showToast('Event deleted');
                        setSelectedEvent(null);
                      } catch (err) {
                        showToast(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
                      }
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    Delete
                  </button>
                </div>
              )}

              {/* RSVP buttons — dual for interclub, single for others */}
              {isInterclub ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!isAttending) {
                        toggleRsvp(detail.id, currentUser?.name || '');
                        showToast("You're confirmed! See you there");
                      }
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: isAttending ? '#6b7a3d' : 'rgba(107, 122, 61, 0.1)',
                      color: isAttending ? '#fff' : '#6b7a3d',
                      border: isAttending ? '2px solid #6b7a3d' : '2px solid transparent',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {isAttending ? "I'm In!" : 'Count Me In'}
                  </button>
                  <button
                    onClick={() => {
                      if (isAttending) {
                        toggleRsvp(detail.id, currentUser?.name || '');
                        showToast("No problem — we'll miss you!");
                      } else {
                        showToast("No problem — we'll miss you!");
                        setSelectedEvent(null);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(239, 68, 68, 0.06)',
                      color: '#ef4444',
                      border: '2px solid transparent',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Can&apos;t Make It
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    toggleRsvp(detail.id, currentUser?.name || '');
                    showToast(isAttending ? 'RSVP cancelled' : `RSVP'd to ${detail.title}`);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: isAttending ? '#ef4444' : '#6b7a3d',
                    color: '#fff',
                  }}
                >
                  {isAttending ? 'Cancel RSVP' : 'RSVP to Event'}
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add/Edit Event Modal (admin only) */}
      {showAddEvent && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAddEvent(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4" style={{ color: '#2a2f1e' }}>
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Title</label>
                <input value={eventForm.title} onChange={e => setEventForm(f => ({...f, title: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Type</label>
                <div className="flex flex-wrap gap-2">
                  {['social', 'match', 'tournament', 'camp', 'lesson'].map(t => (
                    <button key={t} type="button" onClick={() => setEventForm(f => ({...f, type: t}))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: eventForm.type === t ? '#6b7a3d' : '#f5f2eb', color: eventForm.type === t ? '#fff' : '#6b7266' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Date</label>
                  <input type="date" value={eventForm.date} onChange={e => setEventForm(f => ({...f, date: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Time</label>
                  <input value={eventForm.time} onChange={e => setEventForm(f => ({...f, time: e.target.value}))} placeholder="e.g. 6:00 PM" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Location</label>
                <input value={eventForm.location} onChange={e => setEventForm(f => ({...f, location: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Max Spots</label>
                  <input type="number" value={eventForm.spotsTotal} onChange={e => setEventForm(f => ({...f, spotsTotal: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Price</label>
                  <input value={eventForm.price} onChange={e => setEventForm(f => ({...f, price: e.target.value}))} placeholder="Free or $25" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#2a2f1e' }}>Description</label>
                <textarea value={eventForm.description} onChange={e => setEventForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full px-3 py-2 rounded-lg text-sm border resize-none" style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddEvent(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>Cancel</button>
              <button
                disabled={eventFormLoading || !eventForm.title.trim() || !eventForm.date || !eventForm.time.trim()}
                onClick={async () => {
                  setEventFormLoading(true);
                  try {
                    if (editingEvent) {
                      await updateEvent(editingEvent, eventForm);
                      showToast('Event updated');
                    } else {
                      await createEvent({ ...eventForm, spotsTotal: parseInt(eventForm.spotsTotal) || 16 });
                      showToast('Event created');
                    }
                    setShowAddEvent(false);
                  } catch (err) {
                    showToast(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
                  } finally {
                    setEventFormLoading(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: '#6b7a3d', color: '#fff' }}
              >
                {eventFormLoading ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
