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
      className="mx-4 mt-3 rounded-lg py-2 px-4 flex items-center gap-2 animate-slideUp"
      style={{ background: 'rgba(107, 122, 61, 0.08)', border: '1px solid rgba(107, 122, 61, 0.15)' }}
    >
      <p className="flex-1 text-xs font-medium" style={{ color: '#2a2f1e' }}>
        📱 Try the MTC Court App
      </p>
      <a
        href="/mobile-app/index.html"
        className="shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-all hover:opacity-90"
        style={{ background: '#6b7a3d', color: '#fff' }}
      >
        Open
      </a>
      <button
        onClick={() => {
          localStorage.setItem('mtc-mobile-app-dismissed', 'true');
          setDismissed(true);
        }}
        className="shrink-0 p-0.5 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
