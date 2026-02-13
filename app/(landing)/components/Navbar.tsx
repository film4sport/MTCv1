'use client';

import { useEffect, useState } from 'react';

export default function Navbar() {
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
        <div className="logo-group">
          <div
            className="logo-circle w-11 h-11 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#e8e4d9' }}
          >
            <span
              className="text-base font-bold tracking-wide"
              style={{ color: '#e8e4d9' }}
            >
              MTC
            </span>
          </div>
          <span
            className="logo-text text-xl font-bold tracking-wide"
            style={{ color: '#e8e4d9' }}
          >
            Mono Tennis
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <a href="#" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Home</a>
          <a href="/info?tab=about" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.About</a>
          <a href="/info?tab=membership" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Membership</a>
          <a href="#events" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Events</a>
          <a href="/info?tab=faq" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.FAQ</a>
          <a href="/login" className="login-btn ml-2">
            Login
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
          <a href="/info?tab=about" className="mobile-menu-link" onClick={closeMobileMenu}>.About</a>
          <a href="/info?tab=membership" className="mobile-menu-link" onClick={closeMobileMenu}>.Membership</a>
          <a href="#events" className="mobile-menu-link" onClick={closeMobileMenu}>.Events</a>
          <a href="/info?tab=faq" className="mobile-menu-link" onClick={closeMobileMenu}>.FAQ</a>
          <a href="/login" className="mobile-menu-link" onClick={closeMobileMenu}>.LOGIN</a>
        </div>
      </div>
    </>
  );
}
