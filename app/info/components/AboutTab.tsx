import Image from 'next/image';

export default function AboutTab() {
  return (
    <>
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative fade-in-left">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden relative">
                <Image src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/gallery-05-serve.png" alt="Tennis serve at Mono Tennis Club" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-3 mt-3">
                <div className="aspect-video rounded-lg overflow-hidden relative">
                  <Image src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/gallery-01-community.jpeg" alt="Mono Tennis Club Community" fill className="object-cover" sizes="25vw" />
                </div>
                <div className="aspect-video rounded-lg overflow-hidden relative">
                  <Image src="https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images/MTC%20logo.jpg" alt="Mono Tennis Club Logo" fill className="object-cover" sizes="25vw" />
                </div>
              </div>
            </div>

            <div className="fade-in-right">
              <span className="section-label">// About Us</span>
              <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6" style={{ color: '#2a2f1e' }}>
                Mono Tennis Club — Empowering Your Tennis Journey with{' '}
                <span style={{ color: '#6b7a3d' }}>Passion, Community,</span> and Dedication.
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: '#6b7266' }}>
                Welcome to Mono Tennis Club, a not-for-profit community tennis club located in the heart of Mono, Ontario.
                We promote the game of tennis by organizing tournaments, clinic round robins, competitive teams, coaching,
                kids camps, house leagues and more.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: '#6b7266' }}>
                Whether you&apos;re a beginner picking up a racket for the first time or a seasoned player looking for
                competitive matches, Mono Tennis Club is your trusted partner in achieving your full potential and making
                lasting memories on the court.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Parking', 'Wheelchair Accessible', 'Clubhouse', 'Pro Courts'].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
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
                  754483 Mono Centre Rd, Mono, Ontario, L9W 5W9
                </address>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section id="news" className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// News</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              News &amp; Updates
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 fade-in">
            {[
              { badge: 'Announcement', date: 'March 2026', title: 'Registration Opens March 1st', desc: 'The 2026 season registration opens on March 1st. Pay online via Interac e-transfer. Early bird discounts may apply.' },
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

      {/* Board of Directors */}
      <section className="py-12 lg:py-16 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-7xl mx-auto fade-in">
          <div className="text-center mb-8">
            <span className="section-label">// Leadership</span>
            <h2 className="headline-font text-2xl md:text-3xl leading-tight mt-3" style={{ color: '#2a2f1e' }}>
              Board of Directors
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'Patti Powell', role: 'President' },
              { name: 'Peter Gibson', role: 'Past President' },
              { name: 'Lisa Conrad', role: 'Treasurer' },
              { name: 'Kelly Kamstra-Lloyd', role: 'Member at Large' },
              { name: 'Patrick Minshall', role: 'Member at Large' },
              { name: 'Phil Primmer', role: 'Member at Large' },
              { name: 'Michael Horton', role: 'Member at Large' },
            ].map((member) => (
              <div key={member.name} className="rounded-xl p-4 text-center" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>{member.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b7266' }}>{member.role}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-4" style={{ color: '#999' }}>
            Vice-President and Secretary positions are currently open.
          </p>
        </div>
      </section>
    </>
  );
}
