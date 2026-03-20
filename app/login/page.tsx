'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { pinLogin, pinSetup, forgotPin, verifyResetCode } from '../dashboard/lib/auth';
import { APP_COPY, APP_ROUTES, CLUB_NAME, SUPPORT_EMAIL, SUPPORT_EMAIL_MAILTO } from '../lib/site';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  // Screen: 'login' | 'pinSetup' | 'forgotPin' | 'verifyCode'
  const [screen, setScreen] = useState<'login' | 'pinSetup' | 'forgotPin' | 'verifyCode'>('login');
  const [setupPin, setSetupPin] = useState('');
  const [setupPinConfirm, setSetupPinConfirm] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const appTitle = 'MTC COURT';
  const dashboardLabels = {
    home: APP_COPY.home,
    bookCourt: APP_COPY.bookCourt,
    schedule: APP_COPY.schedule,
    partners: APP_COPY.partners,
    findPartners: APP_COPY.findPartners,
    messages: APP_COPY.messages,
    settings: APP_COPY.settings,
    adminPanel: APP_COPY.adminPanel,
    clubEvents: APP_COPY.clubEvents,
  } as const;
  const dashboardLabelsUpper = {
    home: dashboardLabels.home.toUpperCase(),
    bookCourt: dashboardLabels.bookCourt.toUpperCase(),
    schedule: dashboardLabels.schedule.toUpperCase(),
    partners: dashboardLabels.partners.toUpperCase(),
    findPartners: dashboardLabels.findPartners.toUpperCase(),
    messages: dashboardLabels.messages.toUpperCase(),
    clubEvents: dashboardLabels.clubEvents.toUpperCase(),
    adminPanel: dashboardLabels.adminPanel.toUpperCase(),
  } as const;

  // Ref to persist the verified email across screen changes — immune to autofill/re-renders
  const verifiedEmailRef = useRef('');

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  // Warm up DB on page load
  useEffect(() => {
    fetch('/api/keep-alive').catch(() => {});
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes accentLineGrow {
          from { width: 0; opacity: 0; }
          to { width: 48px; opacity: 1; }
        }
        @keyframes subtleGlow {
          0%, 100% { box-shadow: 0 8px 40px rgba(107, 122, 61, 0.08), 0 1px 3px rgba(0,0,0,0.04); }
          50% { box-shadow: 0 12px 50px rgba(107, 122, 61, 0.14), 0 2px 6px rgba(0,0,0,0.06); }
        }
        .login-glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(30px) saturate(1.4);
          -webkit-backdrop-filter: blur(30px) saturate(1.4);
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 28px;
          padding: 40px 36px;
          box-shadow: 0 16px 56px rgba(0, 0, 0, 0.10), 0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
          animation: loginFadeUp 0.6s ease-out 0.15s both, subtleGlow 4s ease-in-out infinite 0.8s;
        }
        @media (max-width: 1023px) {
          .login-glass-card {
            padding: 28px 24px;
            border-radius: 24px;
          }
        }
        @keyframes titleBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .login-title-breathe {
          animation: loginFadeUp 0.5s ease-out 0.15s both, titleBreathe 4s ease-in-out infinite 0.7s;
        }
        .login-btn-google:hover {
          border-color: #6b7a3d !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 0 0 3px rgba(107, 122, 61, 0.08) !important;
          transform: translateY(-2px);
        }
        .login-right-panel::-webkit-scrollbar {
          display: none;
        }
        .login-btn-magic:hover:not(:disabled) {
          background: rgba(107,122,61,0.12) !important;
          transform: translateY(-1px);
        }
      ` }} />

      <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'linear-gradient(160deg, #ede9e0 0%, #e2dfd6 30%, #d8d5cb 60%, #e5e2d8 100%)' }}>

        {/* Left Side: App Preview (Desktop) */}
        <div className="hidden lg:flex lg:w-2/3 items-center justify-center p-6 xl:p-10 relative overflow-y-auto overflow-x-hidden" style={{ background: 'transparent' }}>
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
          <div className="relative z-10 text-center my-auto py-4" style={{ maxWidth: 780, width: '100%' }}>
            <div className="mb-5" style={{ color: '#6b7266', fontWeight: 500, textAlign: 'left' as const, display: 'inline-block' }}>
              <p className="text-base" style={{ whiteSpace: 'nowrap' as const }}>
                Book courts and lessons, find partners, and message members
              </p>
              <p className="text-base" style={{ whiteSpace: 'nowrap' as const, paddingLeft: '83%' }}>
                all in one place
              </p>
              <p className="text-base" style={{ whiteSpace: 'nowrap' as const, paddingLeft: '97%' }}>
                on any device
              </p>
            </div>

            {/* ── Device mockups — perspective showcase ── */}
            <div style={{ perspective: 1200, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 20 }}>

            {/* Row 1: Phone + Tablet */}
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-end' }}>

            {/* ── Phone Mockup ── */}
            <div style={{ textAlign: 'center' }}>
            <div style={{ width: 162, height: 333, position: 'relative' }}>
            <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <div style={{
                width: 310, height: 640, background: '#1a1f12', borderRadius: 44, padding: 10,
                boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: '100%', height: '100%', background: '#0d1208', borderRadius: 36,
                  overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' as const,
                }}>
                  {/* Dynamic Island */}
                  <div style={{
                    position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                    width: 100, height: 26, background: '#000', borderRadius: 20, zIndex: 10,
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1, overflowY: 'hidden', overflowX: 'hidden', paddingBottom: 60, textAlign: 'left' }}>

                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '40px 14px 6px',
                  }}>
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)' }}>
                        <svg width="11" height="11" fill="none" stroke="#777" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(107,91,167,0.25)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                        <svg width="11" height="11" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, color: '#e8e4d9' }}>{appTitle}</div>
                      <div style={{ height: 2.5, borderRadius: 2, background: 'linear-gradient(90deg, #c8ff00, #00d4ff, #ff5a5f, #c8ff00)', backgroundSize: '200% 100%', animation: 'accentShimmer 8s linear infinite' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'relative' }}>
                        <svg width="14" height="14" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, background: '#ff5a5f', borderRadius: '50%', fontSize: 8, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '2px solid #0d1208' }}>3</span>
                      </div>
                      <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        <svg width="14" height="14" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ padding: '6px 14px 10px' }}>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1.5, color: '#e8e4d9', marginBottom: 8 }}>QUICK ACTIONS</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {[
                        { bg: '#c8ff00', label: dashboardLabelsUpper.bookCourt, fg: '#000', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
                        { bg: '#ff5a5f', label: dashboardLabelsUpper.findPartners, fg: '#fff', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
                        { bg: '#00d4ff', label: dashboardLabelsUpper.clubEvents, fg: '#000', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
                        { bg: '#1a1a1a', label: dashboardLabelsUpper.schedule, fg: '#c8ff00', border: '1px solid rgba(200,255,0,0.2)', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                      ].map(a => (
                        <div key={a.label} style={{
                          background: a.bg, borderRadius: 18, height: 85, padding: '12px 14px',
                          display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
                          boxShadow: `0 4px 12px ${a.bg === '#1a1a1a' ? 'rgba(200,255,0,0.08)' : a.bg + '44'}`,
                          ...('border' in a ? { border: a.border } : {}),
                        }}>
                          <svg width="24" height="24" fill="none" stroke={a.fg} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: 1, color: a.fg }}>{a.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div style={{ padding: '4px 14px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1.5, color: '#e8e4d9' }}>UPCOMING EVENTS</p>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: '#c8ff00', letterSpacing: 1 }}>SEE ALL →</span>
                    </div>
                    {[
                      { month: 'MAR', day: '14', title: 'Euchre Tournament', details: 'Saturday Evening • Clubhouse' },
                      { month: 'MAY', day: '9', title: 'Opening Day BBQ', details: '1:00 PM • All Courts • Free' },
                      { month: 'MAY', day: '12', title: "Men's Round Robin", details: '9:00 AM • All Courts' },
                    ].map((evt) => (
                      <div key={evt.day + evt.month} style={{
                        background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '10px 12px', marginBottom: 8,
                        display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{ background: '#c8ff00', borderRadius: 12, padding: '6px 10px', textAlign: 'center', minWidth: 42 }}>
                          <div style={{ fontSize: 8, color: '#0a0a0a', fontWeight: 700, letterSpacing: 0.5 }}>{evt.month}</div>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#0a0a0a', lineHeight: 1 }}>{evt.day}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#e8e4d9' }}>{evt.title}</p>
                          <p style={{ fontSize: 9, color: '#777', marginTop: 2 }}>{evt.details}</p>
                        </div>
                        <span style={{ background: '#c8ff00', borderRadius: 8, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: '#0a0a0a', flexShrink: 0 }}>RSVP</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar section peeking behind nav */}
                  <div style={{ padding: '4px 14px 60px' }}>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1.5, color: '#e8e4d9', marginBottom: 6 }}>CLUB CALENDAR</p>
                    <div style={{
                      background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 16, padding: '12px', border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#e8e4d9' }}>March 2026</span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="9" height="9" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                          </div>
                          <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="9" height="9" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  </div>{/* end content */}

                  {/* Bottom Nav — liquid glass iOS style */}
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 20,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 6px',
                    background: 'rgba(13,18,8,0.45)',
                    backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}>
                    {[
                      { label: dashboardLabelsUpper.home, active: true, d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                      { label: dashboardLabelsUpper.schedule, d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    ].map(n => (
                      <div key={n.label} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, color: n.active ? '#e8e4d9' : '#666', fontSize: 7, fontWeight: 600, letterSpacing: 0.3 }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={n.d}/></svg>
                        {n.label}
                      </div>
                    ))}
                    <div style={{
                      width: 44, height: 44, marginTop: -28, background: '#c8ff00', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(200,255,0,0.4)',
                    }}>
                      <svg width="18" height="18" fill="none" stroke="#0d1208" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    {[
                      { label: dashboardLabelsUpper.partners, d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: 0 },
                      { label: dashboardLabelsUpper.messages, d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 1 },
                    ].map(n => (
                      <div key={n.label} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, color: '#666', fontSize: 7, fontWeight: 600, letterSpacing: 0.3 }}>
                        <div style={{ position: 'relative' }}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={n.d}/></svg>
                          {n.badge > 0 && <span style={{ position: 'absolute', top: -4, right: -6, minWidth: 12, height: 12, background: '#ef4444', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff', padding: '0 2px', lineHeight: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{n.badge}</span>}
                        </div>
                        {n.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>{/* end phone scale */}
            </div>{/* end phone wrapper */}
            <p className="text-xs mt-1.5" style={{ color: '#8a8578', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 400 }}>Mobile</p>
            </div>{/* end phone col */}

            {/* ── Tablet Mockup ── */}
            <div style={{ textAlign: 'center' }}>
            <div style={{ width: 304, height: 236, position: 'relative' }}>
            <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <div style={{
                width: 490, height: 380, background: '#1a1f12', borderRadius: 28, padding: 10,
                boxShadow: '0 30px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: '100%', height: '100%', background: '#f5f2eb', borderRadius: 20,
                  overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' as const,
                }}>
                  {/* Camera dot */}
                  <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, background: '#333', borderRadius: '50%', zIndex: 10 }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 18px 8px' }}>
                    <div style={{ display: 'flex', gap: 2, background: '#e8e4d9', borderRadius: 16, padding: 2, boxShadow: '2px 2px 5px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)' }}>
                      <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <svg width="9" height="9" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(88,68,150,0.12)' }}>
                        <svg width="9" height="9" fill="none" stroke="#6b5ba7" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 3, color: '#1a1f12' }}>{appTitle}</div>
                      <div style={{ height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #c8ff00, #00d4ff, #ff5a5f, #c8ff00)', backgroundSize: '200% 100%', animation: 'accentShimmer 8s linear infinite' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{ width: 26, height: 26, background: '#e8e4d9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)', position: 'relative' }}>
                        <svg width="12" height="12" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, background: '#ff3b30', borderRadius: '50%', fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1.5px solid #f5f2eb' }}>2</span>
                      </div>
                      <div style={{ width: 26, height: 26, background: '#e8e4d9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)' }}>
                        <svg width="12" height="12" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Tablet content: Quick Actions + Events on top, Calendar below */}
                  <div style={{ flex: 1, overflow: 'hidden', padding: '2px 16px 0', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {/* Top row: Quick Actions (left) + Events (right) */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {/* Left: Quick Actions 2x2 — matching phone style */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1.5, color: '#1a1f12', marginBottom: 6, textAlign: 'left' }}>QUICK ACTIONS</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                          {[
                            { bg: '#c8ff00', label: 'BOOK', fg: '#0a0a0a', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
                            { bg: '#ff5a5f', label: 'PARTNER', fg: '#fff', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></> },
                            { bg: '#00d4ff', label: 'EVENTS', fg: '#0a0a0a', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
                            { bg: '#1a1f12', label: dashboardLabelsUpper.schedule, fg: '#e8e4d9', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                          ].map(a => (
                            <div key={a.label} style={{
                              background: a.bg, borderRadius: 14, height: 62, padding: '8px 10px',
                              display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', alignItems: 'flex-start',
                              boxShadow: a.bg === '#1a1f12'
                                ? '3px 3px 8px rgba(0,0,0,0.3), -1px -1px 4px rgba(255,255,255,0.05)'
                                : `3px 3px 8px ${a.bg}33, -2px -2px 6px rgba(255,255,255,0.7)`,
                            }}>
                              <svg width="18" height="18" fill="none" stroke={a.fg} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, letterSpacing: 0.8, color: a.fg }}>{a.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Right: Events */}
                      <div style={{ flex: 1.2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1.5, color: '#1a1f12' }}>UPCOMING EVENTS</p>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 8, color: '#1a1f12', letterSpacing: 0.5 }}>SEE ALL →</span>
                        </div>
                        {[
                          { month: 'MAR', day: '14', title: 'Euchre Tournament', time: 'Sat Evening' },
                          { month: 'MAY', day: '9', title: 'Opening Day BBQ', time: '1:00 PM' },
                          { month: 'MAY', day: '12', title: "Men's Round Robin", time: '9:00 AM' },
                        ].map(evt => (
                          <div key={evt.day + evt.month} style={{
                            background: '#fff', borderRadius: 10, padding: '5px 8px', marginBottom: 4,
                            display: 'flex', alignItems: 'center', gap: 7,
                            boxShadow: '3px 3px 6px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)',
                            border: '1px solid rgba(0,0,0,0.03)',
                          }}>
                            <div style={{ background: '#c8ff00', borderRadius: 7, padding: '3px 6px', textAlign: 'center', minWidth: 28 }}>
                              <div style={{ fontSize: 5, color: '#0a0a0a', fontWeight: 700 }}>{evt.month}</div>
                              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#0a0a0a', lineHeight: 1 }}>{evt.day}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 8, fontWeight: 700, color: '#1a1f12', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                              <p style={{ fontSize: 6, color: '#888' }}>{evt.time}</p>
                            </div>
                            <span style={{ background: '#c8ff00', borderRadius: 6, padding: '3px 8px', fontSize: 7, fontWeight: 700, color: '#0a0a0a', flexShrink: 0 }}>RSVP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bottom: Club Calendar — glassmorphic container */}
                    <div style={{
                      background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 14, padding: '10px 10px 8px',
                      border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
                    }}>
                      {/* Header: month label left, nav arrows right */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#1a1f12' }}>March 2026</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <div style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.5)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                          </div>
                          <div style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.5)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                      </div>
                      {/* Weekday headers */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                          <div key={d + i} style={{ fontSize: 6, fontWeight: 700, color: '#999', textAlign: 'center' }}>{d}</div>
                        ))}
                      </div>
                      {/* Calendar grid — March 2026 starts on Sunday */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const isToday = day === 7;
                          const hasEvent = [9, 14, 21, 28].includes(day);
                          const isPast = day < 7;
                          return (
                            <div key={day} style={{
                              aspectRatio: '1', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
                              fontSize: 7, borderRadius: 5, fontWeight: isToday ? 700 : 500,
                              background: isToday ? '#00d4ff' : '#fff',
                              color: isToday ? '#0a0a0a' : isPast ? '#ccc' : '#333',
                              boxShadow: isToday
                                ? 'inset 2px 2px 4px rgba(0,180,220,0.3), inset -2px -2px 4px rgba(255,255,255,0.5)'
                                : '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.9)',
                              position: 'relative' as const,
                            }}>
                              {day}
                              {hasEvent && !isToday && (
                                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#ff5a5f', boxShadow: '0 0 3px rgba(255,90,95,0.5)' }} />
                              )}
                            </div>
                          );
                        })}
                        {/* Trailing empty cells */}
                        {Array.from({ length: 4 }, (_, i) => (
                          <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: 5 }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Nav — liquid glass (matching phone style) */}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 10, right: 10, zIndex: 20,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 6px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}>
                    {[dashboardLabelsUpper.home, dashboardLabelsUpper.schedule].map((l, i) => (
                      <div key={l} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, color: i === 0 ? '#1a1f12' : '#999', fontSize: 6, fontWeight: 600, letterSpacing: 0.3 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} /></svg>
                        {l}
                      </div>
                    ))}
                    <div style={{ width: 38, height: 38, marginTop: -22, background: '#c8ff00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(200,255,0,0.5)', border: '2px solid rgba(255,255,255,0.6)' }}>
                      <svg width="14" height="14" fill="none" stroke="#1a1f12" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    {[
                      { label: dashboardLabelsUpper.partners, d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: 0 },
                      { label: dashboardLabelsUpper.messages, d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 1 },
                    ].map(n => (
                      <div key={n.label} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, color: '#999', fontSize: 6, fontWeight: 600, letterSpacing: 0.3 }}>
                        <div style={{ position: 'relative' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={n.d} /></svg>
                          {n.badge > 0 && <span style={{ position: 'absolute', top: -3, right: -5, minWidth: 10, height: 10, background: '#ef4444', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 700, color: '#fff', padding: '0 2px', lineHeight: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{n.badge}</span>}
                        </div>
                        {n.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>{/* end tablet scale */}
            </div>{/* end tablet wrapper */}
            <p className="text-xs mt-1.5" style={{ color: '#8a8578', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 400 }}>Tablet</p>
            </div>{/* end tablet col */}

            </div>{/* end Row 1 */}

            {/* ── Row 2: Desktop Dashboard ── */}
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 720, margin: '0 auto' }}>
              {/* Desktop screen — clean browser window */}
              <div style={{
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
              }}>
                {/* Browser chrome */}
                <div style={{ display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: 140, background: '#1a1f12', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }} />
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e' }} />
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840' }} />
                  </div>
                  <div style={{ flex: 1, background: '#faf8f3', padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e0dcd3' }}>
                    <div style={{ background: '#f0ede6', borderRadius: 6, padding: '2.5px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="8" height="8" fill="none" stroke="#aaa" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <span style={{ fontSize: 8, color: '#999' }}>monotennisclub.com/dashboard</span>
                    </div>
                  </div>
                </div>
                {/* Dashboard body */}
                <div style={{ display: 'flex', height: 240, overflow: 'hidden' }}>
                  {/* Sidebar */}
                  <div style={{ width: 140, background: '#1a1f12', display: 'flex', flexDirection: 'column' as const, padding: '10px 8px', gap: 1, flexShrink: 0 }}>
                    <div style={{ padding: '2px 6px', marginBottom: 10 }}>
                      <span style={{ fontSize: 9, color: '#e8e4d9', fontWeight: 500 }}>{CLUB_NAME}</span>
                    </div>
                    {[
                      { label: dashboardLabels.home, active: true, icon: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
                      { label: dashboardLabels.bookCourt, icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
                      { label: dashboardLabels.schedule, icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                      { label: dashboardLabels.partners, icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
                      { label: dashboardLabels.clubEvents, icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
                      { label: dashboardLabels.messages, badge: 2, icon: <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
                      { label: dashboardLabels.settings, icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 7,
                        background: item.active ? 'rgba(212,225,87,0.15)' : 'transparent', position: 'relative' as const,
                      }}>
                        {item.active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 14, background: '#d4e157', borderRadius: 2 }} />}
                        <svg width="11" height="11" fill="none" stroke={item.active ? '#d4e157' : '#8a8578'} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                        <span style={{ fontSize: 8, fontWeight: item.active ? 600 : 400, color: item.active ? '#d4e157' : '#8a8578' }}>{item.label}</span>
                        {'badge' in item && <span style={{ marginLeft: 'auto', minWidth: 13, height: 13, background: '#ef4444', borderRadius: '50%', fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{item.badge}</span>}
                      </div>
                    ))}
                    <div style={{ flex: 1 }} />
                    {/* Collapse chevron */}
                    <div style={{ padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 8 }}>
                      <span style={{ fontSize: 10, color: '#8a8578' }}>{'«'}</span>
                    </div>
                  </div>
                  {/* Main content — with player silhouette bg + glassmorphism */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, position: 'relative' }}>
                    {/* Player silhouette background — matches real dashboard */}
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 0,
                      backgroundColor: '#e8e4d9',
                      backgroundImage: 'url(/tennis-silhouette-1.png)',
                      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                      backgroundBlendMode: 'multiply',
                      opacity: 0.6,
                      filter: 'sepia(1) hue-rotate(60deg) saturate(0.45) brightness(1.05)',
                    }} />
                    {/* Dashboard header bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px', background: 'rgba(250,248,243,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(224,220,211,0.7)', position: 'relative', height: 32, zIndex: 1 }}>
                      <img src="/mono-logo-transparent.png" alt="" width={24} height={24} style={{ filter: 'brightness(0.2)', width: 'auto' }} />
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 8, fontWeight: 600, color: '#2a2f1e' }}>{dashboardLabelsUpper.home}</span>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <div style={{ width: 22, height: 22, background: 'rgba(107,122,61,0.1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="11" height="11" fill="none" stroke="#1a1f12" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        </div>
                        <div style={{ position: 'relative', width: 22, height: 22, background: 'rgba(107,122,61,0.1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" fill="none" stroke="#1a1f12" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          <span style={{ position: 'absolute', top: -3, right: -3, width: 11, height: 11, background: '#d4e157', borderRadius: '50%', fontSize: 6, color: '#1a1f12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1.5px solid #faf8f3' }}>1</span>
                        </div>
                        <div style={{ width: 22, height: 22, background: 'rgba(107,122,61,0.1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="11" height="11" fill="none" stroke="#1a1f12" viewBox="0 0 24 24" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                        </div>
                      </div>
                    </div>
                    {/* Content area */}
                    <div style={{ flex: 1, padding: '10px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, position: 'relative', zIndex: 1 }}>
                      {/* Quick Actions — glass cards over player bg */}
                      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                        {[
                          { label: dashboardLabels.bookCourt, bg: 'rgba(107,122,61,0.85)', fg: '#fff', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
                          { label: dashboardLabels.schedule, bg: 'rgba(232,228,217,0.65)', fg: '#2a2f1e', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                          { label: dashboardLabels.clubEvents, bg: 'rgba(212,225,87,0.7)', fg: '#2a2f1e', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
                          { label: dashboardLabels.adminPanel, bg: 'rgba(200,209,160,0.6)', fg: '#2a2f1e', icon: <><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></> },
                        ].map(a => (
                          <div key={a.label} style={{
                            flex: 1, background: a.bg, borderRadius: 12, padding: '8px 6px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                          }}>
                            <svg width="12" height="12" fill="none" stroke={a.fg} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>{a.icon}</svg>
                            <span style={{ fontSize: 6.5, fontWeight: 600, color: a.fg, display: 'block' }}>{a.label}</span>
                          </div>
                        ))}
                      </div>
                      {/* Bookings + Events — glass cards */}
                      <div style={{ display: 'flex', gap: 6, flex: 1, minHeight: 0 }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 12, padding: '7px 8px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 7, fontWeight: 700, color: '#2a2f1e' }}>Upcoming Bookings</span>
                            <span style={{ fontSize: 5, color: '#6b7a3d' }}>View All</span>
                          </div>
                          {[
                            { mo: 'MAR', d: '4', court: 'Court 1', time: 'Wed, Mar 4 • 9:30 AM' },
                            { mo: 'MAR', d: '6', court: 'Court 1', time: 'Fri, Mar 6 • 10:00 AM' },
                          ].map(b => (
                            <div key={b.d} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, padding: '4px 5px', background: 'rgba(255,255,255,0.7)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.6)' }}>
                              <div style={{ background: '#f5f2eb', borderRadius: 6, padding: '2px 5px', textAlign: 'center', minWidth: 26 }}>
                                <div style={{ fontSize: 4, color: '#999', fontWeight: 700 }}>{b.mo}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#2a2f1e', lineHeight: 1 }}>{b.d}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: 6, fontWeight: 600, color: '#2a2f1e', display: 'block' }}>{b.court}</span>
                                <span style={{ fontSize: 5, color: '#999' }}>{b.time}</span>
                              </div>
                              <span style={{ marginLeft: 'auto', fontSize: 5, background: 'rgba(251,146,60,0.15)', color: '#ea580c', padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>Confirmed</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 12, padding: '7px 8px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 7, fontWeight: 700, color: '#2a2f1e' }}>Upcoming Events</span>
                            <span style={{ fontSize: 5, color: '#6b7a3d' }}>View All</span>
                          </div>
                          {[
                            { mo: 'MAR', d: '14', title: 'Euchre Tournament', time: 'Evening • Clubhouse', going: 12 },
                            { mo: 'MAY', d: '9', title: 'Opening Day BBQ', time: '1 PM • All Courts', going: 34 },
                            { mo: 'MAY', d: '12', title: "Men's Round Robin", time: '9 AM • Courts 1-2', going: 8 },
                          ].map((e, i) => (
                            <div key={e.d + e.mo} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: i < 2 ? 3 : 0, padding: '3px 5px', background: 'rgba(255,255,255,0.7)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.6)' }}>
                              <div style={{ background: '#f5f2eb', borderRadius: 5, padding: '1px 4px', textAlign: 'center', minWidth: 24 }}>
                                <div style={{ fontSize: 4, color: '#999', fontWeight: 700 }}>{e.mo}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#2a2f1e', lineHeight: 1 }}>{e.d}</div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 5.5, fontWeight: 600, color: '#2a2f1e', display: 'block', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                                <span style={{ fontSize: 4.5, color: '#999' }}>{e.time}</span>
                              </div>
                              <span style={{ fontSize: 4.5, background: '#6b7a3d', color: '#fff', padding: '2px 5px', borderRadius: 5, fontWeight: 600, flexShrink: 0 }}>RSVP</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* No laptop base — clean screen view */}
              <p className="text-xs mt-2" style={{ color: '#8a8578', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 400 }}>Desktop</p>
            </div>

            </div>{/* end perspective wrapper */}

          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right-panel w-full lg:w-1/3 flex flex-col px-5 sm:px-8 md:px-10 lg:px-8 xl:px-12 py-8 lg:py-10 lg:min-h-screen relative max-w-lg mx-auto lg:max-w-none lg:mx-0" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          {/* Subtle radial accent glow behind card */}
          <div className="absolute pointer-events-none" style={{ top: '20%', right: '-10%', width: '70%', height: '50%', background: 'radial-gradient(ellipse at center, rgba(107, 122, 61, 0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />

          {/* Back Link — outside card */}
          <a href={APP_ROUTES.home} className="relative z-10 inline-flex items-center gap-2 text-sm font-medium mb-5 transition-all hover:gap-3 self-start group" style={{ color: '#6b7a3d', textDecoration: 'none' }}>
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {APP_COPY.backToHome}
          </a>

          {/* Glass morphism card */}
          <div className="login-glass-card relative z-10">

          {/* Mobile App Preview — phone mockup on phone, tablet mockup on tablet */}
          {/* Phone version (< 640px) */}
          <div className="sm:hidden mb-6 flex flex-col items-center">
            <p className="text-xs mb-3" style={{ color: '#8a8578', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 400 }}>App Preview</p>
            <div style={{ width: 200, background: '#1a1f12', borderRadius: 28, padding: 6, boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)' }}>
              <div style={{ width: '100%', background: '#0d1208', borderRadius: 22, overflow: 'hidden', position: 'relative' }}>
                {/* Dynamic Island */}
                <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 60, height: 16, background: '#000', borderRadius: 10, zIndex: 10 }} />
                {/* Screen content */}
                <div style={{ padding: '28px 10px 8px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'linear-gradient(135deg, #c8ff00, #6b7a3d)', border: '1px solid rgba(200,255,0,0.3)' }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(88,68,150,0.25)', border: '1px solid rgba(88,68,150,0.2)' }} />
                    </div>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1.5, color: '#e8e4d9' }}>{appTitle}</p>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(232,228,217,0.08)' }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(232,228,217,0.08)' }} />
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, letterSpacing: 1.2, color: '#e8e4d9', marginBottom: 5 }}>QUICK ACTIONS</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                    <div style={{ background: '#c8ff00', borderRadius: 8, padding: '6px 6px 5px', height: 38 }}>
                      <svg width="10" height="10" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 7.5, letterSpacing: 0.5, color: '#0a0a0a', marginTop: 2 }}>{dashboardLabelsUpper.bookCourt}</p>
                    </div>
                    <div style={{ background: '#ff5a5f', borderRadius: 8, padding: '6px 6px 5px', height: 38 }}>
                      <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 7.5, letterSpacing: 0.5, color: '#fff', marginTop: 2 }}>{dashboardLabelsUpper.findPartners}</p>
                    </div>
                    <div style={{ background: '#00d4ff', borderRadius: 8, padding: '6px 6px 5px', height: 38 }}>
                      <svg width="10" height="10" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 7.5, letterSpacing: 0.5, color: '#0a0a0a', marginTop: 2 }}>{dashboardLabelsUpper.clubEvents}</p>
                    </div>
                    <div style={{ background: '#0a0a0a', borderRadius: 8, padding: '6px 6px 5px', height: 38 }}>
                      <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 7.5, letterSpacing: 0.5, color: '#fff', marginTop: 2 }}>{dashboardLabelsUpper.schedule}</p>
                    </div>
                  </div>
                  {/* Event preview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, letterSpacing: 1, color: '#e8e4d9' }}>UPCOMING EVENTS</p>
                    <span style={{ fontSize: 7, color: '#8a8578' }}>SEE ALL →</span>
                  </div>
                  <div style={{ background: 'rgba(232,228,217,0.06)', border: '1px solid rgba(232,228,217,0.08)', borderRadius: 8, padding: '5px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ background: '#c8ff00', borderRadius: 5, padding: '2px 4px', textAlign: 'center', minWidth: 22 }}>
                      <div style={{ fontSize: 6, color: '#0a0a0a', fontWeight: 700 }}>MAY</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: '#0a0a0a', lineHeight: 1 }}>9</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 8, fontWeight: 600, color: '#e8e4d9' }}>Opening Day BBQ</p>
                      <p style={{ fontSize: 6, color: '#8a8578' }}>1:00 PM • All Courts</p>
                    </div>
                    <div style={{ background: '#c8ff00', borderRadius: 4, padding: '2px 6px', fontSize: 6.5, fontWeight: 700, color: '#0a0a0a' }}>RSVP</div>
                  </div>
                </div>
                {/* Bottom nav */}
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 0 8px', borderTop: '1px solid rgba(232,228,217,0.06)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <svg width="10" height="10" fill="none" stroke="#e8e4d9" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    <p style={{ fontSize: 5, color: '#e8e4d9', marginTop: 1 }}>{dashboardLabelsUpper.home}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <svg width="10" height="10" fill="none" stroke="#8a8578" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <p style={{ fontSize: 5, color: '#8a8578', marginTop: 1 }}>{dashboardLabelsUpper.schedule}</p>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#c8ff00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" fill="none" stroke="#0a0a0a" viewBox="0 0 24 24" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <svg width="10" height="10" fill="none" stroke="#8a8578" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <p style={{ fontSize: 5, color: '#8a8578', marginTop: 1 }}>{dashboardLabelsUpper.partners}</p>
                  </div>
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    <svg width="10" height="10" fill="none" stroke="#8a8578" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#ff5a5f', border: '1px solid #0d1208' }} />
                    <p style={{ fontSize: 5, color: '#8a8578', marginTop: 1 }}>{dashboardLabelsUpper.messages}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet version (640px - 1024px) — same as desktop mockup, no bezel */}
          <div className="hidden sm:flex lg:hidden mb-6 flex-col items-center">
            <div style={{ width: 304, height: 224, position: 'relative' }}>
            <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <div style={{
                width: 490, height: 360, background: 'rgba(245,242,235,0.85)', borderRadius: 20,
                overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' as const,
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}>
                  {/* Camera dot */}
                  <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, background: '#333', borderRadius: '50%', zIndex: 10 }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 18px 8px' }}>
                    <div style={{ display: 'flex', gap: 2, background: '#e8e4d9', borderRadius: 16, padding: 2, boxShadow: '2px 2px 5px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)' }}>
                      <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <svg width="9" height="9" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(88,68,150,0.12)' }}>
                        <svg width="9" height="9" fill="none" stroke="#6b5ba7" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 3, color: '#1a1f12' }}>{appTitle}</div>
                      <div style={{ height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #c8ff00, #00d4ff, #ff5a5f, #c8ff00)', backgroundSize: '200% 100%', animation: 'accentShimmer 8s linear infinite' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{ width: 26, height: 26, background: '#e8e4d9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)', position: 'relative' }}>
                        <svg width="12" height="12" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, background: '#ff3b30', borderRadius: '50%', fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1.5px solid #f5f2eb' }}>2</span>
                      </div>
                      <div style={{ width: 26, height: 26, background: '#e8e4d9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)' }}>
                        <svg width="12" height="12" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Tablet content: Quick Actions + Events on top, Calendar below */}
                  <div style={{ flex: 1, overflow: 'hidden', padding: '2px 16px 0', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {/* Top row: Quick Actions (left) + Events (right) */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {/* Left: Quick Actions 2x2 */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1.5, color: '#1a1f12', marginBottom: 6, textAlign: 'left' }}>QUICK ACTIONS</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                          {[
                            { bg: '#c8ff00', label: 'BOOK', fg: '#0a0a0a', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
                            { bg: '#ff5a5f', label: 'PARTNER', fg: '#fff', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></> },
                            { bg: '#00d4ff', label: 'EVENTS', fg: '#0a0a0a', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
                            { bg: '#1a1f12', label: 'SCHEDULE', fg: '#e8e4d9', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
                          ].map(a => (
                            <div key={a.label} style={{
                              background: a.bg, borderRadius: 14, height: 62, padding: '8px 10px',
                              display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', alignItems: 'flex-start',
                              boxShadow: a.bg === '#1a1f12'
                                ? '3px 3px 8px rgba(0,0,0,0.3), -1px -1px 4px rgba(255,255,255,0.05)'
                                : `3px 3px 8px ${a.bg}33, -2px -2px 6px rgba(255,255,255,0.7)`,
                            }}>
                              <svg width="18" height="18" fill="none" stroke={a.fg} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, letterSpacing: 0.8, color: a.fg }}>{a.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Right: Events */}
                      <div style={{ flex: 1.2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1.5, color: '#1a1f12' }}>UPCOMING EVENTS</p>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 8, color: '#1a1f12', letterSpacing: 0.5 }}>SEE ALL →</span>
                        </div>
                        {[
                          { month: 'MAR', day: '14', title: 'Euchre Tournament', time: 'Sat Evening' },
                          { month: 'MAY', day: '9', title: 'Opening Day BBQ', time: '1:00 PM' },
                          { month: 'MAY', day: '12', title: "Men's Round Robin", time: '9:00 AM' },
                        ].map(evt => (
                          <div key={evt.day + evt.month} style={{
                            background: '#fff', borderRadius: 10, padding: '5px 8px', marginBottom: 4,
                            display: 'flex', alignItems: 'center', gap: 7,
                            boxShadow: '3px 3px 6px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.8)',
                            border: '1px solid rgba(0,0,0,0.03)',
                          }}>
                            <div style={{ background: '#c8ff00', borderRadius: 7, padding: '3px 6px', textAlign: 'center', minWidth: 28 }}>
                              <div style={{ fontSize: 5, color: '#0a0a0a', fontWeight: 700 }}>{evt.month}</div>
                              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#0a0a0a', lineHeight: 1 }}>{evt.day}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 8, fontWeight: 700, color: '#1a1f12', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                              <p style={{ fontSize: 6, color: '#888' }}>{evt.time}</p>
                            </div>
                            <span style={{ background: '#c8ff00', borderRadius: 6, padding: '3px 8px', fontSize: 7, fontWeight: 700, color: '#0a0a0a', flexShrink: 0 }}>RSVP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bottom: Club Calendar — glassmorphic container */}
                    <div style={{
                      background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 14, padding: '10px 10px 8px',
                      border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#1a1f12' }}>March 2026</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <div style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.5)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                          </div>
                          <div style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.5)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" fill="none" stroke="#555" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                          <div key={d + i} style={{ fontSize: 6, fontWeight: 700, color: '#999', textAlign: 'center' }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const isToday = day === 7;
                          const hasEvent = [9, 14, 21, 28].includes(day);
                          const isPast = day < 7;
                          return (
                            <div key={day} style={{
                              aspectRatio: '1', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
                              fontSize: 7, borderRadius: 5, fontWeight: isToday ? 700 : 500,
                              background: isToday ? '#00d4ff' : '#fff',
                              color: isToday ? '#0a0a0a' : isPast ? '#ccc' : '#333',
                              boxShadow: isToday
                                ? 'inset 2px 2px 4px rgba(0,180,220,0.3), inset -2px -2px 4px rgba(255,255,255,0.5)'
                                : '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.9)',
                              position: 'relative' as const,
                            }}>
                              {day}
                              {hasEvent && !isToday && (
                                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#ff5a5f', boxShadow: '0 0 3px rgba(255,90,95,0.5)' }} />
                              )}
                            </div>
                          );
                        })}
                        {Array.from({ length: 4 }, (_, i) => (
                          <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: 5 }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Nav — liquid glass (matching desktop) */}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 10, right: 10, zIndex: 20,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 6px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}>
                    {[dashboardLabelsUpper.home, dashboardLabelsUpper.schedule].map((l, i) => (
                      <div key={l} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, color: i === 0 ? '#1a1f12' : '#999', fontSize: 6, fontWeight: 600, letterSpacing: 0.3 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} /></svg>
                        {l}
                      </div>
                    ))}
                    <div style={{ width: 38, height: 38, marginTop: -22, background: '#c8ff00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(200,255,0,0.5)', border: '2px solid rgba(255,255,255,0.6)' }}>
                      <svg width="14" height="14" fill="none" stroke="#1a1f12" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    {[
                      { label: dashboardLabelsUpper.partners, d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: 0 },
                      { label: dashboardLabelsUpper.messages, d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 1 },
                    ].map(n => (
                      <div key={n.label} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, color: '#999', fontSize: 6, fontWeight: 600, letterSpacing: 0.3 }}>
                        <div style={{ position: 'relative' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={n.d} /></svg>
                          {n.badge > 0 && <span style={{ position: 'absolute', top: -3, right: -5, minWidth: 10, height: 10, background: '#ef4444', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 700, color: '#fff', padding: '0 2px', lineHeight: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{n.badge}</span>}
                        </div>
                        {n.label}
                      </div>
                    ))}
                  </div>
                </div>
            </div>{/* end tablet scale */}
            </div>{/* end tablet wrapper */}
          </div>

          {/* Logo + Welcome */}
          <div className="mb-8 lg:mb-10 text-center">
            <img
              src="/mono-logo-black.png"
              alt={CLUB_NAME}
              className="mx-auto"
              style={{ height: 72, width: 'auto', marginBottom: 14, opacity: 0.88 }}
            />
            <p className="login-title-breathe text-sm" style={{ color: '#6b7266', transformOrigin: 'center center' }}>
              Your courts, your community.
            </p>
          </div>

          {/* Sign-In Forms */}
          <div className="space-y-4 max-w-lg w-full">

            {/* PIN Login Screen */}
            {screen === 'login' && (
              <>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dcd3', background: '#fff' }}>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                    placeholder="your@email.com"
                    autoComplete="email"
                    maxLength={100}
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0 }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#6b7a3d'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#e0dcd3'; }}
                  />
                  {emailError && <p className="text-xs px-5 pt-2" style={{ color: '#ef4444' }}>Please enter a valid email address</p>}
                  <input
                    id="login-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit PIN"
                    autoComplete="one-time-code"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0, letterSpacing: '6px', fontWeight: 600 }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#6b7a3d'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#e0dcd3'; }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      // Read DOM value directly — browser autofill can bypass React onChange
                      const domEmail = (document.getElementById('login-email') as HTMLInputElement)?.value || email;
                      const domPin = (document.getElementById('login-pin') as HTMLInputElement)?.value || pin;
                      if (!domEmail || !emailRegex.test(domEmail)) {
                        setLoginError('Please enter a valid email address.');
                        setEmailError(true);
                        return;
                      }
                      if (!/^\d{4}$/.test(domPin)) {
                        setLoginError('Please enter your 4-digit PIN.');
                        return;
                      }
                      // Store in ref — immune to autofill/re-renders across screen changes
                      const cleanEmail = domEmail.trim().toLowerCase();
                      verifiedEmailRef.current = cleanEmail;
                      setEmail(domEmail);
                      setPin(domPin);
                      setLoginError('');
                      setLoading(true);
                      const result = await pinLogin(cleanEmail, domPin);
                      setLoading(false);
                      if (result.needsPinSetup) {
                        setScreen('pinSetup');
                        return;
                      }
                      if (result.error) {
                        setLoginError(result.error);
                        return;
                      }
                      if (result.user) {
                        localStorage.setItem('mtc-current-user', JSON.stringify(result.user));
                        window.location.href = APP_ROUTES.dashboard;
                      }
                    }}
                    disabled={loading}
                    className="w-full py-4 font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'rgba(107,122,61,0.06)', color: '#6b7a3d', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(107,122,61,0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(107,122,61,0.06)'; }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-[16px] h-[16px] border-2 border-[#6b7a3d]/30 border-t-[#6b7a3d] rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                        Signing in...
                      </span>
                    ) : 'Sign In'}
                  </button>
                </div>
                <div className="text-center">
                  <button type="button" onClick={() => { setLoginError(''); setScreen('forgotPin'); }} className="text-xs font-medium hover:underline" style={{ color: '#6b7a3d' }}>Forgot PIN?</button>
                </div>
              </>
            )}

            {/* PIN Setup Screen — for migrating users with no PIN */}
            {screen === 'pinSetup' && (
              <>
                <p className="text-sm text-center mb-1" style={{ color: '#6b7266' }}>Choose a 4-digit PIN to secure your account.</p>
                <p className="text-xs text-center mb-3 mx-4 leading-relaxed rounded-lg" style={{ color: '#b45309', background: 'rgba(180, 83, 9, 0.06)', padding: '6px 10px', border: '1px solid rgba(180, 83, 9, 0.12)' }}>Avoid easy PINs like 1234. Anyone who knows your email and PIN can access your profile and messages.</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dcd3', background: '#fff' }}>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="New 4-digit PIN"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0, letterSpacing: '6px', fontWeight: 600 }}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={setupPinConfirm}
                    onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Confirm PIN"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0, letterSpacing: '6px', fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!/^\d{4}$/.test(setupPin)) { setLoginError('PIN must be exactly 4 digits.'); return; }
                      if (setupPin !== setupPinConfirm) { setLoginError('PINs do not match.'); return; }
                      setLoginError('');
                      setLoading(true);
                      // Use ref (immune to autofill) — falls back to state if ref is empty
                      const setupEmail = verifiedEmailRef.current || email.trim().toLowerCase();
                      const result = await pinSetup(setupEmail, setupPin);
                      setLoading(false);
                      if (result.error) { setLoginError(result.error); return; }
                      if (result.user) {
                        localStorage.setItem('mtc-current-user', JSON.stringify(result.user));
                        window.location.href = APP_ROUTES.dashboard;
                      } else {
                        // PIN was set but no user returned — try logging in with the new PIN
                        setLoading(true);
                        const loginResult = await pinLogin(setupEmail, setupPin);
                        setLoading(false);
                        if (loginResult.user) {
                          localStorage.setItem('mtc-current-user', JSON.stringify(loginResult.user));
                          window.location.href = APP_ROUTES.dashboard;
                        } else {
                          setLoginError('PIN was set. Please sign in with your new PIN.');
                          setPin('');
                          setScreen('login');
                        }
                      }
                    }}
                    disabled={loading}
                    className="w-full py-4 font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'rgba(107,122,61,0.06)', color: '#6b7a3d', border: 'none', cursor: 'pointer' }}
                  >
                    {loading ? 'Setting PIN...' : 'Set PIN & Sign In'}
                  </button>
                </div>
                <div className="text-center">
                  <button type="button" onClick={() => { setLoginError(''); setScreen('login'); }} className="text-xs hover:underline" style={{ color: '#999' }}>Back to sign in</button>
                </div>
              </>
            )}

            {/* Forgot PIN Screen */}
            {screen === 'forgotPin' && (
              <>
                <p className="text-sm text-center mb-2" style={{ color: '#6b7266' }}>Enter your email and we&apos;ll send a 4-digit code to reset your PIN.</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dcd3', background: '#fff' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0 }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email || !emailRegex.test(email)) { setLoginError('Please enter a valid email.'); return; }
                      setLoginError('');
                      setLoading(true);
                      const result = await forgotPin(email.trim().toLowerCase());
                      setLoading(false);
                      if (result.error) { setLoginError(result.error); return; }
                      setScreen('verifyCode');
                    }}
                    disabled={loading}
                    className="w-full py-4 font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'rgba(107,122,61,0.06)', color: '#6b7a3d', border: 'none', cursor: 'pointer' }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </div>
                <div className="text-center">
                  <button type="button" onClick={() => { setLoginError(''); setScreen('login'); }} className="text-xs hover:underline" style={{ color: '#999' }}>Back to sign in</button>
                </div>
              </>
            )}

            {/* Verify Code Screen */}
            {screen === 'verifyCode' && (
              <>
                <p className="text-sm text-center mb-2" style={{ color: '#6b7266' }}>Check your email for a 4-digit code, then choose a new PIN.</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dcd3', background: '#fff' }}>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit code"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0, letterSpacing: '6px', fontWeight: 600 }}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="New 4-digit PIN"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0, letterSpacing: '6px', fontWeight: 600 }}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={newPinConfirm}
                    onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Confirm PIN"
                    className="w-full px-5 py-4 text-base text-center transition-all focus:outline-none"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #e0dcd3', color: '#2a2f1e', borderRadius: 0, letterSpacing: '6px', fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!/^\d{4}$/.test(resetCode)) { setLoginError('Enter the 4-digit code from your email.'); return; }
                      if (!/^\d{4}$/.test(newPin)) { setLoginError('PIN must be exactly 4 digits.'); return; }
                      if (newPin !== newPinConfirm) { setLoginError('PINs do not match.'); return; }
                      setLoginError('');
                      setLoading(true);
                      const result = await verifyResetCode(email.trim().toLowerCase(), resetCode, newPin);
                      setLoading(false);
                      if (result.error) { setLoginError(result.error); return; }
                      if (result.user) {
                        localStorage.setItem('mtc-current-user', JSON.stringify(result.user));
                        window.location.href = APP_ROUTES.dashboard;
                      }
                    }}
                    disabled={loading}
                    className="w-full py-4 font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'rgba(107,122,61,0.06)', color: '#6b7a3d', border: 'none', cursor: 'pointer' }}
                  >
                    {loading ? 'Resetting...' : 'Reset PIN & Sign In'}
                  </button>
                </div>
                <div className="text-center space-x-3">
                  <button type="button" onClick={() => { setLoginError(''); setScreen('forgotPin'); }} className="text-xs hover:underline" style={{ color: '#6b7a3d' }}>Resend code</button>
                  <button type="button" onClick={() => { setLoginError(''); setScreen('login'); }} className="text-xs hover:underline" style={{ color: '#999' }}>Back to sign in</button>
                </div>
              </>
            )}

          </div>

          {/* Error Display */}
          {loginError && (
            <p className="mt-4 text-sm text-center max-w-lg px-4 py-3 rounded-lg" style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
              {loginError}
            </p>
          )}

          {/* Register + Under Construction — compact footer */}
          <div className="mt-8 max-w-lg text-center">
            <p className="text-xs" style={{ color: '#8a8578' }}>
              Don&apos;t have an account?{' '}
              <a href={APP_ROUTES.signup} className="font-semibold hover:underline" style={{ color: '#6b7a3d' }}>
                {APP_COPY.becomeMember}
              </a>
            </p>
            <p className="text-xs mt-3" style={{ color: '#b0ab9f', lineHeight: 1.5 }}>
              &#x1F6A7; Still in development. Bugs? Email{' '}
              <a href={SUPPORT_EMAIL_MAILTO} style={{ color: '#6b7a3d', textDecoration: 'none', fontWeight: 600 }}>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          </div>{/* end login-glass-card */}

        </div>
      </div>
    </>
  );
}
