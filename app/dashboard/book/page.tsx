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
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
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
    // Close hour is lights-out; last bookable slot starts 1 hour before
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
    // Check for double-booking
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] };
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const courtsToShow = selectedCourt ? COURTS_CONFIG.filter(c => c.id === selectedCourt) : [...COURTS_CONFIG];

  // Calendar view helpers
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Book Court" />

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto animate-slideUp">

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('week')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: view === 'week' ? '#6b7a3d' : '#fff', color: view === 'week' ? '#fff' : '#2a2f1e', border: view === 'week' ? 'none' : '1px solid #e0dcd3' }}
            >
              Week View
            </button>
            <button
              onClick={() => setView('calendar')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: view === 'calendar' ? '#6b7a3d' : '#fff', color: view === 'calendar' ? '#fff' : '#2a2f1e', border: view === 'calendar' ? 'none' : '1px solid #e0dcd3' }}
            >
              Calendar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#6b7266' }}>Court:</span>
            <select
              value={selectedCourt || ''}
              onChange={(e) => setSelectedCourt(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
              style={{ borderColor: '#e0dcd3', background: '#fff', color: '#2a2f1e' }}
            >
              <option value="">All Courts</option>
              {COURTS_CONFIG.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">

          {/* Main Grid Area */}
          <div className="flex-1 min-w-0">

            {view === 'week' ? (
              <>
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevWeek} className="p-2 rounded-lg border hover:bg-white transition-colors" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <span className="font-medium text-sm" style={{ color: '#2a2f1e' }}>
                    {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={nextWeek} className="p-2 rounded-lg border hover:bg-white transition-colors" style={{ borderColor: '#e0dcd3' }}>
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                {/* Week Grid */}
                <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[700px]">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 p-3 text-xs font-medium text-left border-b border-r" style={{ borderColor: '#f0ede6', background: '#faf8f3', color: '#6b7266', width: 80 }}>
                            Time
                          </th>
                          {weekDays.map(day => {
                            const f = formatDateShort(day);
                            const today = isToday(day);
                            return (
                              <th
                                key={day.toISOString()}
                                className="p-3 text-center border-b border-r last:border-r-0"
                                style={{ borderColor: '#f0ede6', background: today ? 'rgba(107, 122, 61, 0.08)' : '#faf8f3' }}
                              >
                                <div className="text-[0.65rem] font-medium uppercase" style={{ color: '#6b7266' }}>{f.day}</div>
                                <div className="text-sm font-bold" style={{ color: today ? '#6b7a3d' : '#2a2f1e' }}>{f.date}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_SLOTS.map(time => (
                          <tr key={time}>
                            <td className="sticky left-0 z-10 px-3 py-1.5 text-xs font-medium border-b border-r" style={{ borderColor: '#f0ede6', background: '#faf8f3', color: '#6b7266' }}>
                              {time}
                            </td>
                            {weekDays.map(day => {
                              const dateStr = day.toISOString().split('T')[0];
                              const past = isSlotPast(dateStr, time);
                              return (
                                <td key={`${dateStr}-${time}`} className="border-b border-r last:border-r-0 p-0.5" style={{ borderColor: '#f0ede6' }}>
                                  <div className="flex gap-0.5">
                                    {courtsToShow.map(court => {
                                      const booked = isSlotBooked(court.id, dateStr, time);
                                      const mine = isSlotMine(court.id, dateStr, time);
                                      const closed = isCourtClosed(court.id, time);

                                      const isProgram = booked?.type === 'program';
                                      let bg = '#f0fdf4';
                                      let border = '#bbf7d0';
                                      let cursor = 'pointer';

                                      if (mine) { bg = 'rgba(107, 122, 61, 0.15)'; border = '#6b7a3d'; }
                                      else if (isProgram) { bg = 'rgba(245, 158, 11, 0.1)'; border = '#fbbf24'; cursor = 'default'; }
                                      else if (booked) { bg = '#f3f4f6'; border = '#d1d5db'; cursor = 'default'; }
                                      else if (past || closed) { bg = '#fafafa'; border = '#e5e7eb'; cursor = 'default'; }

                                      return (
                                        <button
                                          key={court.id}
                                          onClick={() => handleSlotClick(court.id, court.name, dateStr, time)}
                                          disabled={(!mine && booked !== undefined && !!booked) || past || closed}
                                          className="flex-1 rounded text-[0.55rem] font-medium py-1.5 px-1 transition-colors truncate"
                                          style={{ background: bg, border: `1px solid ${border}`, cursor, minHeight: 28, color: mine ? '#6b7a3d' : isProgram ? '#d97706' : booked ? '#9ca3af' : past || closed ? '#d1d5db' : '#16a34a' }}
                                          title={`${court.name} - ${time} - ${mine ? 'Your booking (click to cancel)' : isProgram ? 'Program' : booked ? 'Booked' : past ? 'Past' : closed ? 'Closed' : 'Available'}`}
                                        >
                                          {courtsToShow.length > 1 ? (isProgram ? 'P' : `C${court.id}`) : (mine ? 'Mine' : isProgram ? 'Prog' : booked ? '—' : '')}
                                        </button>
                                      );
                                    })}
                                  </div>
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
                <div className="flex flex-wrap gap-4 mt-4 text-xs" style={{ color: '#6b7266' }}>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }} /> Available</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border" style={{ background: 'rgba(107, 122, 61, 0.15)', borderColor: '#6b7a3d' }} /> My Booking</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border" style={{ background: '#f3f4f6', borderColor: '#d1d5db' }} /> Booked</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: '#fbbf24' }} /> Program</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border" style={{ background: '#fafafa', borderColor: '#e5e7eb' }} /> Past / Closed</div>
                </div>
              </>
            ) : (
              /* Calendar View */
              <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                    className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e0dcd3' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <span className="font-semibold" style={{ color: '#2a2f1e' }}>
                    {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                    className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e0dcd3' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#2a2f1e" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium py-2" style={{ color: '#6b7266' }}>{d}</div>
                  ))}
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const dateStr = day.toISOString().split('T')[0];
                    const today = isToday(day);
                    const hasBooking = hasBookingOnDate(day);
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                    const selected = calSelectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isPast && setCalSelectedDate(selected ? null : dateStr)}
                        disabled={isPast}
                        className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors relative"
                        style={{
                          background: selected ? '#6b7a3d' : today ? 'rgba(107, 122, 61, 0.08)' : 'transparent',
                          color: selected ? '#fff' : isPast ? '#d1d5db' : '#2a2f1e',
                          cursor: isPast ? 'default' : 'pointer',
                        }}
                      >
                        <span className="text-sm font-medium">{day.getDate()}</span>
                        {hasBooking && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? '#fff' : '#6b7a3d' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected date slots */}
                {calSelectedDate && (
                  <div className="mt-6 pt-6 border-t" style={{ borderColor: '#f0ede6' }}>
                    <h4 className="font-medium text-sm mb-3" style={{ color: '#2a2f1e' }}>
                      {new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {TIME_SLOTS.map(time => {
                        const availableCourts = (selectedCourt ? COURTS_CONFIG.filter(c => c.id === selectedCourt) : COURTS_CONFIG).filter(c =>
                          !isSlotBooked(c.id, calSelectedDate, time) &&
                          !isSlotPast(calSelectedDate, time) &&
                          !isCourtClosed(c.id, time)
                        );
                        if (availableCourts.length === 0) return null;
                        return (
                          <div key={time} className="rounded-xl p-3 border" style={{ borderColor: '#e0dcd3' }}>
                            <p className="font-medium text-sm mb-1.5" style={{ color: '#2a2f1e' }}>{time}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {availableCourts.map(court => (
                                <button
                                  key={court.id}
                                  onClick={() => {
                                    setModalData({ courtId: court.id, courtName: court.name, date: calSelectedDate, time });
                                    setIsGuest(false);
                                    setGuestName('');
                                    setSelectedParticipants([]);
                                    setParticipantSearch('');
                                    setShowModal(true);
                                  }}
                                  className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[rgba(107,122,61,0.08)]"
                                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}
                                >
                                  {court.name}
                                </button>
                              ))}
                            </div>
                          </div>
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
              <h3 className="font-semibold text-sm mb-4" style={{ color: '#2a2f1e' }}>My Bookings</h3>
              {myUpcoming.length === 0 ? (
                <p className="text-sm" style={{ color: '#6b7266' }}>No upcoming bookings</p>
              ) : (
                <div className="space-y-3">
                  {myUpcoming.slice(0, 5).map(b => (
                    <div key={b.id} className="rounded-xl p-3 border" style={{ borderColor: '#f0ede6' }}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{b.courtName}</p>
                        <button
                          onClick={() => {
                            if (!canCancel(b.date, b.time)) {
                              showToast(`Cannot cancel within ${FEES.cancelWindowHours}h of booking`, 'error');
                              return;
                            }
                            cancelBooking(b.id);
                            showToast('Booking cancelled');
                          }}
                          className="text-xs px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                          style={{ color: '#ef4444' }}
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#6b7266' }}>
                        {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {b.time}
                      </p>
                      {b.guestName && (
                        <p className="text-xs mt-0.5" style={{ color: '#d97706' }}>Guest: {b.guestName}</p>
                      )}
                      {b.participants && b.participants.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: '#6b7a3d' }}>With: {b.participants.map(p => p.name).join(', ')}</p>
                      )}
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
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff' }}>
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
          <div className="rounded-2xl p-6 w-full max-w-sm text-center" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
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
