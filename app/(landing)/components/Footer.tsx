'use client';

import { useEffect, useRef } from 'react';

interface FooterProps {
  onOpenBooking: () => void;
}

export default function Footer({ onOpenBooking }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    footerRef.current?.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="text-white py-16 fade-in texture-overlay" style={{ backgroundColor: '#1a1f12' }} ref={footerRef}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        {/* Top Row */}
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="headline-font text-xl mb-4" style={{ color: '#e8e4d9' }}>
              Mono Tennis Club
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              A not-for-profit community tennis club promoting the game of tennis in Mono, Ontario.
            </p>
          </div>

          {/* Club Links */}
          <div>
            <h5 className="font-semibold mb-4" style={{ color: '#e8e4d9' }}>
              Club
            </h5>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  About
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  Membership
                </a>
              </li>
              <li>
                <a href="#events" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  News
                </a>
              </li>
              <li>
                <a href="#events" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  Teams
                </a>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h5 className="font-semibold mb-4" style={{ color: '#e8e4d9' }}>
              Programs
            </h5>
            <ul className="space-y-2">
              <li>
                <a href="#events" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  Tennis Programs
                </a>
              </li>
              <li>
                <a href="#schedule" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  Schedule
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenBooking}
                  className="text-sm hover:opacity-80 transition-opacity text-left"
                  style={{ color: 'rgba(232, 228, 217, 0.6)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Book a Court
                </button>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h5 className="font-semibold mb-4" style={{ color: '#e8e4d9' }}>
              Location
            </h5>
            <address className="not-italic text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              754883 Mono Centre Road
              <br />
              Mono, Ontario
              <br />
              L9W 6S3
            </address>
            <a
              href="mailto:pattipowell@me.com"
              className="text-sm mt-3 inline-block hover:opacity-80 transition-opacity"
              style={{ color: '#d4e157' }}
            >
              pattipowell@me.com
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-8" style={{ backgroundColor: 'rgba(232, 228, 217, 0.1)' }} />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>
            &copy; Mono Tennis Club 2026
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com/monotennisclub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:border-white/40"
              style={{ borderColor: 'rgba(232, 228, 217, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#e8e4d9' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/monotennisclub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:border-white/40"
              style={{ borderColor: 'rgba(232, 228, 217, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#e8e4d9' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Large Watermark Text */}
      <div className="mt-16 overflow-hidden">
        <div className="footer-watermark text-center opacity-[0.08] select-none" style={{ color: '#e8e4d9' }}>
          MONO TENNIS
        </div>
      </div>
    </footer>
  );
}
