'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '../(landing)/styles/landing.css';

import AboutTab from './components/AboutTab';
import MembershipTab from './components/MembershipTab';
import RulesTab from './components/RulesTab';
import CoachingTab from './components/CoachingTab';
import FaqTab from './components/FAQTab';
import PrivacyTab from './components/PrivacyTab';
import TermsTab from './components/TermsTab';

const heroTitles: Record<string, { title: string; subtitle: string }> = {
  about: { title: 'About Us', subtitle: 'Learn about Mono Tennis Club, our mission, facilities, and community.' },
  membership: { title: 'Membership & News', subtitle: 'Everything you need to know about joining Mono Tennis Club, our facilities, fees, and the latest club news.' },
  rules: { title: 'Rules & Constitution', subtitle: 'Club rules, regulations, and our constitution governing the operation of Mono Tennis Club.' },
  coaching: { title: 'Coaching & Camps', subtitle: 'Meet our coaching staff and learn about programs for players of all ages and skill levels.' },
  faq: { title: 'FAQ & Directions', subtitle: 'Find answers to common questions and directions to the club.' },
  privacy: { title: 'Privacy Policy', subtitle: 'How Mono Tennis Club collects, uses, and protects your personal information.' },
  terms: { title: 'Terms of Service', subtitle: 'The terms and conditions governing your use of Mono Tennis Club services.' },
};

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

  // IntersectionObserver for fade-in animations
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

  // Tab-specific document titles for SEO
  useEffect(() => {
    const titles: Record<string, string> = {
      about: 'About Us — History, Facilities & Board | Mono Tennis Club',
      membership: 'Membership — Fees, Benefits & How to Join | Mono Tennis Club',
      coaching: 'Coaching — Lessons, Camps & Programs | Mono Tennis Club',
      faq: 'FAQ & Directions — Find Us | Mono Tennis Club',
      rules: 'Club Rules & Constitution | Mono Tennis Club',
      privacy: 'Privacy Policy | Mono Tennis Club',
      terms: 'Terms of Service | Mono Tennis Club',
    };
    document.title = titles[activeTab] || 'Club Info | Mono Tennis Club';

    const descriptions: Record<string, string> = {
      about: 'Learn about Mono Tennis Club — our history since 1980, 4 courts, clubhouse facilities, and volunteer Board of Directors in Mono, Ontario.',
      membership: 'Join Mono Tennis Club — membership fees from $50/year, family plans, guest passes, and online registration for the Caledon-Dufferin tennis community.',
      coaching: 'Tennis coaching at Mono Tennis Club — lessons with Mark Taylor, summer camps for juniors, clinics for all levels in Mono, Ontario.',
      faq: 'Frequently asked questions about Mono Tennis Club — hours, equipment, booking, guest policy, and directions to 754883 Mono Centre Road.',
      rules: 'Mono Tennis Club constitution, court rules, regulations, and member code of conduct.',
      privacy: 'Mono Tennis Club privacy policy — how we collect, use, and protect your personal information under PIPEDA.',
      terms: 'Mono Tennis Club terms of service — membership agreement, liability, and usage policies.',
    };
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', descriptions[activeTab] || '');
  }, [activeTab]);

  const switchTab = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/info?tab=${newTab}`, { scroll: false });
  };

  const currentHero = heroTitles[activeTab] || heroTitles.membership;

  return (
    <div ref={pageRef} style={{ backgroundColor: '#f5f2eb', minHeight: '100vh' }}>
      {/* Header / Nav Bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 lg:px-16 py-4" style={{ backgroundColor: 'rgba(26, 31, 18, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <a href="/" className="headline-font text-xl font-bold tracking-wide" style={{ color: '#e8e4d9', textDecoration: 'none' }}>
          <span>M</span><span>T</span><span>C</span>
        </a>
        <a href="/" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>
      </nav>

      {/* Hero Banner */}
      <section className="py-16 lg:py-24 px-8 lg:px-16 text-center fade-in" style={{ backgroundColor: '#f5f2eb' }}>
        <span className="section-label">// Club Information</span>
        <h1 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#2a2f1e' }}>
          {currentHero.title}
        </h1>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
          {currentHero.subtitle}
        </p>
      </section>

      {/* Tab Navigation */}
      <div className="sticky top-[61px] z-40 px-8 lg:px-16 py-3 relative" style={{ backgroundColor: '#f5f2eb', borderBottom: '1px solid #e0dcd3' }}>
        {/* Right fade indicator for horizontal scroll on mobile */}
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

      {/* Tab Panels */}
      {activeTab === 'about' && <div role="tabpanel" id="tabpanel-about" aria-labelledby="tab-about" className="animate-fadeIn"><AboutTab /></div>}
      {activeTab === 'membership' && <div role="tabpanel" id="tabpanel-membership" aria-labelledby="tab-membership" className="animate-fadeIn"><MembershipTab /></div>}
      {activeTab === 'rules' && <div role="tabpanel" id="tabpanel-rules" aria-labelledby="tab-rules" className="animate-fadeIn"><RulesTab /></div>}
      {activeTab === 'coaching' && <div role="tabpanel" id="tabpanel-coaching" aria-labelledby="tab-coaching" className="animate-fadeIn"><CoachingTab /></div>}
      {activeTab === 'faq' && <div role="tabpanel" id="tabpanel-faq" aria-labelledby="tab-faq" className="animate-fadeIn"><FaqTab /></div>}
      {activeTab === 'privacy' && <div role="tabpanel" id="tabpanel-privacy" aria-labelledby="tab-privacy" className="animate-fadeIn"><PrivacyTab /></div>}
      {activeTab === 'terms' && <div role="tabpanel" id="tabpanel-terms" aria-labelledby="tab-terms" className="animate-fadeIn"><TermsTab /></div>}

      {/* Back to Home CTA */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 fade-in rounded-2xl p-10 lg:p-14" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.15), rgba(212, 225, 87, 0.08))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <div>
              <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl text-center md:text-left" style={{ color: '#2a2f1e' }}>
                Ready to Play?
              </h2>
              <p className="mt-3 text-sm text-center md:text-left" style={{ color: '#6b7266' }}>
                Join Mono Tennis Club and get access to courts, events, and more.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/signup" className="px-8 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:shadow-lg" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                Become a Member
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 lg:px-16 text-center" style={{ backgroundColor: '#1a1f12', borderTop: '1px solid rgba(232, 228, 217, 0.08)' }}>
        <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>
          &copy; Mono Tennis Club 2026
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
