'use client';

interface CTABannerProps {
  onOpenBooking: () => void;
}

export default function CTABanner({ onOpenBooking }: CTABannerProps) {
  return (
    <section className="py-16 lg:py-20" style={{ backgroundColor: '#1a1f12' }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-8 fade-in rounded-2xl p-10 lg:p-14"
          style={{
            background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.25), rgba(212, 225, 87, 0.1))',
            border: '1px solid rgba(212, 225, 87, 0.15)',
          }}
        >
          <div>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl text-center md:text-left" style={{ color: '#e8e4d9' }}>
              Join Mono Tennis Club Today
            </h2>
            <p className="mt-3 text-sm text-center md:text-left" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
              Registration opens March 1st &bull; Season runs May&ndash;October
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/info"
              className="px-8 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: '#6b7a3d', color: '#e8e4d9' }}
            >
              Register Now
            </a>
            <button
              onClick={onOpenBooking}
              className="btn-primary px-8 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#d4e157', color: '#3b4229' }}
            >
              Book a Court
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
