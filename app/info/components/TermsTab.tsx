import { useState } from 'react';
import { termsSections } from '../data';

export default function TermsTab() {
  const [activeTerms, setActiveTerms] = useState<number | null>(null);

  return (
    <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 fade-in">
          <span className="section-label">// Terms of Service</span>
          <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
            Terms &amp; Conditions
          </h2>
          <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
            Please review the following terms governing the use of Mono Tennis Club services and facilities.
          </p>
          <p className="text-xs mt-3" style={{ color: '#999' }}>Last updated: February 2026</p>
        </div>

        <div className="space-y-3 fade-in">
          {termsSections.map((section, i) => (
            <div key={i} className={`faq-item${activeTerms === i ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
              <button className="faq-question" onClick={() => setActiveTerms(activeTerms === i ? null : i)} style={{ color: '#2a2f1e' }}>
                {section.title}
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="faq-answer" style={{ maxHeight: activeTerms === i ? '300px' : '0', color: '#555' }}>
                <p>{section.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
