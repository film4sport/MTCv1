'use client';

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import * as db from '../lib/db';
import type { AnnouncementAudience } from '../lib/types';
import { reportError } from '../../lib/errorReporter';

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a' },
  intermediate: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb' },
  advanced: { bg: 'rgba(168, 85, 247, 0.1)', text: '#7c3aed' },
  competitive: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
};

export default function CaptainPage() {
  const { currentUser, members, announcements, setAnnouncements } = useApp();
  const [activeTab, setActiveTab] = useState<'roster' | 'announcements'>('roster');

  // Captain state
  const isAdmin = currentUser?.role === 'admin';
  const isCaptain = currentUser?.interclubCaptain === true;
  const userTeam = currentUser?.interclubTeam as 'a' | 'b' | 'none' | undefined;
  const [adminTeamView, setAdminTeamView] = useState<'a' | 'b'>('a');
  // Admins can view any team; members see their own
  const team = (isAdmin && (!userTeam || userTeam === 'none')) ? adminTeamView : (userTeam as 'a' | 'b' | undefined);
  const isOnTeam = team === 'a' || team === 'b';

  // Roster
  const teamMembers = useMemo(() =>
    members.filter(m => m.interclubTeam === team).sort((a, b) => {
      if (a.interclubCaptain && !b.interclubCaptain) return -1;
      if (!a.interclubCaptain && b.interclubCaptain) return 1;
      return a.name.localeCompare(b.name);
    }),
    [members, team]
  );
  const availableMembers = useMemo(() =>
    members.filter(m => m.interclubTeam === 'none' && m.status !== 'paused' && m.role !== 'admin'),
    [members]
  );

  // Team announcements
  const teamAnnouncements = useMemo(() => {
    const teamAudience = team === 'a' ? 'interclub_a' : 'interclub_b';
    return announcements
      .filter(a => a.audience === teamAudience || a.audience === 'interclub_all')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [announcements, team]);

  // ─── Roster Management ───
  const [addingMember, setAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const filteredAvailable = useMemo(() => {
    if (!memberSearch.trim()) return availableMembers.slice(0, 10);
    const q = memberSearch.toLowerCase();
    return availableMembers.filter(m => m.name.toLowerCase().includes(q)).slice(0, 10);
  }, [availableMembers, memberSearch]);

  const addToTeam = useCallback(async (userId: string) => {
    if (!team) return;
    try {
      await db.updateProfile(userId, { interclub_team: team });
      // Refresh will happen via Realtime subscription on profiles
    } catch (e) { reportError(e, 'addToTeam'); }
  }, [team]);

  const removeFromTeam = useCallback(async (userId: string) => {
    try {
      await db.updateProfile(userId, { interclub_team: 'none' });
    } catch (e) { reportError(e, 'removeFromTeam'); }
  }, []);

  // ─── Announcements ───
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const postTeamAnnouncement = useCallback(async () => {
    if (!newAnnouncement.trim() || !team || !currentUser) return;
    setPostingAnnouncement(true);
    try {
      const audience: AnnouncementAudience = team === 'a' ? 'interclub_a' : 'interclub_b';
      const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const date = new Date().toISOString().split('T')[0];
      const ann = { id, text: newAnnouncement.trim(), type: announcementType, audience, date, dismissedBy: [] as string[] };
      await db.createAnnouncement(ann);
      setAnnouncements([ann, ...announcements]);
      setNewAnnouncement('');
      setAnnouncementType('info');
    } catch (e) { reportError(e, 'postTeamAnnouncement'); }
    setPostingAnnouncement(false);
  }, [newAnnouncement, announcementType, team, currentUser, announcements, setAnnouncements]);

  // ─── Guard ───
  if (!currentUser || !isOnTeam) {
    return (
      <div className="min-h-screen dashboard-gradient-bg">
        <DashboardHeader title="My Team" />
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#2a2f1e' }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>No Team Assigned</h2>
          <p style={{ color: '#6b7266' }}>Join an interclub team from your settings page to access team management.</p>
        </div>
      </div>
    );
  }

  const teamLabel = team === 'a' ? 'Team A' : 'Team B';

  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="My Team" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {/* Admin team selector */}
        {isAdmin && (!userTeam || userTeam === 'none') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['a', 'b'] as const).map(t => (
              <button key={t} onClick={() => setAdminTeamView(t)} style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: team === t ? '#6b7a3d' : 'rgba(255,255,255,0.5)',
                color: team === t ? '#fff' : '#6b7266',
                fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              }}>
                Team {t.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(107, 122, 61, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2a2f1e', margin: 0 }}>Interclub {teamLabel}</h1>
            <p style={{ fontSize: 14, color: '#6b7266', margin: 0 }}>
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}{isCaptain ? ' · You are captain' : ''}
            </p>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="glass-card" style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.4)' }}>
          {(['roster', 'announcements'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#6b7a3d' : 'transparent',
              color: activeTab === tab ? '#fff' : '#6b7266',
              fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
            }}>
              {tab === 'roster' ? `Roster (${teamMembers.length})` : 'Updates'}
            </button>
          ))}
        </div>

        {/* ─── ROSTER TAB ─── */}
        {activeTab === 'roster' && (
          <div>
            {/* Add Member (captain or admin) */}
            {(isCaptain || isAdmin) && (
              <div style={{ marginBottom: 20 }}>
                {!addingMember ? (
                  <button onClick={() => setAddingMember(true)} style={{
                    padding: '10px 20px', borderRadius: 10, border: '1.5px dashed rgba(107, 122, 61, 0.3)',
                    background: 'transparent', color: '#6b7a3d', cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%',
                  }}>+ Add Member to {teamLabel}</button>
                ) : (
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ color: '#2a2f1e', fontWeight: 600, fontSize: 14 }}>Add Member</span>
                      <button onClick={() => { setAddingMember(false); setMemberSearch(''); }} style={{ background: 'none', border: 'none', color: '#6b7266', cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <input
                      type="text" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0dcd3', background: '#faf8f3', color: '#2a2f1e', fontSize: 14, boxSizing: 'border-box', marginBottom: 8 }}
                    />
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredAvailable.length === 0 && <p style={{ color: '#6b7266', fontSize: 13, textAlign: 'center', padding: 16 }}>No available members found</p>}
                      {filteredAvailable.map(m => (
                        <div key={m.id} onClick={() => addToTeam(m.id)} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                          borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                        }} onMouseEnter={e => (e.currentTarget.style.background = '#f5f2eb')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div>
                            <span style={{ color: '#2a2f1e', fontSize: 14 }}>{m.name}</span>
                            {m.skillLevel && (
                              <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: SKILL_COLORS[m.skillLevel]?.bg, color: SKILL_COLORS[m.skillLevel]?.text }}>{m.skillLevel}</span>
                            )}
                          </div>
                          <span style={{ color: '#6b7a3d', fontSize: 13, fontWeight: 600 }}>+ Add</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team Members List */}
            {teamMembers.length === 0 ? (
              <p style={{ color: '#6b7266', textAlign: 'center', padding: 32 }}>No members on this team yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamMembers.map(m => (
                  <div key={m.id} className="glass-card" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.6)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.4)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(107, 122, 61, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7a3d', fontWeight: 700, fontSize: 16 }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#2a2f1e', fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                          {m.interclubCaptain && (
                            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(107, 122, 61, 0.15)', color: '#6b7a3d' }}>CAPTAIN</span>
                          )}
                          {m.id === currentUser.id && (
                            <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>YOU</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          {m.skillLevel && (
                            <span style={{ fontSize: 12, color: SKILL_COLORS[m.skillLevel]?.text || '#999' }}>{m.skillLevel}</span>
                          )}
                          {m.ntrp && <span style={{ fontSize: 12, color: '#6b7266' }}>NTRP {m.ntrp}</span>}
                        </div>
                      </div>
                    </div>
                    {(isCaptain || isAdmin) && m.id !== currentUser.id && !m.interclubCaptain && (
                      <button onClick={() => removeFromTeam(m.id)} style={{
                        padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ANNOUNCEMENTS TAB ─── */}
        {activeTab === 'announcements' && (
          <div>
            {/* Post Form (captain only) */}
            {(isCaptain || isAdmin) && (
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7266', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Post Team Update</div>
                <textarea
                  value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)}
                  placeholder={`Message to ${teamLabel}...`} rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e0dcd3', background: '#faf8f3', color: '#2a2f1e', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['info', 'warning', 'urgent'] as const).map(t => (
                      <button key={t} onClick={() => setAnnouncementType(t)} style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: announcementType === t ? (t === 'urgent' ? 'rgba(239,68,68,0.15)' : t === 'warning' ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.15)') : '#f5f2eb',
                        color: announcementType === t ? (t === 'urgent' ? '#dc2626' : t === 'warning' ? '#ca8a04' : '#2563eb') : '#6b7266',
                      }}>{t}</button>
                    ))}
                  </div>
                  <button onClick={postTeamAnnouncement} disabled={!newAnnouncement.trim() || postingAnnouncement} style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: newAnnouncement.trim() ? '#6b7a3d' : '#e0dcd3',
                    color: newAnnouncement.trim() ? '#fff' : '#999',
                    opacity: postingAnnouncement ? 0.6 : 1,
                  }}>{postingAnnouncement ? 'Posting...' : 'Post'}</button>
                </div>
              </div>
            )}

            {/* Announcements List */}
            {teamAnnouncements.length === 0 ? (
              <p style={{ color: '#6b7266', textAlign: 'center', padding: 32 }}>No team updates yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamAnnouncements.map(a => (
                  <div key={a.id} className="glass-card" style={{
                    padding: '14px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: 12,
                    borderLeft: `3px solid ${a.type === 'urgent' ? '#ef4444' : a.type === 'warning' ? '#eab308' : '#60a5fa'}`,
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderLeftWidth: 3, borderLeftColor: a.type === 'urgent' ? '#ef4444' : a.type === 'warning' ? '#eab308' : '#60a5fa',
                  }}>
                    <p style={{ color: '#2a2f1e', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{a.text}</p>
                    <span style={{ fontSize: 12, color: '#6b7266', marginTop: 6, display: 'block' }}>
                      {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
