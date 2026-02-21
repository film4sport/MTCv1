'use client';

import { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import { TIME_SLOTS, COURTS_CONFIG, COURT_HOURS, FEES } from '../lib/types';
import { downloadICS } from '../lib/calendar';
import { generateId } from '../lib/utils';

type ViewMode = 'week' | 'calendar';

export default function BookCourtPage() {
  const { currentUser, members, bookings, addBooking, cancelBooking, showToast } = useApp();
  const [bookingSuccess, setBookingSuccess] = useState<{ courtName: string; date: string; time: string; participants?: { id: string; name: string }[] } | null>(null);
  const [view, setView] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  });
  const [selectedCourt, setSelectedCourt] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ courtId: number; courtName: string; date: string; time: string } | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<{ id: string; name: string }[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const isSlotBooked = (courtId: number, date: string, time: string) => {
    return bookings.find(b => b.courtId === courtId && b.date === date && b.time === time && b.status === 'confirmed');
  };

  const isSlotMine = (courtId: number, date: string, time: string) => {
    return bookings.find(b => b.courtId === courtId && b.date === date && b.time === time && b.status === 'confirmed' && b.userId === currentUser?.id);
  };

  const isSlotPast = (date: string, time: string) => {
    const now = new Date();
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    const slotDate = new Date(date + 'T00:00:00');
    slotDate.setHours(hour, minute, 0, 0);
    return slotDate < now;
  };

  const isCourtClosed = (courtId: number, time: string) => {
    const closeHour = parseInt(COURT_HOURS[courtId]?.close || '22');
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;
    let hour = parseInt(match[1]);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return hour >= closeHour;
  };

  const canCancel = (date: string, time: string) => {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return true;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    const slotDate = new Date(date + 'T00:00:00');
    slotDate.setHours(hour, minute, 0, 0);
    const hoursUntil = (slotDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= FEES.cancelWindowHours;
  };

  const handleSlotClick = (courtId: number, courtName: string, date: string, time: string) => {
    const mine = isSlotMine(courtId, date, time);
    if (mine) {
      if (!canCancel(date, time)) {
        showToast(`Cannot cancel within ${FEES.cancelWindowHours} hours of booking`, 'error');
        return;
      }
      if (confirm(`Cancel booking for ${courtName} on ${date} at ${time}?`)) {
        cancelBooking(mine.id);
        showToast('Booking cancelled');
      }
      return;
    }
    if (isSlotBooked(courtId, date, time) || isSlotPast(date, time) || isCourtClosed(courtId, time)) return;
    setModalData({ courtId, courtName, date, time });
    setIsGuest(false);
    setGuestName('');
    setSelectedParticipants([]);
    setParticipantSearch('');
    setShowModal(true);
  };

  const confirmBooking = () => {
    if (!modalData || !currentUser || bookingLoading) return;
    if (isGuest && !guestName.trim()) return;
    const alreadyBooked = bookings.find(b => b.courtId === modalData.courtId && b.date === modalData.date && b.time === modalData.time && b.status === 'confirmed');
    if (alreadyBooked) {
      showToast('This slot was just booked by someone else', 'error');
      setShowModal(false);
      return;
    }
    setBookingLoading(true);
    const booking = {
      id: generateId('b'),
      courtId: modalData.courtId,
      courtName: modalData.courtName,
      date: modalData.date,
      time: modalData.time,
      userId: currentUser.id,
      userName: currentUser.name,
      guestName: isGuest ? guestName.trim() : undefined,
      participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      status: 'confirmed' as const,
      type: 'court' as const,
    };
    addBooking(booking);
    setBookingLoading(false);
    setShowModal(false);
    setBookingSuccess({ courtName: modalData.courtName, date: modalData.date, time: modalData.time, participants: selectedParticipants.length > 0 ? selectedParticipants : undefined });
    showToast(`Court booked for ${modalData.time}`);
  };

  const myUpcoming = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed' && !isSlotPast(b.date, b.time))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatDateShort = (d: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { day: days[d.getDay()], date: d.getDate() };
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const courtConfig = COURTS_CONFIG.find(c => c.id === selectedCourt)!;
  const slotsForCourt = TIME_SLOTS.filter(t => !isCourtClosed(selectedCourt, t));

  // Calendar helpers
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

  const hasBookingOnDate = (d: Date) => {
    const dateStr = d.toISOString().split('T')[0];
    return bookings.some(b => b.date === dateStr && b.status === 'confirmed');
  };

  const myBookingOnDate = (d: Date) => {
    const dateStr = d.toISOString().split('T')[0];
    return bookings.some(b => b.date === dateStr && b.status === 'confirmed' && b.userId === currentUser?.id);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Book Court" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto animate-slideUp">

        {/* Top Bar: View Toggle + Court Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          {/* Court Tabs */}
          <div className="flex gap-1.5">
            {COURTS_CONFIG.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCourt(c.id)}
                className="relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: selectedCourt === c.id ? '#2a2f1e' : '#fff',
                  color: selectedCourt === c.id ? '#fff' : '#6b7266',
                  border: selectedCourt === c.id ? '1px solid #2a2f1e' : '1px solid #e0dcd3',
                  boxShadow: selectedCourt === c.id ? '0 2px 8px rgba(42,47,30,0.15)' : 'none',
                }}
              >
                {c.name}
                <span className="block text-[0.6rem] font-normal mt-0.5" style={{ opacity: 0.7 }}>
                  {c.floodlight ? 'til 10 PM' : 'til 8 PM'}
                </span>
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
            <button
              onClick={() => setView('week')}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: view === 'week' ? '#6b7a3d' : 'transparent', color: view === 'week' ? '#fff' : '#6b7266' }}
            >
              Week
            </button>
            <button
              onClick={() => setView('calendar')}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: view === 'calendar' ? '#6b7a3d' : 'transparent', color: view === 'calendar' ? '#fff' : '#6b7266' }}
            >
              Month
            </button>
          </div>
        </div>

        <div className="flex gap-6">

          {/* Main Grid Area */}
          <div className="flex-1 min-w-0">

            {view === 'week' ? (
              <>
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevWeek} className="w-9 h-9 rounded-xl flex items-center justify-center border hover:bg-white transition-colors active:scale-95" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <span className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>
                    {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={nextWeek} className="w-9 h-9 rounded-xl flex items-center justify-center border hover:bg-white transition-colors active:scale-95" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                {/* Week Grid — single court */}
                <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[600px]">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 p-3 text-[0.7rem] font-medium text-left border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3', color: '#9ca3a0', width: 72 }}>
                          </th>
                          {weekDays.map(day => {
                            const f = formatDateShort(day);
                            const today = isToday(day);
                            return (
                              <th
                                key={day.toISOString()}
                                className="p-2.5 text-center border-b"
                                style={{ borderColor: '#f0ede6', background: today ? 'rgba(107, 122, 61, 0.06)' : '#faf8f3' }}
                              >
                                <div className="text-[0.6rem] font-medium uppercase tracking-wider" style={{ color: '#9ca3a0' }}>{f.day}</div>
                                <div className={`text-base font-bold mt-0.5 ${today ? 'text-white' : ''}`} style={today ? { background: '#6b7a3d', borderRadius: '8px', padding: '2px 8px', display: 'inline-block' } : { color: '#2a2f1e' }}>
                                  {f.date}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {slotsForCourt.map(time => (
                          <tr key={time} className="group">
                            <td className="sticky left-0 z-10 px-3 py-0 text-[0.7rem] font-medium border-b" style={{ borderColor: '#f7f5f0', background: '#faf8f3', color: '#9ca3a0' }}>
                              {time}
                            </td>
                            {weekDays.map(day => {
                              const dateStr = day.toISOString().split('T')[0];
                              const booked = isSlotBooked(selectedCourt, dateStr, time);
                              const mine = isSlotMine(selectedCourt, dateStr, time);
                              const past = isSlotPast(dateStr, time);
                              const closed = isCourtClosed(selectedCourt, time);
                              const isProgram = booked?.type === 'program';
                              const isLesson = booked?.type === 'lesson';
                              const today = isToday(day);
                              const available = !booked && !past && !closed;

                              return (
                                <td key={`${dateStr}-${time}`} className="border-b p-[3px]" style={{ borderColor: '#f7f5f0', background: today ? 'rgba(107, 122, 61, 0.02)' : 'transparent' }}>
                                  <button
                                    onClick={() => handleSlotClick(selectedCourt, courtConfig.name, dateStr, time)}
                                    disabled={(!mine && !!booked) || past || closed}
                                    className="w-full rounded-lg text-xs font-medium py-2.5 px-2 transition-all duration-150 relative overflow-hidden"
                                    style={{
                                      background: mine
                                        ? '#6b7a3d'
                                        : isLesson ? 'rgba(59, 130, 246, 0.08)'
                                        : isProgram ? 'rgba(245, 158, 11, 0.08)'
                                        : booked ? '#f5f3ee'
                                        : past || closed ? 'transparent'
                                        : 'transparent',
                                      color: mine
                                        ? '#fff'
                                        : isLesson ? '#3b82f6'
                                        : isProgram ? '#d97706'
                                        : booked ? '#b5b0a5'
                                        : past || closed ? '#d5d0c8'
                                        : '#6b7a3d',
                                      cursor: available ? 'pointer' : mine ? 'pointer' : 'default',
                                      border: mine
                                        ? '1.5px solid #6b7a3d'
                                        : available ? '1.5px dashed #d4d0c7'
                                        : '1.5px solid transparent',
                                    }}
                                    title={mine ? 'Click to cancel' : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? `Booked by ${booked.userName}` : past ? 'Past' : closed ? 'Closed' : 'Book this slot'}
                                  >
                                    {mine ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        Booked
                                      </span>
                                    ) : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                                        Taken
                                      </span>
                                    ) : past || closed ? (
                                      <span style={{ opacity: 0.3 }}>—</span>
                                    ) : (
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6b7a3d' }}>Book</span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[0.7rem]" style={{ color: '#9ca3a0' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-3 rounded border border-dashed" style={{ borderColor: '#d4d0c7' }} />
                    Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-3 rounded" style={{ background: '#6b7a3d' }} />
                    My Booking
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-3 rounded" style={{ background: '#f5f3ee' }} />
                    Taken
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-3 rounded" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }} />
                    Lesson
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }} />
                    Program
                  </div>
                </div>
              </>
            ) : (
              /* Calendar View */
              <div className="rounded-2xl border p-5 sm:p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border hover:bg-gray-50 transition-colors active:scale-95"
                    style={{ borderColor: '#e0dcd3' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <span className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>
                    {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border hover:bg-gray-50 transition-colors active:scale-95"
                    style={{ borderColor: '#e0dcd3' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[0.65rem] font-semibold uppercase tracking-wider py-2" style={{ color: '#9ca3a0' }}>{d}</div>
                  ))}
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const dateStr = day.toISOString().split('T')[0];
                    const today = isToday(day);
                    const hasBooking = hasBookingOnDate(day);
                    const hasMine = myBookingOnDate(day);
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                    const selected = calSelectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isPast && setCalSelectedDate(selected ? null : dateStr)}
                        disabled={isPast}
                        className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 relative"
                        style={{
                          background: selected ? '#2a2f1e' : today ? 'rgba(107, 122, 61, 0.08)' : 'transparent',
                          color: selected ? '#fff' : isPast ? '#d1d5db' : '#2a2f1e',
                          cursor: isPast ? 'default' : 'pointer',
                          fontWeight: today ? 700 : 500,
                        }}
                      >
                        <span className="text-sm">{day.getDate()}</span>
                        {(hasBooking || hasMine) && (
                          <div className="flex gap-0.5">
                            {hasMine && <span className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? '#d4e157' : '#6b7a3d' }} />}
                            {hasBooking && !hasMine && <span className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? 'rgba(255,255,255,0.4)' : '#d4d0c7' }} />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected date slots */}
                {calSelectedDate && (
                  <div className="mt-5 pt-5 border-t" style={{ borderColor: '#f0ede6' }}>
                    <h4 className="font-semibold text-sm mb-3" style={{ color: '#2a2f1e' }}>
                      {new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    <div className="space-y-1.5">
                      {slotsForCourt.map(time => {
                        const booked = isSlotBooked(selectedCourt, calSelectedDate, time);
                        const mine = isSlotMine(selectedCourt, calSelectedDate, time);
                        const past = isSlotPast(calSelectedDate, time);
                        const available = !booked && !past;
                        const isLesson = booked?.type === 'lesson';
                        const isProgram = booked?.type === 'program';

                        if (past) return null;

                        return (
                          <button
                            key={time}
                            onClick={() => available || mine ? handleSlotClick(selectedCourt, courtConfig.name, calSelectedDate, time) : undefined}
                            disabled={!available && !mine}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150"
                            style={{
                              background: mine ? '#6b7a3d' : available ? '#fff' : '#f9f7f3',
                              color: mine ? '#fff' : available ? '#2a2f1e' : '#b5b0a5',
                              border: mine ? '1px solid #6b7a3d' : available ? '1px solid #e0dcd3' : '1px solid #f0ede6',
                              cursor: available || mine ? 'pointer' : 'default',
                            }}
                          >
                            <span className="font-medium">{time}</span>
                            <span className="text-xs font-medium" style={{ opacity: 0.7 }}>
                              {mine ? 'Your Booking ✓' : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? 'Taken' : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: My Bookings */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="rounded-2xl border p-5 sticky top-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
                <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                My Bookings
              </h3>
              {myUpcoming.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.06)' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs" style={{ color: '#9ca3a0' }}>No upcoming bookings</p>
                  <p className="text-[0.65rem] mt-1" style={{ color: '#c5c0b8' }}>Click a time slot to book</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myUpcoming.slice(0, 5).map(b => (
                    <div key={b.id} className="rounded-xl p-3.5 transition-colors" style={{ background: '#faf8f3' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{b.courtName}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>
                            {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {b.time}
                          </p>
                          {b.guestName && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#d97706' }}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {b.guestName}
                            </p>
                          )}
                          {b.participants && b.participants.length > 0 && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#6b7a3d' }}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {b.participants.map(p => p.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (!canCancel(b.date, b.time)) {
                              showToast(`Cannot cancel within ${FEES.cancelWindowHours}h of booking`, 'error');
                              return;
                            }
                            cancelBooking(b.id);
                            showToast('Booking cancelled');
                          }}
                          className="text-[0.65rem] px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                          style={{ color: '#ef4444' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-scaleIn" style={{ background: '#fff' }}>
            <h3 className="font-semibold text-lg mb-4" style={{ color: '#2a2f1e' }}>Confirm Booking</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b7266' }}>Court</span>
                <span className="font-medium" style={{ color: '#2a2f1e' }}>{modalData.courtName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b7266' }}>Date</span>
                <span className="font-medium" style={{ color: '#2a2f1e' }}>
                  {new Date(modalData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b7266' }}>Time</span>
                <span className="font-medium" style={{ color: '#2a2f1e' }}>{modalData.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b7266' }}>Cost</span>
                <span className="font-medium" style={{ color: '#2a2f1e' }}>{isGuest ? `$${FEES.guest} (guest fee)` : 'Free'}</span>
              </div>
            </div>

            {/* Guest toggle */}
            <div className="rounded-xl p-4 mb-4" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGuest}
                  onChange={(e) => { setIsGuest(e.target.checked); if (!e.target.checked) setGuestName(''); }}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#6b7a3d' }}
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>Bringing a guest?</p>
                  <p className="text-xs" style={{ color: '#6b7266' }}>Guest fee: ${FEES.guest}</p>
                </div>
              </label>
              {isGuest && (
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest name"
                  className="mt-3 w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', background: '#fff', color: '#2a2f1e' }}
                />
              )}
            </div>

            {/* Add Participants */}
            <div className="rounded-xl p-4 mb-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Add Participants</p>
              <p className="text-xs mb-3" style={{ color: '#6b7266' }}>Search members to add (max 3)</p>
              {selectedParticipants.length < 3 && (
                <div className="relative">
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Search members..."
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                    style={{ borderColor: '#e0dcd3', background: '#fff', color: '#2a2f1e' }}
                  />
                  {participantSearch.trim().length >= 2 && (() => {
                    const results = members.filter(m =>
                      m.id !== currentUser?.id &&
                      !selectedParticipants.some(p => p.id === m.id) &&
                      m.name.toLowerCase().includes(participantSearch.toLowerCase())
                    ).slice(0, 5);
                    if (results.length === 0) return null;
                    return (
                      <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border shadow-lg z-10 max-h-40 overflow-y-auto" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                        {results.map(m => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedParticipants(prev => [...prev, { id: m.id, name: m.name }]);
                              setParticipantSearch('');
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03] transition-colors"
                            style={{ color: '#2a2f1e' }}
                          >
                            {m.name}
                            {m.ntrp && <span className="text-xs ml-2" style={{ color: '#6b7266' }}>NTRP {m.ntrp}</span>}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedParticipants.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.12)', color: '#6b7a3d' }}>
                      {p.name}
                      <button
                        onClick={() => setSelectedParticipants(prev => prev.filter(x => x.id !== p.id))}
                        className="hover:opacity-70"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ background: '#f5f2eb', color: '#2a2f1e' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                disabled={(isGuest && !guestName.trim()) || bookingLoading}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ background: '#6b7a3d' }}
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success + Add to Calendar */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setBookingSuccess(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center animate-scaleIn" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Booked!</h3>
            <p className="text-sm mb-2" style={{ color: '#6b7266' }}>
              {bookingSuccess.courtName} on{' '}
              {new Date(bookingSuccess.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
              at {bookingSuccess.time}
            </p>
            {bookingSuccess.participants && bookingSuccess.participants.length > 0 && (
              <p className="text-xs mb-4" style={{ color: '#6b7a3d' }}>
                With: {bookingSuccess.participants.map(p => p.name).join(', ')}
              </p>
            )}
            {!(bookingSuccess.participants && bookingSuccess.participants.length > 0) && <div className="mb-4" />}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  downloadICS([{
                    title: `Tennis — ${bookingSuccess.courtName}`,
                    date: bookingSuccess.date,
                    time: bookingSuccess.time,
                    duration: 60,
                    location: `${bookingSuccess.courtName} — Mono Tennis Club`,
                  }], 'mtc-booking.ics');
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
                onClick={() => setBookingSuccess(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: '#6b7a3d' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
