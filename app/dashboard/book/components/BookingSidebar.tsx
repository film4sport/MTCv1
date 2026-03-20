import type { Booking } from '../../lib/types';
import { FEES, BOOKING_RULES } from '../../lib/types';
import { useToast } from '../../lib/toast';
import { canCancel, getTimeRange } from './booking-utils';
import { PAYMENT_EMAIL } from '../../../lib/site';

interface BookingSidebarProps {
  myUpcoming: Booking[];
  onCancelBooking: (id: string) => void;
}

export default function BookingSidebar({ myUpcoming, onCancelBooking }: BookingSidebarProps) {
  const { showToast } = useToast();

  return (
    <div className="hidden lg:block w-72 shrink-0">
      <div className="space-y-4 sticky top-6">
        <div className="dashboard-panel rounded-[28px] border p-5 shadow-[0_24px_48px_rgba(31,40,23,0.12)]">
          <div className="mb-4">
            <span className="dashboard-soft-pill mb-2 inline-flex">Booking Guide</span>
            <p className="text-xs leading-relaxed" style={{ color: '#7a756c' }}>
              Quick reminders that keep court time fair and easy to manage.
            </p>
          </div>
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#2a2f1e' }}>
            <svg className="w-3.5 h-3.5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Booking Info
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>
                Guest fee: <span className="font-medium" style={{ color: '#2a2f1e' }}>${FEES.guest}/visit</span> - e-transfer to <span className="font-medium" style={{ color: '#2a2f1e' }}>{PAYMENT_EMAIL}</span>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>
                Cancel anytime <span className="font-medium" style={{ color: '#2a2f1e' }}>before your slot starts</span>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>
                Singles: up to <span className="font-medium" style={{ color: '#2a2f1e' }}>1.5 hrs</span>, Doubles: up to <span className="font-medium" style={{ color: '#2a2f1e' }}>2 hrs</span>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>
                Book up to <span className="font-medium" style={{ color: '#2a2f1e' }}>{BOOKING_RULES.maxAdvanceDays} days</span> in advance
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6b7a3d' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>
                Courts 1-2 until <span className="font-medium" style={{ color: '#2a2f1e' }}>10 PM</span>, Courts 3-4 until <span className="font-medium" style={{ color: '#2a2f1e' }}>8 PM</span>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#d97706' }} />
              <p className="text-[0.7rem] leading-relaxed" style={{ color: '#6b7266' }}>
                Please cancel bookings you no longer need so other members can use the court.
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-panel rounded-[28px] border p-5 shadow-[0_22px_46px_rgba(31,40,23,0.1)]">
          <div className="mb-4">
            <span className="dashboard-soft-pill mb-2 inline-flex">Upcoming</span>
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: '#2a2f1e' }}>
              <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              My Bookings
              {myUpcoming.length > 0 && (
                <span className="text-[0.6rem] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                  {myUpcoming.length}
                </span>
              )}
            </h3>
            <p className="mt-2 text-xs" style={{ color: '#7a756c' }}>
              {myUpcoming.length === 0 ? 'Your next reservation will show up here.' : 'Track upcoming slots and participant confirmations at a glance.'}
            </p>
          </div>
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
              {myUpcoming.slice(0, 5).map((booking) => (
                <div key={booking.id} className="rounded-xl p-3.5 transition-colors" style={{ background: '#faf8f3' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{booking.courtName}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>
                        {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - {getTimeRange(booking.time, booking.duration)}
                      </p>
                      {booking.matchType && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#6b7a3d' }}>
                          {booking.matchType === 'singles' ? 'Singles' : 'Doubles'}
                        </p>
                      )}
                      {booking.participants && booking.participants.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {booking.participants.map((participant) => (
                            <span
                              key={participant.id}
                              className="inline-flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-md"
                              style={{
                                background: participant.confirmedAt ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                                color: participant.confirmedAt ? '#16a34a' : '#ca8a04',
                              }}
                            >
                              {participant.confirmedAt ? (
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx="4" cy="4" r="3" />
                                </svg>
                              )}
                              {participant.name.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!canCancel(booking.date, booking.time)) {
                          showToast('Cannot cancel a booking that has already started', 'error');
                          return;
                        }
                        onCancelBooking(booking.id);
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
