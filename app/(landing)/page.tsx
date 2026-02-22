'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import './styles/landing.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WaveDivider from './components/WaveDivider';
import Events from './components/Events';
import Loader from './components/Loader';

// Below-the-fold components — dynamically imported for smaller initial bundle
const Schedule = dynamic(() => import('./components/Schedule'), { ssr: false });
const Partners = dynamic(() => import('./components/Partners'), { ssr: false });
const Gallery = dynamic(() => import('./components/Gallery'), { ssr: false });
const Footer = dynamic(() => import('./components/Footer'), { ssr: false });
const Lightbox = dynamic(() => import('./components/Lightbox'), { ssr: false });

export default function LandingPage() {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Global IntersectionObserver for all fade-in elements (like original landing.html)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Scroll progress bar + back to top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D Tilt Effect now lives in Events.tsx (re-attaches on filter change)

  const openLightbox = (src: string, alt: string) => setLightbox({ src, alt });
  const closeLightbox = () => setLightbox(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Confetti effect
  const createConfetti = () => {
    if (!confettiRef.current) return;
    const colors = ['#d4e157', '#6b7a3d', '#c8d943', '#e8e4d9', '#a8b835', '#fff'];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confettiRef.current.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  };

  return (
    <>
      {/* Loading Screen */}
      <Loader />

      <a href="#events" className="skip-to-content">Skip to content</a>

      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <Navbar />

      {/* Hero Section (dark, parallax) */}
      <Hero />

      {/* Events & Programs Section */}
      <Events onOpenLightbox={openLightbox} />

      {/* Schedule / Calendar Section (dark bg) */}
      <Schedule />

      {/* Partners Section */}
      <Partners />


      {/* Gallery Section */}
      <Gallery onOpenLightbox={openLightbox} />

      {/* Wave Divider: Gallery (warm gray) → Footer (dark) */}
      <WaveDivider bgColor="#edeae3" fillColor="#1a1f12" />

      {/* Footer (dark) */}
      <Footer />

      {/* Lightbox */}
      <Lightbox
        src={lightbox?.src || ''}
        alt={lightbox?.alt || ''}
        isOpen={!!lightbox}
        onClose={closeLightbox}
      />

      {/* Confetti Container */}
      <div className="confetti" ref={confettiRef} />

      {/* Back to Top */}
      <button
        className={`back-to-top${showBackToTop ? ' visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg className="w-5 h-5" style={{ color: '#1a1f12' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
