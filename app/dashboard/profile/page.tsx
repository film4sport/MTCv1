'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import * as db from '../lib/db';

const NTRP_OPTIONS = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0];

export default function ProfilePage() {
  const { currentUser, showToast } = useApp();
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPartners, setNotifPartners] = useState(true);
  const [notifClub, setNotifClub] = useState(true);
  const [notifCoaching, setNotifCoaching] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [editingNtrp, setEditingNtrp] = useState(false);
  const [ntrpValue, setNtrpValue] = useState(currentUser?.ntrp ?? 3.5);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <p className="text-sm" style={{ color: '#6b7266' }}>Loading profile...</p>
      </div>
    );
  }

  const ntrp = currentUser.ntrp ?? 3.5;
  const skillLevel = ntrp <= 2.5 ? 'Beginner' : ntrp <= 4.0 ? 'Intermediate' : ntrp <= 5.5 ? 'Advanced' : 'Expert';

  const saveNtrp = async () => {
    if (!currentUser) return;
    await db.updateProfile(currentUser.id, { ntrp: ntrpValue });
    // Update the cached user with new ntrp
    const updated = { ...currentUser, ntrp: ntrpValue };
    localStorage.setItem('mtc-current-user', JSON.stringify(updated));
    setEditingNtrp(false);
    showToast('NTRP rating updated');
    // Reload page to pick up the updated user
    window.location.reload();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Profile" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-slideUp">

        {/* Profile Card */}
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
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
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Personal Info</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Full Name</p>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser.name}</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Email</p>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser.email}</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Player Rating</p>
                {editingNtrp ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={ntrpValue}
                      onChange={(e) => setNtrpValue(parseFloat(e.target.value))}
                      className="px-2 py-1 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                      style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                    >
                      {NTRP_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <button onClick={saveNtrp} className="text-xs px-3 py-1 rounded-lg font-medium text-white" style={{ background: '#6b7a3d' }}>Save</button>
                    <button onClick={() => setEditingNtrp(false)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#6b7266' }}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>NTRP {ntrp}</p>
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>{skillLevel}</span>
                  </div>
                )}
              </div>
              <button onClick={() => { setNtrpValue(ntrp); setEditingNtrp(!editingNtrp); }}>
                <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Availability</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Preferred Times</p>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>Mornings, Evenings</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Play Style</p>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>Singles, Mixed Doubles</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Notifications</h3>
          <div className="space-y-4">
            {[
              { label: 'Booking Reminders', checked: notifBooking, onChange: setNotifBooking },
              { label: 'Partner Requests', checked: notifPartners, onChange: setNotifPartners },
              { label: 'Club Announcements', checked: notifClub, onChange: setNotifClub },
              { label: 'Coaching Updates', checked: notifCoaching, onChange: setNotifCoaching },
              { label: 'Push Notifications', checked: notifPush, onChange: setNotifPush },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm" style={{ color: '#2a2f1e' }}>{item.label}</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} />
                  <div className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ background: item.checked ? '#6b7a3d' : '#d1d5db' }} />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
