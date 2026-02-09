'use client';

import { useEffect, useState } from 'react';

export default function Loader() {
  const [exitActive, setExitActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExitActive(true), 2800);
    const fallback = setTimeout(() => setExitActive(true), 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div className={`loader${exitActive ? ' exit-active' : ''}`} id="loader">
      <div className="loader-text">
        <span className="loader-letter">M</span>
        <span className="loader-letter">T</span>
        <span className="loader-letter">C</span>
        <div className="tennis-ball-wrapper">
          <img className="tennis-ball" src="https://i.imgur.com/XuIfpq8.png" alt="" />
        </div>
      </div>
    </div>
  );
}
