'use client';

import { useState, useEffect, useCallback } from 'react';

interface BookingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const courts = [
  { id: 1, name: 'Court 1', type: 'Hard Court', hasLights: true, available: true, rate: 5, isNew: false },
  { id: 2, name: 'Court 2', type: 'Hard Court', hasLights: true, available: true, rate: 5, isNew: false },
  { id: 3, name: 'Court 3', type: 'Hard Court', hasLights: false, available: false, rate: 5, isNew: true },
  { id: 4, name: 'Court 4', type: 'Hard Court', hasLights: false, available: true, rate: 5, isNew: true },
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
];

const mockMemberNames = ['Sarah M.', 'John D.', 'Mike R.', 'Lisa T.', 'Chris P.', 'Anna K.'];

function getBookingInfo(courtId: number, dateIdx: number, timeIdx: number): { booked: boolean; memberName: string | null } {
  const hash = (courtId * 31 + dateIdx * 17 + timeIdx * 7) % 10;
  const booked = hash < 3;
  const memberName = booked ? mockMemberNames[hash % mockMemberNames.length] : null;
  return { booked, memberName };
}

function getBookingDates() {
  const dates: { day: string; date: number; month: string; full: string; dateObj: Date }[] = [];
  const today = new Date();
  const openingDay = new Date(today.getFullYear(), 4, 9);
  const startDate = today >= openingDay ? today : openingDay;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push({
      day: dayNames[d.getDay()],
      date: d.getDate(),
      month: monthNames[d.getMonth()],
      full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      dateObj: d,
    });
  }
  return dates;
}

export default function BookingOverlay({ isOpen, onClose }: BookingOverlayProps) {
  const [screen, setScreen] = useState(1);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [isGuestBooking, setIsGuestBooking] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);
  const [filters, setFilters] = useState({ available: false, lit: false, new: false });

  const dates = getBookingDates();

  const resetState = useCallback(() => {
    setScreen(1);
    setSelectedCourt(null);
    setSelectedTime(null);
    setMatchType('singles');
    setIsGuestBooking(false);
    setGuestName('');
    setIsRecurring(false);
    setRecurringWeeks(4);
    setFilters({ available: false, lit: false, new: false });
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, resetState]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCourts = courts.filter((c) => {
    if (filters.available && !c.available) return false;
    if (filters.lit && !c.hasLights) return false;
    if (filters.new && !c.isNew) return false;
    return true;
  });

  const toggleFilter = (key: 'available' | 'lit' | 'new') => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const court = courts.find((c) => c.id === selectedCourt);
  const basePrice = court?.rate ?? 0;
  const guestFee = isGuestBooking ? 5 : 0;
  const total = basePrice + guestFee;
  const recurringTotal = isRecurring ? total * recurringWeeks : total;

  const confirmBooking = () => {
    setScreen(4);
    setTimeout(() => onClose(), 2500);
  };

  const headerContent = () => {
    if (screen === 2 && court) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="booking-back" onClick={() => setScreen(1)}>
            &larr;
          </button>
          <h2>{court.name} — Select Time</h2>
        </div>
      );
    }
    if (screen === 3) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="booking-back" onClick={() => setScreen(2)}>
            &larr;
          </button>
          <h2>Confirm Booking</h2>
        </div>
      );
    }
    return (
      <h2>
        <span>&#127934;</span> Book a Court
      </h2>
    );
  };

  return (
    <div
      className="booking-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="booking-modal">
        {/* Header */}
        <div className="booking-header">
          <div>{headerContent()}</div>
          <button className="booking-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="booking-body">
          {/* SCREEN 1: Court Selection */}
          {screen === 1 && (
            <div className="booking-screen active">
              {/* Date Picker */}
              <div className="date-picker">
                {dates.map((d, i) => {
                  const isToday = d.dateObj.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={i}
                      className={`date-chip${i === selectedDate ? ' selected' : ''}`}
                      onClick={() => setSelectedDate(i)}
                    >
                      <span className="day-name">{isToday ? 'Today' : d.day}</span>
                      <span className="day-num">{d.date}</span>
                      <span className="day-month">{d.month}</span>
                    </div>
                  );
                })}
              </div>

              {/* Filters */}
              <div className="filter-row">
                {(['available', 'lit', 'new'] as const).map((key) => (
                  <div
                    key={key}
                    className={`filter-toggle${filters[key] ? ' active' : ''}`}
                    onClick={() => toggleFilter(key)}
                  >
                    <span className="filter-dot" />{' '}
                    {key === 'available' ? 'Available Only' : key === 'lit' ? 'Lit Courts' : 'New Courts'}
                  </div>
                ))}
              </div>

              {/* Court Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourts.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'rgba(232,228,217,0.5)' }}>
                    No courts match your filters.
                  </div>
                ) : (
                  filteredCourts.map((c) => (
                    <div key={c.id} className={`court-card${!c.available ? ' disabled' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 className="headline-font" style={{ color: '#e8e4d9', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                            {c.name}
                          </h3>
                          <p style={{ color: 'rgba(232,228,217,0.5)', fontSize: '0.875rem' }}>{c.type}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#d4e157', fontSize: '1.25rem', fontWeight: 700 }}>${c.rate}</span>
                          <span style={{ color: 'rgba(232,228,217,0.4)', fontSize: '0.75rem', display: 'block' }}>/hour</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {c.isNew && <span className="court-badge new">New</span>}
                        {c.hasLights && <span className="court-badge lit">Lit &#128161;</span>}
                        <span className={`court-badge ${c.available ? 'available' : 'booked'}`}>
                          {c.available ? 'Available' : 'Booked'}
                        </span>
                      </div>
                      <button
                        className="court-select-btn"
                        disabled={!c.available}
                        style={!c.available ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                        onClick={() => {
                          setSelectedCourt(c.id);
                          setScreen(2);
                        }}
                      >
                        {c.available ? 'Select Time Slot →' : 'Unavailable'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SCREEN 2: Time Slots */}
          {screen === 2 && (
            <div className="booking-screen active">
              <div className="time-grid">
                {timeSlots.map((slot, i) => {
                  const booking = getBookingInfo(selectedCourt!, selectedDate, i);
                  return (
                    <button
                      key={slot}
                      className={`time-slot${booking.booked ? ' booked' : ''}`}
                      disabled={booking.booked}
                      onClick={() => {
                        if (!booking.booked) {
                          setSelectedTime(slot);
                          setScreen(3);
                        }
                      }}
                    >
                      <span className="time-slot-time">{slot}</span>
                      <span className="time-slot-label">{booking.booked ? booking.memberName : 'Available'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 3: Confirmation */}
          {screen === 3 && court && (
            <div className="booking-screen active">
              {/* Summary */}
              <div className="confirm-card">
                <div className="confirm-row">
                  <span>&#127934; Court</span>
                  <strong style={{ color: '#e8e4d9' }}>
                    {court.name} · {court.type}
                  </strong>
                </div>
                <div className="confirm-row">
                  <span>&#128197; Date</span>
                  <strong style={{ color: '#e8e4d9' }}>{dates[selectedDate].full}</strong>
                </div>
                <div className="confirm-row">
                  <span>&#128336; Time</span>
                  <strong style={{ color: '#e8e4d9' }}>{selectedTime}</strong>
                </div>
                <div className="confirm-row">
                  <span>&#128205; Location</span>
                  <strong style={{ color: '#e8e4d9' }}>Mono Tennis Club</strong>
                </div>
              </div>

              {/* Match Type */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                <label style={{ color: 'rgba(232,228,217,0.6)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Match Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {(['singles', 'doubles'] as const).map((t) => (
                    <button
                      key={t}
                      className={`match-type-btn${matchType === t ? ' active' : ''}`}
                      onClick={() => setMatchType(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest */}
              <div className="option-row">
                <div>
                  <span style={{ color: '#e8e4d9', fontWeight: 500 }}>Guest Booking</span>
                  <span style={{ color: 'rgba(232,228,217,0.4)', fontSize: '0.8rem', display: 'block' }}>
                    +$5 fee for non-members
                  </span>
                </div>
                <div
                  className={`toggle-sw${isGuestBooking ? ' on' : ''}`}
                  onClick={() => setIsGuestBooking(!isGuestBooking)}
                />
              </div>
              {isGuestBooking && (
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Guest name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={50}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(232,228,217,0.15)',
                      background: 'rgba(232,228,217,0.06)',
                      color: '#e8e4d9',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Recurring */}
              <div className="option-row">
                <div>
                  <span style={{ color: '#e8e4d9', fontWeight: 500 }}>Recurring Booking</span>
                  <span style={{ color: 'rgba(232,228,217,0.4)', fontSize: '0.8rem', display: 'block' }}>
                    Book for multiple weeks
                  </span>
                </div>
                <div
                  className={`toggle-sw${isRecurring ? ' on' : ''}`}
                  onClick={() => setIsRecurring(!isRecurring)}
                />
              </div>
              {isRecurring && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[2, 4, 6, 8].map((w) => (
                    <button
                      key={w}
                      className={`week-btn${recurringWeeks === w ? ' active' : ''}`}
                      onClick={() => setRecurringWeeks(w)}
                    >
                      {w} Weeks
                    </button>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="confirm-card" style={{ textAlign: 'center', margin: '1.25rem 0' }}>
                <span style={{ color: 'rgba(232,228,217,0.5)', fontSize: '0.875rem' }}>Total</span>
                <div style={{ color: '#d4e157', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
                  ${recurringTotal}
                </div>
                {isRecurring && (
                  <span style={{ color: 'rgba(232,228,217,0.4)', fontSize: '0.8rem' }}>
                    ${total}/session × {recurringWeeks} weeks
                  </span>
                )}
                {isGuestBooking && (
                  <div style={{ color: 'rgba(232,228,217,0.4)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Includes $5 guest fee
                  </div>
                )}
              </div>

              {/* E-transfer */}
              <div className="etransfer-card">
                <div style={{ fontWeight: 600, color: '#d4e157', marginBottom: '0.25rem' }}>
                  &#128179; E-Transfer Payment
                </div>
                <div style={{ color: 'rgba(232,228,217,0.7)', fontSize: '0.875rem' }}>Send e-transfer to:</div>
                <div style={{ color: '#e8e4d9', fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                  payments@monotennis.com
                </div>
              </div>

              <button className="booking-cta" onClick={confirmBooking}>
                Pay &amp; Confirm Booking
              </button>
            </div>
          )}

          {/* SCREEN 4: Success */}
          {screen === 4 && (
            <div className="booking-screen active">
              <div className="booking-success">
                <div className="check-circle">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="headline-font text-2xl mb-3" style={{ color: '#e8e4d9' }}>
                  Booking Confirmed!
                </h3>
                <p style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Check your email for confirmation details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
