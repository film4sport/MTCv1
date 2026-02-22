'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { TIME_SLOTS, COURTS_CONFIG, COURT_HOURS } from '../lib/types';
import type { Booking } from '../lib/types';
import { generateId } from '../lib/utils';

type Tab = 'book' | 'lessons';

export default function CoachingPanelPage() {
  const { currentUser, bookings, addBooking, cancelBooking } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('book');

  // Book lesson form
  const [courtId, setCourtId] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [lessonType, setLessonType] = useState<'private' | 'group'>('private');
  const [bookingLoading, setBookingLoading] = useState(false);

  const isCoachOrAdmin = currentUser?.role === 'coach' || currentUser?.role === 'admin';

  if (!isCoachOrAdmin) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
        <DashboardHeader title="Book Lessons" />
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: '#6b7266' }}>You do not have access to this page.</p>
        </div>
      </div>
    );
  }

  // Slot helpers
  const isSlotBooked = (cId: number, d: string, t: string) =>
    bookings.find(b => b.courtId === cId && b.date === d && b.time === t && b.status === 'confirmed');

  const isSlotPast = (d: string, t: string) => {
    const now = new Date();
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    const slotDate = new Date(d + 'T00:00:00');
    slotDate.setHours(hour, minute, 0, 0);
    return slotDate < now;
  };

  const isCourtClosed = (cId: number, t: string) => {
    const closeHour = parseInt(COURT_HOURS[cId]?.close || '22');
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;
    let hour = parseInt(match[1]);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return hour >= closeHour;
  };

  const court = COURTS_CONFIG.find(c => c.id === courtId);

  // Filter available time slots for the selected court + date
  const availableSlots = date
    ? TIME_SLOTS.filter(t => !isCourtClosed(courtId, t) && !isSlotPast(date, t) && !isSlotBooked(courtId, date, t))
    : [];

  const handleBookLesson = async () => {
    if (!date || !time) {
      showToast('Select a date and time slot', 'error');
      return;
    }

    // Double-check conflict
    if (isSlotBooked(courtId, date, time)) {
      showToast('This slot is already booked', 'error');
      return;
    }

    setBookingLoading(true);
    const booking: Booking = {
      id: generateId('bk'),
      courtId,
      courtName: court?.name || `Court ${courtId}`,
      date,
      time,
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      status: 'confirmed',
      type: 'lesson',
    };

    await addBooking(booking);
    showToast(`${lessonType === 'private' ? 'Private' : 'Group'} lesson booked on ${court?.name || 'Court'}`);

    // Reset form
    setTime('');
    setBookingLoading(false);
  };

  // My lessons
  const myLessons = bookings
    .filter(b => b.type === 'lesson' && b.userId === currentUser?.id && b.status === 'confirmed')
    .sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return TIME_SLOTS.indexOf(a.time as typeof TIME_SLOTS[number]) - TIME_SLOTS.indexOf(b.time as typeof TIME_SLOTS[number]);
    });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Book Lessons" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-slideUp">
        {/* Tabs */}
        <div className="glass-card flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
          {([
            { key: 'book', label: 'Book Lesson' },
            { key: 'lessons', label: 'My Lessons' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.key ? '#6b7a3d' : 'transparent',
                color: tab === t.key ? '#fff' : '#6b7266',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Book Lesson Tab */}
        {tab === 'book' && (
          <div className="glass-card rounded-2xl border p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            <div className="space-y-5">
              {/* Court selector */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Court</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COURTS_CONFIG.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCourtId(c.id); setTime(''); }}
                      className="py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: courtId === c.id ? '#6b7a3d' : '#f5f2eb',
                        color: courtId === c.id ? '#fff' : '#2a2f1e',
                        border: courtId === c.id ? '2px solid #6b7a3d' : '2px solid transparent',
                      }}
                    >
                      {c.name}
                      <span className="block text-[0.65rem] mt-0.5 opacity-70">
                        {c.floodlight ? 'Lights til 10pm' : 'Closes 8pm'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2a2f1e' }}>Date</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={e => { setDate(e.target.value); setTime(''); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>

              {/* Time slots grid */}
              {date && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Time Slot</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm py-4 text-center" style={{ color: '#6b7266' }}>No available slots for this court and date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {TIME_SLOTS.filter(t => !isCourtClosed(courtId, t)).map(t => {
                        const booked = isSlotBooked(courtId, date, t);
                        const past = isSlotPast(date, t);
                        const disabled = !!booked || past;
                        const selected = time === t;

                        return (
                          <button
                            key={t}
                            disabled={disabled}
                            onClick={() => setTime(t)}
                            className="py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: selected ? '#6b7a3d' : disabled ? '#f0ede6' : '#f5f2eb',
                              color: selected ? '#fff' : disabled ? '#999' : '#2a2f1e',
                              border: selected ? '2px solid #6b7a3d' : '2px solid transparent',
                            }}
                          >
                            {t}
                            {booked && <span className="block text-[0.55rem] opacity-60">Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Lesson type */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2a2f1e' }}>Lesson Type</label>
                <div className="flex gap-2">
                  {(['private', 'group'] as const).map(lt => (
                    <button
                      key={lt}
                      onClick={() => setLessonType(lt)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        background: lessonType === lt ? '#6b7a3d' : '#f5f2eb',
                        color: lessonType === lt ? '#fff' : '#2a2f1e',
                      }}
                    >
                      {lt === 'private' ? 'Private Lesson' : 'Group Lesson'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary + Book */}
              {date && time && (
                <div className="rounded-xl p-4" style={{ background: '#f5f2eb' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#6b7266' }}>Lesson Summary</p>
                  <p className="text-sm" style={{ color: '#2a2f1e' }}>
                    {lessonType === 'private' ? 'Private' : 'Group'} lesson on <strong>{court?.name}</strong>
                    {' '}&bull; {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' '}&bull; {time}
                  </p>
                </div>
              )}

              <button
                onClick={handleBookLesson}
                disabled={!date || !time || bookingLoading}
                className="w-full py-3 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 btn-press disabled:opacity-50"
                style={{ background: '#6b7a3d' }}
              >
                {bookingLoading ? 'Booking...' : 'Book Lesson'}
              </button>
            </div>
          </div>
        )}

        {/* My Lessons Tab */}
        {tab === 'lessons' && (
          <div className="space-y-4">
            {myLessons.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                  <svg className="w-8 h-8" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="font-medium text-sm mb-1" style={{ color: '#2a2f1e' }}>No lessons booked</p>
                <p className="text-xs mb-4" style={{ color: '#6b7266' }}>Book a lesson to block off court time</p>
                <button onClick={() => setTab('book')} className="px-4 py-2 rounded-xl text-sm font-medium text-white btn-press" style={{ background: '#6b7a3d' }}>
                  Book a Lesson
                </button>
              </div>
            ) : (
              myLessons.map(lesson => {
                const isPast = isSlotPast(lesson.date, lesson.time);
                return (
                  <div key={lesson.id} className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{lesson.courtName}</h3>
                          <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                          }}>
                            Lesson
                          </span>
                          {isPast && (
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: '#f0ede6', color: '#999' }}>
                              Past
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: '#6b7266' }}>
                          {new Date(lesson.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} &bull; {lesson.time}
                        </p>
                      </div>
                      {!isPast && (
                        <button
                          onClick={() => { cancelBooking(lesson.id); showToast('Lesson cancelled'); }}
                          className="text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: '#ef4444' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
