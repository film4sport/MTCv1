'use client';

import { useState, useEffect, Suspense } from 'react';
import { signInWithGoogle, signInWithMagicLink } from '../dashboard/lib/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bebas Neue font is preloaded in login/layout.tsx — no client-side injection needed

  // Warm up Supabase on page load so login doesn't wait for cold start.
  // Hits both the server-side keep-alive (warms DB + Auth via API route)
  // and Supabase Auth directly from the client (warms GoTrue connection).
  useEffect(() => {
    fetch('/api/keep-alive').catch(() => {});
    // Direct client-side auth warm-up — getSession is lightweight and
    // establishes the connection to Supabase Auth so signInWithPassword is fast
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().catch(() => {});
    }).catch(() => {});
  }, []);

  // No auto-redirect — always show login page so users can see it

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  const [loginError, setLoginError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  return (
    <>
      <style jsx global>{`
        @keyframes accentShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: '#f5f2eb' }}>

        {/* Left Side: App Preview (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 items-start justify-center p-12 relative overflow-y-auto overflow-x-hidden" style={{ background: '#edeae3' }}>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]">
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a2f1e" strokeWidth="1"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)"/>
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center my-auto py-8">
            <h2 className="headline-font text-3xl xl:text-4xl mb-4 login-app-title" style={{ color: '#2a2f1e' }}>
              MTC Court App
            </h2>
            <p className="text-base mb-12 max-w-md mx-auto" style={{ color: '#6b7266' }}>
              Book courts and lessons, find partners, and message members — all in one place.
            </p>

            {/* Phone Mockup */}
            <div className="relative inline-block">
              <div style={{
                width: 300, height: 640, background: '#000', borderRadius: 40, padding: 12,
                boxShadow: '0 50px 100px rgba(0,0,0,0.15), 0 0 0 2px #333', position: 'relative',
              }}>
                <div style={{
                  width: '100%', height: '100%', background: '#f0f0f0', borderRadius: 32,
                  overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' as const,
                }}>
                  {/* Notch */}
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 120, height: 28, background: '#000', borderRadius: '0 0 20px 20px', zIndex: 10,
                  }} />

                  {/* Scrollable content area */}
                  <div style={{ height: '100%', overflowY: 'hidden', overflowX: 'hidden', paddingBottom: 56, textAlign: 'left' }}>

                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '36px 12px 8px', background: '#f0f0f0', position: 'relative', zIndex: 2,
                  }}>
                    {/* Theme toggle pill */}
                    <div style={{ display: 'flex', gap: 2, background: '#e8e8e8', borderRadius: 20, padding: 3, boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.8)' }}>
                      <div style={{ width: 22, height: 22, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <svg width="10" height="10" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" fill="none" stroke="#999" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                      <div style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: 18, letterSpacing: 2, color: '#0a0a0a', fontWeight: 400, whiteSpace: 'nowrap' as const }}>
                        MTC <span style={{ color: '#0a0a0a' }}>COURT</span>
                      </div>
                      <div style={{
                        height: 2.5, marginTop: 1, borderRadius: 2,
                        background: 'linear-gradient(90deg, #c8ff00, #00d4ff, #ff5a5f, #c8ff00)',
                        backgroundSize: '200% 100%', animation: 'accentShimmer 8s linear infinite',
                      }} />
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{
                        width: 28, height: 28, background: '#e8e8e8', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.8)', position: 'relative',
                      }}>
                        <svg width="13" height="13" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span style={{ position: 'absolute', top: 0, right: -1, minWidth: 13, height: 13, background: '#ff5a5f', borderRadius: '50%', fontSize: 7, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1.5px solid #f0f0f0' }}>3</span>
                      </div>
                      <div style={{
                        width: 28, height: 28, background: '#e8e8e8', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.8)',
                      }}>
                        <svg width="13" height="13" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2">
                          <line x1="3" y1="12" x2="21" y2="12"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ padding: '4px 12px 8px', position: 'relative', zIndex: 2 }}>
                    <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.92rem', letterSpacing: 1, color: '#0a0a0a', marginBottom: 6, fontWeight: 400, textAlign: 'left' }}>QUICK ACTIONS</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
                      {/* Book Court - Volt */}
                      <div style={{
                        background: '#c8ff00', borderRadius: 16, height: 80, padding: '10px 12px',
                        display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(200,255,0,0.2)',
                      }}>
                        <svg width="22" height="22" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.9rem', letterSpacing: 0.8, color: '#0a0a0a', fontWeight: 400 }}>BOOK COURT</p>
                      </div>
                      {/* Find Partner - Coral */}
                      <div style={{
                        background: '#ff5a5f', borderRadius: 16, height: 80, padding: '10px 12px',
                        display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(255,90,95,0.2)',
                      }}>
                        <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.9rem', letterSpacing: 0.8, color: '#fff', fontWeight: 400 }}>FIND PARTNER</p>
                      </div>
                      {/* Club Events - Electric Blue */}
                      <div style={{
                        background: '#00d4ff', borderRadius: 16, height: 80, padding: '10px 12px',
                        display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,212,255,0.2)',
                      }}>
                        <svg width="22" height="22" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.9rem', letterSpacing: 0.8, color: '#0a0a0a', fontWeight: 400 }}>CLUB EVENTS</p>
                      </div>
                      {/* My Schedule - Dark */}
                      <div style={{
                        background: '#0a0a0a', borderRadius: 16, height: 80, padding: '10px 12px',
                        display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}>
                        <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.9rem', letterSpacing: 0.8, color: '#fff', fontWeight: 400 }}>MY SCHEDULE</p>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div style={{ padding: '6px 12px 8px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.92rem', letterSpacing: 1, color: '#0a0a0a', fontWeight: 400 }}>UPCOMING EVENTS</p>
                      <span style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', color: '#0a0a0a', fontWeight: 400, letterSpacing: 0.8 }}>SEE ALL →</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {[
                        { month: 'MAY', day: '9', title: 'Opening Day BBQ', details: '1:00 PM • All Courts • Free' },
                        { month: 'MAY', day: '12', title: "Men's Round Robin", details: 'Tue 9:00 AM • Courts 1-2' },
                        { month: 'MAY', day: '15', title: 'Friday Night Mixed', details: 'Fri 6:00 PM • All Courts' },
                      ].map((evt) => (
                        <div key={evt.day} style={{
                          background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                          border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '10px 10px',
                          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}>
                          <div style={{ background: '#c8ff00', borderRadius: 10, padding: '5px 8px', textAlign: 'center', minWidth: 38, flexShrink: 0 }}>
                            <div style={{ fontSize: '0.48rem', color: '#0a0a0a', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{evt.month}</div>
                            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.0rem', color: '#0a0a0a', fontWeight: 400, lineHeight: 1 }}>{evt.day}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0a0a0a' }}>{evt.title}</p>
                            <p style={{ fontSize: '0.5rem', color: '#666', marginTop: 2 }}>{evt.details}</p>
                          </div>
                          <div style={{ background: '#c8ff00', borderRadius: 8, padding: '6px 14px', fontSize: '0.58rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0 }}>RSVP</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Looking for Partners */}
                  <div style={{ padding: '4px 12px 12px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.92rem', letterSpacing: 1, color: '#0a0a0a', fontWeight: 400 }}>LOOKING FOR PARTNERS</p>
                      <span style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', color: '#0a0a0a', fontWeight: 400, letterSpacing: 0.8 }}>SEE ALL →</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {/* Partner preview 1 */}
                      <div style={{
                        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                        border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 10,
                        display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f5e6d0', border: '2px solid #ff5a5f' }}>
                          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="50" fill="#f5e6d0"/><circle cx="50" cy="38" r="16" fill="#d4a574"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#4a90d9"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>Sarah M.</p>
                          <span style={{ fontSize: '0.46rem', color: '#666', textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: 2 }}>Saturday 10AM</span>
                          <span style={{ fontSize: '0.42rem', fontWeight: 700, color: '#0a0a0a', background: '#c8ff00', borderRadius: 6, padding: '1px 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Intermediate</span>
                        </div>
                        <div style={{ background: '#ff5a5f', borderRadius: 8, padding: '5px 12px', fontSize: '0.54rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>Join</div>
                      </div>
                      {/* Partner preview 2 */}
                      <div style={{
                        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                        border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 10,
                        display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#fce4ec', border: '2px solid #ff5a5f' }}>
                          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="50" fill="#fce4ec"/><circle cx="50" cy="38" r="16" fill="#d4a574"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#e91e63"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>James K.</p>
                          <span style={{ fontSize: '0.46rem', color: '#666', textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: 2 }}>Tomorrow 9AM</span>
                          <span style={{ fontSize: '0.42rem', fontWeight: 700, color: '#fff', background: '#00d4ff', borderRadius: 6, padding: '1px 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Beginner</span>
                        </div>
                        <div style={{ background: '#ff5a5f', borderRadius: 8, padding: '5px 12px', fontSize: '0.54rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>Join</div>
                      </div>
                    </div>
                  </div>

                  </div>{/* end scrollable content */}

                  {/* Bottom Nav */}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 20,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 4px',
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 22,
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                  }}>
                    {[
                      { label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
                      { label: 'Schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        color: item.active ? '#0a0a0a' : '#666', fontSize: '0.45rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.3, padding: '4px 6px', borderRadius: 10,
                        background: item.active ? 'rgba(200,255,0,0.18)' : 'transparent',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        {item.label}
                      </div>
                    ))}
                    {/* Center Book button */}
                    <div style={{
                      width: 44, height: 44, marginTop: -28, background: '#c8ff00', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(200,255,0,0.5), 0 0 24px rgba(200,255,0,0.2)', color: '#0a0a0a',
                    }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    {[
                      { label: 'Partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                      { label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 2 },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        color: '#666', fontSize: '0.45rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.3, padding: '4px 6px', borderRadius: 10, position: 'relative',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        {'badge' in item && (
                          <span style={{
                            position: 'absolute', top: -2, right: '50%', transform: 'translateX(10px)',
                            minWidth: 12, height: 12, background: '#00d4ff', borderRadius: '50%',
                            fontSize: 7, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                          }}>{item.badge}</span>
                        )}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div style={{
                position: 'absolute', top: '28%', left: -60,
                background: '#6b7a3d', color: '#fff', padding: '8px 16px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 10px 30px rgba(107, 122, 61, 0.3)',
                animation: 'float 3s ease-in-out infinite', zIndex: 10,
              }}>Book Courts</div>
              <div style={{
                position: 'absolute', top: '45%', right: -70,
                background: '#6b7a3d', color: '#fff', padding: '8px 16px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 10px 30px rgba(107, 122, 61, 0.3)',
                animation: 'float 3s ease-in-out infinite 1s', zIndex: 10,
              }}>Club Events</div>
              <div style={{
                position: 'absolute', bottom: '8%', left: -70,
                background: '#6b7a3d', color: '#fff', padding: '8px 16px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 10px 30px rgba(107, 122, 61, 0.3)',
                animation: 'float 3s ease-in-out infinite 2s', zIndex: 10,
              }}>Find Partners</div>
            </div>

            {/* iPad Mockup */}
            <div className="mt-10">
              <div style={{
                width: 480, height: 350, background: '#000', borderRadius: 24, padding: 10,
                boxShadow: '0 40px 80px rgba(0,0,0,0.12), 0 0 0 2px #333', position: 'relative',
                margin: '0 auto',
              }}>
                <div style={{
                  width: '100%', height: '100%', background: '#f0f0f0', borderRadius: 18,
                  overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' as const,
                }}>
                  {/* Camera dot */}
                  <div style={{
                    position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                    width: 8, height: 8, background: '#333', borderRadius: '50%', zIndex: 10,
                  }} />

                  {/* iPad Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 16px 6px', background: '#f0f0f0', position: 'relative', zIndex: 2,
                  }}>
                    <div style={{ display: 'flex', gap: 2, background: '#e8e8e8', borderRadius: 16, padding: 2 }}>
                      <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <svg width="8" height="8" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="8" height="8" fill="none" stroke="#999" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: 15, letterSpacing: 2, color: '#0a0a0a', fontWeight: 400 }}>
                        MTC <span style={{ color: '#0a0a0a' }}>COURT</span>
                      </div>
                      <div style={{
                        height: 2, marginTop: 1, borderRadius: 2,
                        background: 'linear-gradient(90deg, #c8ff00, #00d4ff, #ff5a5f, #c8ff00)',
                        backgroundSize: '200% 100%', animation: 'accentShimmer 8s linear infinite',
                      }} />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div style={{ width: 24, height: 24, background: '#e8e8e8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="11" height="11" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </div>
                      <div style={{ width: 24, height: 24, background: '#e8e8e8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="11" height="11" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* iPad Content - Landscape layout */}
                  <div style={{ flex: 1, overflow: 'hidden', padding: '4px 12px 0' }}>
                    {/* Top row: Quick Actions + Events side by side */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      {/* Left: Quick Actions */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.72rem', letterSpacing: 1, color: '#0a0a0a', marginBottom: 6, fontWeight: 400 }}>QUICK ACTIONS</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                          <div style={{ background: '#c8ff00', borderRadius: 12, height: 66, padding: '8px 9px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                            <svg width="16" height="16" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.62rem', letterSpacing: 0.6, color: '#0a0a0a', fontWeight: 400 }}>BOOK COURT</p>
                          </div>
                          <div style={{ background: '#ff5a5f', borderRadius: 12, height: 66, padding: '8px 9px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                            <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.62rem', letterSpacing: 0.6, color: '#fff', fontWeight: 400 }}>FIND PARTNER</p>
                          </div>
                          <div style={{ background: '#00d4ff', borderRadius: 12, height: 66, padding: '8px 9px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                            <svg width="16" height="16" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.62rem', letterSpacing: 0.6, color: '#0a0a0a', fontWeight: 400 }}>CLUB EVENTS</p>
                          </div>
                          <div style={{ background: '#0a0a0a', borderRadius: 12, height: 66, padding: '8px 9px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                            <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.62rem', letterSpacing: 0.6, color: '#fff', fontWeight: 400 }}>MY SCHEDULE</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: 3 Events */}
                      <div style={{ flex: 1.2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.72rem', letterSpacing: 1, color: '#0a0a0a', fontWeight: 400 }}>UPCOMING EVENTS</p>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.42rem', color: '#0a0a0a', letterSpacing: 0.6 }}>SEE ALL →</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                          {[
                            { month: 'MAY', day: '9', title: 'Opening Day BBQ', time: '1:00 PM' },
                            { month: 'MAY', day: '12', title: "Men's Round Robin", time: '9:00 AM' },
                            { month: 'JUN', day: '7', title: 'French Open Social', time: '1:00 PM' },
                          ].map((evt) => (
                            <div key={`${evt.month}-${evt.day}`} style={{
                              background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.06)',
                              borderRadius: 10, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              <div style={{ background: '#c8ff00', borderRadius: 7, padding: '4px 7px', textAlign: 'center', minWidth: 34 }}>
                                <div style={{ fontSize: '0.36rem', color: '#0a0a0a', fontWeight: 700, textTransform: 'uppercase' as const }}>{evt.month}</div>
                                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.78rem', color: '#0a0a0a', lineHeight: 1 }}>{evt.day}</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.52rem', fontWeight: 700, color: '#0a0a0a' }}>{evt.title}</p>
                                <p style={{ fontSize: '0.4rem', color: '#666' }}>{evt.time}</p>
                              </div>
                              <div style={{ background: '#c8ff00', borderRadius: 6, padding: '3px 10px', fontSize: '0.42rem', fontWeight: 700, color: '#0a0a0a' }}>RSVP</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Looking for Partners — full width */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.72rem', letterSpacing: 1, color: '#0a0a0a', fontWeight: 400 }}>LOOKING FOR PARTNERS</p>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.42rem', color: '#0a0a0a', letterSpacing: 0.6 }}>SEE ALL →</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { name: 'Sarah M.', time: 'Saturday 10AM', level: 'Intermediate', levelColor: '#c8ff00', levelTextColor: '#0a0a0a', avatarBg: '#f5e6d0', avatarHair: '#d4a030', avatarShirt: '#4a90d9', borderColor: '#ff5a5f' },
                          { name: 'James K.', time: 'Tomorrow 9AM', level: 'Beginner', levelColor: '#00d4ff', levelTextColor: '#fff', avatarBg: '#e8d5c4', avatarHair: '#8B4513', avatarShirt: '#2d8659', borderColor: '#c8ff00' },
                          { name: 'Lisa T.', time: 'Friday 6PM', level: 'Advanced', levelColor: '#ff5a5f', levelTextColor: '#fff', avatarBg: '#fce4ec', avatarHair: '#d4a574', avatarShirt: '#e91e63', borderColor: '#00d4ff' },
                        ].map((p) => (
                          <div key={p.name} style={{
                            flex: 1, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '6px 8px',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: p.avatarBg, border: `2px solid ${p.borderColor}` }}>
                              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                                <circle cx="50" cy="50" r="50" fill={p.avatarBg}/><circle cx="50" cy="38" r="16" fill={p.avatarHair}/><ellipse cx="50" cy="80" rx="24" ry="20" fill={p.avatarShirt}/>
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.48rem', fontWeight: 700, color: '#0a0a0a', marginBottom: 1 }}>{p.name}</p>
                              <span style={{ fontSize: '0.36rem', color: '#666', textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: 1 }}>{p.time}</span>
                              <span style={{ fontSize: '0.34rem', fontWeight: 700, color: p.levelTextColor, background: p.levelColor, borderRadius: 5, padding: '1px 5px', textTransform: 'uppercase' as const, letterSpacing: 0.3 }}>{p.level}</span>
                            </div>
                            <div style={{ background: '#ff5a5f', borderRadius: 6, padding: '3px 8px', fontSize: '0.4rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>Join</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Nav — matches phone mockup liquid glass style */}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 20,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 4px',
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 22,
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                  }}>
                    {[
                      { label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
                      { label: 'Schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        color: item.active ? '#0a0a0a' : '#666', fontSize: '0.38rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.3, padding: '4px 6px', borderRadius: 10,
                        background: item.active ? 'rgba(200,255,0,0.18)' : 'transparent',
                      }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        {item.label}
                      </div>
                    ))}
                    {/* Center Book button */}
                    <div style={{
                      width: 38, height: 38, marginTop: -22, background: '#c8ff00', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(200,255,0,0.5), 0 0 24px rgba(200,255,0,0.2)', color: '#0a0a0a',
                    }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    {[
                      { label: 'Partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                      { label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        color: '#666', fontSize: '0.38rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.3, padding: '4px 6px', borderRadius: 10,
                      }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                        </svg>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm mt-4 font-medium" style={{ color: '#8a8578' }}>
                iPad / Tablet Version
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col px-6 sm:px-8 md:px-16 lg:px-16 xl:px-24 py-8 lg:py-10 animate-slideUp lg:overflow-y-auto lg:min-h-screen">

          {/* Back Link */}
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-8 lg:mb-10 px-4 py-2 rounded-full transition-all hover:scale-105 self-start" style={{ color: '#2a2f1e', textDecoration: 'none', background: 'rgba(107, 122, 61, 0.1)', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Home
          </a>

          {/* Mobile App Preview (mobile/tablet only) */}
          <div className="lg:hidden mb-6 rounded-2xl p-4 border overflow-hidden" style={{ background: '#f0f0f0', borderColor: '#e0dcd3' }}>
            <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: '#999' }}>App Preview</p>
            {/* Quick Actions mini grid */}
            <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: 15, letterSpacing: 1, color: '#0a0a0a', marginBottom: 6 }}>QUICK ACTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 10 }}>
              <div style={{ background: '#c8ff00', borderRadius: 12, padding: '8px 10px', height: 56, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                <svg width="16" height="16" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 0.8, color: '#0a0a0a' }}>BOOK COURT</p>
              </div>
              <div style={{ background: '#ff5a5f', borderRadius: 12, padding: '8px 10px', height: 56, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 0.8, color: '#fff' }}>FIND PARTNER</p>
              </div>
              <div style={{ background: '#00d4ff', borderRadius: 12, padding: '8px 10px', height: 56, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                <svg width="16" height="16" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 0.8, color: '#0a0a0a' }}>CLUB EVENTS</p>
              </div>
              <div style={{ background: '#0a0a0a', borderRadius: 12, padding: '8px 10px', height: 56, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 0.8, color: '#fff' }}>MY SCHEDULE</p>
              </div>
            </div>
            {/* One event preview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, color: '#0a0a0a' }}>UPCOMING EVENTS</p>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: '#0a0a0a', letterSpacing: 0.8 }}>SEE ALL →</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#c8ff00', borderRadius: 8, padding: '4px 6px', textAlign: 'center', minWidth: 34 }}>
                <div style={{ fontSize: 9, color: '#0a0a0a', fontWeight: 700 }}>MAY</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: '#0a0a0a', lineHeight: 1 }}>9</div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#0a0a0a' }}>Opening Day BBQ</p>
                <p style={{ fontSize: 9, color: '#666' }}>1:00 PM • All Courts • Free</p>
              </div>
              <div style={{ background: '#c8ff00', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#0a0a0a' }}>RSVP</div>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8 lg:mb-12">
            <h1 className="headline-font text-3xl sm:text-4xl lg:text-[2.75rem]" style={{ color: '#2a2f1e' }}>Sign in to your Mono Tennis Club acct</h1>
          </div>

          {/* Sign-In Options: Google + Magic Link */}
          <div className="space-y-5 max-w-lg">
            {/* Google Sign-In (primary) */}
            <button
              type="button"
              onClick={async () => {
                setLoginError('');
                const { error } = await signInWithGoogle();
                if (error) setLoginError(error);
              }}
              className="w-full py-5 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5 active:scale-[0.97] flex items-center justify-center gap-3"
              style={{ background: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e', minHeight: 56 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: '#e0dcd3' }} />
              <span className="text-xs font-medium" style={{ color: '#999' }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#e0dcd3' }} />
            </div>

            {/* Magic Link: email input + button */}
            <div>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#6b7266' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  maxLength={100}
                  className="w-full pl-12 pr-5 py-5 rounded-xl text-base transition-all focus:outline-none"
                  style={{
                    background: '#fff',
                    border: emailError ? '1px solid #ef4444' : '1px solid #e0dcd3',
                    color: '#2a2f1e',
                    boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                  }}
                  onFocus={(e) => { if (!emailError) e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = emailError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(107,122,61,0.15)'; }}
                  onBlur={(e) => { if (!emailError) { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; } }}
                />
              </div>
              {emailError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Please enter a valid email address</p>}
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!email || !emailRegex.test(email)) {
                  setLoginError('Enter your email to receive a sign-in link.');
                  setEmailError(true);
                  return;
                }
                setLoginError('');
                setLoading(true);
                const { error } = await signInWithMagicLink(email.trim().toLowerCase());
                setLoading(false);
                if (error) {
                  setLoginError(error);
                } else {
                  setLoginError('');
                  setMagicLinkSent(true);
                }
              }}
              disabled={loading}
              className="w-full py-5 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5 active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#6b7a3d', color: '#fff', minHeight: 56 }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#5a6832'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(107, 122, 61, 0.25)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6b7a3d'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                  Sending link...
                </span>
              ) : 'Sign in with Email Link'}
            </button>
          </div>

          {/* Error Display */}
          {loginError && (
            <p className="mt-4 text-sm text-center max-w-lg px-4 py-3 rounded-lg" style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
              {loginError}
            </p>
          )}

          {/* Register Link */}
          <p className="mt-8 lg:mt-10 text-center text-sm sm:text-base max-w-lg" style={{ color: '#6b7266' }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>
              Become a Member
            </a>
          </p>

          {/* Club Tasks — admin reminders checklist */}
          <div className="mt-8 rounded-2xl p-5 sm:p-6" style={{ background: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>Club Tasks</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                { done: true, text: 'Open sun shades on courts 1-4' },
                { done: true, text: 'Check net tension & height' },
                { done: false, text: 'Sweep clay off hard courts' },
                { done: false, text: 'Restock ball hopper by court 2' },
                { done: false, text: 'Post weekend tournament draw' },
              ].map((task, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: task.done ? 'none' : '1.5px solid #c5c0b6',
                    background: task.done ? '#6b7a3d' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {task.done && (
                      <svg width="11" height="11" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm" style={{ color: task.done ? '#999' : '#2a2f1e', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs mt-3" style={{ color: '#999' }}>Visible to admins after sign in</p>
          </div>

          {/* Magic Link Sent — Full overlay */}
          {magicLinkSent && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(26, 31, 18, 0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => setMagicLinkSent(false)}
            >
              <div
                className="rounded-2xl p-8 sm:p-10 text-center max-w-sm w-full mx-4 animate-slideUp"
                style={{ background: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Email icon */}
                <div className="mx-auto mb-5 flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(107, 122, 61, 0.12)' }}>
                  <svg width="32" height="32" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="headline-font text-xl sm:text-2xl mb-2" style={{ color: '#2a2f1e' }}>Check Your Email</h2>
                <p className="text-sm sm:text-base mb-1" style={{ color: '#6b7266' }}>
                  We sent a sign-in link to
                </p>
                <p className="text-sm sm:text-base font-semibold mb-5" style={{ color: '#2a2f1e' }}>{email}</p>
                <p className="text-xs" style={{ color: '#999' }}>Click the link in your email to sign in. Check your spam folder if you don&apos;t see it.</p>
                <button
                  type="button"
                  onClick={() => setMagicLinkSent(false)}
                  className="mt-6 text-sm font-medium hover:underline"
                  style={{ color: '#6b7a3d' }}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
