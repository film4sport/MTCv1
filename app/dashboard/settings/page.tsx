'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { AvatarDisplay, AVATAR_OPTIONS, AVATAR_SVGS } from '../lib/avatars';
import type { SkillLevel, FamilyMember, User } from '../lib/types';
import * as db from '../lib/db';
import { reportError } from '../../lib/errorReporter';

const INTERCLUB_TEAMS: { value: User['interclubTeam']; label: string; color: string; bg: string }[] = [
  { value: 'none', label: 'Not on a team', color: '#6b7266', bg: 'rgba(107, 114, 102, 0.08)' },
  { value: 'a', label: 'A Team', color: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.1)' },
  { value: 'b', label: 'B Team', color: '#3BAFDA', bg: 'rgba(59, 175, 218, 0.1)' },
];

const SKILL_LEVELS: { value: SkillLevel; label: string; color: string; bg: string }[] = [
  { value: 'beginner', label: 'Beginner', color: '#16a34a', bg: 'rgba(34, 197, 94, 0.1)' },
  { value: 'intermediate', label: 'Intermediate', color: '#3BAFDA', bg: 'rgba(59, 175, 218, 0.1)' },
  { value: 'advanced', label: 'Advanced', color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)' },
  { value: 'competitive', label: 'Competitive', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' },
];

export default function SettingsPage() {
  const { currentUser, updateCurrentUser, bookings, conversations, logout, notificationPreferences, setNotificationPreferences, familyMembers, setFamilyMembers } = useApp();
  const router = useRouter();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  // Profile state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(currentUser?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const avatarModalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [gateCode, setGateCode] = useState<string | null>(null);

  // Family member management
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberType, setNewMemberType] = useState<'adult' | 'junior'>('adult');
  const [newMemberBirthYear, setNewMemberBirthYear] = useState('');
  const [savingMember, setSavingMember] = useState(false);
  const [editingMemberSkill, setEditingMemberSkill] = useState<string | null>(null);

  const isFamily = currentUser?.membershipType === 'family';
  const adultCount = familyMembers.filter(m => m.type === 'adult').length;
  const juniorCount = familyMembers.filter(m => m.type === 'junior').length;
  const canAddAdult = adultCount < 2;
  const canAddJunior = juniorCount < 4;

  const togglePref = (key: keyof typeof notificationPreferences) => {
    setNotificationPreferences({ ...notificationPreferences, [key]: !notificationPreferences[key] });
  };

  const handleLogout = () => {
    logout();
  };

  // Load gate code on mount
  useEffect(() => {
    db.getGateCode().then(code => { if (code) setGateCode(code); });
  }, []);

  // Esc key closes avatar picker
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && showAvatarPicker) setShowAvatarPicker(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showAvatarPicker]);

  const skillLevel = currentUser?.skillLevel ?? 'intermediate';

  const saveSkillLevel = async (level: SkillLevel) => {
    if (!currentUser) return;
    try {
      await db.updateProfile(currentUser.id, { skill_level: level, skill_level_set: true });
      updateCurrentUser({ skillLevel: level, skillLevelSet: true });
      showToast('Skill level updated');
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to update skill level. Please try again.', 'error');
    }
  };

  const saveInterclubTeam = async (team: User['interclubTeam']) => {
    if (!currentUser || team === undefined) return;
    try {
      await db.updateProfile(currentUser.id, { interclub_team: team });
      updateCurrentUser({ interclubTeam: team });
      showToast(team === 'none' ? 'Removed from interclub team' : `Set to Interclub ${team.toUpperCase()} Team`);
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to update team. Please try again.', 'error');
    }
  };

  const selectAvatar = async (avatarId: string) => {
    if (!currentUser) return;
    try {
      await db.updateProfile(currentUser.id, { avatar: avatarId });
      updateCurrentUser({ avatar: avatarId });
      setShowAvatarPicker(false);
      showToast('Avatar updated!');
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to update avatar. Please try again.', 'error');
    }
  };

  const saveName = async () => {
    if (!currentUser) return;
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === currentUser.name) { setEditingName(false); return; }
    setNameSaving(true);
    try {
      await db.updateProfile(currentUser.id, { name: trimmed });
      updateCurrentUser({ name: trimmed });
      showToast('Name updated');
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to update name. Please try again.', 'error');
      setNameValue(currentUser.name);
    } finally {
      setNameSaving(false);
      setEditingName(false);
    }
  };

  const handleAddMember = useCallback(async () => {
    const trimmed = newMemberName.trim();
    if (!trimmed || !currentUser?.familyId) return;
    setSavingMember(true);
    try {
      const member = await db.addFamilyMember(currentUser.familyId, {
        name: trimmed,
        type: newMemberType,
        birthYear: newMemberType === 'junior' && newMemberBirthYear ? parseInt(newMemberBirthYear) : undefined,
      });
      if (member) {
        setFamilyMembers([...familyMembers, member]);
        showToast(`${trimmed} added to family`);
      }
      setNewMemberName('');
      setNewMemberBirthYear('');
      setAddingMember(false);
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to add family member', 'error');
    } finally {
      setSavingMember(false);
    }
  }, [newMemberName, newMemberType, newMemberBirthYear, currentUser?.familyId, familyMembers, setFamilyMembers, showToast]);

  const handleRemoveMember = useCallback(async (member: FamilyMember) => {
    if (!confirm(`Remove ${member.name} from your family?`)) return;
    try {
      await db.removeFamilyMember(member.id);
      setFamilyMembers(familyMembers.filter(m => m.id !== member.id));
      showToast(`${member.name} removed`);
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to remove family member', 'error');
    }
  }, [familyMembers, setFamilyMembers, showToast]);

  const handleMemberSkillChange = useCallback(async (member: FamilyMember, level: SkillLevel) => {
    try {
      await db.updateFamilyMember(member.id, { skill_level: level, skill_level_set: true });
      setFamilyMembers(familyMembers.map(m => m.id === member.id ? { ...m, skillLevel: level, skillLevelSet: true } : m));
      setEditingMemberSkill(null);
      showToast(`${member.name}'s skill level updated`);
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), 'Supabase');
      showToast('Failed to update skill level', 'error');
    }
  }, [familyMembers, setFamilyMembers, showToast]);

  const downloadMyData = async () => {
    if (!currentUser) return;
    setDownloading(true);
    try {
      const myBookings = bookings.filter(b => b.userId === currentUser.id);
      const myConversations = conversations.map(c => ({
        with: c.memberName,
        messages: c.messages.map(m => ({ from: m.fromId === currentUser.id ? 'You' : m.from, text: m.text, date: m.timestamp })),
      }));
      const data = {
        exportedAt: new Date().toISOString(),
        profile: { name: currentUser.name, email: currentUser.email, role: currentUser.role, skillLevel: currentUser.skillLevel, memberSince: currentUser.memberSince },
        bookings: myBookings.map(b => ({ court: b.courtName, date: b.date, time: b.time, status: b.status, type: b.type })),
        conversations: myConversations,
        notificationPreferences,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mtc-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Your data has been downloaded.');
    } catch {
      showToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <p className="text-sm" style={{ color: '#6b7266' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Settings" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-slideUp">

        {/* ═══ PROFILE SECTION ═══ */}

        {/* Profile Card */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              <AvatarDisplay avatar={currentUser.avatar} name={currentUser.name} size={80} />
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#2a2f1e' }}>{currentUser.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'coach' ? 'Coach' : 'Member'}
                </span>
                {currentUser.memberSince && (
                  <span className="text-xs" style={{ color: '#6b7266' }}>
                    Member since {new Date(currentUser.memberSince + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Personal Info</h3>
          <div className="space-y-4">
            <div className="py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <p className="text-xs" style={{ color: '#6b7266' }}>Full Name</p>
              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameValue(currentUser.name); setEditingName(false); } }}
                    maxLength={80}
                    disabled={nameSaving}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: '#faf8f3', border: '1px solid #6b7a3d', color: '#2a2f1e' }}
                    autoFocus
                  />
                  <button onClick={saveName} disabled={nameSaving} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                    {nameSaving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => { setNameValue(currentUser.name); setEditingName(false); }} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#f5f2eb', color: '#6b7266' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser.name}</p>
                  <button onClick={() => { setNameValue(currentUser.name); setEditingName(true); }} className="text-xs hover:underline" style={{ color: '#6b7a3d' }}>Edit</button>
                </div>
              )}
            </div>
            <div className="py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <p className="text-xs" style={{ color: '#6b7266' }}>Email</p>
              <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser.email}</p>
            </div>
            <div className="py-2">
              <p className="text-xs mb-2" style={{ color: '#6b7266' }}>Skill Level</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => saveSkillLevel(level.value)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 btn-press"
                    style={{
                      background: skillLevel === level.value ? level.color : level.bg,
                      color: skillLevel === level.value ? '#fff' : level.color,
                      border: `1.5px solid ${skillLevel === level.value ? level.color : 'transparent'}`,
                    }}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#6b7266' }}>
                Your skill level helps match you with the right partners
              </p>
            </div>
          </div>
        </div>

        {/* Interclub Team */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#2a2f1e' }}>Interclub Team</h3>
          <p className="text-xs mb-3" style={{ color: '#6b7266' }}>Select your team for interclub competitive league play</p>
          <div className="flex flex-wrap gap-2">
            {INTERCLUB_TEAMS.map(team => (
              <button
                key={team.value}
                onClick={() => saveInterclubTeam(team.value)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 btn-press"
                style={{
                  background: (currentUser.interclubTeam || 'none') === team.value ? team.color : team.bg,
                  color: (currentUser.interclubTeam || 'none') === team.value ? '#fff' : team.color,
                  border: `1.5px solid ${(currentUser.interclubTeam || 'none') === team.value ? team.color : 'transparent'}`,
                }}
              >
                {team.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gate Code */}
        {gateCode && (
          <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#2a2f1e' }}>Court Gate Code</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.15)' }}>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <div>
                <p className="text-lg font-bold tracking-widest" style={{ color: '#2a2f1e', fontFamily: 'monospace' }}>{gateCode}</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>Please keep confidential — do not share with non-members</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS SECTION ═══ */}

        {/* Notification Preferences */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Notification Preferences</h3>
          <div className="space-y-4">
            {([
              { label: 'Bookings', desc: 'Court booking confirmations and participant alerts', key: 'bookings' as const },
              { label: 'Events & Tournaments', desc: 'New events, RSVP reminders', key: 'events' as const },
              { label: 'Partner Requests', desc: 'New partner matches and requests', key: 'partners' as const },
              { label: 'Messages', desc: 'New messages from members', key: 'messages' as const },
            ]).map(item => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer py-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#6b7266' }}>{item.desc}</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={notificationPreferences[item.key]} onChange={() => togglePref(item.key)} />
                  <div className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ background: notificationPreferences[item.key] ? '#6b7a3d' : '#d1d5db' }} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Family Members */}
        {isFamily && (
          <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#2a2f1e' }}>Family Members</h3>
              {!addingMember && (canAddAdult || canAddJunior) && (
                <button onClick={() => setAddingMember(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                  + Add Member
                </button>
              )}
            </div>

            {familyMembers.length === 0 && !addingMember && (
              <p className="text-sm" style={{ color: '#6b7266' }}>No family members added yet. Add up to 2 adults and 4 juniors.</p>
            )}

            <div className="space-y-3">
              {familyMembers.map(member => (
                <div key={member.id} className="p-3 rounded-xl border" style={{ borderColor: '#f0ede6', background: '#faf8f3' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatar={member.avatar} name={member.name} size={36} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{member.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                            background: member.type === 'junior' ? 'rgba(59, 175, 218, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                            color: member.type === 'junior' ? '#3BAFDA' : '#6b7a3d',
                          }}>
                            {member.type === 'junior' ? 'Junior' : 'Adult'}
                          </span>
                          {member.birthYear && (
                            <span className="text-[10px]" style={{ color: '#6b7266' }}>Born {member.birthYear}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveMember(member)} className="text-xs hover:underline" style={{ color: '#dc2626' }}>
                      Remove
                    </button>
                  </div>

                  {/* Skill level for this member */}
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: '#f0ede6' }}>
                    {editingMemberSkill === member.id ? (
                      <div className="flex flex-wrap gap-1.5">
                        {SKILL_LEVELS.map(level => (
                          <button
                            key={level.value}
                            onClick={() => handleMemberSkillChange(member, level.value)}
                            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: member.skillLevel === level.value ? level.color : level.bg,
                              color: member.skillLevel === level.value ? '#fff' : level.color,
                            }}
                          >
                            {level.label}
                          </button>
                        ))}
                        <button onClick={() => setEditingMemberSkill(null)} className="px-2 py-1 text-xs" style={{ color: '#6b7266' }}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#6b7266' }}>Skill:</span>
                        <span className="text-xs font-medium" style={{ color: SKILL_LEVELS.find(l => l.value === (member.skillLevel || 'intermediate'))?.color }}>
                          {SKILL_LEVELS.find(l => l.value === (member.skillLevel || 'intermediate'))?.label}
                        </span>
                        <button onClick={() => setEditingMemberSkill(member.id)} className="text-[10px] hover:underline" style={{ color: '#6b7a3d' }}>Change</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add member form */}
              {addingMember && (
                <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: '#6b7a3d', background: 'rgba(107, 122, 61, 0.03)' }}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: '#6b7266' }}>Name</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        placeholder="Family member name"
                        maxLength={80}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: '#6b7266' }}>Type</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewMemberType('adult')}
                          disabled={!canAddAdult}
                          className="flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                          style={{
                            background: newMemberType === 'adult' ? '#6b7a3d' : '#f5f2eb',
                            color: newMemberType === 'adult' ? '#fff' : '#2a2f1e',
                          }}
                        >
                          Adult {!canAddAdult && '(max 2)'}
                        </button>
                        <button
                          onClick={() => setNewMemberType('junior')}
                          disabled={!canAddJunior}
                          className="flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                          style={{
                            background: newMemberType === 'junior' ? '#3BAFDA' : '#f5f2eb',
                            color: newMemberType === 'junior' ? '#fff' : '#2a2f1e',
                          }}
                        >
                          Junior {!canAddJunior && '(max 4)'}
                        </button>
                      </div>
                    </div>
                    {newMemberType === 'junior' && (
                      <div>
                        <label className="text-xs font-medium block mb-1" style={{ color: '#6b7266' }}>Birth Year (optional)</label>
                        <input
                          type="number"
                          value={newMemberBirthYear}
                          onChange={e => setNewMemberBirthYear(e.target.value)}
                          placeholder="e.g. 2015"
                          min={2000}
                          max={new Date().getFullYear()}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ backgroundColor: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        />
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleAddMember}
                        disabled={!newMemberName.trim() || savingMember}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                        style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
                      >
                        {savingMember ? 'Adding...' : 'Add Member'}
                      </button>
                      <button
                        onClick={() => { setAddingMember(false); setNewMemberName(''); setNewMemberBirthYear(''); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: '#f5f2eb', color: '#6b7266' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {familyMembers.length > 0 && (
              <p className="text-xs mt-3" style={{ color: '#6b7266' }}>
                {adultCount}/2 adults · {juniorCount}/4 juniors — Switch profiles from the menu in the header
              </p>
            )}
          </div>
        )}

        {/* Mobile App */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#2a2f1e' }}>Mobile App</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7266' }}>
            Access your club on the go with our mobile web app. Live court status, bookings, and messaging — all from your phone.
          </p>
          <a
            href="/mobile-app/index.html"
            className="w-full rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md btn-press"
            style={{ background: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.15)', textDecoration: 'none' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#6b7a3d' }}>
              <svg className="w-5 h-5" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>Open MTC Court App</p>
              <p className="text-xs" style={{ color: '#6b7266' }}>Optimized for your phone — courts, bookings & more</p>
            </div>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
            </svg>
          </a>
        </div>

        {/* Your Data (PIPEDA) */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#2a2f1e' }}>Your Data</h3>
          <p className="text-xs mb-4" style={{ color: '#6b7266' }}>
            Download a copy of your profile, bookings, and messages as a JSON file.
          </p>
          <button
            onClick={downloadMyData}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: '#6b7a3d', color: '#fff' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Preparing...' : 'Download My Data'}
          </button>
        </div>

        {/* Legal */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Legal</h3>
          <div className="space-y-3">
            <Link
              href="/info?tab=privacy"
              className="flex items-center justify-between py-2 group"
            >
              <div>
                <p className="text-sm font-medium group-hover:underline" style={{ color: '#2a2f1e' }}>Privacy Policy</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>How we collect and use your data</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div style={{ borderTop: '1px solid #f0ede6' }} />
            <Link
              href="/info?tab=terms"
              className="flex items-center justify-between py-2 group"
            >
              <div>
                <p className="text-sm font-medium group-hover:underline" style={{ color: '#2a2f1e' }}>Terms of Service</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>Rules governing use of our services</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
          style={{ background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.5)', color: '#ef4444' }}
        >
          Sign Out
        </button>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAvatarPicker(false)} role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
          <div ref={avatarModalRef} className="rounded-2xl p-6 w-full max-w-sm" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <h3 id="avatar-modal-title" className="font-semibold text-lg mb-4" style={{ color: '#2a2f1e' }}>Choose Avatar</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {AVATAR_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => selectAvatar(opt.id)}
                  className="p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md flex flex-col items-center gap-2"
                  style={{
                    borderColor: currentUser.avatar === opt.id ? '#6b7a3d' : '#e0dcd3',
                    background: currentUser.avatar === opt.id ? 'rgba(107, 122, 61, 0.05)' : '#fff',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[opt.id] }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#6b7266' }}>{opt.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAvatarPicker(false)}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ background: '#f5f2eb', color: '#2a2f1e' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
