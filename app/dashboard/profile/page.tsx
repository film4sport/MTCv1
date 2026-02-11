'use client';

import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';

export default function ProfilePage() {
  const { currentUser, playerStats, bookings } = useApp();

  const recentBookings = bookings
    .filter(b => b.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const winRate = playerStats.matchesPlayed > 0
    ? Math.round((playerStats.wins / playerStats.matchesPlayed) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Profile" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#2a2f1e' }}>{currentUser?.name}</h2>
              <p className="text-sm" style={{ color: '#6b7266' }}>{currentUser?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                  {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'coach' ? 'Coach' : 'Member'}
                </span>
                {currentUser?.memberSince && (
                  <span className="text-xs" style={{ color: '#6b7266' }}>
                    Member since {new Date(currentUser.memberSince + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Player Stats</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Matches Played', value: playerStats.matchesPlayed.toString() },
              { label: 'Win Rate', value: `${winRate}%` },
              { label: 'Hours Played', value: playerStats.hoursPlayed.toString() },
              { label: 'NTRP Rating', value: playerStats.ntrp.toFixed(1) },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <p className="text-xs mb-1" style={{ color: '#6b7266' }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: '#2a2f1e' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Streak & Record */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <h4 className="font-medium text-sm mb-3" style={{ color: '#2a2f1e' }}>Current Streak</h4>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold" style={{ color: playerStats.streakType === 'win' ? '#16a34a' : '#ef4444' }}>
                {playerStats.currentStreak}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>
                  {playerStats.streakType === 'win' ? 'Win Streak' : 'Loss Streak'}
                </p>
                <p className="text-xs" style={{ color: '#6b7266' }}>
                  {playerStats.streakType === 'win' ? 'Keep it going!' : 'Time to bounce back!'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <h4 className="font-medium text-sm mb-3" style={{ color: '#2a2f1e' }}>Win/Loss Record</h4>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{playerStats.wins}</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>Wins</p>
              </div>
              <div className="w-px h-10" style={{ background: '#e0dcd3' }} />
              <div>
                <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{playerStats.losses}</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>Losses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Recent Activity</h4>
          {recentBookings.length === 0 ? (
            <p className="text-sm" style={{ color: '#6b7266' }}>No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: b.status === 'confirmed' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                    <svg className="w-4 h-4" fill="none" stroke={b.status === 'confirmed' ? '#6b7a3d' : '#ef4444'} viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span style={{ color: '#2a2f1e' }}>{b.courtName}</span>
                    <span className="mx-1" style={{ color: '#d1d5db' }}>&bull;</span>
                    <span style={{ color: '#6b7266' }}>{b.time}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#6b7266' }}>
                    {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
