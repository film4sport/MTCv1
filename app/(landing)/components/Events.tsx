'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

const CDN = 'https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images';

const events = [
  {
    category: 'tournament',
    image: `${CDN}/event-mixed-doubles-tournament.jpeg`,
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
    image: `${CDN}/event-summer-camp.jpeg`,
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
    image: `${CDN}/event-social-round-robin.jpeg`,
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
  const sectionRef = useRef<HTMLDivElement>(null);

  const filters = [
    { label: 'All Events', value: 'all' },
    { label: 'Tournaments', value: 'tournament' },
    { label: 'Camps', value: 'camp' },
    { label: 'Social', value: 'social' },
  ];

  const filteredEvents = filter === 'all' ? events : events.filter((e) => e.category === filter);

  // 3D Tilt effect — re-attaches whenever filter changes (animKey)
  const attachTilt = useCallback(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll<HTMLElement>('.tilt-card');
    const handlers = new Map<HTMLElement, { move: (e: MouseEvent) => void; leave: (e: MouseEvent) => void }>();

    cards.forEach((card) => {
      const move = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      };
      const leave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      handlers.set(card, { move, leave });
    });

    return () => {
      handlers.forEach(({ move, leave }, card) => {
        card.removeEventListener('mousemove', move);
        card.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  useEffect(() => {
    const cleanup = attachTilt();
    return cleanup;
  }, [animKey, attachTilt]);

  return (
    <section id="events" className="text-gray-900 py-20 lg:py-28" style={{ backgroundColor: '#f5f2eb' }} ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">

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
              className={`event-card tilt-card rounded-2xl overflow-hidden card-hover event-card-stagger${filteredEvents.length === 3 && index === 2 ? ' md:col-span-2 lg:col-span-1' : ''}`}
              style={{ backgroundColor: '#faf8f3', animationDelay: `${index * 100}ms` }}
              data-category={event.category}
            >
              <div
                className="aspect-[4/3] overflow-hidden cursor-pointer relative"
                onClick={() => onOpenLightbox(event.image, event.title)}
              >
                <Image
                  src={event.image}
                  alt={event.alt}
                  className="card-image object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
