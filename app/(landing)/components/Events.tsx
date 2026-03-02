'use client';

import { useEffect, useRef, useCallback } from 'react';

const categoryColors: Record<string, { accent: string; bg: string; text: string }> = {
  tournament: { accent: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', text: '#4a5528' },
  camp: { accent: '#d4e157', bg: 'rgba(212, 225, 87, 0.12)', text: '#3b4229' },
  coaching: { accent: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', text: '#4a5528' },
  social: { accent: '#1a1f12', bg: 'rgba(26, 31, 18, 0.05)', text: '#1a1f12' },
};

const events = [
  {
    category: 'social',
    date: 'June 7, 2026',
    title: 'French Open Round Robin Social',
    description:
      'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.',
    highlight: '1:00 - 4:00 PM',
  },
  {
    category: 'social',
    date: 'July 12, 2026',
    title: 'Wimbledon Open Round Robin',
    description:
      'Whites encouraged! Join our Wimbledon-themed round robin with mixed doubles play, strawberries & cream, and great prizes.',
    highlight: '1:00 - 4:00 PM',
  },
  {
    category: 'tournament',
    date: 'July 18-19, 2026',
    title: '95+ Mixed Doubles Tournament',
    description:
      '$180/Team — 2 Matches Guaranteed. A+B Draw, Over 95 Mixed Doubles. Includes lunches at Mono Cliffs Inn and great prizes!',
    highlight: '$180/Team',
  },
];

export default function Events() {
  const sectionRef = useRef<HTMLDivElement>(null);

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
  }, [attachTilt]);

  return (
    <section id="events" className="text-gray-900 py-20 lg:py-28" style={{ backgroundColor: '#f5f2eb' }} ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">

        {/* Section Header */}
        <div className="text-center mb-12 fade-in">
          <span className="section-label">// Featured Events</span>
          <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 text-gray-900">
            Upcoming Events
          </h2>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {events.map((event, index) => {
            const colors = categoryColors[event.category] || categoryColors.social;
            return (
              <div
                key={event.title}
                className={`tilt-card event-card rounded-2xl overflow-hidden card-hover event-card-stagger flex${events.length === 3 && index === 2 ? ' md:col-span-2 lg:col-span-1' : ''}`}
                style={{ backgroundColor: '#faf8f3', animationDelay: `${index * 100}ms`, border: '1px solid #e0dcd3' }}
                data-category={event.category}
              >
                {/* Accent stripe */}
                <div className="w-1.5 flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: colors.accent }} />

                {/* Card content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Category label + date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase" style={{ color: colors.text }}>
                      // {event.category}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#8a8578' }}>{event.date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="headline-font text-xl md:text-[1.35rem] leading-snug mb-3" style={{ color: '#1a1f12' }}>
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: '#6b7266' }}>
                    {event.description}
                  </p>

                  {/* Bottom: highlight chip + RSVP link */}
                  <div className="flex items-center justify-between">
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {event.highlight}
                    </span>
                    <a
                      href="/login"
                      className="text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ color: '#6b7a3d' }}
                    >
                      Log in to RSVP →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
