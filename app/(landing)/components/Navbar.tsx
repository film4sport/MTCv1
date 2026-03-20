'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { APP_ROUTES } from '../../lib/site';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
    // Return focus to hamburger button
    hamburgerRef.current?.focus();
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  // Focus trap + Escape key for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen || !menuRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = menuRef.current?.querySelectorAll<HTMLElement>('a, button');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus first link when menu opens
    const firstLink = menuRef.current.querySelector<HTMLElement>('button, a');
    firstLink?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, closeMobileMenu]);

  return (
    <>
      <nav className={`navbar flex items-center justify-between${scrolled ? ' scrolled' : ''}`} id="navbar">
        <div className="logo-group">
          <Image
            src="/mono-logo-transparent.png"
            alt="Mono Tennis Club"
            width={160}
            height={64}
            className="h-12 md:h-14 lg:h-16 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
            priority
          />
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <a href="#" className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Home</a>
          <div className="nav-dropdown">
            <a href={APP_ROUTES.infoTab('about')} className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.About</a>
            <div className="nav-dropdown-menu">
              <a href={APP_ROUTES.infoTab('about')}>About Us</a>
              <a href={APP_ROUTES.infoTab('about', 'news')}>News</a>
            </div>
          </div>
          <a href={APP_ROUTES.infoTab('membership')} className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.Membership</a>
          <a href={APP_ROUTES.infoTab('faq')} className="nav-link text-sm hover:opacity-80 transition-opacity" style={{ color: '#e8e4d9' }}>.FAQ</a>
          <a href={APP_ROUTES.login} className="login-btn ml-2">
            Login
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          ref={hamburgerRef}
          className="lg:hidden p-2 rounded-lg"
          onClick={openMobileMenu}
          style={{ color: '#e8e4d9' }}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className={`mobile-menu${mobileMenuOpen ? ' active' : ''}`}
        role="dialog"
        aria-modal={mobileMenuOpen}
        aria-label="Navigation menu"
        inert={!mobileMenuOpen ? true : undefined}
      >
        <div className="mobile-menu-content">
          <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <a href="#" className="mobile-menu-link" onClick={closeMobileMenu}>.Home</a>
          <a href={APP_ROUTES.infoTab('about')} className="mobile-menu-link" onClick={closeMobileMenu}>.About</a>
          <a href={APP_ROUTES.infoTab('about', 'news')} className="mobile-menu-link text-sm" onClick={closeMobileMenu} style={{ opacity: 0.6, paddingLeft: '2rem' }}>.News</a>
          <a href={APP_ROUTES.infoTab('membership')} className="mobile-menu-link" onClick={closeMobileMenu}>.Membership</a>
          <a href={APP_ROUTES.infoTab('faq')} className="mobile-menu-link" onClick={closeMobileMenu}>.FAQ</a>
          <a href={APP_ROUTES.login} className="mobile-menu-link" onClick={closeMobileMenu}>.LOGIN</a>
        </div>
      </div>
    </>
  );
}
