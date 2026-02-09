'use client';

import { useState, useEffect, useRef } from 'react';

interface EventsProps {
  onOpenLightbox: (src: string, alt: string) => void;
}

const eventsData = [
  {
    category: 'tournament',
    image: 'https://i.imgur.com/vqd926b.jpeg',
    alt: '95+ Mixed Doubles Tournament',
    badge: 'Tournament',
    badgeStyle: { backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' },
    date: 'July 26-27, 2026',
    title: '95+ Mixed Doubles Tournament',
    description:
      '$180/Team — 2 Matches Guaranteed. A+B Draw, Over 95 Mixed Doubles. Includes lunches at Mono Cliffs Inn and great prizes!',
  },
  {
    category: 'camp',
    image: 'https://i.imgur.com/YOdfHw6.jpeg',
    alt: 'Summer Tennis Camp',
    badge: 'Camp',
    badgeStyle: { backgroundColor: 'rgba(212, 225, 87, 0.3)', color: '#3b4229' },
    date: 'July 28 - Aug 1, 2026',
    title: 'Summer Tennis Camp',
    description:
      '8:30am - 3:30pm daily. Make memories, build skills, gain confidence and have fun! Perfect for young players.',
  },
  {
    category: 'social',
    image: 'https://i.imgur.com/6u73Y8w.jpeg',
    alt: 'Social Round Robin',
    badge: 'Social',
    badgeStyle: { backgroundColor: 'rgba(59, 66, 41, 0.1)', color: '#3b4229' },
    date: 'Ongoing',
    title: 'Social Round Robin',
    description:
      'Join our friendly social round robins! A great way to meet fellow members, play multiple matches, and enjoy the community atmosphere.',
  },
];

const membershipCards = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
    title: 'How to Join',
    description: 'Register online starting March 1st each year. Pay by Interac e-transfer or credit/debit card. Guest passes available for $5.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: 'Membership Fees',
    description: 'Family: $320 | Single Adult: $200 | Student (18-25): $100 | Junior (under 18): $50. Season runs May through October.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
    title: 'Season & Facilities',
    description: '4 hard courts (2 lit), clubhouse, free parking, wheelchair accessible courts and washrooms. Opening Day BBQ kicks off the season in May.',
  },
];

const newsItems = [
  {
    badge: 'Announcement',
    badgeColor: '#d4e157',
    badgeBg: 'rgba(212, 225, 87, 0.2)',
    title: 'Registration Opens March 1st',
    description: 'Online registration for the 2026 season opens March 1st. Early bird registrations welcome — join before Opening Day!',
    date: 'March 2026',
  },
  {
    badge: 'Newsletter',
    badgeColor: '#6b7a3d',
    badgeBg: 'rgba(107, 122, 61, 0.15)',
    title: 'Spring Newsletter',
    description: 'Court maintenance updates, new programs for the season, tournament schedule, and a welcome message from the board.',
    date: 'April 2026',
  },
  {
    badge: 'Fundraising',
    badgeColor: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.15)',
    title: 'Court Resurfacing Fund',
    description: 'Help us resurface Courts 3 & 4! Donate or participate in our fundraising events throughout the season.',
    date: 'Ongoing',
  },
];

export default function Events({ onOpenLightbox }: EventsProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'tournament', label: 'Tournaments' },
    { key: 'camp', label: 'Camps' },
    { key: 'social', label: 'Social' },
    { key: 'membership', label: 'Membership' },
    { key: 'news', label: 'News' },
  ];

  const showEvents = activeFilter === 'all' || activeFilter === 'tournament' || activeFilter === 'camp' || activeFilter === 'social';
  const showMembership = activeFilter === 'all' || activeFilter === 'membership';
  const showNews = activeFilter === 'all' || activeFilter === 'news';

  return (
    <section id="events" className="bg-gray-50 text-gray-900 py-20 lg:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="text-center mb-12 fade-in">
          <span className="section-label uppercase font-medium">// Events &amp; Programs</span>
          <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 text-gray-900">
            Mono Tennis Club — Events &amp;
            <br />
            Programs for Every Player
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 fade-in">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`filter-btn px-5 py-2 rounded-full text-sm font-medium ${
                activeFilter === f.key
                  ? 'text-white active'
                  : 'text-gray-600 bg-white border border-gray-200 hover:border-gray-400 transition-colors'
              }`}
              style={activeFilter === f.key ? { backgroundColor: '#6b7a3d' } : undefined}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event Cards */}
        {showEvents && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative mb-12" id="eventsGrid">
            {eventsData.map((event, i) => {
              const isHidden = activeFilter !== 'all' && event.category !== activeFilter;
              return (
                <div
                  key={i}
                  className={`event-card event-card-enhanced relative fade-in${isHidden ? ' hidden' : ''}`}
                  data-category={event.category}
                  style={isHidden ? { position: 'absolute' } : { position: 'relative' }}
                >
                  <div
                    className="aspect-[4/3] overflow-hidden cursor-zoom-in"
                    onClick={() => onOpenLightbox(event.image, event.alt)}
                  >
                    <img src={event.image} alt={event.alt} className="card-image w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={event.badgeStyle}>
                        {event.badge}
                      </span>
                      <span className="text-xs text-gray-400">{event.date}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Membership Info */}
        {showMembership && (
          <div className={`${showEvents && activeFilter === 'all' ? '' : 'mt-0'} mb-12`}>
            {activeFilter === 'membership' && (
              <h3 className="font-semibold text-xl mb-6 text-gray-900 fade-in">Membership Information</h3>
            )}
            <div className="grid md:grid-cols-3 gap-6 fade-in">
              {membershipCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'rgba(107, 122, 61, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {card.icon}
                    </svg>
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-gray-900">{card.title}</h4>
                  <p className="text-sm leading-relaxed text-gray-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News & Updates */}
        {showNews && (
          <div className="mb-4">
            {activeFilter === 'news' && (
              <h3 className="font-semibold text-xl mb-6 text-gray-900 fade-in">News &amp; Updates</h3>
            )}
            <div className="grid md:grid-cols-3 gap-6 fade-in">
              {newsItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: item.badgeBg, color: item.badgeColor }}
                    >
                      {item.badge}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-gray-900">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
