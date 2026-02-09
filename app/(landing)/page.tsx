'use client';

import { useState, useEffect, useRef } from 'react';
import './styles/landing.css';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatWeOffer from './components/WhatWeOffer';
import Schedule from './components/Schedule';
import Membership from './components/Membership';
import Partners from './components/Partners';
import CTABanner from './components/CTABanner';
import WaveDivider from './components/WaveDivider';
import Footer from './components/Footer';
import BookingOverlay from './components/BookingOverlay';
import Lightbox from './components/Lightbox';

export default function LandingPage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Override body background for landing page (globals.css sets #f9fafb for PWA)
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.setProperty('background-color', '#1a1f12', 'important');
    document.documentElement.style.setProperty('background-color', '#1a1f12', 'important');
    return () => {
      document.body.style.backgroundColor = prev;
      document.documentElement.style.backgroundColor = prev;
    };
  }, []);

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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openBooking = () => setBookingOpen(true);
  const closeBooking = () => setBookingOpen(false);
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
      <Loader />

      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <Navbar onOpenBooking={openBooking} />

      <Hero onOpenBooking={() => { openBooking(); createConfetti(); }} onOpenLightbox={openLightbox} />

      {/* "Play, Learn, Connect" — bg #1a1f12 */}
      <WhatWeOffer />

      {/* Events Calendar — bg #22271a */}
      <Schedule />

      {/* Membership & Info — bg #1a1f12 */}
      <Membership />

      {/* Partners — bg #22271a */}
      <Partners />

      {/* CTA Banner — bg #1a1f12 */}
      <CTABanner onOpenBooking={() => { openBooking(); createConfetti(); }} />

      {/* Single wave divider (CTA to Footer — same color, visually invisible like original) */}
      <WaveDivider bgColor="#1a1f12" fillColor="#1a1f12" variant="footer" />

      {/* Footer — bg #1a1f12 */}
      <Footer onOpenBooking={openBooking} />

      {/* Booking Overlay */}
      <BookingOverlay isOpen={bookingOpen} onClose={closeBooking} />

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
