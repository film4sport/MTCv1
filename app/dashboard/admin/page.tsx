'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { generateId, useFocusTrap } from '../lib/utils';
import * as db from '../lib/db';

type AdminTab = 'dashboard' | 'members' | 'courts' | 'announcements';

export default function AdminPage() {
  const { currentUser, members, setMembers, bookings, courts, setCourts, analytics, announcements, setAnnouncements } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [memberSearch, setMemberSearch] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState<'info' | 'warning' | 'urgent'>('info');

  // Gate code state
  const [gateCode, setGateCode] = useState('');
  const [newGateCode, setNewGateCode] = useState('');
  const [gateCodeLoading, setGateCodeLoading] = useState(false);

  // Member action state
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; action: 'pause' | 'unpause' | 'cancel' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const adminModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(adminModalRef, !!actionTarget);

  // Fetch gate code on mount
  useEffect(() => {
    db.getGateCode().then(code => { if (code) setGateCode(code); });
  }, []);

  // Handle gate code update
  const handleGateCodeUpdate = async () => {
    if (!newGateCode.trim() || !currentUser) return;
    setGateCodeLoading(true);
    try {
      await db.updateGateCode(newGateCode.trim(), currentUser.id);
      setGateCode(newGateCode.trim());

      // Send message + notification to all active non-admin members
      const activeMembers = members.filter(m => m.id !== currentUser.id && m.role !== 'admin' && (m.status || 'active') === 'active');
      for (const member of activeMembers) {
        await db.sendMessageByUsers({
          id: generateId('msg'),
          fromId: currentUser.id,
          fromName: 'Mono Tennis Club',
          toId: member.id,
          toName: member.name,
          text: `The court gate code has been updated. Your new gate code is: ${newGateCode.trim()}\n\nPlease keep this code confidential and do not share it with non-members.`,
        });
        await db.createNotification(member.id, {
          id: generateId('n'),
          type: 'message',
          title: 'Gate Code Updated',
          body: 'The court gate code has been changed. Check your messages for the new code.',
          timestamp: new Date().toISOString(),
        });
      }

      setNewGateCode('');
      showToast(`Gate code updated. ${activeMembers.length} member${activeMembers.length !== 1 ? 's' : ''} notified.`);
    } catch (err) {
      console.error('[MTC Supabase] gate code update:', err);
      showToast('Failed to update gate code', 'error');
    }
    setGateCodeLoading(false);
  };

  // Handle member actions
  const handleMemberAction = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      if (actionTarget.action === 'pause') {
        await db.pauseMember(actionTarget.id);
        setMembers(members.map(m => m.id === actionTarget.id ? { ...m, status: 'paused' as const } : m));
        showToast(`${actionTarget.name}'s membership paused.`);
      } else if (actionTarget.action === 'unpause') {
        await db.unpauseMember(actionTarget.id);
        setMembers(members.map(m => m.id === actionTarget.id ? { ...m, status: 'active' as const } : m));
        showToast(`${actionTarget.name}'s membership reactivated.`);
      } else if (actionTarget.action === 'cancel') {
        await db.deleteMember(actionTarget.id);
        setMembers(members.filter(m => m.id !== actionTarget.id));
        showToast(`${actionTarget.name}'s account deleted.`);
      }
    } catch (err) {
      console.error('[MTC Supabase] member action:', err);
      showToast('Action failed', 'error');
    }
    setActionLoading(false);
    setActionTarget(null);
  };

  // Non-admin redirect (extra guard in addition to layout)
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <p className="text-sm" style={{ color: '#6b7266' }}>Admin access required</p>
      </div>
    );
  }

  const [exportFromDate, setExportFromDate] = useState('');

  const MEMBERSHIP_FEES: Record<string, number> = { adult: 120, family: 240, junior: 55 };

  const exportToCsv = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename} downloaded.`);
  };

  const exportMembers = () => {
    const filtered = exportFromDate
      ? members.filter(m => m.memberSince && m.memberSince >= exportFromDate)
      : members;
    exportToCsv('mtc-members.csv',
      ['Name', 'Email', 'Role', 'Membership Type', 'Annual Fee', 'Skill Level', 'Status', 'Member Since'],
      filtered.map(m => {
        const type = (m.membershipType as string) || 'adult';
        const fee = MEMBERSHIP_FEES[type] || MEMBERSHIP_FEES.adult;
        return [m.name, m.email, m.role, type, `$${fee}`, m.skillLevel || '', m.status || 'active', m.memberSince || ''];
      })
    );
  };

  const exportPayments = () => {
    // Summarise expected revenue from membership fees
    const filtered = exportFromDate
      ? members.filter(m => m.memberSince && m.memberSince >= exportFromDate)
      : members;
    const rows: string[][] = filtered.map(m => {
      const type = (m.membershipType as string) || 'adult';
      const fee = MEMBERSHIP_FEES[type] || MEMBERSHIP_FEES.adult;
      return [m.name, m.email, type, `$${fee}`, m.memberSince || '', m.status || 'active'];
    });
    const totalFees = filtered.reduce((s, m) => s + (MEMBERSHIP_FEES[(m.membershipType as string) || 'adult'] || MEMBERSHIP_FEES.adult), 0);
    rows.push(['', '', '', '', '', '']);
    rows.push(['TOTAL', '', `${filtered.length} members`, `$${totalFees}`, '', '']);
    exportToCsv('mtc-payments.csv',
      ['Name', 'Email', 'Membership Type', 'Annual Fee', 'Member Since', 'Status'],
      rows
    );
  };

  const exportCourtUsage = () => {
    const fromDate = exportFromDate || '';
    const filtered = bookings.filter(b => b.status === 'confirmed' && (!fromDate || b.date >= fromDate));
    // Per-court summary
    const courtMap = new Map<string, { total: number; byType: Record<string, number> }>();
    for (const b of filtered) {
      const entry = courtMap.get(b.courtName) || { total: 0, byType: {} };
      entry.total++;
      entry.byType[b.type] = (entry.byType[b.type] || 0) + 1;
      courtMap.set(b.courtName, entry);
    }
    const rows: string[][] = [];
    Array.from(courtMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([name, data]) => {
        const types = Object.entries(data.byType).map(([t, c]) => `${t}: ${c}`).join(', ');
        rows.push([name, String(data.total), types]);
      });
    rows.push(['', '', '']);
    rows.push(['TOTAL', String(filtered.length), `${fromDate ? `from ${fromDate}` : 'all time'}`]);
    exportToCsv('mtc-court-usage.csv',
      ['Court', 'Total Bookings', 'Breakdown by Type'],
      rows
    );
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const toggleCourtMaintenance = (courtId: number) => {
    const court = courts.find(c => c.id === courtId);
    const newStatus = court?.status === 'maintenance' ? 'available' : 'maintenance';
    setCourts(courts.map(c => c.id === courtId ? { ...c, status: newStatus } as typeof c : c));
    db.updateCourtStatus(courtId, newStatus).catch((err) => console.error('[MTC Supabase]', err));
  };

  const addAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    const ann = {
      id: generateId('a'),
      text: newAnnouncement.trim(),
      type: newAnnouncementType,
      date: new Date().toISOString().split('T')[0],
      dismissedBy: [] as string[],
    };
    setAnnouncements([ann, ...announcements]);
    setNewAnnouncement('');
    db.createAnnouncement(ann).catch((err) => console.error('[MTC Supabase]', err));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    db.deleteAnnouncement(id).catch((err) => console.error('[MTC Supabase]', err));
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'members', label: 'Members' },
    { key: 'courts', label: 'Courts' },
    { key: 'announcements', label: 'Announcements' },
  ];

  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Admin Panel" />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-slideUp">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#e0dcd3' }} role="tablist">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              role="tab"
              aria-selected={tab === t.key}
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
            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#6b7266' }}>
                From:
                <input
                  type="date"
                  value={exportFromDate}
                  onChange={e => setExportFromDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-xs"
                  style={{ background: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                />
                {exportFromDate && (
                  <button onClick={() => setExportFromDate('')} className="text-xs underline" style={{ color: '#6b7a3d' }}>Clear</button>
                )}
              </label>
              {[
                { label: 'Export Members', onClick: exportMembers },
                { label: 'Export Payments', onClick: exportPayments },
                { label: 'Export Court Usage', onClick: exportCourtUsage },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white"
                  style={{ background: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Gate Code Management */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-sm" style={{ color: '#2a2f1e' }}>Court Gate Code</h4>
                  <p className="text-xs" style={{ color: '#6b7266' }}>Access code for the court gate lock</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-4 py-2.5 rounded-xl text-lg font-bold tracking-widest" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>
                  {gateCode || '—'}
                </div>
                <span className="text-xs" style={{ color: '#6b7266' }}>Current code</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGateCode}
                  onChange={(e) => setNewGateCode(e.target.value)}
                  placeholder="Enter new code..."
                  aria-label="New gate code"
                  maxLength={10}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
                <button
                  onClick={handleGateCodeUpdate}
                  disabled={!newGateCode.trim() || gateCodeLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ background: '#6b7a3d' }}
                >
                  {gateCodeLoading ? 'Updating...' : 'Update & Notify'}
                </button>
              </div>
            </div>

            {/* Analytics Cards — computed from real data */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const now = new Date();
                const thisMonth = bookings.filter(b => {
                  const d = new Date(b.date);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status === 'confirmed';
                });
                const activeMembers = members.filter(m => m.status !== 'paused');
                const activeCourts = courts.filter(c => c.status === 'available');
                return [
                  { label: 'Bookings This Month', value: thisMonth.length },
                  { label: 'Total Bookings', value: bookings.filter(b => b.status === 'confirmed').length },
                  { label: 'Active Members', value: activeMembers.length },
                  { label: 'Courts Available', value: `${activeCourts.length}/${courts.length}` },
                ];
              })().map(card => (
                <div key={card.label} className="glass-card rounded-2xl border p-4" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                  <p className="text-xs mb-1" style={{ color: '#6b7266' }}>{card.label}</p>
                  <p className="text-2xl font-bold" style={{ color: '#2a2f1e' }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Peak Times */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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

            {/* Court Usage */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Court Usage</h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Today', value: analytics.courtUsage.today },
                  { label: 'This Week', value: analytics.courtUsage.thisWeek },
                  { label: 'This Month', value: analytics.courtUsage.thisMonth },
                ].map(stat => (
                  <div key={stat.label} className="text-center rounded-xl p-4" style={{ background: '#f5f2eb' }}>
                    <p className="text-2xl font-bold" style={{ color: '#2a2f1e' }}>{stat.value}</p>
                    <p className="text-xs mt-1" style={{ color: '#6b7266' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Revenue Breakdown</h4>
              {/* Stacked bar */}
              <div className="h-6 rounded-full overflow-hidden flex mb-4" style={{ background: '#f5f2eb' }}>
                {analytics.revenueBreakdown.map((item, i) => {
                  const colors = ['#6b7a3d', '#d4e157', '#a3b356'];
                  return (
                    <div
                      key={item.category}
                      className="h-full"
                      style={{ width: `${item.percentage}%`, background: colors[i % colors.length] }}
                      title={`${item.category}: $${item.amount}`}
                    />
                  );
                })}
              </div>
              <div className="space-y-2">
                {analytics.revenueBreakdown.map((item, i) => {
                  const colors = ['#6b7a3d', '#d4e157', '#a3b356'];
                  return (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                        <span style={{ color: '#2a2f1e' }}>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium" style={{ color: '#2a2f1e' }}>${item.amount}</span>
                        <span className="text-xs w-10 text-right" style={{ color: '#6b7266' }}>{item.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Member Activity */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Member Activity</h4>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl p-4" style={{ background: '#f5f2eb' }}>
                  <p className="text-2xl font-bold" style={{ color: '#2a2f1e' }}>{analytics.memberActivity.newMembersThisMonth}</p>
                  <p className="text-xs mt-1" style={{ color: '#6b7266' }}>New Members This Month</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#f5f2eb' }}>
                  <p className="text-2xl font-bold" style={{ color: '#2a2f1e' }}>{analytics.memberActivity.avgBookingsPerMember}</p>
                  <p className="text-xs mt-1" style={{ color: '#6b7266' }}>Avg Bookings / Member</p>
                </div>
              </div>
              <p className="text-xs font-medium mb-3" style={{ color: '#6b7266' }}>Most Active Members</p>
              <div className="space-y-2">
                {analytics.memberActivity.mostActive.map((m, i) => {
                  const maxBookings = analytics.memberActivity.mostActive[0].bookings;
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      <span className="text-xs w-4 text-right font-medium" style={{ color: '#6b7266' }}>{i + 1}</span>
                      <span className="text-sm w-32 truncate" style={{ color: '#2a2f1e' }}>{m.name}</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#f5f2eb' }}>
                        <div className="h-full rounded-full" style={{ background: '#6b7a3d', width: `${(m.bookings / maxBookings) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium w-6 text-right" style={{ color: '#2a2f1e' }}>{m.bookings}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <h4 className="font-medium text-sm mb-4" style={{ color: '#2a2f1e' }}>Monthly Trends</h4>
              <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
                {analytics.monthlyTrends.map(month => {
                  const maxBookings = Math.max(...analytics.monthlyTrends.map(m => m.bookings));
                  const heightPct = (month.bookings / maxBookings) * 100;
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: '#2a2f1e' }}>{month.bookings}</span>
                      <div className="w-full rounded-t-lg" style={{ background: '#6b7a3d', height: `${heightPct}%`, minHeight: '8px' }} />
                      <span className="text-xs" style={{ color: '#6b7266' }}>{month.month}</span>
                    </div>
                  );
                })}
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
              aria-label="Search members"
              className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 mb-4"
              style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
            />
            <div className="glass-card rounded-2xl border overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#faf8f3' }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Membership</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Skill</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Since</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Actions</th>
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
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{
                          background: m.membershipType === 'family' ? 'rgba(147, 51, 234, 0.1)' : m.membershipType === 'junior' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                          color: m.membershipType === 'family' ? '#7c3aed' : m.membershipType === 'junior' ? '#2563eb' : '#6b7a3d',
                        }}>
                          {m.membershipType || 'adult'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{
                          background: m.skillLevel === 'beginner' ? 'rgba(34, 197, 94, 0.1)' : m.skillLevel === 'intermediate' ? 'rgba(59, 175, 218, 0.1)' : m.skillLevel === 'advanced' ? 'rgba(245, 158, 11, 0.1)' : m.skillLevel === 'competitive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                          color: m.skillLevel === 'beginner' ? '#16a34a' : m.skillLevel === 'intermediate' ? '#3BAFDA' : m.skillLevel === 'advanced' ? '#d97706' : m.skillLevel === 'competitive' ? '#dc2626' : '#6b7266',
                        }}>
                          {m.skillLevel || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                          background: (m.status || 'active') === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: (m.status || 'active') === 'active' ? '#16a34a' : '#d97706',
                        }}>
                          {(m.status || 'active') === 'active' ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6b7266' }}>{m.memberSince || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {m.id !== currentUser.id && m.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {(m.status || 'active') === 'active' ? (
                              <button
                                onClick={() => setActionTarget({ id: m.id, name: m.name, action: 'pause' })}
                                className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-amber-50"
                                style={{ color: '#d97706' }}
                              >
                                Pause
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionTarget({ id: m.id, name: m.name, action: 'unpause' })}
                                className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-green-50"
                                style={{ color: '#16a34a' }}
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() => setActionTarget({ id: m.id, name: m.name, action: 'cancel' })}
                              className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-red-50"
                              style={{ color: '#ef4444' }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
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
              <div key={court.id} className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium" style={{ color: '#2a2f1e' }}>{court.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium`} style={{
                    background: court.status === 'maintenance' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: court.status === 'maintenance' ? '#dc2626' : '#16a34a',
                  }}>
                    {court.status === 'maintenance' ? 'Closed' : 'Active'}
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
                  {court.status === 'maintenance' ? 'Reopen Court' : 'Close Court'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Announcements Tab */}
        {tab === 'announcements' && (
          <div className="space-y-4">
            {/* New Announcement */}
            <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <h4 className="font-medium text-sm mb-3" style={{ color: '#2a2f1e' }}>New Announcement</h4>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Write an announcement..."
                  aria-label="Announcement message"
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
              <div key={a.id} className="glass-card rounded-2xl border p-4 flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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

      {/* Confirmation Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => !actionLoading && setActionTarget(null)} role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
          <div ref={adminModalRef} className="rounded-2xl p-6 max-w-sm w-full shadow-xl" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{
              background: actionTarget.action === 'cancel' ? 'rgba(239, 68, 68, 0.1)' : actionTarget.action === 'pause' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            }}>
              {actionTarget.action === 'cancel' ? (
                <svg className="w-6 h-6" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : actionTarget.action === 'pause' ? (
                <svg className="w-6 h-6" style={{ color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" style={{ color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 id="admin-modal-title" className="text-center font-medium mb-2" style={{ color: '#2a2f1e' }}>
              {actionTarget.action === 'cancel' ? 'Cancel Membership' : actionTarget.action === 'pause' ? 'Pause Membership' : 'Reactivate Membership'}
            </h3>
            <p className="text-center text-sm mb-6" style={{ color: '#6b7266' }}>
              {actionTarget.action === 'cancel'
                ? `This will permanently delete ${actionTarget.name}'s account and all their data. This cannot be undone.`
                : actionTarget.action === 'pause'
                ? `${actionTarget.name} will be unable to access the dashboard or book courts until reactivated.`
                : `${actionTarget.name}'s account will be reactivated and they will regain full access.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActionTarget(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: '#f5f2eb', color: '#2a2f1e' }}
              >
                Go Back
              </button>
              <button
                onClick={handleMemberAction}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{
                  background: actionTarget.action === 'cancel' ? '#ef4444' : actionTarget.action === 'pause' ? '#d97706' : '#16a34a',
                }}
              >
                {actionLoading ? 'Processing...' : actionTarget.action === 'cancel' ? 'Delete Account' : actionTarget.action === 'pause' ? 'Pause' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
