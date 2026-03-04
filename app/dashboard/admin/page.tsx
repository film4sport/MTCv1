'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../lib/store';
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
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase gate code update');
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
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase member action');
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

  const toggleCourtMaintenance = (courtId: number) => {
    const court = courts.find(c => c.id === courtId);
    const newStatus = court?.status === 'maintenance' ? 'available' : 'maintenance';
    setCourts(courts.map(c => c.id === courtId ? { ...c, status: newStatus } as typeof c : c));
    db.updateCourtStatus(courtId, newStatus).catch((err) => reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase'));
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
    db.createAnnouncement(ann).catch((err) => reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase'));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    db.deleteAnnouncement(id).catch((err) => reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase'));
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
            onAnnouncementChange={setNewAnnouncement}
            onAnnouncementTypeChange={setNewAnnouncementType}
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
