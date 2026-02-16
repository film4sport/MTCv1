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

  // Show nothing while loading or redirecting
  if (!isLoaded || !currentUser) {
    const clubName = 'Mono Tennis Club';
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="text-center">
          {/* Tennis ball drops in */}
          <div
            className="mx-auto mb-5 w-10 h-10"
            style={{
              animation: 'ballDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            <img src="/tennis-ball-clean.png" alt="" className="w-10 h-10" />
          </div>
          {/* Letters cascade in */}
          <p className="headline-font text-2xl mb-4" style={{ color: '#6b7a3d' }}>
            {clubName.split('').map((char, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: 0,
                  animation: `letterCascade 0.3s ease-out ${0.3 + i * 0.03}s both`,
                  minWidth: char === ' ' ? '0.3em' : undefined,
                }}
              >
                {char}
              </span>
            ))}
          </p>
          {/* Loading dots fade in */}
          <p
            className="text-sm font-medium tracking-wider"
            style={{
              color: '#6b7a3d',
              opacity: 0,
              animation: 'fadeIn 0.4s ease-out 1s both',
            }}
          >
            Loading
            <span style={{ animation: 'dotPulse 1.2s ease-in-out 1.2s infinite' }}>...</span>
          </p>
        </div>
        <style>{`
          @keyframes ballDrop {
            from { opacity: 0; transform: translateY(-30px) scale(0.5); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes letterCascade {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dotPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
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
