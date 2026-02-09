'use client';

import { useEffect, useState } from 'react';

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    document.body.style.overflow = 'hidden';
  };

  return (
    <>
      <nav className={`navbar flex items-center justify-between${scrolled ? ' scrolled' : ''}`} id="navbar">
        <div className="mtc-logo headline-font text-xl md:text-2xl font-bold tracking-wide" style={{ color: '#e8e4d9' }}>
          <span className="mtc-letter">M</span>
          <span className="mtc-letter">T</span>
          <span className="mtc-letter">C</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <a href="#" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Home</a>
          <a href="/info" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.About</a>
          <a href="/info" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Membership</a>
          <a href="#events" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Events</a>
          <a href="#contact" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Contact</a>
          <button
            onClick={onOpenBooking}
            className="nav-link text-sm hover:opacity-80 transition-opacity font-semibold bg-transparent border-none cursor-pointer"
            style={{ color: '#d4e157' }}
          >
            .Book
          </button>
          <a href="/login" className="login-btn ml-2" style={{ color: '#e8e4d9' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2 rounded-lg" onClick={openMobileMenu} style={{ color: '#e8e4d9' }} aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${mobileMenuOpen ? ' active' : ''}`}>
        <div className="mobile-menu-content">
          <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <a href="#" className="mobile-menu-link" onClick={closeMobileMenu}>.Home</a>
          <a href="/info" className="mobile-menu-link" onClick={closeMobileMenu}>.About</a>
          <a href="/info" className="mobile-menu-link" onClick={closeMobileMenu}>.Membership</a>
          <a href="#events" className="mobile-menu-link" onClick={closeMobileMenu}>.Events</a>
          <a href="#contact" className="mobile-menu-link" onClick={closeMobileMenu}>.Contact</a>
          <button
            onClick={() => { onOpenBooking(); closeMobileMenu(); }}
            className="mobile-menu-link bg-transparent border-none cursor-pointer"
            style={{ color: '#d4e157' }}
          >
            .Book
          </button>
          <a href="/login" className="mobile-menu-link" onClick={closeMobileMenu}>.LOGIN</a>
        </div>
      </div>
    </>
  );
}
