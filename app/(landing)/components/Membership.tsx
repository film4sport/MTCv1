'use client';

export default function Membership() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: '#1a1f12' }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">

        <div className="text-center mb-16 fade-in">
          <span className="section-label uppercase font-medium">// Membership</span>
          <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#e8e4d9' }}>
            Join the Club
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
            Mono Tennis Club is a not-for-profit community club that has been promoting tennis in Mono since 1980. Registration opens March 1st each year for the May&ndash;October season.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 fade-in">

          {/* How to Join */}
          <div className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
              <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>How to Join</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Register online starting March 1st. Pay by Interac e-transfer or credit/debit card. Guest passes available for $5.
            </p>
            <a href="/info" className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
              Register
              <svg className="w-4 h-4 learn-more-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

          {/* Season & Facilities */}
          <div className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
              <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>Season &amp; Facilities</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Season runs May through October. 4 courts, clubhouse, free parking, and accessible facilities. Opening Day BBQ kicks off the season in May.
            </p>
          </div>

          {/* News & Updates */}
          <div className="rounded-xl p-6" style={{ background: 'rgba(232, 228, 217, 0.04)', border: '1px solid rgba(232, 228, 217, 0.08)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
              <svg className="w-5 h-5" style={{ color: '#d4e157' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#e8e4d9' }}>News &amp; Updates</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Stay connected with newsletters, club announcements, tournament results, and community updates throughout the season.
            </p>
            <a href="/info" className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity" style={{ color: '#d4e157' }}>
              Club News
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
