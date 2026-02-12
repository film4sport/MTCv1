'use client';

import { useEffect, useState } from 'react';

export default function Loader() {
  const [exitActive, setExitActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExitActive(true), 1000);
    const fallback = setTimeout(() => setExitActive(true), 2000);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div className={`loader${exitActive ? ' exit-active' : ''}`} id="loader">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#1a1f12' }}
          >
            <span
              className="font-bold text-base"
              style={{ color: '#1a1f12', fontFamily: "'Gotham Rounded', sans-serif" }}
            >
              MTC
            </span>
          </div>
          <span
            className="font-semibold text-xl tracking-wide"
            style={{ color: '#1a1f12', fontFamily: "'Gotham Rounded', sans-serif" }}
          >
            Mono Tennis
          </span>
        </div>
        <div className="tennis-ball-wrapper">
          <img className="tennis-ball" src="https://i.imgur.com/XuIfpq8.png" alt="" />
        </div>
      </div>
    </div>
  );
}
