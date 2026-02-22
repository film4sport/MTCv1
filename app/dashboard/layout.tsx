'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from './lib/store';
import { ToastProvider } from './lib/toast';
import { UIProvider, useUI } from './lib/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import MobileAppBanner from './components/MobileAppBanner';
import Toast from './components/Toast';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, logout } = useApp();
  const { sidebarCollapsed, setMobileSidebarOpen } = useUI();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.replace('/login');
    }
  }, [isLoaded, currentUser, router]);

  // Loading skeleton while auth check runs
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: '#f5f2eb' }}>
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-[72px] min-h-screen" style={{ backgroundColor: '#1a1f12' }} />
        <div className="flex-1">
          {/* Header skeleton */}
          <div className="h-16 border-b flex items-center justify-between px-6" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="flex gap-2">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton w-10 h-10 rounded-xl" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="skeleton w-48 h-7 rounded-lg" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="skeleton h-48 rounded-2xl" />
              <div className="skeleton h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paused membership screen
  if (currentUser.status === 'paused') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <svg className="w-10 h-10" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="headline-font text-2xl mb-3" style={{ color: '#2a2f1e' }}>
            Membership Paused
          </h2>
          <p className="text-sm mb-8" style={{ color: '#6b7266' }}>
            Your membership is currently paused. Please contact the club administrator to reactivate your account.
          </p>
          <button
            onClick={logout}
            className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: '#6b7a3d' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ backgroundColor: '#f5f2eb' }}>
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:text-white"
        style={{ backgroundColor: '#6b7a3d' }}
      >
        Skip to content
      </a>
      <Sidebar />
      {/* Mobile hamburger button — positioned to not overlap title */}
      <button
        className="lg:hidden fixed top-3.5 left-3 z-20 p-2.5 rounded-xl shadow-lg"
        style={{ backgroundColor: '#1a1f12', color: '#e8e4d9' }}
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <main
        id="main-content"
        className={`flex-1 min-h-screen transition-all duration-300 ml-0 overscroll-bounce overflow-x-hidden w-full max-w-[100vw] ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        }`}
      >
        <MobileAppBanner />
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>
      <Toast />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <UIProvider>
          <AppProvider>
            <DashboardGuard>{children}</DashboardGuard>
          </AppProvider>
        </UIProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
