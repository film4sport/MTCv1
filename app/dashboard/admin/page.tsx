'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useBookings, useNotifications, useDerived, apiCall } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { generateId, useFocusTrap } from '../lib/utils';
import * as db from '../lib/db';
import { reportError } from '../../lib/errorReporter';
import AdminDashboardTab from './components/AdminDashboardTab';
import AdminMembersTab from './components/AdminMembersTab';
import AdminCourtsTab from './components/AdminCourtsTab';
import AdminAnnouncementsTab from './components/AdminAnnouncementsTab';

type AdminTab = 'dashboard' | 'members' | 'courts' | 'announcements';

export default function AdminPage() {
  const { currentUser } = useAuth();
  const { bookings, courts, setCourts } = useBookings();
  const { announcements, setAnnouncements } = useNotifications();
  const { analytics, members, setMembers } = useDerived();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [memberSearch, setMemberSearch] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [newAnnouncementAudience, setNewAnnouncementAudience] = useState<'all' | 'interclub_a' | 'interclub_b' | 'interclub_all'>('all');

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
      // Update gate code via settings API
      await apiCall('/api/mobile/settings', 'POST', {
        settings: { gate_code: newGateCode.trim() },
      });
      setGateCode(newGateCode.trim());
      setNewGateCode('');
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'API gate code update');
      showToast('Failed to update gate code', 'error');
      setGateCodeLoading(false);
      return;
    }

    // Notify members separately via conversations API (creates bell + push per message)
    const code = newGateCode.trim() || gateCode;
    const activeMembers = members.filter(m => m.id !== currentUser.id && m.role !== 'admin' && (m.status || 'active') === 'active');
    let notified = 0;
    for (const member of activeMembers) {
      try {
        await apiCall('/api/mobile/conversations', 'POST', {
          toId: member.id,
          text: `The court gate code has been updated. Your new gate code is: ${code}\n\nPlease keep this code confidential and do not share it with non-members.`,
        });
        notified++;
      } catch (err) {
        console.error(`[MTC] Failed to notify ${member.name}:`, err);
      }
    }

    if (notified === activeMembers.length) {
      showToast(`Gate code updated. ${notified} member${notified !== 1 ? 's' : ''} notified.`);
    } else {
      showToast(`Gate code updated, but only ${notified}/${activeMembers.length} members notified. Some notifications failed.`, 'error');
    }
    setGateCodeLoading(false);
  };

  // Handle member actions
  const handleMemberAction = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      if (actionTarget.action === 'pause') {
        await apiCall('/api/mobile/members', 'PATCH', { memberId: actionTarget.id, status: 'paused' });
        setMembers(members.map(m => m.id === actionTarget.id ? { ...m, status: 'paused' as const } : m));
        showToast(`${actionTarget.name}'s membership paused.`);
      } else if (actionTarget.action === 'unpause') {
        await apiCall('/api/mobile/members', 'PATCH', { memberId: actionTarget.id, status: 'active' });
        setMembers(members.map(m => m.id === actionTarget.id ? { ...m, status: 'active' as const } : m));
        showToast(`${actionTarget.name}'s membership reactivated.`);
      } else if (actionTarget.action === 'cancel') {
        await apiCall('/api/mobile/members', 'DELETE', { memberId: actionTarget.id });
        setMembers(members.filter(m => m.id !== actionTarget.id));
        showToast(`${actionTarget.name}'s account deleted.`);
      }
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'API member action');
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
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

  const toggleCourtMaintenance = (courtId: number) => {
    const court = courts.find(c => c.id === courtId);
    const newStatus = court?.status === 'maintenance' ? 'available' : 'maintenance';
    setCourts(courts.map(c => c.id === courtId ? { ...c, status: newStatus } as typeof c : c));
    apiCall('/api/mobile/courts', 'PATCH', { courtId, status: newStatus }).catch((err) => {
      // Rollback
      setCourts(courts.map(c => c.id === courtId ? { ...c, status: court?.status || 'available' } as typeof c : c));
      reportError(err instanceof Error ? err : new Error(String(err)), 'API');
      showToast('Failed to update court status', 'error');
    });
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    const optimisticAnn = {
      id: generateId('a'),
      text: newAnnouncement.trim(),
      type: newAnnouncementType,
      audience: newAnnouncementAudience,
      date: new Date().toISOString().split('T')[0],
      dismissedBy: [] as string[],
    };
    setAnnouncements([optimisticAnn, ...announcements]);
    setNewAnnouncement('');
    setNewAnnouncementAudience('all');

    try {
      // API route handles: DB insert + bell notifications + push notifications
      await apiCall('/api/mobile/announcements', 'POST', {
        text: optimisticAnn.text,
        type: optimisticAnn.type,
        audience: optimisticAnn.audience,
      });
      const audienceLabel = optimisticAnn.audience === 'all' ? 'all members' : optimisticAnn.audience === 'interclub_a' ? 'Team A' : optimisticAnn.audience === 'interclub_b' ? 'Team B' : 'all interclub members';
      showToast(`Announcement posted to ${audienceLabel}`);
    } catch (err) {
      // Rollback optimistic update
      setAnnouncements(announcements.filter(a => a.id !== optimisticAnn.id));
      reportError(err instanceof Error ? err : new Error(String(err)), 'API');
      showToast(err instanceof Error ? err.message : 'Failed to post announcement', 'error');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const prev = announcements;
    setAnnouncements(announcements.filter(a => a.id !== id));
    try {
      await apiCall('/api/mobile/announcements', 'DELETE', { id });
    } catch (err) {
      setAnnouncements(prev); // Rollback
      reportError(err instanceof Error ? err : new Error(String(err)), 'API');
      showToast('Failed to delete announcement', 'error');
    }
  };

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> },
    { key: 'members', label: 'Members', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { key: 'courts', label: 'Courts', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="12" y1="4" x2="12" y2="20" /><line x1="2" y1="12" x2="22" y2="12" /></svg> },
    { key: 'announcements', label: 'Announcements', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> },
  ];

  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Admin Panel" />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-slideUp space-y-5">
        <div className="dashboard-panel rounded-[32px] border p-5 sm:p-6 shadow-[0_28px_72px_rgba(31,40,23,0.16)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="dashboard-soft-pill mb-3 inline-flex">Club Operations</span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em]" style={{ color: '#24301c' }}>
                Run the club with more clarity and less visual noise.
              </h2>
              <p className="mt-3 text-sm leading-6" style={{ color: '#6d685e' }}>
                Member actions, court controls, and announcements should feel just as polished as the member-facing experience.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:min-w-[360px]">
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(107,122,61,0.08)', border: '1px solid rgba(107,122,61,0.12)' }}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Members</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: '#24301c' }}>{members.length}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.55)' }}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Courts</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: '#24301c' }}>{courts.length}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,248,231,0.74)', border: '1px solid rgba(214,188,123,0.2)' }}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Live Tab</p>
                <p className="mt-1 text-sm font-semibold capitalize" style={{ color: '#24301c' }}>{tab}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-panel rounded-[28px] border p-2 flex gap-1 overflow-x-auto" role="tablist">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              role="tab"
              aria-selected={tab === t.key}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors relative"
              style={{
                color: tab === t.key ? '#6b7a3d' : '#9a9689',
                fontSize: '0.9375rem',
                borderRadius: '18px',
                background: tab === t.key ? 'rgba(107, 122, 61, 0.08)' : 'transparent',
              }}
            >
              <span style={{ opacity: tab === t.key ? 1 : 0.5 }}>{t.icon}</span>
              {t.label}
              {tab === t.key && (
                <div className="absolute inset-x-4 bottom-1 h-[3px] rounded-full" style={{ background: '#6b7a3d' }} />
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <AdminDashboardTab
            currentUser={currentUser}
            members={members}
            bookings={bookings}
            courts={courts}
            analytics={analytics}
            gateCode={gateCode}
            newGateCode={newGateCode}
            gateCodeLoading={gateCodeLoading}
            onGateCodeChange={setNewGateCode}
            onGateCodeUpdate={handleGateCodeUpdate}
            exportFromDate={exportFromDate}
            onExportFromDateChange={setExportFromDate}
          />
        )}

        {/* Members Tab */}
        {tab === 'members' && (
          <AdminMembersTab
            currentUser={currentUser}
            members={members}
            memberSearch={memberSearch}
            onMemberSearchChange={setMemberSearch}
            onActionClick={(id, name, action) => setActionTarget({ id, name, action })}
            onSetCaptain={async (userId, captain) => {
              try {
                await apiCall('/api/mobile/members', 'PATCH', { memberId: userId, interclub_captain: captain });
                setMembers(members.map(m => m.id === userId ? { ...m, interclubCaptain: captain } : m));
                showToast(captain ? 'Set as team captain' : 'Removed captain status');
              } catch (err) {
                reportError(err instanceof Error ? err : new Error(String(err)), 'API');
                showToast('Failed to update captain status', 'error');
              }
            }}
          />
        )}

        {/* Courts Tab */}
        {tab === 'courts' && (
          <AdminCourtsTab
            courts={courts}
            onToggleMaintenance={toggleCourtMaintenance}
          />
        )}

        {/* Announcements Tab */}
        {tab === 'announcements' && (
          <AdminAnnouncementsTab
            announcements={announcements}
            newAnnouncement={newAnnouncement}
            newAnnouncementType={newAnnouncementType}
            newAnnouncementAudience={newAnnouncementAudience}
            onAnnouncementChange={setNewAnnouncement}
            onAnnouncementTypeChange={setNewAnnouncementType}
            onAnnouncementAudienceChange={setNewAnnouncementAudience}
            onAddAnnouncement={addAnnouncement}
            onDeleteAnnouncement={deleteAnnouncement}
          />
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
