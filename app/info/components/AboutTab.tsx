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
              { name: 'Jan Howard', role: 'Treasurer' },
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
