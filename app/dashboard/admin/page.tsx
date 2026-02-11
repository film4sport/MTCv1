'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';

type AdminTab = 'dashboard' | 'members' | 'courts' | 'payments' | 'announcements';

export default function AdminPage() {
  const { currentUser, members, courts, setCourts, payments, analytics, announcements, setAnnouncements } = useApp();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [memberSearch, setMemberSearch] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState<'info' | 'warning' | 'urgent'>('info');

  // Non-admin redirect (extra guard in addition to layout)
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <p className="text-sm" style={{ color: '#6b7266' }}>Admin access required</p>
      </div>
    );
  }

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const toggleCourtMaintenance = (courtId: number) => {
    setCourts(courts.map(c => c.id === courtId ? { ...c, status: c.status === 'maintenance' ? 'available' : 'maintenance' } as typeof c : c));
  };

  const addAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    const ann = {
      id: `a-${Date.now()}`,
      text: newAnnouncement.trim(),
      type: newAnnouncementType,
      date: new Date().toISOString().split('T')[0],
      dismissedBy: [],
    };
    setAnnouncements([ann, ...announcements]);
    setNewAnnouncement('');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'members', label: 'Members' },
    { key: 'courts', label: 'Courts' },
    { key: 'payments', label: 'Payments' },
    { key: 'announcements', label: 'Announcements' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Admin Panel" />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#e0dcd3' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{ color: tab === t.key ? '#6b7a3d' : '#6b7266' }}
            >
              {t.label}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#6b7a3d' }} />
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Bookings This Month', value: analytics.totalBookingsThisMonth, change: `+${analytics.bookingsChange}%` },
                { label: 'Revenue', value: `$${analytics.revenueThisMonth}`, change: `+${analytics.revenueChange}%` },
                { label: 'Active Members', value: members.length },
                { label: 'Courts', value: courts.length },
              ].map(card => (
                <div key={card.label} className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  <p className="text-xs mb-1" style={{ color: '#6b7266' }}>{card.label}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold" style={{ color: '#2a2f1e' }}>{card.value}</p>
                    {card.change && (
                      <span className="text-xs font-medium pb-1" style={{ color: '#16a34a' }}>{card.change}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Peak Times */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
              <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Peak Times</h4>
              <div className="space-y-3">
                {analytics.peakTimes.map((pt, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm w-24" style={{ color: '#2a2f1e' }}>{pt.day}</span>
                    <span className="text-xs w-20" style={{ color: '#6b7266' }}>{pt.time}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: '#f5f2eb' }}>
                      <div className="h-full rounded-full" style={{ background: '#6b7a3d', width: `${(pt.bookings / 30) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right" style={{ color: '#2a2f1e' }}>{pt.bookings}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Court Utilization */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
              <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Court Utilization</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.courtUtilization.map(cu => (
                  <div key={cu.court} className="text-center">
                    <div className="relative inline-flex items-center justify-center w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#f0ede6" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#6b7a3d" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - cu.utilization / 100)}`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-sm font-bold" style={{ color: '#2a2f1e' }}>{cu.utilization}%</span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#6b7266' }}>{cu.court}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {tab === 'members' && (
          <div>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 mb-4"
              style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
            />
            <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#faf8f3' }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>NTRP</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Since</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="border-t" style={{ borderColor: '#f0ede6' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                            {m.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6b7266' }}>{m.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium" style={{
                          background: m.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : m.role === 'coach' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                          color: m.role === 'admin' ? '#dc2626' : m.role === 'coach' ? '#d97706' : '#6b7a3d',
                        }}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#2a2f1e' }}>{m.ntrp || '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6b7266' }}>{m.memberSince || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courts Tab */}
        {tab === 'courts' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {courts.map(court => (
              <div key={court.id} className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium" style={{ color: '#2a2f1e' }}>{court.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium`} style={{
                    background: court.status === 'maintenance' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: court.status === 'maintenance' ? '#dc2626' : '#16a34a',
                  }}>
                    {court.status === 'maintenance' ? 'Maintenance' : 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-sm mb-4" style={{ color: '#6b7266' }}>
                  <p>Floodlight: {court.floodlight ? 'Yes' : 'No'}</p>
                  <p>Closes: {court.floodlight ? '10:00 PM' : '8:00 PM'}</p>
                </div>
                <button
                  onClick={() => toggleCourtMaintenance(court.id)}
                  className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{
                    background: court.status === 'maintenance' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: court.status === 'maintenance' ? '#16a34a' : '#dc2626',
                  }}
                >
                  {court.status === 'maintenance' ? 'Reopen Court' : 'Set Maintenance'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="space-y-4">
            {payments.map(p => (
              <div key={p.memberId} className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{p.memberName}</p>
                    <p className="text-xs" style={{ color: '#6b7266' }}>Member</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: p.balance > 0 ? '#ef4444' : '#16a34a' }}>
                      ${Math.abs(p.balance).toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: '#6b7266' }}>{p.balance > 0 ? 'Outstanding' : 'Paid'}</p>
                  </div>
                </div>
                {p.history.length > 0 && (
                  <div className="border-t pt-3 space-y-2" style={{ borderColor: '#f0ede6' }}>
                    {p.history.map(h => (
                      <div key={h.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span style={{ color: '#2a2f1e' }}>{h.description}</span>
                          <span className="ml-2 text-xs" style={{ color: '#6b7266' }}>{h.date}</span>
                        </div>
                        <span className="font-medium" style={{ color: h.type === 'charge' ? '#ef4444' : '#16a34a' }}>
                          {h.type === 'charge' ? '+' : '-'}${Math.abs(h.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Announcements Tab */}
        {tab === 'announcements' && (
          <div className="space-y-4">
            {/* New Announcement */}
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
              <h4 className="font-medium text-sm mb-3" style={{ color: '#2a2f1e' }}>New Announcement</h4>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Write an announcement..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
                <select
                  value={newAnnouncementType}
                  onChange={(e) => setNewAnnouncementType(e.target.value as typeof newAnnouncementType)}
                  className="px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  onClick={addAnnouncement}
                  disabled={!newAnnouncement.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#6b7a3d' }}
                >
                  Post
                </button>
              </div>
            </div>

            {/* Existing Announcements */}
            {announcements.map(a => (
              <div key={a.id} className="rounded-2xl border p-4 flex items-center justify-between" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{a.type === 'urgent' ? '🔴' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                  <div>
                    <p className="text-sm" style={{ color: '#2a2f1e' }}>{a.text}</p>
                    <p className="text-xs" style={{ color: '#6b7266' }}>{a.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="text-xs px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: '#ef4444' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
