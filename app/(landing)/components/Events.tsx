'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const categoryColors: Record<string, { accent: string; bg: string; text: string }> = {
  tournament: { accent: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', text: '#4a5528' },
  camp: { accent: '#d4e157', bg: 'rgba(212, 225, 87, 0.12)', text: '#3b4229' },
  coaching: { accent: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', text: '#4a5528' },
  social: { accent: '#1a1f12', bg: 'rgba(26, 31, 18, 0.05)', text: '#1a1f12' },
};

const events = [
  {
    category: 'coaching',
    isoDate: '2026-03-08',
    date: 'March 1 - 22, 2026',
    title: 'Beginner Group Clinic',
    description:
      '4-week beginner clinic with Coach Mark Taylor. Covers grips, strokes, footwork, and match play basics. Saturdays 10:00 AM on Court 3.',
    highlight: '$120 · 4 Weeks',
  },
  {
    category: 'coaching',
    isoDate: '2026-05-10',
    date: 'Season 2026',
    title: 'Private & Group Lessons',
    description:
      'Book private or group lessons with Coach Mark Taylor. All ages and skill levels. Contact the club to schedule your sessions.',
    highlight: 'Contact to Book',
  },
  {
    category: 'social',
    isoDate: '2026-03-14',
    date: 'March 14, 2026',
    title: 'Euchre Tournament',
    description:
      'Pre-season Euchre tournament! Open to members and guests. Prizes for top teams. Come kick off the new season.',
    highlight: 'Evening',
  },
  {
    category: 'social',
    isoDate: '2026-05-09',
    date: 'May 9, 2026',
    title: 'Opening Day BBQ & Round Robin',
    description:
      'Kick off the 2026 season! BBQ, music, and meet our coaching staff including Mark Taylor. All members, families, and guests welcome.',
    highlight: '12:30 - 3:00 PM',
  },
  {
    category: 'social',
    isoDate: '2026-05-12',
    date: 'Every Tuesday · Starts May 12',
    title: "Men's Round Robin",
    description:
      "Weekly men's round robin every Tuesday morning. All skill levels welcome. Courts 1-2.",
    highlight: '9:00 - 11:00 AM',
  },
  {
    category: 'social',
    isoDate: '2026-05-14',
    date: 'Every Thursday · Starts May 14',
    title: 'Freedom 55 League',
    description:
      'Thursday morning league for the 55+ crowd. Fun and social tennis. Courts 1-2.',
    highlight: '9:00 - 11:00 AM',
  },
  {
    category: 'social',
    isoDate: '2026-05-15',
    date: 'Every Friday · Starts May 15',
    title: "Ladies Round Robin",
    description:
      "Weekly ladies round robin every Friday morning. All skill levels welcome. Courts 1-2.",
    highlight: '9:00 - 11:00 AM',
  },
  {
    category: 'social',
    isoDate: '2026-05-15',
    date: 'Every Friday · Starts May 15',
    title: 'Friday Night Mixed Round Robin',
    description:
      'Mixed doubles round robin every Friday evening. Rotating partners, fun format! All Courts.',
    highlight: '6:00 - 9:00 PM',
  },
  {
    category: 'social',
    isoDate: '2026-06-07',
    date: 'June 7, 2026',
    title: 'French Open Round Robin Social',
    description:
      'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.',
    highlight: '1:00 - 4:00 PM',
  },
  {
    category: 'camp',
    isoDate: '2026-07-01',
    date: 'Summer 2026 · Dates TBA',
    title: 'Junior Summer Camp',
    description:
      'Intensive camp for juniors aged 8-14 with Mark Taylor. Daily drills, match play, fitness, and fun activities. All skill levels. Exact dates coming soon!',
    highlight: 'Ages 8-14 · TBA',
  },
  {
    category: 'social',
    isoDate: '2026-07-12',
    date: 'July 12, 2026',
    title: 'Wimbledon Open Round Robin',
    description:
      'Whites encouraged! Join our Wimbledon-themed round robin with mixed doubles play, strawberries & cream, and great prizes.',
    highlight: '1:00 - 4:00 PM',
  },
  {
    category: 'tournament',
    isoDate: '2026-07-18',
    date: 'July 18-19, 2026',
    title: '95+ Mixed Doubles Tournament',
    description:
      '$180/Team — 2 Matches Guaranteed. A+B Draw, Over 95 Mixed Doubles. Includes lunches at Mono Cliffs Inn and great prizes!',
    highlight: '$180/Team',
  },
];

const filters = [
  { label: 'All Events', value: 'all' },
  { label: 'Tournaments', value: 'tournament' },
  { label: 'Camps', value: 'camp' },
  { label: 'Coaching', value: 'coaching' },
  { label: 'Social', value: 'social' },
];

export default function Events() {
  const [filter, setFilter] = useState('all');
  const [animKey, setAnimKey] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter);
  const upcoming = filtered
    .filter(e => e.isoDate >= today)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
    .slice(0, 3);

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {upcoming.map((event, index) => {
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

      </div>
    </section>
  );
}
