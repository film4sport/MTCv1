'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '../(landing)/styles/landing.css';

const faqItems = [
  {
    question: 'How do I become a member?',
    answer: 'Register online starting March 1st. Membership includes court access, events, and booking privileges.',
  },
  {
    question: 'When is the club open?',
    answer: 'Late April through late October (weather permitting). Courts available dawn to dusk daily.',
  },
  {
    question: 'Do I need my own equipment?',
    answer:
      'Bring your own racquet and balls. Wear proper tennis shoes (non-marking soles). Clubhouse has water and washroom facilities.',
  },
  {
    question: 'Programs for beginners?',
    answer:
      'Absolutely! Social round robins are perfect for beginners. We also offer coaching programs and clinics.',
  },
  {
    question: 'How do I book a court?',
    answer: 'Use our online booking system. Select your date/time and confirm. Book up to 7 days in advance.',
  },
  {
    question: 'Can I bring guests?',
    answer: 'Yes! Guest fees apply. Guests must be accompanied by a member and follow club rules.',
  },
];

function InfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const tab = searchParams.get('tab') || 'membership';
  const [activeTab, setActiveTab] = useState(tab);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    pageRef.current?.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  const switchTab = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/info?tab=${newTab}`, { scroll: false });
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

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
        <span className="section-label section-label-light">// Club Information</span>
        <h1 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#e8e4d9' }}>
          {activeTab === 'about' ? 'About Us' : activeTab === 'faq' ? 'FAQ & Directions' : 'Membership & News'}
        </h1>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
          {activeTab === 'about'
            ? 'Learn about Mono Tennis Club, our mission, facilities, and community.'
            : activeTab === 'faq'
            ? 'Find answers to common questions and directions to the club.'
            : 'Everything you need to know about joining Mono Tennis Club, our facilities, fees, and the latest club news.'}
        </p>
      </section>

      {/* Tab Navigation */}
      <div className="px-8 lg:px-16 mb-8">
        <div className="max-w-7xl mx-auto flex justify-center gap-3">
          {[
            { key: 'about', label: 'About' },
            { key: 'membership', label: 'Membership' },
            { key: 'faq', label: 'FAQ' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className="filter-btn"
              style={
                activeTab === t.key
                  ? { backgroundColor: '#d4e157', color: '#1a1f12' }
                  : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* =================== ABOUT TAB =================== */}
      {activeTab === 'about' && (
        <>
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#22271a' }}>
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Left: Images */}
                <div className="relative fade-in-left">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                    <img
                      src="https://i.imgur.com/JJiiQRQ.png"
                      alt="Mono Tennis Club Courts"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="hidden lg:grid grid-cols-2 gap-3 mt-3">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src="https://i.imgur.com/C9D3kXQ.jpeg"
                        alt="Mono Tennis Club Opening Day"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src="https://i.imgur.com/OtUfWsL.jpeg"
                        alt="Tennis Court"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Content */}
                <div className="fade-in-right">
                  <span className="section-label section-label-light">// About Us</span>
                  <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#e8e4d9' }}>
                    Mono Tennis Club — Empowering Your Tennis Journey with{' '}
                    <span style={{ color: '#d4e157' }}>Passion, Community,</span> and Dedication.
                  </h2>
                  <p className="leading-relaxed mb-6" style={{ color: 'rgba(232, 228, 217, 0.7)' }}>
                    Welcome to Mono Tennis Club, a not-for-profit community tennis club located in the heart of Mono, Ontario.
                    We promote the game of tennis by organizing tournaments, clinic round robins, competitive teams, coaching,
                    kids camps, house leagues and more.
                  </p>
                  <p className="leading-relaxed mb-8" style={{ color: 'rgba(232, 228, 217, 0.7)' }}>
                    Whether you&apos;re a beginner picking up a racket for the first time or a seasoned player looking for
                    competitive matches, Mono Tennis Club is your trusted partner in achieving your full potential and making
                    lasting memories on the court.
                  </p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-3">
                    {['Parking', 'Wheelchair Accessible', 'Clubhouse', 'Pro Courts'].map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-2 rounded-full text-sm font-medium"
                        style={{ backgroundColor: 'rgba(212, 225, 87, 0.12)', color: '#d4e157' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* =================== MEMBERSHIP TAB =================== */}
      {activeTab === 'membership' && (
        <>
          {/* Membership Information */}
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#22271a' }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label section-label-light">// Membership</span>
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
                    {[
                      'Registration opens March 1st each year',
                      'Pay by Interac e-transfer or credit/debit card',
                      'Guest passes available for $5 per visit',
                      'All members must sign a waiver',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
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
                    {[
                      { label: 'Adult (Single)', price: '$100' },
                      { label: 'Family', price: '$200' },
                      { label: 'Student (18 & under)', price: '$50' },
                      { label: 'Guest Pass', price: '$5 / visit' },
                    ].map((fee, i) => (
                      <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid rgba(232, 228, 217, 0.06)' } : {}}>
                        <span className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>{fee.label}</span>
                        <span className="font-semibold text-sm" style={{ color: '#d4e157' }}>{fee.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Season & Facilities */}
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#1a1f12' }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label section-label-light">// Facilities</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#e8e4d9' }}>
                  Season &amp; Facilities
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in">
                {[
                  { icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', title: 'Season', desc: 'May through October' },
                  { icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', title: '4 Courts', desc: 'Courts 1 & 2 have lights' },
                  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', title: 'Clubhouse', desc: 'Washrooms & facilities' },
                  { icon: 'M5 13l4 4L19 7', title: 'Accessible', desc: 'Wheelchair accessible & free parking' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-6 text-center" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                      <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <h4 className="font-bold mb-2" style={{ color: '#e8e4d9' }}>{item.title}</h4>
                    <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>{item.desc}</p>
                  </div>
                ))}
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
                <span className="section-label section-label-light">// News</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#e8e4d9' }}>
                  News &amp; Updates
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 fade-in">
                {[
                  { badge: 'Announcement', date: 'March 2026', title: 'Registration Opens March 1st', desc: 'The 2026 season registration opens on March 1st. Pay online via Interac e-transfer or credit/debit card. Early bird discounts may apply.' },
                  { badge: 'Newsletter', date: 'April 2026', title: 'Spring Newsletter', desc: 'Get the latest updates on the upcoming season, new programs, coaching staff changes, and social events planned for the summer.' },
                  { badge: 'Fundraiser', date: 'Ongoing', title: 'Court Resurfacing Fund', desc: 'Help us maintain and improve our courts. Donations go toward resurfacing and upgrading our facilities for future seasons.' },
                ].map((news, i) => (
                  <div key={i} className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(212, 225, 87, 0.15)', color: '#d4e157' }}>
                        {news.badge}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(232, 228, 217, 0.4)' }}>{news.date}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>{news.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                      {news.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* =================== FAQ TAB =================== */}
      {activeTab === 'faq' && (
        <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#22271a' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left: FAQ */}
              <div className="fade-in-left">
                <h3 className="font-semibold text-lg mb-6" style={{ color: '#e8e4d9' }}>Frequently Asked Questions</h3>

                {faqItems.map((item, index) => (
                  <div key={index} className={`faq-item${activeFaq === index ? ' active' : ''}`} style={{ borderColor: 'rgba(232, 228, 217, 0.1)' }}>
                    <button
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                      style={{ color: '#e8e4d9' }}
                    >
                      {item.question}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className="faq-answer"
                      style={{
                        maxHeight: activeFaq === index ? '200px' : '0',
                        color: 'rgba(232, 228, 217, 0.6)',
                      }}
                    >
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Google Maps */}
              <div className="fade-in-right">
                <h3 className="font-semibold text-lg mb-6" style={{ color: '#e8e4d9' }}>Find Us</h3>
                <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-full lg:min-h-[450px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.8904!2d-80.0731!3d43.9981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882a7a2e7e8e8e8d%3A0x8e8e8e8e8e8e8e8e!2s754883%20Mono%20Centre%20Rd%2C%20Mono%2C%20ON%20L9W%206S3!5e0!3m2!1sen!2sca!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mono Tennis Club Location"
                  />
                </div>
                <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)' }}>
                  <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.7)' }}>
                    <strong style={{ color: '#e8e4d9' }}>754883 Mono Centre Road</strong>
                    <br />
                    Mono, Ontario L9W 6S3
                    <br />
                    <a href="mailto:info@monotennisclub.ca" className="hover:underline" style={{ color: '#d4e157' }}>
                      info@monotennisclub.ca
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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

export default function InfoPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#1a1f12', minHeight: '100vh' }} />}>
      <InfoPageContent />
    </Suspense>
  );
}
