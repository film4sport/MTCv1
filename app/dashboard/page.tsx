'use client';

import { useMemo } from 'react';
import { useApp } from './lib/store';
import DashboardHeader from './components/DashboardHeader';
import OnboardingTour from './components/OnboardingTour';
import Link from 'next/link';


export default function DashboardHome() {
  const { currentUser, bookings, events, announcements, dismissAnnouncement, partners, members } = useApp();

  const myBookings = bookings
    .filter(b => b.userId === currentUser?.id && b.status === 'confirmed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const activeAnnouncements = announcements.filter(
    a => !a.dismissedBy.includes(currentUser?.id || '')
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
      <DashboardHeader title="Home" />
      <OnboardingTour />

      {/* Tennis silhouette background — alternates between two images each page load */}
      <div
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundColor: '#f5f2eb',
          backgroundImage: `url(${Math.random() > 0.5 ? '/tennis-silhouette-1.png' : '/tennis-silhouette-2.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'multiply',
          opacity: 0.35,
          filter: 'sepia(1) hue-rotate(60deg) saturate(0.4) brightness(1.05)',
        }}
      />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 relative z-[1]">

        {/* Welcome Greeting */}
        <div className="animate-slideUp">
          <h2 className="headline-font text-xl sm:text-2xl" style={{ color: '#2a2f1e' }}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {currentUser?.name.split(' ')[0]}
          </h2>
        </div>

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
            { label: 'Book Court', href: '/dashboard/book', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'rgba(107, 122, 61, 0.85)', color: '#fff' },
            { label: 'View Schedule', href: '/dashboard/schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'rgba(232, 228, 217, 0.6)', color: '#2a2f1e' },
            // 3rd action: Club Events for member/admin, Coaching Panel for coach
            ...(currentUser?.role === 'coach' ? [
              { label: 'Coaching Panel', href: '/dashboard/coaching', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', bg: 'rgba(212, 225, 87, 0.7)', color: '#2a2f1e' },
            ] : [
              { label: 'Club Events', href: '/dashboard/events', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', bg: 'rgba(212, 225, 87, 0.7)', color: '#2a2f1e' },
            ]),
            // 4th action: Find Partner for member, Admin Panel for admin, Club Events for coach
            ...(currentUser?.role === 'coach' ? [
              { label: 'Club Events', href: '/dashboard/events', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', bg: 'rgba(200, 209, 160, 0.6)', color: '#2a2f1e' },
            ] : currentUser?.role === 'admin' ? [
              { label: 'Admin Panel', href: '/dashboard/admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', bg: 'rgba(200, 209, 160, 0.6)', color: '#2a2f1e' },
            ] : [
              { label: 'Find Partner', href: '/dashboard/partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'rgba(200, 209, 160, 0.6)', color: '#2a2f1e' },
            ]),
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              data-tour={action.label === 'Book Court' ? 'book-court' : action.label === 'Find Partner' ? 'find-partner' : undefined}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
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

        {/* Two Column: Bookings + Events */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Upcoming Bookings */}
          <div className="glass-card rounded-2xl border p-5 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="glass-card rounded-2xl border p-5 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
                      <p className="font-medium text-sm truncate" style={{ color: '#2a2f1e' }}>{ev.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>{ev.time} &bull; {ev.location}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {spotsLeft != null && (
                          <span className="text-xs" style={{ color: spotsLeft <= 3 ? '#ef4444' : '#6b7266' }}>
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        )}
                        {attending && (
                          <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                            ✓ Going
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed bookings={bookings} events={events} partners={partners} members={members} currentUserName={currentUser?.name || ''} />
      </div>
    </div>
  );
}

interface FeedItem {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  text: string;
  time: string;
  timestamp: number;
  href?: string;
}

function ActivityFeed({ bookings, events, partners, members, currentUserName }: {
  bookings: ReturnType<typeof useApp>['bookings'];
  events: ReturnType<typeof useApp>['events'];
  partners: ReturnType<typeof useApp>['partners'];
  members: ReturnType<typeof useApp>['members'];
  currentUserName: string;
}) {
  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Recent bookings (confirmed, future dates)
    bookings
      .filter(b => b.status === 'confirmed' && new Date(b.date + 'T00:00:00').getTime() > weekAgo)
      .forEach(b => {
        const ts = new Date(b.date + 'T00:00:00').getTime();
        items.push({
          id: `b-${b.id}`,
          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          iconBg: 'rgba(107, 122, 61, 0.1)',
          iconColor: '#6b7a3d',
          text: b.userName === currentUserName
            ? `You booked ${b.courtName} for ${formatRelativeDate(b.date)} at ${b.time}`
            : `${b.userName} booked ${b.courtName} for ${formatRelativeDate(b.date)}`,
          time: formatRelativeDate(b.date),
          timestamp: ts,
          href: '/dashboard/schedule',
        });
      });

    // Partner requests (recent)
    partners
      .filter(p => p.status === 'available')
      .slice(0, 5)
      .forEach(p => {
        const ts = new Date(p.date + 'T00:00:00').getTime();
        items.push({
          id: `p-${p.id}`,
          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
          iconBg: 'rgba(59, 130, 246, 0.1)',
          iconColor: '#2563eb',
          text: `${p.name} is looking for a ${p.matchType === 'any' ? '' : p.matchType + ' '}partner on ${formatRelativeDate(p.date)}`,
          time: formatRelativeDate(p.date),
          timestamp: ts,
          href: '/dashboard/partners',
        });
      });

    // Events with RSVPs
    events
      .filter(e => new Date(e.date + 'T00:00:00').getTime() >= now - 2 * 24 * 60 * 60 * 1000)
      .forEach(ev => {
        const count = ev.spotsTaken ?? ev.attendees.length;
        if (count > 0) {
          items.push({
            id: `e-${ev.id}`,
            icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
            iconBg: 'rgba(212, 225, 87, 0.15)',
            iconColor: '#6b7a3d',
            text: `${count} member${count !== 1 ? 's' : ''} going to ${ev.title}`,
            time: formatRelativeDate(ev.date),
            timestamp: new Date(ev.date + 'T00:00:00').getTime(),
            href: '/dashboard/events',
          });
        }
      });

    // New members (joined recently — check memberSince)
    members
      .filter(m => m.memberSince && m.status !== 'paused')
      .sort((a, b) => (b.memberSince || '').localeCompare(a.memberSince || ''))
      .slice(0, 3)
      .forEach(m => {
        items.push({
          id: `m-${m.id}`,
          icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
          iconBg: 'rgba(34, 197, 94, 0.1)',
          iconColor: '#16a34a',
          text: `Welcome ${m.name} to the club!`,
          time: m.memberSince || '',
          timestamp: new Date((m.memberSince || '2024-01-01') + '-01T00:00:00').getTime(),
          href: '/dashboard/directory',
        });
      });

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  }, [bookings, events, partners, members, currentUserName]);

  if (feedItems.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl border p-5 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
      <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Club Activity</h3>
      <div className="space-y-3">
        {feedItems.map(item => (
          <Link
            key={item.id}
            href={item.href || '#'}
            className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-black/[0.02]"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: item.iconBg }}
            >
              <svg className="w-4.5 h-4.5" style={{ color: item.iconColor, width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </div>
            <p className="text-sm flex-1" style={{ color: '#2a2f1e' }}>{item.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff <= 6) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
