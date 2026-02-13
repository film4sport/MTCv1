'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from './lib/store';
import Sidebar from './components/Sidebar';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, sidebarCollapsed, setMobileSidebarOpen } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.replace('/login');
    }
  }, [isLoaded, currentUser, router]);

  // Show nothing while loading or redirecting
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="text-center">
          <p className="headline-font text-2xl mb-4 animate-pulse" style={{ color: '#6b7a3d' }}>Mono Tennis Club</p>
          <p className="text-sm" style={{ color: '#6b7a3d' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f2eb' }}>
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
        className={`flex-1 min-h-screen transition-all duration-300 ml-0 ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        }`}
      >
        {children}
      </main>
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
