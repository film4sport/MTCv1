'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import * as db from '../lib/db';
import type { MatchLineup, LineupStatus, AnnouncementAudience } from '../lib/types';
import { reportError } from '../../lib/errorReporter';

const STATUS_COLORS: Record<LineupStatus, { bg: string; text: string; label: string }> = {
  available: { bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a', label: 'Available' },
  maybe: { bg: 'rgba(234, 179, 8, 0.15)', text: '#ca8a04', label: 'Maybe' },
  unavailable: { bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626', label: 'Unavailable' },
  pending: { bg: 'rgba(156, 163, 175, 0.15)', text: '#6b7280', label: 'Pending' },
};

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a' },
  intermediate: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb' },
  advanced: { bg: 'rgba(168, 85, 247, 0.1)', text: '#7c3aed' },
  competitive: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
};

export default function CaptainPage() {
  const { currentUser, members, announcements, setAnnouncements } = useApp();
  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'announcements' | 'lineups'>('roster');
  const [loading, setLoading] = useState(true);

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

  // Load lineups
  useEffect(() => {
    if (!isOnTeam || !team) return;
    setLoading(true);
    db.fetchLineups(team).then(data => {
      setLineups(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isOnTeam, team]);

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

  // ─── Lineups ───
  const [showNewLineup, setShowNewLineup] = useState(false);
  const [newLineup, setNewLineup] = useState({ matchDate: '', matchTime: '', opponent: '', location: '', notes: '' });
  const [expandedLineup, setExpandedLineup] = useState<string | null>(null);
  const [creatingLineup, setCreatingLineup] = useState(false);

  const createMatch = useCallback(async () => {
    if (!newLineup.matchDate || !team || !currentUser) return;
    setCreatingLineup(true);
    try {
      const id = await db.createLineup({ ...newLineup, team, createdBy: currentUser.id });
      if (id && team) {
        const updated = await db.fetchLineups(team);
        setLineups(updated);
      }
      setNewLineup({ matchDate: '', matchTime: '', opponent: '', location: '', notes: '' });
      setShowNewLineup(false);
    } catch (e) { reportError(e, 'createMatch'); }
    setCreatingLineup(false);
  }, [newLineup, team, currentUser]);

  const updateAvailability = useCallback(async (lineupId: string, memberId: string, status: LineupStatus, notes?: string) => {
    try {
      await db.updateLineupEntry(lineupId, memberId, { status, notes });
      setLineups(prev => prev.map(l =>
        l.id === lineupId
          ? { ...l, entries: l.entries.map(e => e.memberId === memberId ? { ...e, status, notes: notes ?? e.notes } : e) }
          : l
      ));
    } catch (e) { reportError(e, 'updateAvailability'); }
  }, []);

  const deleteMatch = useCallback(async (lineupId: string) => {
    try {
      await db.deleteLineup(lineupId);
      setLineups(prev => prev.filter(l => l.id !== lineupId));
    } catch (e) { reportError(e, 'deleteMatch'); }
  }, []);

  // ─── Guard ───
  if (!currentUser || !isOnTeam) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1f12' }}>
        <DashboardHeader title="My Team" />
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#e8e4d9' }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>No Team Assigned</h2>
          <p style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Join an interclub team from your profile page to access team management.</p>
        </div>
      </div>
    );
  }

  const teamLabel = team === 'a' ? 'Team A' : 'Team B';

  return (
    <div style={{ minHeight: '100vh', background: '#1a1f12' }}>
      <DashboardHeader title="My Team" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {/* Admin team selector */}
        {isAdmin && (!userTeam || userTeam === 'none') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['a', 'b'] as const).map(t => (
              <button key={t} onClick={() => setAdminTeamView(t)} style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: team === t ? '#d4e157' : 'rgba(255,255,255,0.08)',
                color: team === t ? '#1a1f12' : 'rgba(232,228,217,0.6)',
                fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              }}>
                Team {t.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212, 225, 87, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4e157" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e4d9', margin: 0 }}>Interclub {teamLabel}</h1>
            <p style={{ fontSize: 14, color: 'rgba(232, 228, 217, 0.5)', margin: 0 }}>
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}{isCaptain ? ' · You are captain' : ''}
            </p>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
          {(['roster', 'announcements', 'lineups'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(212, 225, 87, 0.15)' : 'transparent',
              color: activeTab === tab ? '#d4e157' : 'rgba(232, 228, 217, 0.5)',
              fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
            }}>
              {tab === 'roster' ? `Roster (${teamMembers.length})` : tab === 'announcements' ? 'Updates' : 'Matches'}
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
                    padding: '10px 20px', borderRadius: 10, border: '1.5px dashed rgba(212, 225, 87, 0.3)',
                    background: 'transparent', color: '#d4e157', cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%',
                  }}>+ Add Member to {teamLabel}</button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ color: '#e8e4d9', fontWeight: 600, fontSize: 14 }}>Add Member</span>
                      <button onClick={() => { setAddingMember(false); setMemberSearch(''); }} style={{ background: 'none', border: 'none', color: 'rgba(232, 228, 217, 0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <input
                      type="text" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, boxSizing: 'border-box', marginBottom: 8 }}
                    />
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredAvailable.length === 0 && <p style={{ color: 'rgba(232, 228, 217, 0.4)', fontSize: 13, textAlign: 'center', padding: 16 }}>No available members found</p>}
                      {filteredAvailable.map(m => (
                        <div key={m.id} onClick={() => addToTeam(m.id)} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                          borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                        }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div>
                            <span style={{ color: '#e8e4d9', fontSize: 14 }}>{m.name}</span>
                            {m.skillLevel && (
                              <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: SKILL_COLORS[m.skillLevel]?.bg, color: SKILL_COLORS[m.skillLevel]?.text }}>{m.skillLevel}</span>
                            )}
                          </div>
                          <span style={{ color: '#d4e157', fontSize: 13, fontWeight: 600 }}>+ Add</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team Members List */}
            {teamMembers.length === 0 ? (
              <p style={{ color: 'rgba(232, 228, 217, 0.4)', textAlign: 'center', padding: 32 }}>No members on this team yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamMembers.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212, 225, 87, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4e157', fontWeight: 700, fontSize: 16 }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#e8e4d9', fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                          {m.interclubCaptain && (
                            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(212, 225, 87, 0.2)', color: '#d4e157' }}>CAPTAIN</span>
                          )}
                          {m.id === currentUser.id && (
                            <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>YOU</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          {m.skillLevel && (
                            <span style={{ fontSize: 12, color: SKILL_COLORS[m.skillLevel]?.text || '#999' }}>{m.skillLevel}</span>
                          )}
                          {m.ntrp && <span style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.4)' }}>NTRP {m.ntrp}</span>}
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
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(232, 228, 217, 0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Post Team Update</div>
                <textarea
                  value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)}
                  placeholder={`Message to ${teamLabel}...`} rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['info', 'warning', 'urgent'] as const).map(t => (
                      <button key={t} onClick={() => setAnnouncementType(t)} style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: announcementType === t ? (t === 'urgent' ? 'rgba(239,68,68,0.2)' : t === 'warning' ? 'rgba(234,179,8,0.2)' : 'rgba(59,130,246,0.2)') : 'rgba(255,255,255,0.05)',
                        color: announcementType === t ? (t === 'urgent' ? '#ef4444' : t === 'warning' ? '#eab308' : '#60a5fa') : 'rgba(232,228,217,0.4)',
                      }}>{t}</button>
                    ))}
                  </div>
                  <button onClick={postTeamAnnouncement} disabled={!newAnnouncement.trim() || postingAnnouncement} style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: newAnnouncement.trim() ? '#d4e157' : 'rgba(255,255,255,0.1)',
                    color: newAnnouncement.trim() ? '#1a1f12' : 'rgba(232,228,217,0.3)',
                    opacity: postingAnnouncement ? 0.6 : 1,
                  }}>{postingAnnouncement ? 'Posting...' : 'Post'}</button>
                </div>
              </div>
            )}

            {/* Announcements List */}
            {teamAnnouncements.length === 0 ? (
              <p style={{ color: 'rgba(232, 228, 217, 0.4)', textAlign: 'center', padding: 32 }}>No team updates yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamAnnouncements.map(a => (
                  <div key={a.id} style={{
                    padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                    borderLeft: `3px solid ${a.type === 'urgent' ? '#ef4444' : a.type === 'warning' ? '#eab308' : '#60a5fa'}`,
                  }}>
                    <p style={{ color: '#e8e4d9', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{a.text}</p>
                    <span style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.35)', marginTop: 6, display: 'block' }}>
                      {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── LINEUPS TAB ─── */}
        {activeTab === 'lineups' && (
          <div>
            {/* Create Match (captain only) */}
            {(isCaptain || isAdmin) && (
              <div style={{ marginBottom: 20 }}>
                {!showNewLineup ? (
                  <button onClick={() => setShowNewLineup(true)} style={{
                    padding: '10px 20px', borderRadius: 10, border: '1.5px dashed rgba(212, 225, 87, 0.3)',
                    background: 'transparent', color: '#d4e157', cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%',
                  }}>+ Schedule Match</button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ color: '#e8e4d9', fontWeight: 600, fontSize: 14 }}>Schedule Match</span>
                      <button onClick={() => setShowNewLineup(false)} style={{ background: 'none', border: 'none', color: 'rgba(232, 228, 217, 0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.5)', display: 'block', marginBottom: 4 }}>Date *</label>
                        <input type="date" value={newLineup.matchDate} onChange={e => setNewLineup(p => ({ ...p, matchDate: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.5)', display: 'block', marginBottom: 4 }}>Time</label>
                        <input type="text" placeholder="e.g. 7:00 PM" value={newLineup.matchTime} onChange={e => setNewLineup(p => ({ ...p, matchTime: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.5)', display: 'block', marginBottom: 4 }}>Opponent</label>
                        <input type="text" placeholder="e.g. Orangeville TC" value={newLineup.opponent} onChange={e => setNewLineup(p => ({ ...p, opponent: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.5)', display: 'block', marginBottom: 4 }}>Location</label>
                        <input type="text" placeholder="e.g. Home / Away" value={newLineup.location} onChange={e => setNewLineup(p => ({ ...p, location: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, color: 'rgba(232, 228, 217, 0.5)', display: 'block', marginBottom: 4 }}>Notes</label>
                      <textarea value={newLineup.notes} onChange={e => setNewLineup(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional details..."
                        rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e8e4d9', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <button onClick={createMatch} disabled={!newLineup.matchDate || creatingLineup} style={{
                      padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, width: '100%',
                      background: newLineup.matchDate ? '#d4e157' : 'rgba(255,255,255,0.1)',
                      color: newLineup.matchDate ? '#1a1f12' : 'rgba(232,228,217,0.3)',
                      opacity: creatingLineup ? 0.6 : 1,
                    }}>{creatingLineup ? 'Creating...' : 'Create Match'}</button>
                  </div>
                )}
              </div>
            )}

            {/* Lineups List */}
            {loading ? (
              <p style={{ color: 'rgba(232, 228, 217, 0.4)', textAlign: 'center', padding: 32 }}>Loading matches...</p>
            ) : lineups.length === 0 ? (
              <p style={{ color: 'rgba(232, 228, 217, 0.4)', textAlign: 'center', padding: 32 }}>No upcoming matches scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lineups.map(lineup => {
                  const expanded = expandedLineup === lineup.id;
                  const counts = { available: 0, maybe: 0, unavailable: 0, pending: 0 };
                  lineup.entries.forEach(e => { counts[e.status]++; });
                  const dateStr = new Date(lineup.matchDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                  return (
                    <div key={lineup.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      {/* Match Header */}
                      <div onClick={() => setExpandedLineup(expanded ? null : lineup.id)} style={{
                        padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ color: '#e8e4d9', fontWeight: 700, fontSize: 15 }}>{dateStr}</span>
                            {lineup.matchTime && <span style={{ color: 'rgba(232, 228, 217, 0.5)', fontSize: 13 }}>{lineup.matchTime}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {lineup.opponent && <span style={{ color: '#d4e157', fontSize: 13, fontWeight: 600 }}>vs {lineup.opponent}</span>}
                            {lineup.location && <span style={{ color: 'rgba(232, 228, 217, 0.4)', fontSize: 12 }}>· {lineup.location}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {counts.available > 0 && <span style={{ ...dotBadge(STATUS_COLORS.available) }}>{counts.available}</span>}
                          {counts.maybe > 0 && <span style={{ ...dotBadge(STATUS_COLORS.maybe) }}>{counts.maybe}</span>}
                          {counts.unavailable > 0 && <span style={{ ...dotBadge(STATUS_COLORS.unavailable) }}>{counts.unavailable}</span>}
                          {counts.pending > 0 && <span style={{ ...dotBadge(STATUS_COLORS.pending) }}>{counts.pending}</span>}
                          <span style={{ color: 'rgba(232, 228, 217, 0.3)', fontSize: 16, marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Expanded: Member Availability */}
                      {expanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                          {lineup.notes && <p style={{ color: 'rgba(232, 228, 217, 0.5)', fontSize: 13, margin: '0 0 12px', fontStyle: 'italic' }}>{lineup.notes}</p>}
                          {lineup.entries.length === 0 ? (
                            <p style={{ color: 'rgba(232, 228, 217, 0.3)', fontSize: 13, textAlign: 'center' }}>No entries yet</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {lineup.entries.map(entry => {
                                const isMe = entry.memberId === currentUser.id;
                                const canEdit = isMe || isCaptain;
                                const sc = STATUS_COLORS[entry.status];
                                return (
                                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.15)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212, 225, 87, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4e157', fontWeight: 700, fontSize: 13 }}>
                                        {(entry.memberName || '?').charAt(0)}
                                      </div>
                                      <div>
                                        <span style={{ color: '#e8e4d9', fontSize: 13, fontWeight: isMe ? 700 : 500 }}>{entry.memberName || 'Unknown'}{isMe ? ' (you)' : ''}</span>
                                        {entry.position && <span style={{ color: 'rgba(232, 228, 217, 0.4)', fontSize: 11, marginLeft: 6 }}>{entry.position}</span>}
                                        {entry.notes && <span style={{ color: 'rgba(232, 228, 217, 0.35)', fontSize: 11, display: 'block' }}>{entry.notes}</span>}
                                      </div>
                                    </div>
                                    {canEdit ? (
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        {(['available', 'maybe', 'unavailable'] as const).map(s => (
                                          <button key={s} onClick={() => updateAvailability(lineup.id, entry.memberId, s)} style={{
                                            width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
                                            background: entry.status === s ? STATUS_COLORS[s].bg : 'rgba(255,255,255,0.05)',
                                            color: entry.status === s ? STATUS_COLORS[s].text : 'rgba(232,228,217,0.3)',
                                            fontWeight: entry.status === s ? 700 : 400,
                                          }} title={STATUS_COLORS[s].label}>
                                            {s === 'available' ? '✓' : s === 'maybe' ? '?' : '✗'}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text }}>{sc.label}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Delete Match (captain only) */}
                          {(isCaptain || isAdmin) && (
                            <button onClick={() => deleteMatch(lineup.id)} style={{
                              marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)',
                              background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%',
                            }}>Delete Match</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function dotBadge(colors: { bg: string; text: string }): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: 8, fontSize: 12, fontWeight: 700,
    background: colors.bg, color: colors.text,
  };
}
