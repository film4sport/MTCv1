'use client';

import { useState } from 'react';

const faqItems = [
  {
    question: 'How do I become a member?',
    answer: 'Register online starting March 1st. Membership includes court access, events, and booking privileges.',
  },
  {
    question: 'When is the club open?',
    answer: 'Late April through late October (weather permitting). Courts available dawn to dusk daily.',
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
    answer: 'Use our online booking system. Select your date/time and confirm. Book up to 7 days in advance.',
  },
  {
    question: 'Can I bring guests?',
    answer: 'Yes! Guest fees apply. Guests must be accompanied by a member and follow club rules.',
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-gray-50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="text-center mb-12 fade-in">
          <span className="section-label uppercase font-medium">// FAQ &amp; Location</span>
          <h2 className="headline-font text-3xl md:text-4xl mt-4 text-gray-900">Questions &amp; Directions</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: FAQ */}
          <div className="fade-in-left">
            <h3 className="font-semibold text-lg mb-6 text-gray-900">Frequently Asked Questions</h3>

            {faqItems.map((item, index) => (
              <div key={index} className={`faq-item${activeIndex === index ? ' active' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  {item.question}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="faq-answer"
                  style={{
                    maxHeight: activeIndex === index ? '200px' : '0',
                  }}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Google Maps */}
          <div className="fade-in-right">
            <h3 className="font-semibold text-lg mb-6 text-gray-900">Find Us</h3>
            <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-full lg:min-h-[450px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.8904!2d-80.0731!3d43.9981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882a7a2e7e8e8e8d%3A0x8e8e8e8e8e8e8e8e!2s754883%20Mono%20Centre%20Rd%2C%20Mono%2C%20ON%20L9W%206S3!5e0!3m2!1sen!2sca!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mono Tennis Club Location"
              />
            </div>
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(107, 122, 61, 0.1)' }}>
              <p className="text-sm text-gray-700">
                <strong>754883 Mono Centre Road</strong>
                <br />
                Mono, Ontario L9W 6S3
                <br />
                <a href="mailto:info@monotennisclub.ca" className="hover:underline" style={{ color: '#6b7a3d' }}>
                  info@monotennisclub.ca
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
