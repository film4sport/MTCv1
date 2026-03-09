'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { TIME_SLOTS, COURTS_CONFIG, FEES, BOOKING_RULES } from '../lib/types';
import { generateId } from '../lib/utils';
import {
  ViewMode, COURT_COLORS, getTimeRange, formatDuration, parseTimeMinutes,
  isSlotBooked, isSlotMine, isSlotPast, isCourtClosed, isCourtInMaintenance, isSlotBlocked, canCancel, canBookDate,
  formatDateShort, isToday, toLocalDateStr,
  type CourtBlockSlot,
} from './components/booking-utils';
import BookingLegend from './components/BookingLegend';
import BookingSidebar from './components/BookingSidebar';

const BookingModal = dynamic(() => import('./components/BookingModal'), { ssr: false });
const SuccessModal = dynamic(() => import('./components/SuccessModal'), { ssr: false });

export default function BookCourtPage() {
  const searchParams = useSearchParams();
  const { currentUser, members, bookings, courts, events, addBooking, cancelBooking, activeProfile, activeDisplayName } = useApp();
  const { showToast } = useToast();
  const [bookingSuccess, setBookingSuccess] = useState<{ courtName: string; date: string; time: string; participants?: { id: string; name: string }[]; duration?: number; matchType?: 'singles' | 'doubles' } | null>(null);
  const [view, setView] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d; // Rolling 7-day view: starts from today
  });
  const [selectedCourt, setSelectedCourt] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ courtId: number; courtName: string; date: string; time: string } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; courtName: string; date: string; time: string; participants?: string[] } | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const nowLineRef = useRef<HTMLTableRowElement | null>(null);
  const [mobileDayIdx, setMobileDayIdx] = useState(0); // Today is always first in rolling view
  const [courtBlocks, setCourtBlocks] = useState<CourtBlockSlot[]>([]);

  // Pre-fill partner from query param (e.g. from Find Partner → Book)
  const partnerParam = searchParams.get('partner');
  const partnerNameParam = searchParams.get('partnerName');
  const initialParticipants = useMemo(() => {
    if (partnerParam && partnerNameParam) {
      return [{ id: partnerParam, name: partnerNameParam }];
    }
    return undefined;
  }, [partnerParam, partnerNameParam]);

  // Fetch court blocks from Supabase
  useEffect(() => {
    import('../lib/db').then(db => {
      db.fetchCourtBlocks().then(blocks => setCourtBlocks(blocks as CourtBlockSlot[])).catch(() => {});
    });
  }, [bookings]); // re-fetch when bookings change (piggyback on realtime)

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

  // Pre-select date from URL params (e.g. ?date=2026-03-15)
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current) return;
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      prefilledRef.current = true;
      const target = new Date(dateParam + 'T00:00:00');
      if (!isNaN(target.getTime())) {
        // Navigate rolling view to start from that date
        setWeekStart(target);
        setMobileDayIdx(0);
        // Also set calendar view
        setCalMonth(new Date(target.getFullYear(), target.getMonth()));
        setCalSelectedDate(dateParam);
      }
    }
  }, [searchParams]);

  // Esc key closes cancel confirmation dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && cancelTarget) setCancelTarget(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cancelTarget]);

  const handleSlotClick = (courtId: number, courtName: string, date: string, time: string) => {
    const mine = isSlotMine(bookings, courtId, date, time, currentUser?.id);
    if (mine) {
      if (!canCancel(date, time)) {
        showToast('Cannot cancel a booking that has already started', 'error');
        return;
      }
      setCancelTarget({ id: mine.id, courtName, date, time, participants: mine.participants?.map(p => p.name) });
      return;
    }
    if (isCourtInMaintenance(courts, courtId)) { showToast('This court is currently closed', 'error'); return; }
    if (isSlotBooked(bookings, courtId, date, time) || isSlotPast(date, time) || isCourtClosed(courtId, time)) return;
    if (!canBookDate(date)) {
      showToast(`Bookings can only be made up to ${BOOKING_RULES.maxAdvanceDays} days in advance`, 'error');
      return;
    }
    setModalData({ courtId, courtName, date, time });
    setShowModal(true);
  };

  const confirmBooking = (isGuest: boolean, guestName: string, participants: { id: string; name: string }[], matchType: 'singles' | 'doubles', duration: number) => {
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
      matchType,
      duration,
      bookedFor: activeProfile.type === 'family_member' ? activeDisplayName : undefined,
    });
    setBookingLoading(false);
    setShowModal(false);
    setBookingSuccess({ courtName: modalData.courtName, date: modalData.date, time: modalData.time, participants: participants.length > 0 ? participants : undefined, duration, matchType });
    showToast(`Court booked: ${getTimeRange(modalData.time, duration)}`);
  };

  const myUpcoming = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed' && !isSlotPast(b.date, b.time))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  const hasBookingOnDate = (d: Date) => { const s = toLocalDateStr(d); return bookings.some(b => b.date === s && b.status === 'confirmed'); };
  const myBookingOnDate = (d: Date) => { const s = toLocalDateStr(d); return bookings.some(b => b.date === s && b.status === 'confirmed' && b.userId === currentUser?.id); };

  // Parse event time like "1:00 PM - 4:00 PM" into start/end slot indices; returns null for unparseable times ("Evening", "All Day", "Dates TBA")
  const parseEventTimeRange = (timeStr: string): { startIdx: number; endIdx: number } | null => {
    const match = timeStr.match(/^(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)$/i);
    if (!match) return null;
    const startTime = match[1].replace(/\s+/g, ' ').trim();
    const endTime = match[2].replace(/\s+/g, ' ').trim();
    // Find closest TIME_SLOTS index for start and end
    const startIdx = TIME_SLOTS.findIndex(t => parseTimeMinutes(t) >= parseTimeMinutes(startTime));
    const endMinutes = parseTimeMinutes(endTime);
    let endIdx = TIME_SLOTS.findIndex(t => parseTimeMinutes(t) >= endMinutes);
    if (endIdx < 0) endIdx = TIME_SLOTS.length; // event goes beyond last slot
    if (startIdx < 0) return null;
    return { startIdx, endIdx };
  };

  // Determine which court IDs an event occupies based on location
  const getEventCourts = (location: string): number[] => {
    const loc = location.toLowerCase();
    if (loc.includes('all courts')) return [1, 2, 3, 4];
    if (loc.includes('courts 1-2') || loc.includes('court 1-2')) return [1, 2];
    if (loc.includes('courts 3-4') || loc.includes('court 3-4')) return [3, 4];
    if (loc.includes('court 1')) return [1];
    if (loc.includes('court 2')) return [2];
    if (loc.includes('court 3')) return [3];
    if (loc.includes('court 4')) return [4];
    // Clubhouse or unknown — no courts blocked
    return [];
  };

  // Check if a court+time slot is blocked by an event on a given date
  const getEventForSlot = (courtId: number, dateStr: string, time: string) => {
    const tIdx = TIME_SLOTS.indexOf(time as typeof TIME_SLOTS[number]);
    return events.find(e => {
      if (e.date !== dateStr) return false;
      const courts = getEventCourts(e.location);
      if (!courts.includes(courtId)) return false;
      const range = parseEventTimeRange(e.time);
      if (!range) return null; // can't determine — don't block
      return tIdx >= range.startIdx && tIdx < range.endIdx;
    }) || null;
  };

  const eventsForDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  // Event type color mapping — matches landing page Schedule.tsx dotColors
  const eventTypeColors: Record<string, { accent: string; bg: string; border: string; text: string }> = {
    social: { accent: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.25)', text: '#92400e' },
    match: { accent: '#9333ea', bg: 'rgba(147, 51, 234, 0.08)', border: 'rgba(147, 51, 234, 0.25)', text: '#6b21a8' },
    tournament: { accent: '#3a3a3a', bg: 'rgba(58, 58, 58, 0.08)', border: 'rgba(58, 58, 58, 0.25)', text: '#2a2a2a' },
    camp: { accent: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)', text: '#991b1b' },
    lesson: { accent: '#60a5fa', bg: 'rgba(96, 165, 250, 0.08)', border: 'rgba(96, 165, 250, 0.25)', text: '#1d4ed8' },
  };
  const getEventColors = (type: string) => eventTypeColors[type] || eventTypeColors.social;

  const handleSlotHover = (slotKey: string | null) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    if (slotKey) { tooltipTimeout.current = setTimeout(() => setHoveredSlot(slotKey), 300); } else { setHoveredSlot(null); }
  };

  const mobileDay = weekDays[mobileDayIdx] || weekDays[0];
  const mobileDateStr = toLocalDateStr(mobileDay);

  // Now-line: current time indicator for today
  const [nowMinutes, setNowMinutes] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => {
    const iv = setInterval(() => { const d = new Date(); setNowMinutes(d.getHours() * 60 + d.getMinutes()); }, 60000);
    return () => clearInterval(iv);
  }, []);
  const isNowSlot = (dateStr: string, time: string, nextTime?: string) => {
    if (!isToday(new Date(dateStr + 'T00:00:00'))) return false;
    const slotMins = parseTimeMinutes(time);
    const nextMins = nextTime ? parseTimeMinutes(nextTime) : slotMins + 30;
    return nowMinutes >= slotMins && nowMinutes < nextMins;
  };

  // Auto-scroll to the now-line (red line) when the grid renders for today
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nowLineRef.current) {
        nowLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [mobileDayIdx, contentKey, view]);

  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Book Court" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto animate-slideUp">

        {/* Top Bar: View Toggle */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#2a2f1e' }}>
            <svg className="w-4 h-4" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            All Courts
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl shrink-0" style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
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

                {/* Day Tabs — select which day to show all 4 courts for */}
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                  {weekDays.map((day, idx) => {
                    const f = formatDateShort(day);
                    const today = isToday(day);
                    const active = mobileDayIdx === idx;
                    const dayEvents = eventsForDate(toLocalDateStr(day));
                    return (
                      <button key={day.toISOString()} onClick={() => { setMobileDayIdx(idx); setContentKey(k => k + 1); }} className="flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 shrink-0 flex-1 min-w-0" style={{ background: active ? '#2a2f1e' : today ? 'rgba(107, 122, 61, 0.08)' : '#fff', color: active ? '#fff' : today ? '#6b7a3d' : '#6b7266', border: active ? '1px solid #2a2f1e' : '1px solid #e0dcd3' }}>
                        <span className="text-[0.6rem] font-medium uppercase">{f.day}</span>
                        <span className="text-sm font-bold">{f.date}</span>
                        {dayEvents.length > 0 && <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: '#d97706' }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Event banner for selected day */}
                {(() => {
                  const selectedDate = toLocalDateStr(weekDays[mobileDayIdx] || weekDays[0]);
                  const dayEvts = eventsForDate(selectedDate);
                  if (dayEvts.length === 0) return null;
                  return (
                    <div className="mb-4 space-y-2">
                      {dayEvts.map(evt => {
                        const ec = getEventColors(evt.type);
                        return (
                        <div key={evt.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: ec.bg, borderColor: ec.border }}>
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke={ec.accent} strokeWidth="1.5"><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8h14" /><path d="M7 4V2M13 4V2" strokeLinecap="round" /></svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>{evt.title}</p>
                            <p className="text-[0.65rem]" style={{ color: '#6b7266' }}>{evt.time} · {evt.location}</p>
                          </div>
                          {evt.spotsTotal && <span className="text-[0.6rem] px-2 py-1 rounded-lg" style={{ background: '#f5f2eb', color: '#6b7266' }}>{evt.spotsTaken || 0}/{evt.spotsTotal}</span>}
                        </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* All Courts Grid for selected day */}
                {(() => {
                  const selectedDate = toLocalDateStr(weekDays[mobileDayIdx] || weekDays[0]);
                  return (
                    <div className="glass-card rounded-2xl border overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse table-fixed min-w-[500px]">
                          <thead>
                            <tr>
                              <th className="sticky left-0 z-10 p-3 text-[0.7rem] font-medium text-left border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3', color: '#9ca3a0', width: 72 }}>Time</th>
                              {COURTS_CONFIG.map(c => {
                                const closed = isCourtInMaintenance(courts, c.id);
                                return (
                                  <th key={c.id} className="p-2.5 text-center border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3' }}>
                                    <div className="flex items-center justify-center gap-1.5">
                                      {closed ? (
                                        <span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
                                      ) : (
                                        <span className="w-2 h-2 rounded-full" style={{ background: '#6b7a3d' }} />
                                      )}
                                      <span className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>{c.name}</span>
                                      {c.floodlight && !closed && (
                                        <svg className="inline-block w-4 h-4 -mt-px" viewBox="0 0 24 24" fill="none" stroke="#e8b624" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" fill="rgba(232,182,36,0.2)"/></svg>
                                      )}
                                    </div>
                                    <div className="text-[0.6rem] font-normal mt-0.5" style={{ color: '#9ca3a0' }}>
                                      {closed ? 'Closed' : c.floodlight ? 'Lit til 10 PM' : 'til 8 PM'}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {TIME_SLOTS.map((time, tIdx) => {
                              const nowRow = isNowSlot(selectedDate, time, TIME_SLOTS[tIdx + 1]);
                              return (
                              <tr key={time} ref={nowRow ? nowLineRef : undefined} className="relative">
                                {nowRow && <td colSpan={5} className="absolute top-0 left-0 right-0 h-0 z-20 pointer-events-none" style={{ borderTop: '2px solid #ff5a5f', boxShadow: '0 0 6px rgba(255, 90, 95, 0.4)' }} />}
                                <td className="sticky left-0 z-10 px-3 py-0 text-[0.7rem] font-medium border-b" style={{ borderColor: '#f7f5f0', background: '#faf8f3', color: nowRow ? '#ff5a5f' : '#9ca3a0', fontWeight: nowRow ? 700 : 500 }}>{time}</td>
                                {COURTS_CONFIG.map(c => {
                                  const courtClosed = isCourtInMaintenance(courts, c.id);
                                  const slotClosed = isCourtClosed(c.id, time);
                                  const blocked = isSlotBlocked(courtBlocks, c.id, selectedDate, time);
                                  const booked = isSlotBooked(bookings, c.id, selectedDate, time);
                                  const mine = isSlotMine(bookings, c.id, selectedDate, time, currentUser?.id);
                                  const past = isSlotPast(selectedDate, time);
                                  const beyondWindow = !canBookDate(selectedDate);
                                  const isProgram = booked?.type === 'program';
                                  const isLesson = booked?.type === 'lesson';
                                  const eventSlot = !booked ? getEventForSlot(c.id, selectedDate, time) : null;
                                  const available = !booked && !eventSlot && !blocked && !past && !courtClosed && !slotClosed && !beyondWindow;
                                  const colors = COURT_COLORS[c.id];
                                  const slotKey = `wk-${c.id}-${selectedDate}-${time}`;
                                  const showTooltipHere = hoveredSlot === slotKey && (booked || eventSlot || blocked) && !mine;

                                  return (
                                    <td key={c.id} className="border-b p-[3px] relative" style={{ borderColor: '#f7f5f0', background: courtClosed || slotClosed ? '#f5f2eb' : blocked ? 'repeating-linear-gradient(-45deg, #f5f2eb, #f5f2eb 4px, #ebe8e0 4px, #ebe8e0 8px)' : 'transparent', height: 44 }}>
                                      <button
                                        onClick={() => !eventSlot && !blocked && handleSlotClick(c.id, c.name, selectedDate, time)}
                                        onMouseEnter={() => ((booked && !mine) || eventSlot || blocked) ? handleSlotHover(slotKey) : undefined}
                                        onMouseLeave={() => handleSlotHover(null)}
                                        disabled={(!mine && !!booked) || !!eventSlot || !!blocked || past || courtClosed || slotClosed}
                                        className={`slot-cell w-full h-full rounded-lg text-xs font-medium px-2 transition-all duration-150 relative overflow-hidden ${mine ? 'slot-booked-pulse' : ''} ${available ? 'hover:border-[#d97706] hover:border-solid hover:bg-[#d97706]/[0.04]' : ''}`}
                                        style={{
                                          background: mine ? colors.accent : courtClosed || slotClosed ? '#f0ede6' : blocked ? 'rgba(220, 38, 38, 0.06)' : eventSlot ? getEventColors(eventSlot.type).bg : isLesson ? 'rgba(59, 130, 246, 0.08)' : isProgram ? 'rgba(245, 158, 11, 0.08)' : booked ? '#f5f3ee' : 'transparent',
                                          color: mine ? '#fff' : courtClosed || slotClosed ? '#c5c0b5' : blocked ? '#dc2626' : eventSlot ? getEventColors(eventSlot.type).text : isLesson ? '#3b82f6' : isProgram ? '#d97706' : booked ? '#b5b0a5' : past || beyondWindow ? '#d5d0c8' : colors.accent,
                                          cursor: available ? 'pointer' : mine ? 'pointer' : 'default',
                                          border: mine ? `1.5px solid ${colors.accent}` : blocked ? '1.5px solid rgba(220, 38, 38, 0.2)' : eventSlot ? `1.5px solid ${getEventColors(eventSlot.type).border}` : available ? '1.5px dashed #d4d0c7' : '1.5px solid transparent',
                                        }}
                                      >
                                        {mine ? (
                                          <span className="flex items-center justify-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            You
                                          </span>
                                        ) : courtClosed || slotClosed ? (
                                          <span style={{ opacity: 0.4 }}>—</span>
                                        ) : blocked ? (
                                          <span className="flex items-center justify-center gap-1 truncate" title={blocked.reason + (blocked.notes ? ': ' + blocked.notes : '')}>
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                                            {blocked.reason.length > 10 ? blocked.reason.slice(0, 9) + '…' : blocked.reason}
                                          </span>
                                        ) : eventSlot ? (
                                          <span className="flex items-center justify-center gap-1 truncate"><span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: getEventColors(eventSlot.type).accent }} /> {eventSlot.title.length > 12 ? eventSlot.title.slice(0, 12) + '…' : eventSlot.title}</span>
                                        ) : isLesson ? 'Lesson' : isProgram ? 'Program' : booked ? (
                                          <span className="flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />Taken</span>
                                        ) : past || beyondWindow ? (
                                          <span style={{ opacity: 0.3 }}>—</span>
                                        ) : (
                                          <span className="slot-book-label opacity-0 transition-opacity duration-150" style={{ color: '#d97706' }}>Book</span>
                                        )}
                                      </button>

                                      {showTooltipHere && (booked || eventSlot || blocked) && (
                                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 rounded-lg text-[0.65rem] font-medium whitespace-nowrap shadow-lg pointer-events-none animate-fadeIn" style={{ background: '#2a2f1e', color: '#e8e4d9' }}>
                                          {blocked ? blocked.reason : eventSlot ? eventSlot.title : isLesson ? 'Lesson' : isProgram ? 'Program session' : 'Booked'}
                                          <span className="block text-[0.55rem] font-normal" style={{ color: '#9ca3a0' }}>{blocked ? (blocked.notes || 'Court unavailable') : eventSlot ? eventSlot.time : getTimeRange(time, booked?.duration)}</span>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#2a2f1e' }} />
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
                <div className="mt-4"><BookingLegend /></div>
              </>
            ) : (
              /* Calendar View */
              <div className="glass-card rounded-2xl border p-5 sm:p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
                    const dateStr = toLocalDateStr(day);
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
                          <div className="flex gap-1">
                            {hasMine && <span className="w-2 h-2 rounded-full calendar-dot-bounce" style={{ background: selected ? '#d4e157' : '#6b7a3d' }} />}
                            {hasEvent && <span className="w-2 h-2 rounded-full calendar-dot-bounce" style={{ background: selected ? 'rgba(217,119,6,0.7)' : '#d97706', animationDelay: '0.3s' }} />}
                            {hasBooking && !hasMine && <span className="w-2 h-2 rounded-full calendar-dot-bounce" style={{ background: selected ? 'rgba(255,255,255,0.4)' : '#d4d0c7', animationDelay: '0.6s' }} />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected date: events + all courts grid */}
                {calSelectedDate && (
                  <div className="mt-5 pt-5 border-t" style={{ borderColor: '#f0ede6' }}>
                    <h4 className="font-semibold text-sm mb-3" style={{ color: '#2a2f1e' }}>
                      {new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>

                    {/* Event details for this date */}
                    {eventsForDate(calSelectedDate).length > 0 && (
                      <div className="mb-4 space-y-2">
                        {eventsForDate(calSelectedDate).map(evt => {
                          const ec = getEventColors(evt.type);
                          return (
                          <div key={evt.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: ec.bg, borderColor: ec.border }}>
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none" stroke={ec.accent} strokeWidth="1.5"><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8h14" /><path d="M7 4V2M13 4V2" strokeLinecap="round" /></svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>{evt.title}</p>
                              <p className="text-[0.65rem]" style={{ color: '#6b7266' }}>{evt.time} · {evt.location}</p>
                              <p className="text-[0.65rem] mt-1" style={{ color: '#9ca3a0' }}>{evt.description}</p>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    {/* All Courts Grid */}
                    <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse table-fixed min-w-[420px]">
                          <thead>
                            <tr>
                              <th className="sticky left-0 z-10 p-2.5 text-[0.65rem] font-medium text-left border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3', color: '#9ca3a0', width: 64 }}>Time</th>
                              {COURTS_CONFIG.map(c => {
                                const closed = isCourtInMaintenance(courts, c.id);
                                return (
                                  <th key={c.id} className="p-2 text-center border-b" style={{ borderColor: '#f0ede6', background: '#faf8f3' }}>
                                    <span className="text-[0.7rem] font-semibold" style={{ color: '#2a2f1e' }}>{c.name}</span>
                                    <div className="text-[0.55rem] font-normal" style={{ color: '#9ca3a0' }}>{closed ? 'Closed' : c.floodlight ? 'til 10 PM' : 'til 8 PM'}</div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {TIME_SLOTS.map(time => {
                              const past = isSlotPast(calSelectedDate, time);
                              if (past) return null;
                              return (
                                <tr key={time}>
                                  <td className="sticky left-0 z-10 px-2.5 py-0 text-[0.65rem] font-medium border-b" style={{ borderColor: '#f7f5f0', background: '#faf8f3', color: '#9ca3a0' }}>{time}</td>
                                  {COURTS_CONFIG.map(c => {
                                    const courtClosed = isCourtInMaintenance(courts, c.id);
                                    const slotClosed = isCourtClosed(c.id, time);
                                    const booked = isSlotBooked(bookings, c.id, calSelectedDate, time);
                                    const mine = isSlotMine(bookings, c.id, calSelectedDate, time, currentUser?.id);
                                    const calBeyondWindow = !canBookDate(calSelectedDate);
                                    const isProgram = booked?.type === 'program';
                                    const isLesson = booked?.type === 'lesson';
                                    const eventSlot = !booked ? getEventForSlot(c.id, calSelectedDate, time) : null;
                                    const available = !booked && !eventSlot && !past && !courtClosed && !slotClosed && !calBeyondWindow;
                                    const colors = COURT_COLORS[c.id];

                                    return (
                                      <td key={c.id} className="border-b p-[2px]" style={{ borderColor: '#f7f5f0', background: courtClosed || slotClosed ? '#f5f2eb' : 'transparent', height: 36 }}>
                                        <button
                                          onClick={() => !eventSlot && (available || mine) && handleSlotClick(c.id, c.name, calSelectedDate, time)}
                                          disabled={!available && !mine}
                                          className={`w-full h-full rounded-lg text-[0.65rem] font-medium transition-all duration-150 ${mine ? 'slot-booked-pulse' : ''} ${available ? 'hover:border-[#d97706] hover:border-solid hover:bg-[#d97706]/[0.04]' : ''}`}
                                          style={{
                                            background: mine ? colors.accent : eventSlot ? getEventColors(eventSlot.type).bg : isLesson ? 'rgba(59, 130, 246, 0.06)' : isProgram ? 'rgba(245, 158, 11, 0.06)' : courtClosed || slotClosed ? '#f0ede6' : 'transparent',
                                            color: mine ? '#fff' : eventSlot ? getEventColors(eventSlot.type).text : isLesson ? '#3b82f6' : isProgram ? '#d97706' : booked ? '#b5b0a5' : available ? colors.accent : '#d5d0c8',
                                            cursor: available || mine ? 'pointer' : 'default',
                                            border: mine ? `1.5px solid ${colors.accent}` : eventSlot ? `1.5px solid ${getEventColors(eventSlot.type).border}` : available ? '1.5px dashed #d4d0c7' : '1.5px solid transparent',
                                          }}
                                        >
                                          {mine ? '✓' : eventSlot ? 'E' : isLesson ? 'L' : isProgram ? 'P' : booked ? '•' : courtClosed || slotClosed ? '—' : ''}
                                        </button>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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
            onCancelBooking={(id) => cancelBooking(id)}
          />
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && modalData && (
        <BookingModal
          modalData={modalData}
          members={members}
          currentUser={currentUser}
          bookings={bookings}
          onConfirm={confirmBooking}
          onCancel={() => setShowModal(false)}
          loading={bookingLoading}
          initialParticipants={initialParticipants}
        />
      )}

      {/* Success Modal */}
      {bookingSuccess && (
        <SuccessModal
          courtName={bookingSuccess.courtName}
          date={bookingSuccess.date}
          time={bookingSuccess.time}
          duration={bookingSuccess.duration}
          matchType={bookingSuccess.matchType}
          participants={bookingSuccess.participants}
          onClose={() => setBookingSuccess(null)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setCancelTarget(null)} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className="w-full max-w-sm rounded-2xl p-6 animate-scaleIn" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <svg className="w-6 h-6" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 id="cancel-modal-title" className="text-center font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Cancel Booking?</h3>
            <p className="text-center text-sm mb-2" style={{ color: '#6b7266' }}>
              {cancelTarget.courtName} on {new Date(cancelTarget.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {cancelTarget.time}
            </p>
            {cancelTarget.participants && cancelTarget.participants.length > 0 && (
              <p className="text-center text-xs mb-4" style={{ color: '#ef4444' }}>
                {cancelTarget.participants.join(', ')} will be notified
              </p>
            )}
            {(!cancelTarget.participants || cancelTarget.participants.length === 0) && <div className="mb-3" />}
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
