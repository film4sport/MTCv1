'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from './lib/store';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, sidebarCollapsed, setMobileSidebarOpen } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.replace('/login');
    }
  }, [isLoaded, currentUser, router]);

  // Show blank screen while loading or redirecting (logout does hard redirect, so this is brief)
  if (!isLoaded || !currentUser) {
    return <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }} />;
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ backgroundColor: '#f5f2eb' }}>
      <Sidebar />
      {/* Mobile hamburger button — positioned to not overlap title */}
      <button
        className="lg:hidden fixed top-3.5 left-3 z-10 p-2.5 rounded-xl shadow-lg"
        style={{ backgroundColor: '#1a1f12', color: '#e8e4d9' }}
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ml-0 overscroll-bounce ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        }`}
      >
        {children}
      </main>
      <Toast />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </AppProvider>
  );
}
