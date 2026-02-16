'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface GalleryProps {
  onOpenLightbox: (src: string, alt: string) => void;
}

const CDN = 'https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images';

const slides = [
  { src: `${CDN}/gallery-01-community.jpeg`, alt: 'MTC Community' },
  { src: `${CDN}/gallery-02-doubles-match.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-03-court-action.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-04-players-net.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-05-serve.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-06-group-photo.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-07-rally.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-08-court-overview.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-09-warmup.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-10-forehand.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-11-celebration.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-12-clubhouse.png`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-13-backhand.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-14-sunset-court.jpeg`, alt: 'MTC Tennis' },
  { src: `${CDN}/gallery-15-team-spirit.jpeg`, alt: 'MTC Tennis' },
];

export default function Gallery({ onOpenLightbox }: GalleryProps) {
  // Shuffle slides on each page load so the gallery starts differently every time
  const shuffledSlides = useMemo(() => {
    const arr = [...slides];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  // Responsive: how many slides visible at once
  const [slidesPerView, setSlidesPerView] = useState(4);

  useEffect(() => {
    const updateSlidesPerView = () => {
      if (window.innerWidth < 640) setSlidesPerView(2);
      else if (window.innerWidth < 1024) setSlidesPerView(3);
      else setSlidesPerView(4);
    };
    updateSlidesPerView();
    window.addEventListener('resize', updateSlidesPerView);
    return () => window.removeEventListener('resize', updateSlidesPerView);
  }, []);

  const maxSlide = Math.max(0, shuffledSlides.length - slidesPerView);
  const totalDots = maxSlide + 1;

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxSlide));
      setCurrentSlide(clamped);
    },
    [maxSlide]
  );

  useEffect(() => {
    if (trackRef.current) {
      const slideWidth = 100 / slidesPerView;
      const gap = 1; // 1rem gap
      trackRef.current.style.transform = `translateX(calc(-${currentSlide * slideWidth}% - ${currentSlide * gap}rem))`;
    }
  }, [currentSlide, slidesPerView]);

  // Touch/swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToSlide(currentSlide + 1);
      else goToSlide(currentSlide - 1);
    }
  };

  // Fade-in observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Subtle parallax on heading
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !headingRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const offset = ((sectionCenter - viewportCenter) / windowHeight) * 20;
      headingRef.current.style.transform = `translateY(${offset}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="gallery" className="py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: '#edeae3' }} ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="text-center mb-12 fade-in">
          <div ref={headingRef} style={{ willChange: 'transform' }}>
            <span className="section-label">// Gallery</span>
            <h2 className="headline-font text-3xl md:text-4xl mt-4 text-gray-900">Life at Mono Tennis Club</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Capturing the moments that make our community special
            </p>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="gallery-carousel fade-in"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Nav Buttons */}
          <button className="gallery-nav prev" onClick={() => goToSlide(currentSlide - 1)} aria-label="Previous">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="gallery-nav next" onClick={() => goToSlide(currentSlide + 1)} aria-label="Next">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Track */}
          <div className="gallery-track" ref={trackRef}>
            {shuffledSlides.map((slide, i) => (
              <div key={i} className="gallery-slide" onClick={() => onOpenLightbox(slide.src, slide.alt)}>
                <img src={slide.src} alt={slide.alt} loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="gallery-dots">
          {Array.from({ length: totalDots }, (_, i) => (
            <button
              key={i}
              className={`gallery-dot${i === currentSlide ? ' active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
