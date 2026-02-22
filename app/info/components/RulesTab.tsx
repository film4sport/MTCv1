import { useState, useRef } from 'react';
import { clubRules, constitutionArticles } from '../data';

export default function RulesTab() {
  const [activeConstitution, setActiveConstitution] = useState<number | null>(null);
  const articleRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const toggleConstitution = (index: number) => {
    setActiveConstitution(activeConstitution === index ? null : index);
  };

  return (
    <>
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Club Rules</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              Rules &amp; Regulations
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              All members and guests must follow these rules to ensure a safe and enjoyable experience for everyone.
            </p>
          </div>

          <div className="space-y-4 fade-in">
            {clubRules.map((rule, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-xl" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}>
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed pt-1" style={{ color: '#555' }}>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Constitution</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              Club Constitution
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              The governing document of the Mono Tennis Club, outlining its structure, purpose, and operations.
            </p>
          </div>

          <div className="space-y-3 fade-in">
            {constitutionArticles.map((article, i) => (
              <div key={i} className={`faq-item${activeConstitution === i ? ' active' : ''}`} style={{ borderColor: '#e0dcd3' }}>
                <button className="faq-question" id={`constitution-q-${i}`} aria-expanded={activeConstitution === i} aria-controls={`constitution-answer-${i}`} onClick={() => toggleConstitution(i)} style={{ color: '#2a2f1e' }}>
                  {article.title}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="faq-answer" id={`constitution-answer-${i}`} role="region" aria-labelledby={`constitution-q-${i}`} ref={(el) => { articleRefs.current[i] = el; }} style={{ maxHeight: activeConstitution === i ? `${articleRefs.current[i]?.scrollHeight || 500}px` : '0', color: '#555' }}>
                  <p>{article.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
