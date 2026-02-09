'use client';

export default function WhatWeOffer() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: '#1a1f12' }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">

        <div className="text-center mb-16 fade-in">
          <span className="section-label uppercase font-medium">// What We Offer</span>
          <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#e8e4d9' }}>
            Play, Learn, Connect
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
            Mono Tennis Club welcomes all members, no matter your skill, age or experience. We promote the game of tennis through coaching, competitive play, and community events.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">

          {/* Lessons */}
          <div className="fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
              <svg className="w-6 h-6" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-4" style={{ color: '#e8e4d9' }}>Lessons</h3>
            <p className="leading-relaxed mb-6" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Take your game to the next level with lessons taught by our experienced coaches. Programs for all ages and skill levels.
            </p>
            <a href="#events" className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
              Learn More
              <svg className="w-4 h-4 learn-more-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

          {/* Programs */}
          <div className="fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
              <svg className="w-6 h-6" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-4" style={{ color: '#e8e4d9' }}>Programs</h3>
            <p className="leading-relaxed mb-6" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Play with fellow members through organized house leagues, round robins, and competitive interclub teams.
            </p>
            <a href="#events" className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
              Learn More
              <svg className="w-4 h-4 learn-more-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

          {/* Events */}
          <div className="fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
              <svg className="w-6 h-6" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-4" style={{ color: '#e8e4d9' }}>Events</h3>
            <p className="leading-relaxed mb-6" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Have fun and connect with fellow members at our socials, tournaments, BBQs, and community events all season long.
            </p>
            <a href="#events" className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
              Learn More
              <svg className="w-4 h-4 learn-more-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
