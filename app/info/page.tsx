'use client';

import { useEffect, useRef } from 'react';
import '../(landing)/styles/landing.css';

export default function InfoPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    pageRef.current?.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={pageRef} style={{ backgroundColor: '#1a1f12', minHeight: '100vh' }}>
      {/* Header / Nav Bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 lg:px-16 py-4" style={{ backgroundColor: 'rgba(26, 31, 18, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <a href="/" className="headline-font text-xl font-bold tracking-wide" style={{ color: '#e8e4d9', textDecoration: 'none' }}>
          <span>M</span><span>T</span><span>C</span>
        </a>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#d4e157' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>
      </nav>

      {/* Hero Banner */}
      <section className="py-16 lg:py-24 px-8 lg:px-16 text-center fade-in">
        <span className="section-label uppercase font-medium">// Club Information</span>
        <h1 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#e8e4d9' }}>
          Membership &amp; News
        </h1>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
          Everything you need to know about joining Mono Tennis Club, our facilities, fees, and the latest club news.
        </p>
      </section>

      {/* Membership Information */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#22271a' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label uppercase font-medium">// Membership</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#e8e4d9' }}>
              How to Join
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Mono Tennis Club is a not-for-profit community club that has been promoting tennis in Mono since 1980. Registration opens March 1st each year for the May–October season.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 fade-in">
            {/* How to Join */}
            <div className="rounded-xl p-8" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#e8e4d9' }}>How to Join</h3>
              <ul className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Registration opens March 1st each year
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pay by Interac e-transfer or credit/debit card
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guest passes available for $5 per visit
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All members must sign a waiver
                </li>
              </ul>
            </div>

            {/* Membership Fees */}
            <div className="rounded-xl p-8" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#e8e4d9' }}>Membership Fees</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(232, 228, 217, 0.06)' }}>
                  <span className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Adult (Single)</span>
                  <span className="font-semibold text-sm" style={{ color: '#d4e157' }}>$100</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(232, 228, 217, 0.06)' }}>
                  <span className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Family</span>
                  <span className="font-semibold text-sm" style={{ color: '#d4e157' }}>$200</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(232, 228, 217, 0.06)' }}>
                  <span className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Student (18 &amp; under)</span>
                  <span className="font-semibold text-sm" style={{ color: '#d4e157' }}>$50</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Guest Pass</span>
                  <span className="font-semibold text-sm" style={{ color: '#d4e157' }}>$5 / visit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Season & Facilities */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#1a1f12' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label uppercase font-medium">// Facilities</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#e8e4d9' }}>
              Season &amp; Facilities
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in">
            {/* Season */}
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#e8e4d9' }}>Season</h4>
              <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>May through October</p>
            </div>

            {/* Courts */}
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#e8e4d9' }}>4 Courts</h4>
              <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Courts 1 &amp; 2 have lights</p>
            </div>

            {/* Clubhouse */}
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#e8e4d9' }}>Clubhouse</h4>
              <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Washrooms &amp; facilities</p>
            </div>

            {/* Accessibility */}
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#e8e4d9' }}>Accessible</h4>
              <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>Wheelchair accessible &amp; free parking</p>
            </div>
          </div>

          {/* Location */}
          <div className="mt-12 rounded-xl p-8 fade-in" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1" style={{ color: '#e8e4d9' }}>Location</h4>
                <address className="not-italic text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  754883 Mono Centre Road, Mono, Ontario, L9W 6S3
                </address>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#22271a' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label uppercase font-medium">// News</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#e8e4d9' }}>
              News &amp; Updates
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 fade-in">
            {/* Registration Opens */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(212, 225, 87, 0.15)', color: '#d4e157' }}>
                  Announcement
                </span>
                <span className="text-xs" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>March 2026</span>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>Registration Opens March 1st</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                The 2026 season registration opens on March 1st. Pay online via Interac e-transfer or credit/debit card. Early bird discounts may apply.
              </p>
            </div>

            {/* Spring Newsletter */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(212, 225, 87, 0.15)', color: '#d4e157' }}>
                  Newsletter
                </span>
                <span className="text-xs" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>April 2026</span>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>Spring Newsletter</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                Get the latest updates on the upcoming season, new programs, coaching staff changes, and social events planned for the summer.
              </p>
            </div>

            {/* Court Resurfacing Fund */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(212, 225, 87, 0.15)', color: '#d4e157' }}>
                  Fundraiser
                </span>
                <span className="text-xs" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>Ongoing</span>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>Court Resurfacing Fund</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                Help us maintain and improve our courts. Donations go toward resurfacing and upgrading our facilities for future seasons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Home CTA */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#1a1f12' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 fade-in rounded-2xl p-10 lg:p-14" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.25), rgba(212, 225, 87, 0.1))', border: '1px solid rgba(212, 225, 87, 0.15)' }}>
            <div>
              <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl text-center md:text-left" style={{ color: '#e8e4d9' }}>
                Ready to Play?
              </h2>
              <p className="mt-3 text-sm text-center md:text-left" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                Head back to the home page to book a court or view the schedule.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="px-8 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:shadow-lg"
                style={{ backgroundColor: '#6b7a3d', color: '#e8e4d9' }}
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 px-8 lg:px-16 text-center" style={{ backgroundColor: '#1a1f12', borderTop: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>
          &copy; Mono Tennis Club 2026
        </p>
      </footer>
    </div>
  );
}
