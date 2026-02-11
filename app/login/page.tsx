'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '../dashboard/lib/types';
import { CREDENTIALS } from '../dashboard/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mtc-current-user');
      if (saved && JSON.parse(saved)) {
        router.replace('/dashboard');
      }
    } catch {}
  }, [router]);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!email || !emailRegex.test(email)) {
      setEmailError(true);
      valid = false;
    }
    if (!password) {
      setPasswordError(true);
      valid = false;
    }
    if (!valid) return;

    setLoading(true);

    // Check credentials
    const entry = CREDENTIALS[email];
    let user: User;
    if (entry && entry.password === password) {
      user = { id: email.split('@')[0], name: entry.name, email, role: entry.role, memberSince: '2025-01' };
    } else {
      // Demo mode: accept any email/password as member
      user = { id: 'member', name: email.split('@')[0], email, role: 'member', memberSince: '2025-01' };
    }

    localStorage.setItem('mtc-current-user', JSON.stringify(user));

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const handleGuest = () => {
    const guest: User = { id: 'guest', name: 'Guest', email: 'guest@mtc.ca', role: 'guest', memberSince: '' };
    localStorage.setItem('mtc-current-user', JSON.stringify(guest));
    router.push('/dashboard');
  };

  return (
    <>
      <style jsx global>{`
        @font-face {
          font-family: 'Gotham Rounded';
          src: url('/Gotham_Rounded_Medium.otf') format('opentype');
          font-weight: 500;
          font-style: normal;
        }
        .headline-font {
          font-family: 'Gotham Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
        }

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
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center p-12 relative overflow-hidden" style={{ background: '#edeae3' }}>
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
          <div className="relative z-10 text-center">
            <h2 className="headline-font text-3xl xl:text-4xl mb-4" style={{ color: '#2a2f1e' }}>
              The MTC App
            </h2>
            <p className="text-base mb-12 max-w-md mx-auto" style={{ color: '#6b7266' }}>
              Live court status, book courts, find partners, and connect with members — all in one place.
            </p>

            {/* Phone Mockup */}
            <div className="relative inline-block">
              <div style={{
                width: 280, height: 580, background: '#000', borderRadius: 40, padding: 12,
                boxShadow: '0 50px 100px rgba(0,0,0,0.15), 0 0 0 2px #333', position: 'relative',
              }}>
                <div style={{
                  width: '100%', height: '100%', background: '#f0f0f0', borderRadius: 32,
                  overflow: 'hidden', position: 'relative',
                }}>
                  {/* Notch */}
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 120, height: 28, background: '#000', borderRadius: '0 0 20px 20px', zIndex: 10,
                  }} />

                  {/* Scrollable content area */}
                  <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: 56 }}>

                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '36px 12px 10px', background: '#f0f0f0', position: 'relative', zIndex: 2,
                  }}>
                    <div style={{
                      width: 28, height: 28, background: '#e0e0e0', borderRadius: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.08), -2px -2px 4px rgba(255,255,255,0.8)',
                    }}>
                      <svg width="12" height="12" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                      </svg>
                    </div>
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                      <div style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: 18, letterSpacing: 2, color: '#0a0a0a', fontWeight: 400 }}>
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
                        width: 28, height: 28, background: '#e0e0e0', borderRadius: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.08), -2px -2px 4px rgba(255,255,255,0.8)', position: 'relative',
                      }}>
                        <svg width="12" height="12" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ff5a5f', borderRadius: '50%' }} />
                      </div>
                      <div style={{
                        width: 28, height: 28, background: '#e0e0e0', borderRadius: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.08), -2px -2px 4px rgba(255,255,255,0.8)',
                      }}>
                        <svg width="12" height="12" fill="none" stroke="#444" viewBox="0 0 24 24" strokeWidth="2">
                          <line x1="3" y1="12" x2="21" y2="12"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ padding: '2px 10px 6px', position: 'relative', zIndex: 2 }}>
                    <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.65rem', letterSpacing: 1, color: '#444', marginBottom: 6 }}>QUICK ACTIONS</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {/* Book Court - Volt */}
                      <div style={{
                        background: '#c8ff00', borderRadius: 14, height: 62, padding: 10,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '3px 3px 6px rgba(0,0,0,0.08), -3px -3px 6px rgba(255,255,255,0.8)',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: 0.5, color: '#0a0a0a', fontWeight: 600 }}>BOOK COURT</p>
                      </div>
                      {/* Find Partner - Coral */}
                      <div style={{
                        background: '#ff5a5f', borderRadius: 14, height: 62, padding: 10,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '3px 3px 6px rgba(0,0,0,0.08), -3px -3px 6px rgba(255,255,255,0.8)',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: 0.5, color: '#fff', fontWeight: 600 }}>FIND PARTNER</p>
                      </div>
                      {/* Club Events - Electric Blue */}
                      <div style={{
                        background: '#00d4ff', borderRadius: 14, height: 62, padding: 10,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '3px 3px 6px rgba(0,0,0,0.08), -3px -3px 6px rgba(255,255,255,0.8)',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: 0.5, color: '#0a0a0a', fontWeight: 600 }}>CLUB EVENTS</p>
                      </div>
                      {/* My Schedule - Dark */}
                      <div style={{
                        background: '#0a0a0a', borderRadius: 14, height: 62, padding: 10,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '3px 3px 6px rgba(0,0,0,0.08), -3px -3px 6px rgba(255,255,255,0.8)',
                      }}>
                        <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: 0.5, color: '#fff', fontWeight: 600 }}>MY SCHEDULE</p>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div style={{ padding: '6px 10px 4px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: 1, color: '#444' }}>UPCOMING EVENTS</p>
                      <span style={{ fontSize: '0.45rem', color: '#0a0a0a', fontWeight: 600 }}>See All →</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {/* Opening Day BBQ */}
                      <div style={{
                        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '7px 8px',
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        <div style={{ background: '#c8ff00', borderRadius: 8, padding: '4px 6px', textAlign: 'center', minWidth: 32, flexShrink: 0 }}>
                          <div style={{ fontSize: '0.35rem', color: '#0a0a0a', fontWeight: 600, textTransform: 'uppercase' }}>May</div>
                          <div style={{ fontSize: '0.75rem', color: '#0a0a0a', fontWeight: 700, lineHeight: 1 }}>9</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.5rem', fontWeight: 600, color: '#0a0a0a' }}>Opening Day BBQ</p>
                          <p style={{ fontSize: '0.4rem', color: '#666' }}>1:00 PM &bull; All Courts &bull; Free</p>
                        </div>
                        <div style={{
                          background: '#c8ff00', borderRadius: 6, padding: '3px 7px',
                          fontSize: '0.4rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
                        }}>RSVP</div>
                      </div>
                      {/* Men's Round Robin */}
                      <div style={{
                        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '7px 8px',
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        <div style={{ background: '#c8ff00', borderRadius: 8, padding: '4px 6px', textAlign: 'center', minWidth: 32, flexShrink: 0 }}>
                          <div style={{ fontSize: '0.35rem', color: '#0a0a0a', fontWeight: 600, textTransform: 'uppercase' }}>&mdash;</div>
                          <div style={{ fontSize: '0.75rem', color: '#0a0a0a', fontWeight: 700, lineHeight: 1 }}>&mdash;</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.5rem', fontWeight: 600, color: '#0a0a0a' }}>Men&apos;s Round Robin</p>
                          <p style={{ fontSize: '0.4rem', color: '#666' }}>Tue 9:00 AM &bull; Courts 1-2</p>
                        </div>
                        <div style={{
                          background: '#c8ff00', borderRadius: 6, padding: '3px 7px',
                          fontSize: '0.4rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
                        }}>RSVP</div>
                      </div>
                      {/* Friday Night Mixed */}
                      <div style={{
                        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '7px 8px',
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        <div style={{ background: '#c8ff00', borderRadius: 8, padding: '4px 6px', textAlign: 'center', minWidth: 32, flexShrink: 0 }}>
                          <div style={{ fontSize: '0.35rem', color: '#0a0a0a', fontWeight: 600, textTransform: 'uppercase' }}>&mdash;</div>
                          <div style={{ fontSize: '0.75rem', color: '#0a0a0a', fontWeight: 700, lineHeight: 1 }}>&mdash;</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.5rem', fontWeight: 600, color: '#0a0a0a' }}>Friday Night Mixed</p>
                          <p style={{ fontSize: '0.4rem', color: '#666' }}>Fri 6:00 PM &bull; All Courts</p>
                        </div>
                        <div style={{
                          background: '#c8ff00', borderRadius: 6, padding: '3px 7px',
                          fontSize: '0.4rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
                        }}>RSVP</div>
                      </div>
                    </div>
                  </div>

                  {/* Looking for Partners */}
                  <div style={{ padding: '6px 10px 8px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <p style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: 1, color: '#444' }}>LOOKING FOR PARTNERS</p>
                      <span style={{ fontSize: '0.45rem', color: '#0a0a0a', fontWeight: 600 }}>See All →</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {/* James Park */}
                      <div style={{
                        background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '7px 8px',
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="45" fill="#8D5524"/>
                            <path d="M30 38 Q35 20 55 22 Q75 24 72 42 L68 38 Q60 30 45 32 Q35 34 30 38 Z" fill="#1a1a1a"/>
                            <rect x="28" y="36" width="44" height="6" rx="2" fill="#c8ff00"/>
                            <ellipse cx="50" cy="52" rx="22" ry="20" fill="#8D5524"/>
                            <circle cx="42" cy="50" r="3" fill="#222"/>
                            <circle cx="58" cy="50" r="3" fill="#222"/>
                            <path d="M42 60 Q50 68 58 60" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                            <path d="M30 78 Q50 72 70 78 L72 100 L28 100 Z" fill="#3BAFDA"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.5rem', fontWeight: 600, color: '#0a0a0a' }}>James Park</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <span style={{ fontSize: '0.4rem', color: '#666' }}>Today <span style={{ fontWeight: 600 }}>4PM</span></span>
                            <span style={{ fontSize: '0.35rem', fontWeight: 600, color: '#0a0a0a', background: 'rgba(200,255,0,0.3)', borderRadius: 4, padding: '1px 4px' }}>Intermediate</span>
                          </div>
                        </div>
                        <div style={{
                          background: '#c8ff00', borderRadius: 6, padding: '3px 8px',
                          fontSize: '0.4rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
                        }}>Join</div>
                      </div>
                      {/* Emily Rodriguez */}
                      <div style={{
                        background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '7px 8px',
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="45" fill="#FFE0BD"/>
                            <path d="M68 30 Q85 35 80 55 Q78 65 72 60 Q75 45 68 38 Z" fill="#8B4513"/>
                            <path d="M28 40 Q30 25 50 24 Q70 25 72 40 L68 42 Q60 32 40 34 Q32 36 28 40 Z" fill="#8B4513"/>
                            <rect x="26" y="36" width="48" height="7" rx="2" fill="#3BAFDA"/>
                            <rect x="26" y="38" width="48" height="2" fill="#fff"/>
                            <ellipse cx="50" cy="52" rx="21" ry="19" fill="#FFE0BD"/>
                            <circle cx="42" cy="50" r="2.5" fill="#333"/>
                            <circle cx="58" cy="50" r="2.5" fill="#333"/>
                            <path d="M43 59 Q50 66 57 59" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
                            <path d="M32 78 Q50 72 68 78 L70 100 L30 100 Z" fill="#3BAFDA"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.5rem', fontWeight: 600, color: '#0a0a0a' }}>Emily Rodriguez</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <span style={{ fontSize: '0.4rem', color: '#666' }}>Tomorrow <span style={{ fontWeight: 600 }}>10AM</span></span>
                            <span style={{ fontSize: '0.35rem', fontWeight: 600, color: '#fff', background: '#ff5a5f', borderRadius: 4, padding: '1px 4px' }}>Advanced</span>
                          </div>
                        </div>
                        <div style={{
                          background: '#c8ff00', borderRadius: 6, padding: '3px 8px',
                          fontSize: '0.4rem', fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
                        }}>Join</div>
                      </div>
                    </div>
                  </div>

                  </div>{/* end scrollable content */}

                  {/* Bottom Nav */}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8, right: 8,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 4px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(250,250,248,0.9) 50%, rgba(255,255,255,0.85) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 22,
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.08), 0 0 40px rgba(200,255,0,0.04)',
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
                            minWidth: 12, height: 12, background: '#ff5a5f', borderRadius: '50%',
                            fontSize: 7, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
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
              }}>Live Status</div>
              <div style={{
                position: 'absolute', bottom: '8%', left: -70,
                background: '#6b7a3d', color: '#fff', padding: '8px 16px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 10px 30px rgba(107, 122, 61, 0.3)',
                animation: 'float 3s ease-in-out infinite 2s', zIndex: 10,
              }}>Find Partners</div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-12 xl:px-20 py-8 lg:py-12">

          {/* Back Link */}
          <a href="/" className="inline-flex items-center gap-2 text-sm mb-6 lg:mb-8 transition-all hover:text-[#2a2f1e]" style={{ color: '#6b7266', textDecoration: 'none' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Home
          </a>

          {/* Mobile App Preview (mobile/tablet only) */}
          <div className="lg:hidden mb-6 rounded-2xl p-5 border" style={{ background: '#faf8f3', borderColor: '#e0dcd3' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: '#999' }}>Preview</p>
                <p className="font-semibold" style={{ color: '#2a2f1e' }}>The MTC App</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>Book</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>Stats</span>
              </div>
            </div>

            {/* Mini preview header */}
            <div className="rounded-2xl p-4 mb-3" style={{ background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/80">Good morning!</p>
                  <p className="text-white font-bold">Alex Johnson</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center relative" style={{ border: '1px solid rgba(255,255,255,0.3)' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">2</span>
                </div>
              </div>
            </div>

            {/* Mini court status */}
            <div className="rounded-xl p-3 border" style={{ background: 'white', borderColor: '#f0ede6' }}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#1f2937' }}>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Live Court Status
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-lg p-2 text-[0.65rem] border-l-[3px]" style={{ borderColor: '#ef4444', background: '#fef2f2' }}>
                  <span className="font-semibold text-gray-800">Court 1</span>
                  <p style={{ color: '#ef4444' }}>In use</p>
                </div>
                <div className="rounded-lg p-2 text-[0.65rem] border-l-[3px]" style={{ borderColor: '#22c55e', background: '#f0fdf4' }}>
                  <span className="font-semibold text-gray-800">Court 2</span>
                  <p style={{ color: '#22c55e' }}>Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logo / Welcome */}
          <div className="mb-6 lg:mb-8">
            <div className="headline-font text-2xl sm:text-3xl mb-2" style={{ color: '#6b7a3d' }}>MTC</div>
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: '#2a2f1e' }}>Welcome Back</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: '#6b7266' }}>Sign in to your Mono Tennis Club account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#2a2f1e' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-5 py-4 rounded-xl text-base transition-all focus:outline-none"
                style={{
                  background: '#fff',
                  border: emailError ? '1px solid #ef4444' : '1px solid #e0dcd3',
                  color: '#2a2f1e',
                  boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                }}
                onFocus={(e) => { if (!emailError) e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = emailError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(107,122,61,0.15)'; }}
                onBlur={(e) => { if (!emailError) { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; } }}
              />
              {emailError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Please enter a valid email address</p>}
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#2a2f1e' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-5 py-4 rounded-xl text-base transition-all focus:outline-none"
                style={{
                  background: '#fff',
                  border: passwordError ? '1px solid #ef4444' : '1px solid #e0dcd3',
                  color: '#2a2f1e',
                  boxShadow: passwordError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                }}
                onFocus={(e) => { if (!passwordError) e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = passwordError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(107,122,61,0.15)'; }}
                onBlur={(e) => { if (!passwordError) { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; } }}
              />
              {passwordError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Password is required</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#6b7266' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#6b7a3d' }}
                />
                Remember me
              </label>
              <a href="#" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-6"
              style={{
                background: '#6b7a3d',
                minHeight: 52,
                boxShadow: loading ? 'none' : undefined,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#5a6832'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(107, 122, 61, 0.25)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6b7a3d'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 rounded-xl border p-4" style={{ background: '#faf8f3', borderColor: '#e0dcd3' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#6b7266' }}>Demo Accounts</p>
            <div className="space-y-2">
              {[
                { email: 'member@mtc.ca', password: 'member123', role: 'Member', color: '#6b7a3d' },
                { email: 'coach@mtc.ca', password: 'coach123', role: 'Coach', color: '#d97706' },
                { email: 'admin@mtc.ca', password: 'admin123', role: 'Admin', color: '#dc2626' },
              ].map(cred => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword(cred.password); setEmailError(false); setPasswordError(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-black/[0.03]"
                >
                  <span className="text-xs" style={{ color: '#2a2f1e' }}>{cred.email}</span>
                  <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cred.color}15`, color: cred.color }}>{cred.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6" style={{ color: '#999', fontSize: '0.875rem' }}>
            <div className="flex-1 h-px" style={{ background: '#e0dcd3' }} />
            <span className="px-4">or</span>
            <div className="flex-1 h-px" style={{ background: '#e0dcd3' }} />
          </div>

          {/* Continue as Guest */}
          <button
            onClick={handleGuest}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-[0.9375rem] transition-all hover:bg-[#f0ede6] active:scale-[0.97]"
            style={{ background: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e', minHeight: 52 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Continue as Guest
          </button>

          {/* Register Link */}
          <p className="mt-6 lg:mt-8 text-center text-sm sm:text-base" style={{ color: '#6b7266' }}>
            Don&apos;t have an account?{' '}
            <a href="/info?tab=membership" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>
              Become a Member
            </a>
          </p>

          {/* Mobile App Download CTA (mobile only) */}
          <div className="lg:hidden mt-8 p-5 rounded-2xl text-center" style={{ background: 'rgba(107, 122, 61, 0.08)', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#6b7a3d' }}>
                <span className="text-lg" style={{ filter: 'brightness(10)' }}>📱</span>
              </div>
              <div className="text-left">
                <div className="font-semibold" style={{ color: '#2a2f1e' }}>Get the MTC App</div>
                <p className="text-xs" style={{ color: '#6b7266' }}>Live status, bookings & more</p>
              </div>
            </div>
            <a href="/dashboard" className="inline-block w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: '#6b7a3d', color: '#fff' }}>
              Open Web App
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
