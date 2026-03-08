import type { Booking } from '../../lib/types';
import { FEES, BOOKING_RULES } from '../../lib/types';
import { useToast } from '../../lib/toast';
import { canCancel, getTimeRange, formatDuration } from './booking-utils';

interface BookingSidebarProps {
  myUpcoming: Booking[];
  onCancelBooking: (id: string) => void;
}

export default function BookingSidebar({ myUpcoming, onCancelBooking }: BookingSidebarProps) {
  const { showToast } = useToast();
  return (
    <div className="hidden lg:block w-72 shrink-0">
      <div className="space-y-4 sticky top-6">

        {/* Court Info Card */}
        <div className="glass-card rounded-2xl border p-4" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#2a2f1e' }}>
            <svg className="w-3.5 h-3.5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Booking Info
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>Guest fee: <span className="font-medium" style={{ color: '#2a2f1e' }}>${FEES.guest}/visit</span> — e-transfer to <span className="font-medium" style={{ color: '#2a2f1e' }}>monotennis.payment@gmail.com</span></p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>Cancel anytime <span className="font-medium" style={{ color: '#2a2f1e' }}>before your slot starts</span></p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>Singles: up to <span className="font-medium" style={{ color: '#2a2f1e' }}>1.5 hrs</span>, Doubles: up to <span className="font-medium" style={{ color: '#2a2f1e' }}>2 hrs</span></p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>Book up to <span className="font-medium" style={{ color: '#2a2f1e' }}>{BOOKING_RULES.maxAdvanceDays} days</span> in advance</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>Courts 1-2 til <span className="font-medium" style={{ color: '#2a2f1e' }}>10 PM</span>, Courts 3-4 til <span className="font-medium" style={{ color: '#2a2f1e' }}>8 PM</span></p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#d97706' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>Please cancel bookings you no longer need so others can use the court</p>
            </div>
          </div>
        </div>

        {/* My Bookings */}
        <div className="rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#2a2f1e' }}>
            <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            My Bookings
            {myUpcoming.length > 0 && (
              <span className="text-[0.6rem] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>{myUpcoming.length}</span>
            )}
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
                        {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {getTimeRange(b.time, b.duration)}
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
                          showToast('Cannot cancel a booking that has already started', 'error');
                          return;
                        }
                        onCancelBooking(b.id);
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
              {myUpcoming.length > 5 && (
                <p className="text-center text-[0.65rem] pt-1" style={{ color: '#9ca3a0' }}>
                  +{myUpcoming.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
