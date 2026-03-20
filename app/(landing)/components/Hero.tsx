'use client';

import { useEffect, useRef } from 'react';
import { APP_COPY, APP_ROUTES } from '../../lib/site';


export default function Hero() {
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // React doesn't reliably set the HTML `muted` attribute from JSX props,
  // which Chrome requires for autoplay. Set it programmatically + force play.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay blocked — try again after user interaction
      const tryPlay = () => {
        video.play().catch(() => {});
        document.removeEventListener('click', tryPlay);
        document.removeEventListener('scroll', tryPlay);
      };
      document.addEventListener('click', tryPlay, { once: true });
      document.addEventListener('scroll', tryPlay, { once: true });
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      heroContentRef.current?.classList.add('visible');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (heroBgRef.current && scrolled < window.innerHeight) {
          heroBgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative h-dvh w-full overflow-hidden texture-overlay" style={{ zIndex: 0 }}>
      {/* Background Video with Parallax */}
      <div className="absolute inset-0 parallax-bg" ref={heroBgRef}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-110"
          poster="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/hero-aerial-court.png"
        >
          <source src="/videos/hero-clubhouse.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 hero-overlay"></div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col md:flex-row md:items-start justify-center px-8 lg:px-16 z-10 pt-16 sm:pt-24 md:pt-28">
        <div className="max-w-2xl hero-content md:flex-1" ref={heroContentRef}>
          {/* Section Label */}
          <span className="hero-subtext text-xs md:text-sm tracking-[0.25em] uppercase mb-4 block font-medium" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
            // Mono Tennis Club
          </span>

          {/* Main Headline */}
          <h1
            className="headline-font text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] mb-6"
            style={{ color: '#e8e4d9', textShadow: '0 2px 30px rgba(0, 0, 0, 0.4)' }}
          >
            <span>Your Court</span><br /><span>is Waiting</span>
          </h1>

          {/* Subtext */}
          <p
            className="hero-subtext text-[15px] md:text-base mb-8 leading-relaxed max-w-lg font-normal"
            style={{ color: 'rgba(232, 228, 217, 0.85)' }}
          >
            Where Mono plays tennis. Tournaments, round robins,
            competitive teams, coaching, kids camps and more.
          </p>

          {/* Buttons */}
          <div className="hero-buttons flex items-center gap-4 mb-10">
            <a
              href={APP_ROUTES.signup}
              className="glass-btn hero-cta-pulse px-8 py-3 rounded-full text-sm font-medium"
            >
              {APP_COPY.becomeMember}
            </a>
            <a
              href={APP_ROUTES.login}
              className="glass-btn-solid px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2"
            >
              {APP_COPY.memberLogin}
              <span className="glass-icon w-6 h-6 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </span>
            </a>
          </div>

          {/* Spring Programs CTA — visible on all screens */}
          <a
            href={APP_ROUTES.infoTab('coaching')}
            className="hero-subtext inline-flex items-center gap-3 px-5 py-3 rounded-xl text-sm no-underline transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(212, 225, 87, 0.25)',
              color: 'rgba(232, 228, 217, 0.9)',
              textDecoration: 'none',
            }}
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 225, 87, 0.15)' }}>
              <svg className="w-4 h-4" fill="none" stroke="rgba(212, 225, 87, 0.9)" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span>
              <span className="font-semibold" style={{ color: 'rgba(212, 225, 87, 0.9)' }}>Spring Programs Now Open</span>
              <span className="block text-xs mt-0.5" style={{ color: 'rgba(232, 228, 217, 0.5)' }}>Junior &amp; adult classes · Starting May 11</span>
            </span>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="rgba(212, 225, 87, 0.7)" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

        </div>

        {/* Opening Day Card — right side on desktop, below buttons on tablet, hidden on mobile */}
        <div className="hidden md:flex md:flex-1 md:justify-end">
          <div
            className="opening-day-card inline-flex flex-col items-center px-5 py-3 md:px-6 md:py-4 lg:px-8 lg:py-6 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span className="text-xs tracking-[0.2em] uppercase font-medium mb-2" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              // Opening Day
            </span>
            <span className="headline-font text-3xl lg:text-5xl" style={{ color: '#e8e4d9' }}>
              May 9
            </span>
            <span className="text-sm mt-2 font-medium" style={{ color: 'rgba(212, 225, 87, 0.9)' }}>
              BBQ &amp; Meet the Pro&apos;s
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-8 z-10">
        <div
          className="flex items-center justify-center sm:justify-between text-sm font-medium pt-6"
          style={{ color: 'rgba(255, 255, 255, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}
        >
          <span className="flex items-center gap-3 cursor-pointer group" onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>
            // Scroll Down
            <span className="relative flex items-center justify-center">
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="rgba(255, 255, 255, 0.6)" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <svg className="w-6 h-6 absolute animate-ping opacity-40" fill="none" stroke="rgba(255, 255, 255, 0.6)" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </span>
          <span className="hidden sm:inline">// 2026</span>
          <span className="hidden sm:inline">// Tennis</span>
        </div>
      </div>
    </section>
  );
}
