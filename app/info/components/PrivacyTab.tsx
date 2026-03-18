import { useState } from 'react';
import { privacySections } from '../data';

export default function PrivacyTab() {
  const [activePrivacy, setActivePrivacy] = useState<number | null>(null);

  return (
    <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 fade-in">
          <span className="section-label">// Privacy Policy</span>
          <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
            Your Privacy Matters
          </h2>
          <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
            Mono Tennis Club is committed to protecting your personal information in accordance with PIPEDA.
          </p>
          <p className="text-xs mt-3" style={{ color: '#999' }}>Last updated: February 2026</p>
        </div>

        <div className="space-y-3 fade-in">
          {privacySections.map((section, i) => (
            <div key={i} className={`faq-item${activePrivacy === i ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
              <button className="faq-question" onClick={() => setActivePrivacy(activePrivacy === i ? null : i)} style={{ color: '#2a2f1e' }}>
                {section.title}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="faq-answer" style={{ maxHeight: activePrivacy === i ? '300px' : '0', color: '#555' }}>
                <p>{section.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
