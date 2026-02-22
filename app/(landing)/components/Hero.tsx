'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

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
      const scrolled = window.scrollY;
      if (heroBgRef.current && scrolled < window.innerHeight) {
        heroBgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden texture-overlay" style={{ zIndex: 0 }}>
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 parallax-bg" ref={heroBgRef}>
        <Image
          src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/hero-aerial-court.png"
          alt="Tennis court aerial view"
          className="w-full h-full object-cover scale-110"
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 hero-overlay"></div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col lg:flex-row lg:items-center justify-center px-8 lg:px-16 z-10 pt-16 sm:pt-24 md:pt-28">
        <div className="max-w-2xl hero-content lg:flex-1" ref={heroContentRef}>
          {/* Section Label */}
          <span className="hero-subtext text-xs md:text-sm tracking-[0.25em] uppercase mb-4 block font-medium" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
            // Mono Tennis Club
          </span>

          {/* Main Headline */}
          <h1
            className="headline-font text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] mb-6 hero-shimmer"
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
              href="/signup"
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

        </div>

      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-8 z-10">
        <div
          className="flex items-center justify-center sm:justify-between text-sm font-medium pt-6"
          style={{ color: 'rgba(255, 255, 255, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}
        >
          <span className="flex items-center gap-2">
            // Scroll Down
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </span>
          <span className="hidden sm:inline">// 2026</span>
          <span className="hidden sm:inline">// Tennis</span>
        </div>
      </div>
    </section>
  );
}
