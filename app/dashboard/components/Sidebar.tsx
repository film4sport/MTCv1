'use client';

import { useMemo, memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/book', label: 'Book Court', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/schedule', label: 'My Schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/partners', label: 'Partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/dashboard/events', label: 'Events', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { href: '/dashboard/lessons', label: 'Lessons', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const adminItem = { href: '/dashboard/admin', label: 'Admin Panel', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' };
const coachItem = { href: '/dashboard/coaching', label: 'Book Lessons', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' };

function Sidebar() {
  const pathname = usePathname();
  const { currentUser, conversations } = useApp();
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUI();
  const isAdmin = currentUser?.role === 'admin';
  const isCoach = currentUser?.role === 'coach';
  const isOnTeam = currentUser?.interclubTeam === 'a' || currentUser?.interclubTeam === 'b' || isAdmin;

  const unreadMessages = useMemo(() => conversations.reduce((sum, c) => sum + c.unread, 0), [conversations]);

  // Role-based nav filtering (memoized — only changes when role changes)
  const filteredNavItems = useMemo(() => navItems.filter(item => {
    if (isCoach && (item.label === 'Partners' || item.label === 'Lessons')) return false;
    if (isAdmin && item.label === 'Lessons') return false;
    return true;
  }), [isAdmin, isCoach]);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const [tappedHref, setTappedHref] = useState<string | null>(null);
  const handleNavClick = useCallback((href: string) => {
    setTappedHref(href);
    setTimeout(() => setTappedHref(null), 500);
    closeMobileSidebar();
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-30 transition-all duration-300 flex flex-col
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ backgroundColor: '#1a1f12' }}
      >
        {/* Mobile close button */}
        <button
          className="lg:hidden absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
          onClick={closeMobileSidebar}
          style={{ color: 'rgba(232, 228, 217, 0.7)' }}
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

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
          <ul className="space-y-1 relative">
            {/* Sliding active indicator */}
            {(() => {
              const activeIdx = filteredNavItems.findIndex(item =>
                item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
              );
              if (activeIdx === -1) return null;
              // Each li is ~44px tall (py-2.5 + content + space-y-1 gap)
              const top = activeIdx * 44;
              return (
                <div
                  className="absolute left-0 w-[3px] h-[36px] rounded-r-full sidebar-indicator"
                  style={{ top, backgroundColor: '#d4e157' }}
                />
              );
            })()}
            {filteredNavItems.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => handleNavClick(item.href)}
                    aria-current={isActive ? 'page' : undefined}
                    data-tour={item.label === 'Messages' ? 'messages' : item.label === 'Settings' ? 'settings' : undefined}
                    className={`sidebar-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? 'sidebar-nav-active font-semibold'
                        : ''
                    } ${tappedHref === item.href ? 'sidebar-tapped' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true">
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

            {/* Coach link — visible to coaches and admins */}
            {(isCoach || isAdmin) && (
              <li className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(232, 228, 217, 0.1)' }}>
                <Link
                  href={coachItem.href}
                  onClick={() => handleNavClick(coachItem.href)}
                  aria-current={pathname.startsWith(coachItem.href) ? 'page' : undefined}
                  className={`sidebar-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    pathname.startsWith(coachItem.href)
                      ? 'sidebar-nav-active font-semibold'
                      : ''
                  } ${tappedHref === coachItem.href ? 'sidebar-tapped' : ''}`}
                  title={sidebarCollapsed ? coachItem.label : undefined}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname.startsWith(coachItem.href) ? 2.5 : 2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={coachItem.icon} />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm">{coachItem.label}</span>}
                </Link>
              </li>
            )}

            {/* My Team — interclub members */}
            {isOnTeam && (
              <li className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(232, 228, 217, 0.1)' }}>
                <Link
                  href="/dashboard/captain"
                  onClick={() => handleNavClick('/dashboard/captain')}
                  aria-current={pathname.startsWith('/dashboard/captain') ? 'page' : undefined}
                  className={`sidebar-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    pathname.startsWith('/dashboard/captain')
                      ? 'sidebar-nav-active font-semibold'
                      : ''
                  } ${tappedHref === '/dashboard/captain' ? 'sidebar-tapped' : ''}`}
                  title={sidebarCollapsed ? 'My Team' : undefined}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname.startsWith('/dashboard/captain') ? 2.5 : 2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm">My Team</span>}
                </Link>
              </li>
            )}

            {/* Admin Panel — admin only */}
            {isAdmin && (
              <li className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(232, 228, 217, 0.1)' }}>
                <Link
                  href={adminItem.href}
                  onClick={() => handleNavClick(adminItem.href)}
                  aria-current={pathname.startsWith(adminItem.href) ? 'page' : undefined}
                  className={`sidebar-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    pathname.startsWith(adminItem.href)
                      ? 'sidebar-nav-active font-semibold'
                      : ''
                  } ${tappedHref === adminItem.href ? 'sidebar-tapped' : ''}`}
                  title={sidebarCollapsed ? adminItem.label : undefined}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname.startsWith(adminItem.href) ? 2.5 : 2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={adminItem.icon} />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm">{adminItem.label}</span>}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex p-4 border-t hover:bg-white/5 transition-colors items-center justify-center"
          style={{ borderColor: 'rgba(232, 228, 217, 0.1)', color: 'rgba(232, 228, 217, 0.5)' }}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}

export default memo(Sidebar);
