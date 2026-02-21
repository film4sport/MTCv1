'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import { TIME_SLOTS, COURTS_CONFIG, FEES } from '../lib/types';
import { generateId } from '../lib/utils';
import {
  ViewMode, COURT_COLORS, getTimeRange,
  isSlotBooked, isSlotMine, isSlotPast, isCourtClosed, isCourtInMaintenance, canCancel,
  formatDateShort, isToday,
} from './components/booking-utils';
import BookingLegend from './components/BookingLegend';
import BookingModal from './components/BookingModal';
import BookingSidebar from './components/BookingSidebar';
import SuccessModal from './components/SuccessModal';

export default function BookCourtPage() {
  const { currentUser, members, bookings, courts, events, addBooking, cancelBooking, showToast } = useApp();
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
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; courtName: string; date: string; time: string } | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [mobileDayIdx, setMobileDayIdx] = useState(() => new Date().getDay());

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); setContentKey(k => k + 1); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); setContentKey(k => k + 1); };

  useEffect(() => { setContentKey(k => k + 1); }, [selectedCourt, view]);

  const handleSlotClick = (courtId: number, courtName: string, date: string, time: string) => {
    const mine = isSlotMine(bookings, courtId, date, time, currentUser?.id);
    if (mine) {
      if (!canCancel(date, time)) {
        showToast(`Cannot cancel within ${FEES.cancelWindowHours} hours of booking`, 'error');
        return;
      }
      setCancelTarget({ id: mine.id, courtName, date, time });
      return;
    }
    if (isCourtInMaintenance(courts, courtId)) { showToast('This court is currently closed', 'error'); return; }
    if (isSlotBooked(bookings, courtId, date, time) || isSlotPast(date, time) || isCourtClosed(courtId, time)) return;
    setModalData({ courtId, courtName, date, time });
    setShowModal(true);
  };

  const confirmBooking = (isGuest: boolean, guestName: string, participants: { id: string; name: string }[]) => {
    if (!modalData || !currentUser || bookingLoading) return;
    if (isGuest && !guestName.trim()) return;
    const alreadyBooked = isSlotBooked(bookings, modalData.courtId, modalData.date, modalData.time);
    if (alreadyBooked) {
      showToast('This slot was just booked by someone else', 'error');
      setShowModal(false);
      return;
    }
    setBookingLoading(true);
    addBooking({
      id: generateId('b'),
      courtId: modalData.courtId,
      courtName: modalData.courtName,
      date: modalData.date,
      time: modalData.time,
      userId: currentUser.id,
      userName: currentUser.name,
      guestName: isGuest ? guestName.trim() : undefined,
      participants: participants.length > 0 ? participants : undefined,
      status: 'confirmed' as const,
      type: 'court' as const,
    });
    setBookingLoading(false);
    setShowModal(false);
    setBookingSuccess({ courtName: modalData.courtName, date: modalData.date, time: modalData.time, participants: participants.length > 0 ? participants : undefined });
    showToast(`Court booked for ${modalData.time}`);
  };

  const myUpcoming = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed' && !isSlotPast(b.date, b.time))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const courtConfig = COURTS_CONFIG.find(c => c.id === selectedCourt)!;
  const slotsForCourt = TIME_SLOTS.filter(t => !isCourtClosed(selectedCourt, t));

  const nextAvailableSlot = useMemo(() => {
    const today = new Date();
    for (let d = 0; d < 8; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      for (const time of slotsForCourt) {
        if (!isSlotPast(dateStr, time) && !isSlotBooked(bookings, selectedCourt, dateStr, time) && !isCourtClosed(selectedCourt, time)) {
          return { date: dateStr, time, courtId: selectedCourt, courtName: courtConfig.name };
        }
      }
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourt, bookings, slotsForCourt]);

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

  const hasBookingOnDate = (d: Date) => { const s = d.toISOString().split('T')[0]; return bookings.some(b => b.date === s && b.status === 'confirmed'); };
  const myBookingOnDate = (d: Date) => { const s = d.toISOString().split('T')[0]; return bookings.some(b => b.date === s && b.status === 'confirmed' && b.userId === currentUser?.id); };

  const handleSlotHover = (slotKey: string | null) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    if (slotKey) { tooltipTimeout.current = setTimeout(() => setHoveredSlot(slotKey), 300); } else { setHoveredSlot(null); }
  };

  const mobileDay = weekDays[mobileDayIdx] || weekDays[0];
  const mobileDateStr = mobileDay.toISOString().split('T')[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Book Court" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto animate-slideUp">

        {/* Top Bar: Court Tabs + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1">
            {COURTS_CONFIG.map(c => {
              const colors = COURT_COLORS[c.id];
              const active = selectedCourt === c.id;
              const closed = isCourtInMaintenance(courts, c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourt(c.id)}
                  className="relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shrink-0"
                  style={{
                    background: active ? '#2a2f1e' : closed ? '#f5f2eb' : '#fff',
                    color: active ? '#fff' : closed ? '#b5b0a5' : '#6b7266',
                    border: active ? '1px solid #2a2f1e' : '1px solid #e0dcd3',
                    boxShadow: active ? '0 2px 8px rgba(42,47,30,0.15)' : 'none',
                    opacity: closed && !active ? 0.7 : 1,
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: closed ? '#dc2626' : active ? '#d4e157' : colors.dot, opacity: active ? 1 : 0.5 }} />
                    {c.name}
                  </span>
                  <span className="block text-[0.6rem] font-normal mt-0.5" style={{ opacity: 0.7 }}>
                    {closed ? 'Closed' : c.floodlight ? 'til 10 PM' : 'til 8 PM'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl shrink-0" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
            <button onClick={() => setView('week')} className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200" style={{ background: view === 'week' ? '#6b7a3d' : 'transparent', color: view === 'week' ? '#fff' : '#6b7266' }}>Week</button>
            <button onClick={() => setView('calendar')} className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200" style={{ background: view === 'calendar' ? '#6b7a3d' : 'transparent', color: view === 'calendar' ? '#fff' : '#6b7266' }}>Month</button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Grid Area */}
          <div className="flex-1 min-w-0">
            <div key={contentKey} className="animate-fadeIn">

            {view === 'week' ? (
              <>
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevWeek} className="w-10 h-10 rounded-xl flex items-center justify-center border hover:bg-white transition-colors active:scale-95" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <span className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>
                    {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={nextWeek} className="w-10 h-10 rounded-xl flex items-center justify-center border hover:bg-white transition-colors active:scale-95" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>

                {/* Desktop: Full Week Grid */}
                <div className="hidden sm:block rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[600px]">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 p-3 text-[0.7rem] font-medium text-left border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3', color: '#9ca3a0', width: 72 }} />
                          {weekDays.map(day => {
                            const f = formatDateShort(day);
                            const today = isToday(day);
                            return (
                              <th key={day.toISOString()} className="p-2.5 text-center border-b" style={{ borderColor: '#f0ede6', background: today ? 'rgba(107, 122, 61, 0.06)' : '#faf8f3' }}>
                                <div className="text-[0.6rem] font-medium uppercase tracking-wider" style={{ color: '#9ca3a0' }}>{f.day}</div>
                                <div className={`text-base font-bold mt-0.5 ${today ? 'text-white' : ''}`} style={today ? { background: '#6b7a3d', borderRadius: '8px', padding: '2px 8px', display: 'inline-block' } : { color: '#2a2f1e' }}>{f.date}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => { const courtClosed = isCourtInMaintenance(courts, selectedCourt); return slotsForCourt.map(time => (
                          <tr key={time}>
                            <td className="sticky left-0 z-10 px-3 py-0 text-[0.7rem] font-medium border-b" style={{ borderColor: '#f7f5f0', background: '#faf8f3', color: '#9ca3a0' }}>{time}</td>
                            {weekDays.map(day => {
                              const dateStr = day.toISOString().split('T')[0];
                              const booked = isSlotBooked(bookings, selectedCourt, dateStr, time);
                              const mine = isSlotMine(bookings, selectedCourt, dateStr, time, currentUser?.id);
                              const past = isSlotPast(dateStr, time);
                              const closed = isCourtClosed(selectedCourt, time) || courtClosed;
                              const isProgram = booked?.type === 'program';
                              const isLesson = booked?.type === 'lesson';
                              const today = isToday(day);
                              const available = !booked && !past && !closed;
                              const slotKey = `${selectedCourt}-${dateStr}-${time}`;
                              const showTooltipHere = hoveredSlot === slotKey && booked && !mine;

                              return (
                                <td key={`${dateStr}-${time}`} className="border-b p-[3px] relative" style={{ borderColor: '#f7f5f0', background: courtClosed ? '#f5f2eb' : today ? 'rgba(107, 122, 61, 0.02)' : 'transparent' }}>
                                  <button
                                    onClick={() => handleSlotClick(selectedCourt, courtConfig.name, dateStr, time)}
                                    onMouseEnter={() => (booked && !mine) ? handleSlotHover(slotKey) : undefined}
                                    onMouseLeave={() => handleSlotHover(null)}
                                    disabled={(!mine && !!booked) || past || closed}
                                    className={`slot-cell w-full rounded-lg text-xs font-medium py-2.5 px-2 transition-all duration-150 relative overflow-hidden ${available ? 'hover:border-[#6b7a3d] hover:border-solid hover:bg-[#6b7a3d]/[0.04]' : ''}`}
                                    style={{
                                      background: mine ? '#6b7a3d' : courtClosed ? '#f0ede6' : isLesson ? 'rgba(59, 130, 246, 0.08)' : isProgram ? 'rgba(245, 158, 11, 0.08)' : booked ? '#f5f3ee' : 'transparent',
                                      color: mine ? '#fff' : courtClosed ? '#c5c0b5' : isLesson ? '#3b82f6' : isProgram ? '#d97706' : booked ? '#b5b0a5' : past || closed ? '#d5d0c8' : '#6b7a3d',
                                      cursor: available ? 'pointer' : mine ? 'pointer' : 'default',
                                      border: mine ? '1.5px solid #6b7a3d' : available ? '1.5px dashed #d4d0c7' : courtClosed ? '1.5px solid #e0dcd3' : '1.5px solid transparent',
                                    }}
                                  >
                                    {mine ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        Booked
                                      </span>
                                    ) : courtClosed ? (
                                      <span style={{ opacity: 0.4 }}>Closed</span>
                                    ) : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? (
                                      <span className="flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />Taken</span>
                                    ) : past || closed ? (
                                      <span style={{ opacity: 0.3 }}>—</span>
                                    ) : (
                                      <span className="slot-book-label opacity-0 transition-opacity duration-150" style={{ color: '#6b7a3d' }}>Book</span>
                                    )}
                                  </button>

                                  {showTooltipHere && booked && (
                                    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 rounded-lg text-[0.65rem] font-medium whitespace-nowrap shadow-lg pointer-events-none animate-fadeIn" style={{ background: '#2a2f1e', color: '#e8e4d9' }}>
                                      {isLesson ? 'Lesson' : isProgram ? 'Program session' : booked.userName}
                                      <span className="block text-[0.55rem] font-normal" style={{ color: '#9ca3a0' }}>{getTimeRange(time)}</span>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#2a2f1e' }} />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        )); })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile: Day-by-day vertical list */}
                <div className="sm:hidden">
                  <div className="flex gap-1 mb-4 overflow-x-auto pb-1 -mb-1">
                    {weekDays.map((day, idx) => {
                      const f = formatDateShort(day);
                      const today = isToday(day);
                      const active = mobileDayIdx === idx;
                      return (
                        <button key={day.toISOString()} onClick={() => setMobileDayIdx(idx)} className="flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 shrink-0" style={{ background: active ? '#2a2f1e' : today ? 'rgba(107, 122, 61, 0.08)' : '#fff', color: active ? '#fff' : today ? '#6b7a3d' : '#6b7266', border: active ? '1px solid #2a2f1e' : '1px solid #e0dcd3', minWidth: 48 }}>
                          <span className="text-[0.6rem] font-medium uppercase">{f.day}</span>
                          <span className="text-sm font-bold">{f.date}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                    <div className="p-3 border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3' }}>
                      <p className="text-xs font-semibold" style={{ color: '#2a2f1e' }}>{mobileDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      <p className="text-[0.65rem] mt-0.5" style={{ color: '#9ca3a0' }}>{courtConfig.name} &bull; {courtConfig.floodlight ? 'Lights til 10 PM' : 'Closes 8 PM'}</p>
                    </div>
                    <div className="divide-y" style={{ borderColor: '#f7f5f0' }}>
                      {(() => { const mobileCourtClosed = isCourtInMaintenance(courts, selectedCourt); return slotsForCourt.map(time => {
                        const booked = isSlotBooked(bookings, selectedCourt, mobileDateStr, time);
                        const mine = isSlotMine(bookings, selectedCourt, mobileDateStr, time, currentUser?.id);
                        const past = isSlotPast(mobileDateStr, time);
                        const available = !booked && !past && !mobileCourtClosed;
                        const isLesson = booked?.type === 'lesson';
                        const isProgram = booked?.type === 'program';

                        return (
                          <button key={time} onClick={() => (available || mine) ? handleSlotClick(selectedCourt, courtConfig.name, mobileDateStr, time) : undefined} disabled={!available && !mine} className="w-full flex items-center justify-between px-4 py-3.5 transition-colors" style={{ background: mine ? 'rgba(107, 122, 61, 0.06)' : mobileCourtClosed ? '#f5f2eb' : 'transparent', cursor: (available || mine) ? 'pointer' : 'default' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 rounded-full" style={{ background: mine ? '#6b7a3d' : mobileCourtClosed ? '#e0dcd3' : isLesson ? '#3b82f6' : isProgram ? '#d97706' : available ? '#d4d0c7' : '#f0ede6' }} />
                              <div className="text-left">
                                <span className="text-sm font-medium" style={{ color: (past && !mine) || mobileCourtClosed ? '#d1d5db' : '#2a2f1e' }}>{time}</span>
                                <span className="block text-[0.65rem]" style={{ color: '#9ca3a0' }}>{getTimeRange(time).split(' – ')[1] ? `til ${getTimeRange(time).split(' – ')[1]}` : ''}</span>
                              </div>
                            </div>
                            <span className="text-xs font-medium" style={{ color: mine ? '#6b7a3d' : mobileCourtClosed ? '#c5c0b5' : isLesson ? '#3b82f6' : isProgram ? '#d97706' : available ? '#9ca3a0' : '#d1d5db' }}>
                              {mine ? 'Your Booking ✓' : mobileCourtClosed ? 'Closed' : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? booked.userName : past ? 'Past' : 'Available'}
                            </span>
                          </button>
                        );
                      }); })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4"><BookingLegend /></div>
              </>
            ) : (
              /* Calendar View */
              <div className="rounded-2xl border p-5 sm:p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center border hover:bg-gray-50 transition-colors active:scale-95" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <span className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="w-10 h-10 rounded-xl flex items-center justify-center border hover:bg-gray-50 transition-colors active:scale-95" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
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
                    const hasEvent = events.some(e => e.date === dateStr);
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                    const selected = calSelectedDate === dateStr;
                    return (
                      <button key={dateStr} onClick={() => !isPast && setCalSelectedDate(selected ? null : dateStr)} disabled={isPast} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 relative" style={{ background: selected ? '#2a2f1e' : today ? 'rgba(107, 122, 61, 0.08)' : 'transparent', color: selected ? '#fff' : isPast ? '#d1d5db' : '#2a2f1e', cursor: isPast ? 'default' : 'pointer', fontWeight: today ? 700 : 500 }}>
                        <span className="text-sm">{day.getDate()}</span>
                        {(hasBooking || hasMine || hasEvent) && (
                          <div className="flex gap-0.5">
                            {hasMine && <span className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? '#d4e157' : '#6b7a3d' }} />}
                            {hasEvent && <span className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? 'rgba(212,225,87,0.7)' : '#d4e157' }} />}
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
                        const booked = isSlotBooked(bookings, selectedCourt, calSelectedDate, time);
                        const mine = isSlotMine(bookings, selectedCourt, calSelectedDate, time, currentUser?.id);
                        const past = isSlotPast(calSelectedDate, time);
                        const available = !booked && !past;
                        const isLesson = booked?.type === 'lesson';
                        const isProgram = booked?.type === 'program';

                        if (past) return null;

                        return (
                          <button key={time} onClick={() => available || mine ? handleSlotClick(selectedCourt, courtConfig.name, calSelectedDate, time) : undefined} disabled={!available && !mine} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150" style={{ background: mine ? '#6b7a3d' : isLesson ? 'rgba(59, 130, 246, 0.06)' : isProgram ? 'rgba(245, 158, 11, 0.06)' : available ? '#fff' : '#f9f7f3', color: mine ? '#fff' : available ? '#2a2f1e' : '#b5b0a5', border: mine ? '1px solid #6b7a3d' : isLesson ? '1px solid rgba(59, 130, 246, 0.15)' : isProgram ? '1px solid rgba(245, 158, 11, 0.15)' : available ? '1px solid #e0dcd3' : '1px solid #f0ede6', cursor: available || mine ? 'pointer' : 'default' }}>
                            <div>
                              <span className="font-medium">{time}</span>
                              <span className="text-[0.65rem] ml-2" style={{ color: mine ? 'rgba(255,255,255,0.6)' : '#c5c0b8' }}>{getTimeRange(time).split(' – ')[1] ? `→ ${getTimeRange(time).split(' – ')[1]}` : ''}</span>
                            </div>
                            <span className="text-xs font-medium" style={{ opacity: 0.8, color: mine ? '#fff' : isLesson ? '#3b82f6' : isProgram ? '#d97706' : booked ? '#b5b0a5' : '#9ca3a0' }}>
                              {mine ? 'Your Booking ✓' : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? booked.userName : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t" style={{ borderColor: '#f0ede6' }}><BookingLegend /></div>
              </div>
            )}

            </div>
          </div>

          {/* Sidebar */}
          <BookingSidebar
            myUpcoming={myUpcoming}
            nextAvailableSlot={nextAvailableSlot}
            courtName={courtConfig.name}
            onSlotClick={handleSlotClick}
            onCancelBooking={(id) => cancelBooking(id)}
            showToast={showToast}
          />
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && modalData && (
        <BookingModal
          modalData={modalData}
          members={members}
          currentUser={currentUser}
          onConfirm={confirmBooking}
          onCancel={() => setShowModal(false)}
          loading={bookingLoading}
        />
      )}

      {/* Success Modal */}
      {bookingSuccess && (
        <SuccessModal
          courtName={bookingSuccess.courtName}
          date={bookingSuccess.date}
          time={bookingSuccess.time}
          participants={bookingSuccess.participants}
          onClose={() => setBookingSuccess(null)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setCancelTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-scaleIn" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <svg className="w-6 h-6" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-center font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Cancel Booking?</h3>
            <p className="text-center text-sm mb-5" style={{ color: '#6b7266' }}>
              {cancelTarget.courtName} on {new Date(cancelTarget.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {cancelTarget.time}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: '#f5f2eb', color: '#2a2f1e' }}
              >
                Keep Booking
              </button>
              <button
                onClick={() => { cancelBooking(cancelTarget.id); showToast('Booking cancelled'); setCancelTarget(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: '#ef4444' }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
