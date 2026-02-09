'use client';

export default function About() {
  return (
    <section id="about" className="bg-white text-gray-900 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Images */}
          <div className="relative fade-in-left">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src="https://i.imgur.com/JJiiQRQ.png"
                alt="Mono Tennis Club Courts"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Decorative smaller images */}
            <div className="hidden lg:grid grid-cols-2 gap-3 mt-3">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src="https://i.imgur.com/C9D3kXQ.jpeg"
                  alt="Mono Tennis Club Opening Day"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src="https://i.imgur.com/OtUfWsL.jpeg"
                  alt="Tennis Court"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="fade-in-right">
            <span className="section-label uppercase font-medium">// About Us</span>
            <h2 className="headline-font text-3xl md:text-4xl lg:text-[2.75rem] leading-tight mt-4 mb-6 text-gray-900">
              Mono Tennis Club — Empowering Your Tennis Journey with{' '}
              <span style={{ color: '#6b7a3d' }}>Passion, Community,</span> and Dedication.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Welcome to Mono Tennis Club, a not-for-profit community tennis club located in the heart of Mono, Ontario.
              We promote the game of tennis by organizing tournaments, clinic round robins, competitive teams, coaching,
              kids camps, house leagues and more.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Whether you&apos;re a beginner picking up a racket for the first time or a seasoned player looking for
              competitive matches, Mono Tennis Club is your trusted partner in achieving your full potential and making
              lasting memories on the court.
            </p>

            {/* Amenities */}
            <div className="flex flex-wrap gap-3">
              <span
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}
              >
                Parking
              </span>
              <span
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}
              >
                Wheelchair Accessible
              </span>
              <span
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}
              >
                Clubhouse
              </span>
              <span
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}
              >
                Pro Courts
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
