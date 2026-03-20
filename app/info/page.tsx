'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import '../(landing)/styles/landing.css';

import AboutTab from './components/AboutTab';
import MembershipTab from './components/MembershipTab';
import RulesTab from './components/RulesTab';
import CoachingTab from './components/CoachingTab';
import FaqTab from './components/FAQTab';
import PrivacyTab from './components/PrivacyTab';
import TermsTab from './components/TermsTab';
import { APP_COPY, APP_ROUTES, CLUB_NAME } from '../lib/site';
import { INFO_TAB_METADATA } from '../lib/site-metadata';

const tabs = [
  { key: 'about', label: 'About' },
  { key: 'membership', label: 'Membership' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'faq', label: 'FAQ' },
  { key: 'rules', label: 'Rules' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms' },
];

function InfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const tab = searchParams.get('tab') || 'membership';
  const [activeTab, setActiveTab] = useState(tab);

  useEffect(() => { setActiveTab(tab); }, [tab]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    let attempts = 0;
    const tryScroll = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 100);
      }
    };
    const timer = setTimeout(tryScroll, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    const timer = setTimeout(() => {
      pageRef.current?.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    }, 50);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [activeTab]);

  useEffect(() => {
    const tabMetadata = INFO_TAB_METADATA[activeTab as keyof typeof INFO_TAB_METADATA];
    document.title = tabMetadata?.documentTitle || `Club Info | ${CLUB_NAME}`;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', tabMetadata?.description || '');
  }, [activeTab]);

  const switchTab = (newTab: string) => {
    setActiveTab(newTab);
    router.push(APP_ROUTES.infoTab(newTab), { scroll: false });
  };

  const currentHero = INFO_TAB_METADATA[activeTab as keyof typeof INFO_TAB_METADATA] || INFO_TAB_METADATA.membership;

  return (
    <div ref={pageRef} style={{ backgroundColor: '#f5f2eb', minHeight: '100vh' }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 lg:px-16 py-4" style={{ backgroundColor: 'rgba(26, 31, 18, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <a href={APP_ROUTES.home}>
          <Image src="/mono-logo-transparent.png" alt={CLUB_NAME} width={48} height={48} className="h-10 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </a>
        <a href={APP_ROUTES.home} className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {APP_COPY.backToHome}
        </a>
      </nav>

      <section className="py-16 lg:py-24 px-8 lg:px-16 text-center fade-in" style={{ backgroundColor: '#f5f2eb' }}>
        <span className="section-label">// Club Information</span>
        <h1 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#2a2f1e' }}>
          {currentHero.heroTitle}
        </h1>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
          {currentHero.heroSubtitle}
        </p>
      </section>

      <div className="sticky top-[61px] z-40 px-8 lg:px-16 py-3 relative" style={{ backgroundColor: '#f5f2eb', borderBottom: '1px solid #e0dcd3' }}>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 lg:hidden z-10" style={{ background: 'linear-gradient(to right, transparent, #f5f2eb)' }} />
        <div className="max-w-7xl mx-auto flex justify-center gap-3 overflow-x-auto" role="tablist" aria-label="Info page sections" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={activeTab === t.key}
              aria-controls={`tabpanel-${t.key}`}
              onClick={() => switchTab(t.key)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0"
              style={
                activeTab === t.key
                  ? { backgroundColor: '#6b7a3d', color: '#fff' }
                  : { backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'about' && <div role="tabpanel" id="tabpanel-about" aria-labelledby="tab-about" className="animate-fadeIn"><AboutTab /></div>}
      {activeTab === 'membership' && <div role="tabpanel" id="tabpanel-membership" aria-labelledby="tab-membership" className="animate-fadeIn"><MembershipTab /></div>}
      {activeTab === 'rules' && <div role="tabpanel" id="tabpanel-rules" aria-labelledby="tab-rules" className="animate-fadeIn"><RulesTab /></div>}
      {activeTab === 'coaching' && <div role="tabpanel" id="tabpanel-coaching" aria-labelledby="tab-coaching" className="animate-fadeIn"><CoachingTab /></div>}
      {activeTab === 'faq' && <div role="tabpanel" id="tabpanel-faq" aria-labelledby="tab-faq" className="animate-fadeIn"><FaqTab /></div>}
      {activeTab === 'privacy' && <div role="tabpanel" id="tabpanel-privacy" aria-labelledby="tab-privacy" className="animate-fadeIn"><PrivacyTab /></div>}
      {activeTab === 'terms' && <div role="tabpanel" id="tabpanel-terms" aria-labelledby="tab-terms" className="animate-fadeIn"><TermsTab /></div>}

      {activeTab !== 'membership' && <section className="py-12 lg:py-16 px-8 lg:px-16 text-center fade-in" style={{ backgroundColor: '#1a1f12' }}>
        <h2 className="headline-font text-2xl md:text-3xl" style={{ color: '#e8e4d9' }}>
          Ready to Play?
        </h2>
        <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
          Join the club and get access to courts, events, and a community that loves the game.
        </p>
        <a
          href={APP_ROUTES.signup}
          className="inline-block mt-6 px-8 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
          style={{ backgroundColor: '#d4e157', color: '#2a2f1e' }}
        >
          {APP_COPY.becomeMember}
        </a>
      </section>}

      <footer className="py-8 px-8 lg:px-16 text-center" style={{ backgroundColor: '#1a1f12', borderTop: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>
          &copy; {CLUB_NAME} 2026
        </p>
      </footer>
    </div>
  );
}

export default function InfoPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#f5f2eb', minHeight: '100vh' }} />}>
      <InfoPageContent />
    </Suspense>
  );
}
