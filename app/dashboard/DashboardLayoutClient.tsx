'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useAuth } from './lib/store';
import { ToastProvider } from './lib/toast';
import { UIProvider, useUI } from './lib/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { APP_ROUTES } from '../lib/site';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, logout } = useAuth();
  const { sidebarCollapsed, setMobileSidebarOpen } = useUI();
  const router = useRouter();

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
    const isAndroidTablet = /Android/.test(ua) && !/Mobile/.test(ua);
    const isMobilePhone = /iPhone|iPod/.test(ua) || (/Android/.test(ua) && /Mobile/.test(ua));
    if (isIPad || isAndroidTablet || isMobilePhone) {
      window.location.replace(APP_ROUTES.mobileApp);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.replace(APP_ROUTES.login);
    }
  }, [isLoaded, currentUser, router]);

  if (!currentUser) {
    return (
      <div className="dashboard-shell min-h-screen flex">
        <div className="dashboard-panel-strong hidden lg:block w-[80px] min-h-screen border-r" />
        <div className="flex-1">
          <div className="dashboard-topbar h-16 border-b flex items-center justify-between px-6">
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="flex gap-2">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton w-10 h-10 rounded-xl" />
            </div>
          </div>
          <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="skeleton w-48 h-7 rounded-lg" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
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

  if (!isLoaded) {
    return (
      <div className="dashboard-shell min-h-screen flex overflow-x-hidden">
        <Sidebar />
        <main
          className={`flex-1 min-h-screen transition-all duration-300 ml-0 overflow-x-hidden w-full max-w-[100vw] ${
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
          }`}
        >
          <div className="relative min-h-screen">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-90"
              style={{
                background:
                  'radial-gradient(circle at 12% 8%, rgba(212, 225, 87, 0.18), transparent 30%), radial-gradient(circle at 88% 0%, rgba(107, 122, 61, 0.14), transparent 34%)',
              }}
            />
            <div className="dashboard-topbar h-16 border-b flex items-center justify-end px-6">
              <div className="dashboard-soft-pill px-3 py-1.5 text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7a3d' }}>
                Syncing Club Data
              </div>
            </div>
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 lg:py-14">
              <div className="dashboard-panel-strong rounded-[30px] p-6 lg:p-8 shadow-[0_24px_80px_rgba(42,47,30,0.14)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <div className="dashboard-soft-pill inline-flex px-3 py-1.5 text-[11px] uppercase tracking-[0.26em]" style={{ color: '#6b7a3d' }}>
                      Welcome Back
                    </div>
                    <div>
                      <h1 className="headline-font text-3xl lg:text-4xl" style={{ color: '#2a2f1e' }}>
                        Preparing your dashboard
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm lg:text-[15px]" style={{ color: '#6b7266' }}>
                        Bringing in bookings, messages, and club updates for {currentUser.name.split(' ')[0] || 'you'}.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[320px]">
                    {['Bookings', 'Messages', 'Notices'].map((label) => (
                      <div key={label} className="dashboard-panel rounded-2xl px-4 py-4">
                        <div className="skeleton h-7 w-10 rounded-lg mb-2" />
                        <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: '#7c8570' }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-5 mt-8">
                  <div className="dashboard-panel rounded-[24px] p-5 lg:p-6">
                    <div className="skeleton h-5 w-36 rounded-lg mb-4" />
                    <div className="space-y-3">
                      <div className="skeleton h-4 w-full rounded-lg" />
                      <div className="skeleton h-4 w-5/6 rounded-lg" />
                      <div className="skeleton h-4 w-2/3 rounded-lg" />
                    </div>
                  </div>
                  <div className="dashboard-panel rounded-[24px] p-5 lg:p-6">
                    <div className="skeleton h-5 w-28 rounded-lg mb-4" />
                    <div className="space-y-4">
                      <div className="skeleton h-12 w-full rounded-2xl" />
                      <div className="skeleton h-12 w-full rounded-2xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Toast />
      </div>
    );
  }

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
    <div className="dashboard-shell min-h-screen flex overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:text-white"
        style={{ backgroundColor: '#6b7a3d' }}
      >
        Skip to content
      </a>
      <Sidebar />
      <button
        className="dashboard-panel-strong lg:hidden fixed top-3.5 left-3 z-20 p-2.5 rounded-2xl shadow-lg"
        style={{ color: '#e8e4d9' }}
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
        <div className="animate-fadeIn relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-52 opacity-80"
            style={{
              background:
                'radial-gradient(circle at 12% 8%, rgba(212, 225, 87, 0.18), transparent 30%), radial-gradient(circle at 88% 0%, rgba(107, 122, 61, 0.12), transparent 34%)',
            }}
          />
          {children}
        </div>
      </main>
      <Toast />
    </div>
  );
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
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
