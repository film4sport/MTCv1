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
    <section className="relative h-screen w-full overflow-hidden" style={{ zIndex: 0 }}>
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 parallax-bg" ref={heroBgRef}>
        <img
          src="https://i.imgur.com/JJiiQRQ.png"
          alt="Tennis court aerial view"
          className="w-full h-full object-cover scale-110"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 hero-overlay"></div>
      <div className="absolute inset-0 hero-grain"></div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-16 z-10 pt-16">
        <div className="max-w-2xl hero-content" ref={heroContentRef}>
          <h1
            className="headline-font text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.15] mb-6"
            style={{ color: '#e8e4d9', fontFamily: "'Gotham Rounded', sans-serif" }}
          >
            <span>Welcome to</span>
            <br />
            <span>Mono Tennis Club</span>
          </h1>

          <p
            className="hero-subtext text-base md:text-[17px] mb-8 leading-relaxed max-w-lg font-light"
            style={{ color: 'rgba(232, 228, 217, 0.75)' }}
          >
            We promote the game of tennis in Mono by organizing tournaments, clinic round robins,
            competitive teams, coaching, kids camps, house leagues and more.
          </p>

          <div className="hero-buttons flex items-center gap-4 mb-10">
            <a
              href="/info?tab=membership"
              className="px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'rgba(107, 122, 61, 0.7)', color: '#e8e4d9' }}
            >
              Join Now
            </a>
          </div>

        </div>
      </div>

      {/* Bottom gradient for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
      ></div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-8 pb-8">
        <div
          className="max-w-7xl mx-auto w-full flex items-center justify-between text-sm font-medium pt-6"
          style={{ color: 'rgba(232, 228, 217, 0.6)', borderTop: '1px solid rgba(232, 228, 217, 0.2)' }}
        >
          <span>// Tennis</span>
          <span>// 2026</span>
          <span className="flex items-center gap-2">
            // Scroll Down
            <svg className="w-4 h-4 scroll-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
