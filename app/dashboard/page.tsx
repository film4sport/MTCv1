'use client';

import { useAuth, useBookings, useEvents, useNotifications } from './lib/store';
import DashboardHeader from './components/DashboardHeader';
import OnboardingTour from './components/OnboardingTour';
import Link from 'next/link';


export default function DashboardHome() {
  const { currentUser } = useAuth();
  const { bookings, confirmParticipant } = useBookings();
  const { events, toggleRsvp } = useEvents();
  const { announcements, dismissAnnouncement } = useNotifications();

  const myBookings = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Bookings where current user is invited as participant but hasn't confirmed
  const pendingConfirmations = bookings.filter(b =>
    b.status === 'confirmed' &&
    b.participants?.some(p => p.id === currentUser?.id && !p.confirmedAt)
  );

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const activeAnnouncements = announcements.filter(a => {
    if (a.dismissedBy.includes(currentUser?.id || '')) return false;
    // Filter by audience — only show announcements targeted to this user's team
    const audience = a.audience || 'all';
    if (audience === 'all') return true;
    const team = currentUser?.interclubTeam || 'none';
    if (audience === 'interclub_a') return team === 'a';
    if (audience === 'interclub_b') return team === 'b';
    if (audience === 'interclub_all') return team === 'a' || team === 'b';
    return true;
  });

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
    <div className="min-h-screen relative overflow-hidden">
      <DashboardHeader title="Home" />
      <OnboardingTour />

      {/* Tennis silhouette background — alternates between two images each page load */}
      <div
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundColor: 'transparent',
          backgroundImage: `url(${Math.random() > 0.5 ? '/tennis-silhouette-1.png' : '/tennis-silhouette-2.png'})`,
          backgroundSize: 'contain',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'multiply',
          opacity: 0.1,
          filter: 'sepia(1) hue-rotate(54deg) saturate(0.3) brightness(1.08)',
        }}
      />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 relative z-[1]">
        <section className="dashboard-panel relative overflow-hidden rounded-[32px] border px-6 py-6 lg:px-8 lg:py-8">
          <div className="dashboard-hero-grid absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(212, 225, 87, 0.18)' }} />
          <div className="pointer-events-none absolute -bottom-16 left-8 h-40 w-40 rounded-full blur-3xl" style={{ background: 'rgba(107, 122, 61, 0.14)' }} />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#6b7a3d' }}>
                Member Home
              </p>
              <h2 className="headline-font text-3xl sm:text-4xl" style={{ color: '#202617' }}>
                {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}.` : 'Welcome back.'}
              </h2>
              <p className="mt-3 max-w-xl text-sm sm:text-[15px] leading-6" style={{ color: '#5f6658' }}>
                Everything important for your week is here: bookings, confirmations, events, and club updates in one calmer, cleaner view.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(107, 122, 61, 0.12)' }}>
                <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#7c836f' }}>Upcoming</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: '#202617' }}>{myBookings.length}</p>
                <p className="text-xs" style={{ color: '#5f6658' }}>Booked courts</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(107, 122, 61, 0.12)' }}>
                <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#7c836f' }}>Pending</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: '#202617' }}>{pendingConfirmations.length}</p>
                <p className="text-xs" style={{ color: '#5f6658' }}>Confirmations</p>
              </div>
              <div className="rounded-2xl px-4 py-3 col-span-2 sm:col-span-1" style={{ background: 'rgba(32,38,23,0.94)', border: '1px solid rgba(212, 225, 87, 0.16)' }}>
                <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'rgba(212,225,87,0.72)' }}>Club Pulse</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: '#f3f0e8' }}>{upcomingEvents.length}</p>
                <p className="text-xs" style={{ color: 'rgba(232,228,217,0.72)' }}>Upcoming events</p>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements */}
        {activeAnnouncements.map(a => (
          <div
            key={a.id}
            className="dashboard-panel flex items-center justify-between rounded-2xl px-5 py-4 border"
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

        {/* Skill Level Reminder */}
        {currentUser && currentUser.skillLevelSet !== true && (
          <div
            className="flex items-center justify-between rounded-xl px-5 py-3.5 border animate-slideUp"
            style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.08), rgba(212, 225, 87, 0.06))', borderColor: 'rgba(107, 122, 61, 0.2)' }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-30" style={{ backgroundColor: '#6b7a3d' }} />
                <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#6b7a3d' }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </span>
              </span>
              <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>
                Complete your profile - set your skill level to get matched with the right partners.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-all hover:opacity-90"
              style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
            >
              Go to Profile
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {[
            { label: 'Book Court', href: '/dashboard/book', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'rgba(107, 122, 61, 0.85)', color: '#fff' },
            { label: 'View Schedule', href: '/dashboard/schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'rgba(232, 228, 217, 0.6)', color: '#2a2f1e' },
            { label: 'Club Events', href: '/dashboard/events', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', bg: 'rgba(212, 225, 87, 0.7)', color: '#2a2f1e' },
            // 4th action: Find Partner for member, Admin Panel for admin, Messages for coach
            ...(currentUser?.role === 'admin' ? [
              { label: 'Admin Panel', href: '/dashboard/admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', bg: 'rgba(200, 209, 160, 0.6)', color: '#2a2f1e' },
            ] : [
              { label: 'Find Partner', href: '/dashboard/partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'rgba(200, 209, 160, 0.6)', color: '#2a2f1e' },
            ]),
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              data-tour={action.label === 'Book Court' ? 'book-court' : action.label === 'Find Partner' ? 'find-partner' : undefined}
              className="dashboard-panel rounded-[28px] p-5 flex flex-col gap-3 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl active:translate-y-0 active:duration-100"
              style={{
                background: action.bg,
                color: action.color,
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon}/>
              </svg>
              <span className="font-semibold text-sm">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Pending Confirmations - bookings you're invited to */}
        {pendingConfirmations.length > 0 && (
          <div className="dashboard-panel rounded-[28px] border p-5 section-card mb-6" style={{ background: 'rgba(234, 179, 8, 0.05)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#ca8a04' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Pending Confirmations
            </h3>
            <div className="space-y-2">
              {pendingConfirmations.map(b => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{b.courtName} • {b.matchType === 'doubles' ? 'Doubles' : 'Singles'}</p>
                    <p className="text-xs" style={{ color: '#6b7266' }}>{new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {b.time}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7a3d' }}>Booked by {b.userName}</p>
                  </div>
                  <button
                    onClick={() => { confirmParticipant(b.id, currentUser!.id); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white btn-press shrink-0"
                    style={{ background: '#6b7a3d' }}
                  >
                    Confirm
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column: Bookings + Events */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Upcoming Bookings */}
          <div className="dashboard-panel rounded-[28px] border p-5 section-card">
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
                      <p className="text-xs" style={{ color: '#6b7266' }}>{formatDate(b.date)} • {b.time}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="dashboard-panel rounded-[28px] border p-5 section-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#2a2f1e' }}>Upcoming Events</h3>
              <Link href="/dashboard/events" className="text-xs font-medium hover:underline" style={{ color: '#6b7a3d' }}>View All</Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 animate-fadeIn">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <p className="text-sm mb-1" style={{ color: '#6b7266' }}>No upcoming events</p>
                <Link href="/dashboard/events" className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-medium text-white btn-press" style={{ background: '#6b7a3d' }}>
                  View Events
                </Link>
              </div>
            ) : (
            <div className="space-y-3">
              {upcomingEvents.map(ev => {
                const bc = badgeColors[ev.badge] || badgeColors['members'];
                const spotsLeft = ev.spotsTotal != null && ev.spotsTaken != null ? ev.spotsTotal - ev.spotsTaken : null;
                const attending = ev.attendees.includes(currentUser?.name || '');
                return (
                  <Link key={ev.id} href={`/dashboard/events?event=${ev.id}`} className="flex items-start gap-4 rounded-xl p-3 border card-hover cursor-pointer transition-all hover:shadow-sm" style={{ borderColor: '#f0ede6', textDecoration: 'none' }}>
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: '#f5f2eb' }}>
                      <span className="text-[0.6rem] font-semibold uppercase" style={{ color: '#6b7266' }}>
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-none" style={{ color: '#2a2f1e' }}>
                        {new Date(ev.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: '#2a2f1e' }}>{ev.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>{ev.time} • {ev.location}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {spotsLeft != null && (
                          <span className="text-xs" style={{ color: spotsLeft <= 3 ? '#ef4444' : '#6b7266' }}>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        )}
                        <span className="text-[0.65rem]" style={{ color: '#6b7266' }}>
                          {ev.spotsTaken ?? ev.attendees.length} going
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleRsvp(ev.id, currentUser?.name || ''); }}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                      style={{
                        background: attending ? 'rgba(245,158,11,0.1)' : '#6b7a3d',
                        color: attending ? '#d97706' : '#fff',
                        border: attending ? '1px solid rgba(245,158,11,0.2)' : 'none',
                      }}
                    >
                      {attending ? '✓ Going' : 'RSVP'}
                    </button>
                  </Link>
                );
              })}
            </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

