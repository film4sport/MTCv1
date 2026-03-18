'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

export default function Loader() {
  const [ballHit, setBallHit] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const imgLoaded = useRef(false);
  const triggered = useRef(false);

  const triggerExit = useCallback(() => {
    if (triggered.current) return; // Prevent double-trigger from race
    triggered.current = true;
    setBallHit(true);
    setTimeout(() => setFadeOut(true), 400);
  }, []);

  useEffect(() => {
    // Ball flies away after 1s minimum (if image loaded)
    const minDelay = setTimeout(() => {
      if (imgLoaded.current) triggerExit();
    }, 1000);
    // Hard fallback — never show loader longer than 2.5s even if image fails
    const fallback = setTimeout(() => triggerExit(), 2500);
    return () => {
      clearTimeout(minDelay);
      clearTimeout(fallback);
    };
  }, [triggerExit]);

  const handleImgLoad = () => {
    imgLoaded.current = true;
  };

  return (
    <div className={`loader${fadeOut ? ' exit-active' : ''}`} id="loader">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/mono-logo-transparent.png"
          alt="Mono Tennis Club"
          width={128}
          height={128}
          className="h-32 w-auto"
          style={{ filter: 'brightness(0)' }}
          priority
        />
        <div className={`tennis-ball-wrapper${ballHit ? ' ball-hit' : ''}`}>
          <Image className="tennis-ball" src="/tennis-ball-loader.png" alt="" width={40} height={40} onLoad={handleImgLoad} priority aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
