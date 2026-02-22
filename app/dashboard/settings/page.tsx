'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';

export default function SettingsPage() {
  const { currentUser, bookings, conversations, logout, notificationPreferences, setNotificationPreferences } = useApp();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const togglePref = (key: keyof typeof notificationPreferences) => {
    setNotificationPreferences({ ...notificationPreferences, [key]: !notificationPreferences[key] });
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

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
    } catch {
      // silent fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Settings" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-slideUp">

        {/* Notification Preferences */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2a2f1e' }}>Notification Preferences</h3>
          <div className="space-y-4">
            {([
              { label: 'Bookings', desc: 'Court booking confirmations and participant alerts', key: 'bookings' as const },
              { label: 'Events & Tournaments', desc: 'New events, RSVP reminders', key: 'events' as const },
              { label: 'Partner Requests', desc: 'New partner matches and requests', key: 'partners' as const },
              { label: 'Messages', desc: 'New messages from members', key: 'messages' as const },
              { label: 'Programs', desc: 'Enrollment confirmations, session reminders', key: 'programs' as const },
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

        {/* Account */}
        <div className="glass-card rounded-2xl border p-6 section-card" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
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
    </div>
  );
}
