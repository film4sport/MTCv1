'use client';

import { useApp } from './lib/store';
import DashboardHeader from './components/DashboardHeader';
import Link from 'next/link';


export default function DashboardHome() {
  const { currentUser, bookings, events, announcements, dismissAnnouncement } = useApp();

  const myBookings = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const activeAnnouncements = announcements.filter(
    a => !a.dismissedBy.includes(currentUser?.email || '')
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const badgeColors: Record<string, { bg: string; color: string }> = {
    free: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' },
    members: { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' },
    paid: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Dashboard" />

      {/* Tennis silhouette background — alternates between two images each page load */}
      <div
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundColor: '#f5f2eb',
          backgroundImage: `url(${Math.random() > 0.5 ? '/tennis-silhouette-1.jpg' : '/tennis-silhouette-2.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'multiply',
          opacity: 0.7,
          filter: 'sepia(1) hue-rotate(60deg) saturate(0.6) brightness(0.95)',
        }}
      />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 relative z-[1]">

        {/* Announcements */}
        {activeAnnouncements.map(a => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl px-5 py-3.5 border"
            style={{
              background: a.type === 'urgent' ? '#fef2f2' : a.type === 'warning' ? '#fffbeb' : '#f0fdf4',
              borderColor: a.type === 'urgent' ? '#fecaca' : a.type === 'warning' ? '#fde68a' : '#bbf7d0',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{a.type === 'urgent' ? '🔴' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{a.text}</p>
            </div>
            <button
              onClick={() => dismissAnnouncement(a.id)}
              className="text-sm px-3 py-1 rounded-lg hover:bg-black/5 transition-colors"
              style={{ color: '#6b7266' }}
            >
              Dismiss
            </button>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {[
            { label: 'Book Court', href: '/dashboard/book', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: '#6b7a3d', color: '#fff' },
            { label: 'Find Partner', href: '/dashboard/partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: '#d4e157', color: '#2a2f1e' },
            { label: 'View Schedule', href: '/dashboard/schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#faf8f3', color: '#2a2f1e', border: true },
            { label: 'Club Events', href: '/dashboard/events', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', bg: '#faf8f3', color: '#2a2f1e', border: true },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: action.bg,
                color: action.color,
                border: action.border ? '1px solid #e0dcd3' : 'none',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon}/>
              </svg>
              <span className="font-semibold text-sm">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Two Column: Bookings + Events */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Upcoming Bookings */}
          <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#2a2f1e' }}>Upcoming Bookings</h3>
              <Link href="/dashboard/schedule" className="text-xs font-medium hover:underline" style={{ color: '#6b7a3d' }}>View All</Link>
            </div>
            {myBookings.length === 0 ? (
              <div className="text-center py-8 animate-fadeIn">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="text-sm mb-1" style={{ color: '#6b7266' }}>No upcoming bookings</p>
                <Link href="/dashboard/book" className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-medium text-white btn-press" style={{ background: '#6b7a3d' }}>
                  Book a Court
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-4 rounded-xl p-3 border card-hover" style={{ borderColor: '#f0ede6' }}>
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: '#f5f2eb' }}>
                      <span className="text-[0.6rem] font-semibold uppercase" style={{ color: '#6b7266' }}>
                        {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-none" style={{ color: '#2a2f1e' }}>
                        {new Date(b.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{b.courtName}</p>
                      <p className="text-xs" style={{ color: '#6b7266' }}>{formatDate(b.date)} &bull; {b.time}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#2a2f1e' }}>Upcoming Events</h3>
              <Link href="/dashboard/events" className="text-xs font-medium hover:underline" style={{ color: '#6b7a3d' }}>View All</Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map(ev => {
                const bc = badgeColors[ev.badge] || badgeColors['members'];
                const spotsLeft = ev.spotsTotal != null && ev.spotsTaken != null ? ev.spotsTotal - ev.spotsTaken : null;
                const attending = ev.attendees.includes(currentUser?.name || '');
                return (
                  <div key={ev.id} className="flex items-start gap-4 rounded-xl p-3 border card-hover" style={{ borderColor: '#f0ede6' }}>
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: '#f5f2eb' }}>
                      <span className="text-[0.6rem] font-semibold uppercase" style={{ color: '#6b7266' }}>
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-none" style={{ color: '#2a2f1e' }}>
                        {new Date(ev.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate" style={{ color: '#2a2f1e' }}>{ev.title}</p>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full shrink-0 font-medium" style={{ background: bc.bg, color: bc.color }}>
                          {ev.price}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>{ev.time} &bull; {ev.location}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {spotsLeft != null && (
                          <span className="text-xs" style={{ color: spotsLeft <= 3 ? '#ef4444' : '#6b7266' }}>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        )}
                        {attending && (
                          <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                            Going
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
