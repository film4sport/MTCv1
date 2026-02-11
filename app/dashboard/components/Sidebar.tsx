'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../lib/store';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/book', label: 'Book Court', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/schedule', label: 'My Schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/partners', label: 'Partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/dashboard/events', label: 'Events', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/dashboard/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const adminItem = { href: '/dashboard/admin', label: 'Admin Panel', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' };

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, sidebarCollapsed, setSidebarCollapsed, conversations } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      style={{ backgroundColor: '#1a1f12' }}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(232, 228, 217, 0.1)' }}>
        {sidebarCollapsed ? (
          <span className="headline-font text-lg flex-shrink-0 w-10 text-center" style={{ color: '#d4e157' }}>
            MTC
          </span>
        ) : (
          <span className="headline-font text-base truncate" style={{ color: '#e8e4d9' }}>
            Mono Tennis Club
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'text-[#1a1f12] font-semibold'
                      : 'hover:bg-white/5'
                  }`}
                  style={isActive ? { backgroundColor: '#d4e157', color: '#1a1f12' } : { color: 'rgba(232, 228, 217, 0.7)' }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                  {/* Unread badge for messages */}
                  {item.label === 'Messages' && unreadMessages > 0 && (
                    <span className={`${sidebarCollapsed ? 'absolute top-0 right-0' : 'ml-auto'} bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <>
              <li className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(232, 228, 217, 0.1)' }}>
                <Link
                  href={adminItem.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    pathname.startsWith(adminItem.href)
                      ? 'text-[#1a1f12] font-semibold'
                      : 'hover:bg-white/5'
                  }`}
                  style={pathname.startsWith(adminItem.href) ? { backgroundColor: '#d4e157', color: '#1a1f12' } : { color: 'rgba(232, 228, 217, 0.7)' }}
                  title={sidebarCollapsed ? adminItem.label : undefined}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname.startsWith(adminItem.href) ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={adminItem.icon} />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm">{adminItem.label}</span>}
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-4 border-t hover:bg-white/5 transition-colors flex items-center justify-center"
        style={{ borderColor: 'rgba(232, 228, 217, 0.1)', color: 'rgba(232, 228, 217, 0.5)' }}
      >
        <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
