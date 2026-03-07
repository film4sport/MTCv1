'use client';

import { useState, useEffect } from 'react';

/**
 * Persistent nag banner for iPad/tablet users accessing the desktop dashboard.
 * Unlike MobileAppBanner, this cannot be permanently dismissed — it returns
 * every session to remind tablet users to use the dedicated tablet PWA.
 */
export default function TabletNagBanner() {
  const [visible, setVisible] = useState(false);
  const [closedThisSession, setClosedThisSession] = useState(false);

  useEffect(() => {
    // Detect tablet: iPad, Android tablet, or touch-capable macOS (iPad pretending to be Mac)
    const ua = navigator.userAgent || '';
    const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
    const isAndroidTablet = /Android/.test(ua) && !/Mobile/.test(ua);
    const isTablet = isIPad || isAndroidTablet;

    // Only check session dismiss if we're on a tablet
    if (isTablet) {
      const sessionClosed = sessionStorage.getItem('mtc-tablet-nag-closed') === 'true';
      if (!sessionClosed) {
        setVisible(true);
      }
    }
  }, []);

  if (!visible || closedThisSession) return null;

  return (
    <div
      className="mx-4 mt-3 rounded-lg py-3 px-4 flex items-center gap-3 animate-slideUp"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(200, 255, 0, 0.08) 100%)',
        border: '1.5px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 2px 8px rgba(0, 212, 255, 0.1)',
      }}
    >
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 212, 255, 0.15)' }}>
        <svg className="w-4 h-4" fill="none" stroke="#00a8cc" viewBox="0 0 24 24" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: '#1a1f12' }}>
          This dashboard is built for desktop
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: '#4a5238' }}>
          Switch to the MTC Court App — optimized for your tablet with touch-friendly controls.
        </p>
      </div>
      <a
        href="/mobile-app/index.html"
        className="shrink-0 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #00d4ff, #00a8cc)', color: '#fff', boxShadow: '0 2px 6px rgba(0, 212, 255, 0.3)' }}
      >
        Open App
      </a>
      <button
        onClick={() => {
          sessionStorage.setItem('mtc-tablet-nag-closed', 'true');
          setClosedThisSession(true);
        }}
        className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Close for now"
        title="I'll remind you next time"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
