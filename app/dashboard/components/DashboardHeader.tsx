'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../lib/store';
import WeatherWidget from './WeatherWidget';

interface DashboardHeaderProps {
  title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const router = useRouter();
  const { currentUser, logout, notifications, clearNotifications, markNotificationRead, notificationPreferences } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Map notification type to preference key; announcements always show
  const prefMap: Record<string, keyof typeof notificationPreferences> = {
    booking: 'bookings', event: 'events', payment: 'payments',
    partner: 'partners', message: 'messages',
  };
  const filteredNotifications = notifications.filter(n => {
    if (n.type === 'announcement') return true;
    const key = prefMap[n.type];
    return key ? notificationPreferences[key] : true;
  });
  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 pl-14 sm:pl-6 lg:pl-6 border-b" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
      {/* Page Title */}
      <h1 className="headline-font text-xl truncate" style={{ color: '#1a1f12' }}>{title}</h1>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
            className="relative p-2 rounded-xl hover:bg-black/5 transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e0dcd3' }}>
                <span className="font-semibold text-sm" style={{ color: '#1a1f12' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={clearNotifications} className="text-xs font-medium" style={{ color: '#6b7a3d' }}>Mark all read</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm" style={{ color: '#6b7a3d' }}>No notifications</div>
                ) : (
                  filteredNotifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`w-full text-left p-4 border-b transition-colors hover:bg-black/[0.02] ${!n.read ? 'bg-[#d4e157]/10' : ''}`}
                      style={{ borderColor: '#e0dcd3' }}
                    >
                      <p className="text-sm font-medium" style={{ color: '#1a1f12' }}>{n.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7a3d' }}>{n.body}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menu Button */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
            className="p-2 rounded-xl hover:bg-black/5 transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Menu Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-12 w-72 rounded-2xl shadow-2xl border overflow-hidden z-50" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
              {/* User info */}
              <div className="p-4 border-b" style={{ borderColor: '#e0dcd3' }}>
                <p className="font-semibold text-sm" style={{ color: '#1a1f12' }}>{currentUser?.name}</p>
                <p className="text-xs" style={{ color: '#6b7a3d' }}>{currentUser?.email}</p>
              </div>

              {/* Weather */}
              <div className="p-3 border-b" style={{ borderColor: '#e0dcd3' }}>
                <WeatherWidget compact />
              </div>

              {/* Menu items */}
              <div className="p-2">
                <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-black/5 transition-colors" style={{ color: '#1a1f12' }}>
                  <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Profile
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-black/5 transition-colors" style={{ color: '#1a1f12' }}>
                  <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Settings
                </Link>
                <div className="my-1 border-t" style={{ borderColor: '#e0dcd3' }} />
                <button
                  onClick={() => { logout(); router.push('/login'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
