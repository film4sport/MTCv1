'use client';

import { useEffect, useState, useRef } from 'react';

export default function Loader() {
  const [exitActive, setExitActive] = useState(false);
  const imgLoaded = useRef(false);

  useEffect(() => {
    // Start exit after image loads (or 1s minimum, whichever is later)
    const minDelay = setTimeout(() => {
      if (imgLoaded.current) setExitActive(true);
    }, 1000);
    // Hard fallback — never show loader longer than 2.5s even if image fails
    const fallback = setTimeout(() => setExitActive(true), 2500);
    return () => {
      clearTimeout(minDelay);
      clearTimeout(fallback);
    };
  }, []);

  const handleImgLoad = () => {
    imgLoaded.current = true;
  };

  return (
    <div className={`loader${exitActive ? ' exit-active' : ''}`} id="loader">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#1a1f12' }}
          >
            <span
              className="text-base font-bold tracking-wide"
              style={{ color: '#1a1f12' }}
            >
              MTC
            </span>
          </div>
          <span
            className="text-xl font-bold tracking-wide"
            style={{ color: '#1a1f12' }}
          >
            Mono Tennis
          </span>
        </div>
        <div className="tennis-ball-wrapper">
          <img className="tennis-ball" src="/tennis-ball-clean.png" alt="" onLoad={handleImgLoad} />
        </div>
      </div>
    </div>
  );
}
