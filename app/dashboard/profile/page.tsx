'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';

export default function ProfilePage() {
  const { currentUser } = useApp();
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPartners, setNotifPartners] = useState(true);
  const [notifClub, setNotifClub] = useState(true);
  const [notifCoaching, setNotifCoaching] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  const ntrp = '3.5';
  const skillLevel = 'Intermediate';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Profile" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#2a2f1e' }}>{currentUser?.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                  {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'coach' ? 'Coach' : 'Member'}
                </span>
                {currentUser?.memberSince && (
                  <span className="text-xs" style={{ color: '#6b7266' }}>
                    Member since {new Date(currentUser.memberSince + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Personal Info</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Full Name</p>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser?.name}</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#f0ede6' }}>
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Email</p>
                <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser?.email}</p>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Player Rating</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>NTRP {ntrp}</p>
                  <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>{skillLevel}</span>
                </div>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
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
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
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
