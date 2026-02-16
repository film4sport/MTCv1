'use client';

import { useEffect, useRef } from 'react';

export default function Hero() {
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      heroContentRef.current?.classList.add('visible');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      if (heroBgRef.current && scrolled < window.innerHeight) {
        heroBgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden texture-overlay" style={{ zIndex: 0 }}>
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 parallax-bg" ref={heroBgRef}>
        <img
          src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/hero-aerial-court.png"
          alt="Tennis court aerial view"
          className="w-full h-full object-cover scale-110"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 hero-overlay"></div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col lg:flex-row lg:items-center justify-center px-8 lg:px-16 z-10 pt-16">
        <div className="max-w-2xl hero-content flex-1" ref={heroContentRef}>
          {/* Main Headline */}
          <h1
            className="headline-font text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.15] mb-6"
            style={{ color: '#e8e4d9' }}
          >
            <span>Welcome to</span><br /><span>Mono Tennis Club</span>
          </h1>

          {/* Subtext */}
          <p
            className="hero-subtext text-[15px] md:text-base mb-8 leading-relaxed max-w-lg font-normal"
            style={{ color: 'rgba(232, 228, 217, 0.75)' }}
          >
            We promote the game of tennis in Mono by organizing tournaments, clinic round robins,
            competitive teams, coaching, kids camps, house leagues and more.
          </p>

          {/* Buttons */}
          <div className="hero-buttons flex items-center gap-4 mb-10">
            <a
              href="/info?tab=membership"
              className="glass-btn px-8 py-3 rounded-full text-sm font-medium"
            >
              Join Now
            </a>
            <a
              href="/login"
              className="glass-btn-solid px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2"
            >
              Member Login
              <span className="glass-icon w-6 h-6 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </span>
            </a>
          </div>

          {/* Divider Line */}
          <div className="divider-line w-full max-w-2xl"></div>
        </div>

        {/* Booking Preview — Desktop Only */}
        <div className="hidden lg:block flex-shrink-0 ml-8 xl:ml-16 hero-content" style={{ width: 300 }}>
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(26, 31, 18, 0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(232, 228, 217, 0.12)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgba(232, 228, 217, 0.5)' }}>
                Member Feature
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212, 225, 87, 0.15)', color: '#d4e157' }}>
                Live
              </span>
            </div>

            {/* Mini date chips */}
            <div className="flex gap-2 mb-4">
              {['Today', 'Sat', 'Sun'].map((day, i) => (
                <div
                  key={day}
                  className="flex-1 text-center py-2 rounded-lg text-xs"
                  style={
                    i === 0
                      ? { background: '#d4e157', color: '#1a1f12', fontWeight: 600 }
                      : { background: 'rgba(232, 228, 217, 0.06)', color: 'rgba(232, 228, 217, 0.5)', border: '1px solid rgba(232, 228, 217, 0.08)' }
                  }
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Mini court cards */}
            <div className="space-y-2.5 mb-4">
              {[
                { name: 'Court 1', available: true, hasLights: true },
                { name: 'Court 3', available: false, isNew: true },
              ].map((court) => (
                <div
                  key={court.name}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(232, 228, 217, 0.04)',
                    border: '1px solid rgba(232, 228, 217, 0.08)',
                    opacity: court.available ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: '#e8e4d9' }}>{court.name}</span>
                    <span className="text-sm font-semibold" style={{ color: '#d4e157' }}>
                      $5<span style={{ color: 'rgba(232,228,217,0.4)', fontSize: '0.65rem' }}>/hr</span>
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {court.hasLights && (
                      <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>Lit</span>
                    )}
                    {court.isNew && (
                      <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>New</span>
                    )}
                    <span
                      className="text-[0.6rem] px-2 py-0.5 rounded-full font-medium"
                      style={
                        court.available
                          ? { background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }
                          : { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }
                      }
                    >
                      {court.available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="/login"
              className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#d4e157', color: '#1a1f12' }}
            >
              Login to Book &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-8 z-10">
        <div
          className="flex items-center justify-between text-sm font-medium border-t pt-6"
          style={{ color: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <span>// Tennis</span>
          <span>// 2026</span>
          <span className="flex items-center gap-2">
            // Scroll Down
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
