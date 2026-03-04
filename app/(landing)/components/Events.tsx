'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allCardEvents, eventFilters, type MTCEvent } from '../../lib/events';

const categoryColors: Record<string, { accent: string; bg: string; text: string }> = {
  tournament: { accent: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', text: '#4a5528' },
  camp: { accent: '#d4e157', bg: 'rgba(212, 225, 87, 0.12)', text: '#3b4229' },
  coaching: { accent: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', text: '#4a5528' },
  social: { accent: '#1a1f12', bg: 'rgba(26, 31, 18, 0.05)', text: '#1a1f12' },
};

// Use shared event data
const events = allCardEvents;
const filters = eventFilters;

function EventCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden flex" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
      <div className="w-1.5 flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: '#e0dcd3' }} />
      <div className="p-6 flex-1 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded" style={{ backgroundColor: '#e8e4d9' }} />
          <div className="h-3 w-24 rounded" style={{ backgroundColor: '#e8e4d9' }} />
        </div>
        <div className="h-5 w-3/4 rounded" style={{ backgroundColor: '#e8e4d9' }} />
        <div className="h-3 w-full rounded" style={{ backgroundColor: '#e8e4d9' }} />
        <div className="h-3 w-5/6 rounded" style={{ backgroundColor: '#e8e4d9' }} />
        <div className="flex justify-between mt-auto pt-2">
          <div className="h-7 w-20 rounded-lg" style={{ backgroundColor: '#e8e4d9' }} />
          <div className="h-4 w-24 rounded" style={{ backgroundColor: '#e8e4d9' }} />
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [filter, setFilter] = useState('all');
  const [animKey, setAnimKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(
    () => filter === 'all' ? events : events.filter(e => e.category === filter),
    [filter]
  );
  const upcoming = useMemo(
    () => filtered
      .filter(e => e.isoDate >= today)
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
      .slice(0, 3),
    [filtered, today]
  );

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
            Upcoming Events
          </h2>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 fade-in">
          {filters.map((f) => (
            <button
              key={f.value}
              aria-pressed={filter === f.value}
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" aria-live="polite" aria-atomic="false">
          {!mounted && (
            <>{[0, 1, 2].map(i => <EventCardSkeleton key={i} />)}</>
          )}
          {mounted && upcoming.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12">
              <p className="text-base" style={{ color: '#8a8578' }}>
                No upcoming {filter === 'all' ? '' : filter} events right now — check back soon!
              </p>
            </div>
          )}
          {mounted && upcoming.map((event, index) => {
            const colors = categoryColors[event.category] || categoryColors.social;
            return (
              <div
                key={`${event.title}-${animKey}`}
                className={`tilt-card event-card rounded-2xl overflow-hidden card-hover event-card-stagger flex${upcoming.length === 3 && index === 2 ? ' md:col-span-2 lg:col-span-1' : ''}`}
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

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mt-12 fade-in">
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: '#6b7a3d' }}
          >
            Book a Court
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
          <a
            href="/info?tab=coaching"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold border transition-transform hover:scale-105"
            style={{ color: '#6b7a3d', borderColor: '#6b7a3d' }}
          >
            View Coaching Programs
          </a>
        </div>

      </div>
    </section>
  );
}
