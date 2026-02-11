'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from './lib/store';
import Sidebar from './components/Sidebar';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, sidebarCollapsed } = useApp();
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
          <img src="/mono-logo.png" alt="MTC" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-sm" style={{ color: '#6b7a3d' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f2eb' }}>
      <Sidebar />
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'
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
