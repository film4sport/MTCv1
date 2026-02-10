'use client';

import { useState } from 'react';

const events = [
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
    image: 'https://i.imgur.com/551fHj1.jpeg',
    alt: 'Social Round Robin',
    badge: 'Social',
    badgeStyle: { backgroundColor: 'rgba(59, 66, 41, 0.1)', color: '#3b4229' },
    date: 'Ongoing',
    title: 'Social Round Robin',
    description:
      'Join our friendly social round robins! A great way to meet fellow members, play multiple matches, and enjoy the community atmosphere.',
  },
];

interface EventsProps {
  onOpenLightbox: (src: string, alt: string) => void;
}

export default function Events({ onOpenLightbox }: EventsProps) {
  const [filter, setFilter] = useState('all');
  const [animKey, setAnimKey] = useState(0);

  const filters = [
    { label: 'All Events', value: 'all' },
    { label: 'Tournaments', value: 'tournament' },
    { label: 'Camps', value: 'camp' },
    { label: 'Social', value: 'social' },
  ];

  const filteredEvents = filter === 'all' ? events : events.filter((e) => e.category === filter);

  return (
    <section id="events" className="text-gray-900 py-20 lg:py-28" style={{ backgroundColor: '#f5f2eb' }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">

        {/* Section Header */}
        <div className="text-center mb-12 fade-in">
          <span className="section-label">// Featured Events</span>
          <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 text-gray-900">
            Upcoming Events &amp; Tournaments
          </h2>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 fade-in">
          {filters.map((f) => (
            <button
              key={f.value}
              className={`filter-btn px-5 py-2 rounded-full text-sm font-medium transition-colors${
                filter === f.value ? ' active text-white' : ' text-gray-600 border hover:border-gray-400'
              }`}
              style={filter === f.value ? { backgroundColor: '#6b7a3d' } : { backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}
              onClick={() => { setFilter(f.value); setAnimKey(k => k + 1); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredEvents.map((event, index) => (
            <div
              key={`${event.title}-${animKey}`}
              className="event-card tilt-card rounded-2xl overflow-hidden card-hover event-card-stagger"
              style={{ backgroundColor: '#faf8f3', animationDelay: `${index * 100}ms` }}
              data-category={event.category}
            >
              <div
                className="aspect-[4/3] overflow-hidden cursor-pointer"
                onClick={() => onOpenLightbox(event.image, event.title)}
              >
                <img
                  src={event.image}
                  alt={event.alt}
                  className="card-image w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={event.badgeStyle}
                  >
                    {event.badge}
                  </span>
                  <span className="text-xs text-gray-400">{event.date}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
