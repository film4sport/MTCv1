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
              Become a Member
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
