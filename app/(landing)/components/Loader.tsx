'use client';

import { useEffect, useState, useRef } from 'react';

export default function Loader() {
  const [ballHit, setBallHit] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const imgLoaded = useRef(false);

  useEffect(() => {
    // Ball flies away after 1s minimum (if image loaded)
    const minDelay = setTimeout(() => {
      if (imgLoaded.current) {
        setBallHit(true);
        // Loader fades out 400ms after ball starts flying
        setTimeout(() => setFadeOut(true), 400);
      }
    }, 1000);
    // Hard fallback — never show loader longer than 2.5s even if image fails
    const fallback = setTimeout(() => {
      setBallHit(true);
      setTimeout(() => setFadeOut(true), 400);
    }, 2500);
    return () => {
      clearTimeout(minDelay);
      clearTimeout(fallback);
    };
  }, []);

  const handleImgLoad = () => {
    imgLoaded.current = true;
  };

  return (
    <div className={`loader${fadeOut ? ' exit-active' : ''}`} id="loader">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/mono-logo-transparent.png"
          alt="Mono Tennis Club"
          className="h-32 w-auto"
          style={{ filter: 'brightness(0)' }}
        />
        <div className={`tennis-ball-wrapper${ballHit ? ' ball-hit' : ''}`}>
          <img className="tennis-ball" src="/tennis-ball-loader.png" alt="" onLoad={handleImgLoad} />
        </div>
      </div>
    </div>
  );
}
