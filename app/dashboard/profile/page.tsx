'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { AvatarDisplay, AVATAR_OPTIONS, AVATAR_SVGS } from '../lib/avatars';
import type { SkillLevel } from '../lib/types';
import * as db from '../lib/db';

const SKILL_LEVELS: { value: SkillLevel; label: string; color: string; bg: string }[] = [
  { value: 'beginner', label: 'Beginner', color: '#16a34a', bg: 'rgba(34, 197, 94, 0.1)' },
  { value: 'intermediate', label: 'Intermediate', color: '#3BAFDA', bg: 'rgba(59, 175, 218, 0.1)' },
  { value: 'advanced', label: 'Advanced', color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)' },
  { value: 'competitive', label: 'Competitive', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' },
];

export default function ProfilePage() {
  const { currentUser, updateCurrentUser, notificationPreferences, setNotificationPreferences } = useApp();
  const { showToast } = useToast();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(currentUser?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const avatarModalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Esc key closes avatar picker
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && showAvatarPicker) setShowAvatarPicker(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showAvatarPicker]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <p className="text-sm" style={{ color: '#6b7266' }}>Loading profile...</p>
      </div>
    );
  }

  const skillLevel = currentUser.skillLevel ?? 'intermediate';

  const saveSkillLevel = async (level: SkillLevel) => {
    if (!currentUser) return;
    try {
      await db.updateProfile(currentUser.id, { skill_level: level });
      updateCurrentUser({ skillLevel: level });
      showToast('Skill level updated');
    } catch (err) {
      console.error('[MTC Supabase]', err);
      showToast('Failed to update skill level. Please try again.', 'error');
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
      console.error('[MTC Supabase]', err);
      showToast('Failed to update avatar. Please try again.', 'error');
    }
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === currentUser.name || !currentUser) { setEditingName(false); return; }
    setNameSaving(true);
    try {
      await db.updateProfile(currentUser.id, { name: trimmed });
      updateCurrentUser({ name: trimmed });
      showToast('Name updated');
    } catch (err) {
      console.error('[MTC Supabase]', err);
      showToast('Failed to update name. Please try again.', 'error');
      setNameValue(currentUser.name);
    } finally {
      setNameSaving(false);
      setEditingName(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Profile" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-slideUp">

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

        {/* Notifications */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Notifications</h3>
          <div className="space-y-4">
            {([
              { label: 'Booking Reminders', key: 'bookings' as const },
              { label: 'Partner Requests', key: 'partners' as const },
              { label: 'Event Updates', key: 'events' as const },
              { label: 'Coaching Programs', key: 'programs' as const },
              { label: 'Messages', key: 'messages' as const },
            ] as const).map(item => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm" style={{ color: '#2a2f1e' }}>{item.label}</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={notificationPreferences[item.key]} onChange={() => setNotificationPreferences({ ...notificationPreferences, [item.key]: !notificationPreferences[item.key] })} />
                  <div className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ background: notificationPreferences[item.key] ? '#6b7a3d' : '#d1d5db' }} />
                </div>
              </label>
            ))}
          </div>
        </div>
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
