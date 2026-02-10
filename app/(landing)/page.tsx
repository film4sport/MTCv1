'use client';

import { useState, useEffect, useRef } from 'react';
import './styles/landing.css';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WaveDivider from './components/WaveDivider';
import Events from './components/Events';
import Schedule from './components/Schedule';
import Partners from './components/Partners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import BookingOverlay from './components/BookingOverlay';
import Lightbox from './components/Lightbox';

export default function LandingPage() {
  const [bookingOpen, setBookingOpen] = useState(false);
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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D Tilt Effect for tilt-card elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const card = (e.currentTarget as HTMLElement);
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      (e.currentTarget as HTMLElement).style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    };

    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', handleMouseMove as EventListener);
      card.addEventListener('mouseleave', handleMouseLeave as EventListener);
    });

    return () => {
      tiltCards.forEach((card) => {
        card.removeEventListener('mousemove', handleMouseMove as EventListener);
        card.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      });
    };
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
      <a href="#events" className="skip-to-content">Skip to content</a>
      <Loader />

      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <Navbar onOpenBooking={openBooking} />

      {/* Hero Section (dark, parallax) */}
      <Hero onOpenBooking={() => { openBooking(); createConfetti(); }} />

      {/* Wave Divider: Hero → Events (overlaps hero bottom) */}
      <WaveDivider bgColor="transparent" fillColor="#f5f2eb" height={120} overlap />

      {/* Events & Programs Section */}
      <Events onOpenLightbox={openLightbox} />

      {/* Wave Divider: Events (warm cream) → Schedule (dark) */}
      <WaveDivider bgColor="#f5f2eb" fillColor="#22271a" />

      {/* Schedule / Calendar Section (dark bg) */}
      <Schedule />

      {/* Wave Divider: Schedule (dark) → Partners (cream) */}
      <WaveDivider bgColor="#22271a" fillColor="#faf8f3" />

      {/* Partners Section */}
      <Partners />

      {/* Wave Divider: Partners (cream) → Gallery (warm gray) */}
      <WaveDivider bgColor="#faf8f3" fillColor="#edeae3" />

      {/* Gallery Section */}
      <Gallery onOpenLightbox={openLightbox} />

      {/* Wave Divider: Gallery (warm gray) → Footer (dark) */}
      <WaveDivider bgColor="#edeae3" fillColor="#1a1f12" />

      {/* Footer (dark) */}
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
