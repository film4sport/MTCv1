'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';

export default function SettingsPage() {
  const { currentUser, logout } = useApp();
  const router = useRouter();
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifPartners, setNotifPartners] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Settings" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

        {/* Notification Preferences */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'Events & Tournaments', desc: 'New events, RSVP reminders', checked: notifEvents, onChange: setNotifEvents },
              { label: 'Payments & Billing', desc: 'Charges, payments, balance alerts', checked: notifPayments, onChange: setNotifPayments },
              { label: 'Partner Requests', desc: 'New partner matches and requests', checked: notifPartners, onChange: setNotifPartners },
              { label: 'Messages', desc: 'New messages from members', checked: notifMessages, onChange: setNotifMessages },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer py-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#6b7266' }}>{item.desc}</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} />
                  <div className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ background: item.checked ? '#6b7a3d' : '#d1d5db' }} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Account</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#6b7266' }}>Email</label>
              <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{currentUser?.email}</p>
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#6b7266' }}>Role</label>
              <p className="text-sm font-medium capitalize" style={{ color: '#2a2f1e' }}>{currentUser?.role}</p>
            </div>
          </div>
        </div>

        {/* Mobile App */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#2a2f1e' }}>Mobile App</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7266' }}>
            Access your club on the go with our mobile web app. Live court status, bookings, and messaging — all from your phone.
          </p>
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#6b7a3d' }}>
              <svg className="w-5 h-5" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>Get the MTC App</p>
              <p className="text-xs" style={{ color: '#6b7266' }}>Open on your phone for the best experience</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
          style={{ background: '#fff', border: '1px solid #e0dcd3', color: '#ef4444' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
