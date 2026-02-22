'use client';

import { useState, useEffect } from 'react';

export default function MobileAppBanner() {
  const [dismissed, setDismissed] = useState(true); // default hidden until we check

  useEffect(() => {
    const wasDismissed = localStorage.getItem('mtc-mobile-app-dismissed') === 'true';
    setDismissed(wasDismissed);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className="mx-4 mt-4 rounded-xl p-4 flex items-center gap-3 animate-slideUp"
      style={{ background: 'rgba(107, 122, 61, 0.08)', border: '1px solid rgba(107, 122, 61, 0.2)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#6b7a3d' }}>
        <svg className="w-5 h-5" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>Try the MTC Mobile App</p>
        <p className="text-xs" style={{ color: '#6b7266' }}>Optimized for your phone — courts, bookings & more</p>
      </div>
      <a
        href="/mobile-app/"
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
        style={{ background: '#6b7a3d', color: '#fff' }}
      >
        Open
      </a>
      <button
        onClick={() => {
          localStorage.setItem('mtc-mobile-app-dismissed', 'true');
          setDismissed(true);
        }}
        className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
