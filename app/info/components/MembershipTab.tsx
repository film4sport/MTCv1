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

      {/* ─── Membership: features + fees side by side ─── */}
      <section className="py-12 lg:py-16 px-6 lg:px-16 animate-fadeIn" style={{ backgroundColor: '#edeae3' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="section-label">// Membership</span>
            <h2 className="headline-font text-2xl md:text-3xl leading-tight mt-4" style={{ color: '#2a2f1e' }}>
              Why Join Mono Tennis Club
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left — 4 feature cards in 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                  title: 'Bookings',
                  desc: 'Reserve courts on any device',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
                  title: 'Messaging',
                  desc: 'Message members and interclub teammates',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
                  title: 'Partners',
                  desc: 'Match with members by level for singles, doubles & mixed',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
                  title: 'Programs',
                  desc: 'Coaching for juniors, teens & adults',
                },
              ].map((b, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: '#6b7a3d' }}>
                    <svg style={{ color: '#fff', width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{b.icon}</svg>
                  </div>
                  <h4 className="font-semibold text-sm mb-0.5" style={{ color: '#2a2f1e' }}>{b.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7266' }}>{b.desc}</p>
                </div>
              ))}
            </div>

            {/* Right — fees */}
            <div className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: '#2a2f1e' }}>Membership Fees</h3>
              <div className="space-y-3">
                {membershipTypes.map((fee, i) => (
                  <div key={i} className="flex items-center justify-between py-3" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                    <div>
                      <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{fee.label}</span>
                      {fee.desc && <p className="text-xs mt-0.5" style={{ color: '#999' }}>{fee.desc}</p>}
                    </div>
                    <span className="font-semibold text-sm flex-shrink-0 ml-4" style={{ color: '#4a5528' }}>${fee.price}{fee.key === 'guest' ? ' / visit' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg"
              style={{ background: '#6b7a3d', color: '#fff' }}
            >
              Join Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
