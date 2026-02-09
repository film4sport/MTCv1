'use client';

import { useEffect, useRef } from 'react';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenLightbox: (src: string, alt: string) => void;
}

export default function Hero({ onOpenBooking, onOpenLightbox }: HeroProps) {
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      heroContentRef.current?.classList.add('visible');
    }, 3100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      if (heroBgRef.current && scrolled < window.innerHeight) {
        heroBgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const previewImages = [
    { src: 'https://i.imgur.com/ZttBEXm.jpeg', alt: 'MTC Tennis', centered: false },
    { src: 'https://i.imgur.com/fBkdZzT.jpeg', alt: 'Mono Tennis Club Logo', centered: true },
    { src: 'https://i.imgur.com/2rgFCv4.jpeg', alt: 'MTC Tennis', centered: false },
  ];

  return (
    <section className="relative h-screen w-full overflow-hidden texture-overlay">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 parallax-bg" ref={heroBgRef}>
        <img
          src="https://i.imgur.com/PsCEmg2.png"
          alt="Tennis court aerial view"
          className="w-full h-full object-cover scale-110"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 hero-overlay"></div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-16 z-10 pt-16">
        <div className="max-w-2xl hero-content" ref={heroContentRef}>
          <h1
            className="headline-font text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.15] mb-6"
            style={{ color: '#e8e4d9' }}
          >
            <span>Welcome to</span>
            <br />
            <span>Mono Tennis Club</span>
          </h1>

          <p
            className="hero-subtext text-base md:text-[17px] mb-8 leading-relaxed max-w-lg font-light"
            style={{ color: 'rgba(232, 228, 217, 0.75)' }}
          >
            We promote the game of tennis in Mono by organizing tournaments, clinic round robins,
            competitive teams, coaching, kids camps, house leagues and more.
          </p>

          <div className="hero-buttons flex items-center gap-4 mb-10">
            <a href="#faq" className="glass-btn px-8 py-3 rounded-full text-sm font-medium">
              Join Now
            </a>
            <button
              onClick={onOpenBooking}
              className="glass-btn-solid px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              Book a Court
              <span className="glass-icon w-6 h-6 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </span>
            </button>
          </div>

          <div className="divider-line w-full max-w-2xl"></div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-8 z-10">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3 text-xs tracking-[0.2em]" style={{ color: 'rgba(232, 228, 217, 0.6)' }}>
            <span>SCROLL TO EXPLORE</span>
            <svg className="w-4 h-4 scroll-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {previewImages.map((img, i) => (
              <div
                key={i}
                className={`hero-preview-container w-32 h-20 rounded-lg overflow-hidden border-2 hero-preview-img${
                  img.centered ? ' bg-white flex items-center justify-center' : ''
                }`}
                style={{ borderColor: 'rgba(232, 228, 217, 0.25)' }}
                onClick={() => onOpenLightbox(img.src, img.alt)}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className={img.centered ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
