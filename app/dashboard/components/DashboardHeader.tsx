'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../lib/store';
import { useToast } from '../lib/toast';
import WeatherWidget from './WeatherWidget';

interface DashboardHeaderProps {
  title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const router = useRouter();
  const { currentUser, logout, notifications, clearNotifications, markNotificationRead, notificationPreferences, refreshData } = useApp();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Map notification type to preference key; announcements always show
  const prefMap: Record<string, keyof typeof notificationPreferences> = {
    booking: 'bookings', event: 'events',
    partner: 'partners', message: 'messages', program: 'programs',
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
    <>
      <header className="h-16 flex items-center justify-between px-4 pl-14 sm:pl-6 lg:pl-6 border-b relative z-10" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
        {/* Logo */}
        <Image src="/mono-logo-transparent.png" alt="Mono Tennis Club" width={36} height={36} className="h-9 w-auto" style={{ filter: 'brightness(0.2)' }} />

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={async () => {
              setRefreshing(true);
              await refreshData();
              setRefreshing(false);
              showToast('Data refreshed', 'info');
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 bg-[#6b7a3d]/10 hover:bg-[#6b7a3d]/20 active:scale-95"
            aria-label="Refresh data"
          >
            <svg className={`w-[18px] h-[18px] transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="#1a1f12" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
              className={`bell-btn relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${notifOpen ? 'bg-[#6b7a3d] shadow-md' : 'bg-[#6b7a3d]/10 hover:bg-[#6b7a3d]/20 active:scale-95'}`}
              aria-label="Notifications"
            >
              <svg className="bell-icon w-[22px] h-[22px] transition-transform duration-200" style={{ color: notifOpen ? '#fff' : '#1a1f12' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="badge-pulse absolute -top-1 -right-1 text-[0.65rem] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm ring-2 ring-[#faf8f3]" style={{ backgroundColor: '#d4e157', color: '#2a2f1e' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="dropdown-enter absolute right-0 top-[52px] w-[calc(100vw-24px)] sm:w-80 rounded-2xl shadow-2xl border overflow-hidden z-50" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e0dcd3' }}>
                  <span className="font-semibold text-sm" style={{ color: '#1a1f12' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={clearNotifications} className="text-xs font-medium hover:underline" style={{ color: '#6b7a3d' }}>Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-sm" style={{ color: '#6b7266' }}>No notifications</p>
                    </div>
                  ) : (
                    filteredNotifications.map(n => {
                      const formatAgo = (ts: string) => {
                        const diff = Date.now() - new Date(ts).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'Just now';
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        const days = Math.floor(hrs / 24);
                        if (days < 7) return `${days}d ago`;
                        return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      };
                      return (
                        <button
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`w-full text-left p-4 border-b transition-colors hover:bg-black/[0.02] ${!n.read ? 'bg-[#d4e157]/10' : ''}`}
                          style={{ borderColor: '#e0dcd3' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium" style={{ color: '#1a1f12' }}>{n.title}</p>
                            <span className="text-[0.6rem] shrink-0 mt-0.5" style={{ color: '#6b7266' }}>{formatAgo(n.timestamp)}</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: '#6b7a3d' }}>{n.body}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu Button */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
              className={`${menuOpen ? 'menu-open' : ''} relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${menuOpen ? 'bg-[#6b7a3d] shadow-md' : 'bg-[#6b7a3d]/10 hover:bg-[#6b7a3d]/20 active:scale-95'}`}
              aria-label="Menu"
            >
              <div className="w-[18px] h-[14px] flex flex-col justify-between">
                <span className="menu-line menu-line-1 block w-full h-[2px] rounded-full transition-colors duration-200" style={{ backgroundColor: menuOpen ? '#fff' : '#1a1f12' }} />
                <span className="menu-line menu-line-2 block w-full h-[2px] rounded-full transition-colors duration-200" style={{ backgroundColor: menuOpen ? '#fff' : '#1a1f12' }} />
                <span className="menu-line menu-line-3 block w-full h-[2px] rounded-full transition-colors duration-200" style={{ backgroundColor: menuOpen ? '#fff' : '#1a1f12' }} />
              </div>
            </button>

            {/* Menu Dropdown */}
            {menuOpen && (
              <div className="dropdown-enter absolute right-0 top-[52px] w-[calc(100vw-24px)] sm:w-72 rounded-2xl shadow-2xl border overflow-hidden z-50" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
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
    </>
  );
}
