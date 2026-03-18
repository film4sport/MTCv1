'use client';

import type { User, Court, Booking, AdminAnalytics } from '../../lib/types';
import { useToast } from '../../lib/toast';

interface AdminDashboardTabProps {
  currentUser: User | null;
  members: User[];
  bookings: Booking[];
  courts: Court[];
  analytics: AdminAnalytics;
  gateCode: string;
  newGateCode: string;
  gateCodeLoading: boolean;
  onGateCodeChange: (value: string) => void;
  onGateCodeUpdate: () => void;
  exportFromDate: string;
  onExportFromDateChange: (value: string) => void;
}

export default function AdminDashboardTab({
  currentUser,
  members,
  bookings,
  courts,
  analytics,
  gateCode,
  newGateCode,
  gateCodeLoading,
  onGateCodeChange,
  onGateCodeUpdate,
  exportFromDate,
  onExportFromDateChange,
}: AdminDashboardTabProps) {
  const { showToast } = useToast();

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.64)', borderColor: 'rgba(255, 255, 255, 0.55)' }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Exports</p>
              <h4 className="mt-1 font-semibold text-lg" style={{ color: '#2a2f1e' }}>Pull the operational numbers you need without digging.</h4>
              <p className="mt-2 text-xs leading-6" style={{ color: '#6b7266' }}>
                Filter by join date when needed, then download member, payment, or court-usage snapshots for bookkeeping and planning.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs rounded-xl px-3 py-2 self-start lg:self-auto" style={{ color: '#6b7266', background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              From
              <input
                type="date"
                value={exportFromDate}
                onChange={e => onExportFromDateChange(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ background: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
              />
              {exportFromDate && (
                <button onClick={() => onExportFromDateChange('')} className="text-xs underline" style={{ color: '#6b7a3d' }}>Clear</button>
              )}
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { label: 'Export Members', onClick: exportMembers },
              { label: 'Export Payments', onClick: exportPayments },
              { label: 'Export Court Usage', onClick: exportCourtUsage },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-white"
                style={{ background: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 248, 231, 0.7)', borderColor: 'rgba(214,188,123,0.2)' }}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Today at a Glance</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.55)' }}>
              <p className="text-[0.65rem]" style={{ color: '#8c866f' }}>Admins</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: '#2a2f1e' }}>{members.filter(m => m.role === 'admin').length}</p>
            </div>
            <div className="rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.55)' }}>
              <p className="text-[0.65rem]" style={{ color: '#8c866f' }}>Revenue Streams</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: '#2a2f1e' }}>{analytics.revenueBreakdown.length}</p>
            </div>
            <div className="rounded-2xl px-3 py-3" style={{ background: 'rgba(107,122,61,0.08)', border: '1px solid rgba(107,122,61,0.12)' }}>
              <p className="text-[0.65rem]" style={{ color: '#8c866f' }}>Operator</p>
              <p className="mt-1 text-sm font-semibold truncate" style={{ color: '#2a2f1e' }}>{currentUser?.name || 'Admin'}</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-6" style={{ color: '#6b7266' }}>
            Keep member communication, gate updates, and reporting moving from one calm operations surface.
          </p>
        </div>
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
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="px-4 py-2.5 rounded-xl text-lg font-bold tracking-widest self-start" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>
            {gateCode || '—'}
          </div>
          <div className="text-xs leading-5 sm:text-right" style={{ color: '#6b7266' }}>
            <p>Current code</p>
            <p>Updating this will message all active non-admin members.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGateCode}
            onChange={(e) => onGateCodeChange(e.target.value)}
            placeholder="Enter new code..."
            aria-label="New gate code"
            maxLength={10}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
            style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
          />
          <button
            onClick={onGateCodeUpdate}
            disabled={!newGateCode.trim() || gateCodeLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90 whitespace-nowrap"
            style={{ background: '#6b7a3d' }}
          >
            {gateCodeLoading ? 'Updating...' : 'Update & Notify'}
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
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
          {analytics.peakTimes.map((pt: any, i: number) => (
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
        <div className="h-6 rounded-full overflow-hidden flex mb-4" style={{ background: '#f5f2eb' }}>
          {analytics.revenueBreakdown.map((item: any, i: number) => {
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
          {analytics.revenueBreakdown.map((item: any, i: number) => {
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
          {analytics.memberActivity.mostActive.map((m: any, i: number) => {
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
          {analytics.monthlyTrends.map((month: any) => {
            const maxBookings = Math.max(...analytics.monthlyTrends.map((m: any) => m.bookings));
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
  );
}
