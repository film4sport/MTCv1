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
  const [notifPrograms, setNotifPrograms] = useState(true);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Settings" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-slideUp">

        {/* Notification Preferences */}
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'Events & Tournaments', desc: 'New events, RSVP reminders', checked: notifEvents, onChange: setNotifEvents },
              { label: 'Payments & Billing', desc: 'Charges, payments, balance alerts', checked: notifPayments, onChange: setNotifPayments },
              { label: 'Partner Requests', desc: 'New partner matches and requests', checked: notifPartners, onChange: setNotifPartners },
              { label: 'Messages', desc: 'New messages from members', checked: notifMessages, onChange: setNotifMessages },
              { label: 'Programs', desc: 'Enrollment confirmations, session reminders', checked: notifPrograms, onChange: setNotifPrograms },
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
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
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
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#2a2f1e' }}>Mobile App</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7266' }}>
            Access your club on the go with our mobile web app. Live court status, bookings, and messaging — all from your phone.
          </p>
          <button
            onClick={() => {
              // Try PWA install prompt if available
              const deferredPrompt = (window as unknown as Record<string, unknown>).__pwaInstallPrompt;
              if (deferredPrompt && typeof (deferredPrompt as { prompt: () => void }).prompt === 'function') {
                (deferredPrompt as { prompt: () => void }).prompt();
              } else {
                alert('To install: open this site on your phone browser, tap the share icon, then "Add to Home Screen".');
              }
            }}
            className="w-full rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md btn-press"
            style={{ background: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.15)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#6b7a3d' }}>
              <svg className="w-5 h-5" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>Install MTC App</p>
              <p className="text-xs" style={{ color: '#6b7266' }}>Add to your home screen for the best experience</p>
            </div>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
          </button>
        </div>

        {/* Legal */}
        <div className="rounded-2xl border p-6 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Legal</h3>
          <div className="space-y-3">
            <a
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
            </a>
            <div style={{ borderTop: '1px solid #f0ede6' }} />
            <a
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
            </a>
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
