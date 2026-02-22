import { useEffect, useState, useRef } from 'react';
import { faqItems } from '../data';

export default function FaqTab() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const answerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // FAQPage JSON-LD for Google rich results
  useEffect(() => {
    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld';
    script.textContent = JSON.stringify(faqJsonLd);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="fade-in-left">
            <h3 className="font-semibold text-lg mb-6" style={{ color: '#2a2f1e' }}>Frequently Asked Questions</h3>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search FAQ..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                aria-label="Search frequently asked questions"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
              />
            </div>

            {(() => {
              const filtered = faqItems.filter((item) => {
                if (!faqSearch.trim()) return true;
                const term = faqSearch.toLowerCase();
                return item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term);
              });
              if (filtered.length === 0) {
                return (
                  <p className="text-center py-8" style={{ color: '#999' }}>
                    No results found for &ldquo;{faqSearch}&rdquo;
                  </p>
                );
              }
              return filtered.map((item) => {
                const originalIndex = faqItems.indexOf(item);
                return (
                  <div key={originalIndex} className={`faq-item${activeFaq === originalIndex ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
                    <button className="faq-question" id={`faq-q-${originalIndex}`} aria-expanded={activeFaq === originalIndex} aria-controls={`faq-answer-${originalIndex}`} onClick={() => toggleFaq(originalIndex)} style={{ color: '#2a2f1e' }}>
                      {item.question}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="faq-answer" id={`faq-answer-${originalIndex}`} role="region" aria-labelledby={`faq-q-${originalIndex}`} ref={(el) => { answerRefs.current[originalIndex] = el; }} style={{ maxHeight: activeFaq === originalIndex ? `${answerRefs.current[originalIndex]?.scrollHeight || 500}px` : '0', color: '#555' }}>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="fade-in-right">
            <h3 className="font-semibold text-lg mb-6" style={{ color: '#2a2f1e' }}>Find Us</h3>
            <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-full lg:min-h-[450px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.8904!2d-80.0731!3d43.9981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882a7a2e7e8e8e8d%3A0x8e8e8e8e8e8e8e8e!2s754883%20Mono%20Centre%20Rd%2C%20Mono%2C%20ON%20L9W%206S3!5e0!3m2!1sen!2sca!4v1234567890"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" title="Mono Tennis Club Location"
              />
            </div>
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(107, 122, 61, 0.1)' }}>
              <p className="text-sm" style={{ color: '#555' }}>
                <strong style={{ color: '#2a2f1e' }}>754883 Mono Centre Road</strong>
                <br />Mono, Ontario L9W 6S3
                <br />
                <a href="mailto:info@monotennisclub.ca" className="hover:underline" style={{ color: '#6b7a3d' }}>
                  info@monotennisclub.ca
                </a>
              </p>
              <p className="text-sm mt-3 flex items-center gap-2" style={{ color: '#6b7a3d' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Just <strong>~1 hour</strong> north of Toronto — an easy drive up Highway 10</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
