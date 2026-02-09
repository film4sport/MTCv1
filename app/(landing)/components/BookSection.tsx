'use client';

import { useEffect, useRef } from 'react';

interface BookSectionProps {
  onOpenBooking: () => void;
}

export default function BookSection({ onOpenBooking }: BookSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
      title: 'Easy Booking',
      desc: 'Online reservation system',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      title: 'Flexible Hours',
      desc: 'Dawn to dusk access',
    },
    {
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      ),
      title: 'Great Location',
      desc: '754883 Mono Centre Rd',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      ),
      title: 'Community',
      desc: 'Welcoming all skill levels',
    },
  ];

  return (
    <section id="book" className="relative py-20 lg:py-28 overflow-hidden texture-overlay" ref={sectionRef}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://i.imgur.com/N2XH9K4.png"
          alt="Tennis Court"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="fade-in-left">
            <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: '#d4e157' }}>
              // Book a Court
            </span>
            <h2
              className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6"
              style={{ color: '#e8e4d9' }}
            >
              Reserve Your Court
              <br />
              Time Today
            </h2>
            <p className="leading-relaxed mb-8 font-light" style={{ color: 'rgba(232, 228, 217, 0.75)' }}>
              Members can easily book court time online. View availability, reserve your preferred time slots, and manage your bookings all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="btn-primary px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: '#d4e157', color: '#3b4229' }}
              >
                Book Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <a
                href="#faq"
                className="px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgba(107, 122, 61, 0.7)', color: '#e8e4d9' }}
              >
                Join Membership
              </a>
            </div>
          </div>

          {/* Right: Info Cards */}
          <div className="grid grid-cols-2 gap-4 fade-in-right">
            {cards.map((card) => (
              <div
                key={card.title}
                className="tilt-card glass-card bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 225, 87, 0.2)' }}
                >
                  <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h4 className="font-semibold mb-1" style={{ color: '#e8e4d9' }}>
                  {card.title}
                </h4>
                <p className="text-sm" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
