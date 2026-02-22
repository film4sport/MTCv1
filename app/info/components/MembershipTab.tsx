import { useEffect, useState } from 'react';
import { membershipTypes } from '../data';

export default function MembershipTab() {
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mtc-current-user');
      if (stored) setExistingProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      {/* Existing Member Profile Banner */}
      {existingProfile && (
        <section className="py-8 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b7a3d', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                {existingProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-base" style={{ color: '#2a2f1e' }}>{existingProfile.name}</h4>
                <p className="text-sm" style={{ color: '#6b7266' }}>
                  {existingProfile.status === 'paused' ? 'Paused' : 'Active'} Member
                </p>
                <p className="text-xs mt-1" style={{ color: '#999' }}>{existingProfile.email}</p>
              </div>
              <a href="/dashboard" className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                Go to Dashboard
              </a>
            </div>
          </div>
        </section>
      )}

      {/* How to Join + Fees */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Membership</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              How to Join
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Mono Tennis Club is a not-for-profit community club that has been promoting tennis in Mono since 1980. Registration opens March 1st each year for the May–October season.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 fade-in">
            <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>How to Join</h3>
              <ul className="space-y-3 text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                {['Registration opens March 1st each year', 'Pay by Interac e-transfer or credit/debit card', 'Guest passes available for $10 per visit', 'All members must sign a waiver'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>Membership Fees</h3>
              <div className="space-y-3">
                {membershipTypes.map((fee, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                    <span className="text-sm" style={{ color: '#6b7266' }}>{fee.label}</span>
                    <span className="font-semibold text-sm" style={{ color: '#4a5528' }}>${fee.price}{fee.key === 'guest' ? ' / visit' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-12 fade-in">
            <a
              href="/signup"
              className="inline-block px-10 py-4 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
            >
              Join Now
            </a>
          </div>
        </div>
      </section>

      {/* Season & Facilities */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Facilities</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
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
              <div key={i} className="rounded-xl p-6 text-center" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                  <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h4 className="font-bold mb-2" style={{ color: '#2a2f1e' }}>{item.title}</h4>
                <p className="text-sm" style={{ color: '#6b7266' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl p-8 fade-in" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1" style={{ color: '#2a2f1e' }}>Location</h4>
                <address className="not-italic text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                  754883 Mono Centre Road, Mono, Ontario, L9W 6S3
                </address>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// News</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              News &amp; Updates
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 fade-in">
            {[
              { badge: 'Announcement', date: 'March 2026', title: 'Registration Opens March 1st', desc: 'The 2026 season registration opens on March 1st. Pay online via Interac e-transfer or credit/debit card. Early bird discounts may apply.' },
              { badge: 'Newsletter', date: 'April 2026', title: 'Spring Newsletter', desc: 'Get the latest updates on the upcoming season, new programs, coaching staff changes, and social events planned for the summer.' },
              { badge: 'Fundraiser', date: 'Ongoing', title: 'Court Resurfacing Fund', desc: 'Help us maintain and improve our courts. Donations go toward resurfacing and upgrading our facilities for future seasons.' },
            ].map((news, i) => (
              <div key={i} className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}>
                    {news.badge}
                  </span>
                  <span className="text-xs" style={{ color: '#999' }}>{news.date}</span>
                </div>
                <h3 className="font-bold text-lg mb-3" style={{ color: '#2a2f1e' }}>{news.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>{news.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
