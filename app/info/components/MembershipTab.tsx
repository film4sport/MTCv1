import { useEffect, useState } from 'react';
import { membershipTypes } from '../data';

export default function MembershipTab() {
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mtc-current-user');
      if (stored) setExistingProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      {/* Existing Member Profile Banner */}
      {existingProfile && (
        <section className="py-8 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b7a3d', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                {existingProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-base" style={{ color: '#2a2f1e' }}>{existingProfile.name}</h4>
                <p className="text-sm" style={{ color: '#6b7266' }}>
                  {existingProfile.status === 'paused' ? 'Paused' : 'Active'} Member
                </p>
                <p className="text-xs mt-1" style={{ color: '#999' }}>{existingProfile.email}</p>
              </div>
              <a href="/dashboard" className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                Go to Dashboard
              </a>
            </div>
          </div>
        </section>
      )}

      {/* How to Join + Fees */}
      <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-in">
            <span className="section-label">// Membership</span>
            <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
              How to Join
            </h2>
            <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: '#6b7266' }}>
              Mono Tennis Club is a not-for-profit community club that has been promoting tennis in Mono since 1980. Registration opens March 1st each year for the May–October season.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 fade-in">
            <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>How to Join</h3>
              <ul className="space-y-3 text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                {['Registration opens March 1st each year', 'Pay by Interac e-transfer or credit/debit card', 'Guest passes available for $10 per visit', 'All members must sign a waiver'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl p-8" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#2a2f1e' }}>Membership Fees</h3>
              <div className="space-y-3">
                {membershipTypes.map((fee, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                    <span className="text-sm" style={{ color: '#6b7266' }}>{fee.label}</span>
                    <span className="font-semibold text-sm" style={{ color: '#4a5528' }}>${fee.price}{fee.key === 'guest' ? ' / visit' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-12 fade-in">
            <a
              href="/signup"
              className="inline-block px-10 py-4 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
            >
              Join Now
            </a>
          </div>
        </div>
      </section>

    </>
  );
}
