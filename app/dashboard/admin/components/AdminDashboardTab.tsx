'use client';

import { Member, Court, Booking, Analytics } from '../../lib/store';
import { useToast } from '../../lib/toast';
import { generateId } from '../../lib/utils';
import * as db from '../../lib/db';
import { reportError } from '../../../lib/errorReporter';
import { useState } from 'react';

interface AdminDashboardTabProps {
  currentUser: Member | null;
  members: Member[];
  bookings: Booking[];
  courts: Court[];
  analytics: Analytics;
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
      {/* Export Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#6b7266' }}>
          From:
          <input
            type="date"
            value={exportFromDate}
            onChange={e => onExportFromDateChange(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs"
            style={{ background: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
          />
          {exportFromDate && (
            <button onClick={() => onExportFromDateChange('')} className="text-xs underline" style={{ color: '#6b7a3d' }}>Clear</button>
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
  );
}
