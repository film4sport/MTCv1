'use client';

import { useState, useEffect, useRef } from 'react';

const faqItems = [
  {
    question: 'How do I become a member?',
    answer:
      'Register online starting March 1st each year. Membership includes court access, events, and booking privileges. Pay by Interac e-transfer or credit/debit card.',
  },
  {
    question: 'When is the club open?',
    answer:
      'Late April through late October (weather permitting). Courts available dawn to dusk daily.',
  },
  {
    question: 'Do I need my own equipment?',
    answer:
      'Bring your own racquet and balls. Wear proper tennis shoes (non-marking soles). Clubhouse has water and washroom facilities.',
  },
  {
    question: 'Programs for beginners?',
    answer:
      'Absolutely! Social round robins are perfect for beginners. We also offer coaching programs and clinics.',
  },
  {
    question: 'How do I book a court?',
    answer:
      'Use the booking system on this site — select your date, court, and time, then confirm. Book up to 7 days in advance.',
  },
  {
    question: 'Can I bring guests?',
    answer:
      'Yes! Guest fees apply ($5). Guests must be accompanied by a member and follow club rules.',
  },
];

export default function FAQ() {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="faq" className="bg-gray-50 py-20 lg:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="text-center mb-12 fade-in">
          <span className="section-label uppercase font-medium">// FAQ &amp; Location</span>
          <h2 className="headline-font text-3xl md:text-4xl mt-4 text-gray-900">Questions &amp; Directions</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: FAQ */}
          <div className="fade-in-left">
            <h3 className="font-semibold text-lg mb-6 text-gray-900">Frequently Asked Questions</h3>

            {faqItems.map((item, i) => (
              <div key={i} className={`faq-item${openItem === i ? ' active' : ''}`}>
                <button className="faq-question" onClick={() => setOpenItem(openItem === i ? null : i)}>
                  {item.question}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Google Maps */}
          <div id="directions" className="fade-in-right flex flex-col">
            <h3 className="font-semibold text-lg mb-6 text-gray-900">Find Us</h3>
            <div className="rounded-2xl overflow-hidden shadow-lg flex-1" style={{ minHeight: 350 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.5!2d-80.073!3d43.998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882a7a2f91c9a7d7%3A0x5c6a6c8e7b8a9d0e!2s754883%20Mono%20Centre%20Rd%2C%20Mono%2C%20ON%20L9W%206S3%2C%20Canada!5e0!3m2!1sen!2sca!4v1706000000000"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 350 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 p-4 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(107, 122, 61, 0.1)' }}>
              <p className="text-sm text-gray-700">
                <strong className="block">754883 Mono Centre Road</strong>
                <span className="block">Mono, Ontario L9W 6S3</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
