'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, resetPassword, updatePassword, signInWithGoogle } from '../dashboard/lib/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset mode
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetUpdateError, setResetUpdateError] = useState('');
  const [resetUpdateLoading, setResetUpdateLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Detect recovery mode or error from URL
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setResetMode(true);
    }
    if (searchParams.get('error') === 'expired_link') {
      setLoginError('Your reset link has expired. Please request a new one.');
    }
    // Also detect recovery from hash fragment (Supabase implicit grant flow)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setResetMode(true);
      }
    }
  }, [searchParams]);

  // Restore remembered email on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mtc-remember-email');
      if (saved) { setEmail(saved); setRememberMe(true); }
      // Clean up legacy password storage (never store passwords client-side)
      localStorage.removeItem('mtc-remember-pwd');
    } catch { /* ignore */ }
  }, []);

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Cooldown timer for password reset rate limiting
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setTimeout(() => setResetCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);

  // Focus trap for forgot password modal
  useEffect(() => {
    if (!showForgotPassword || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>('input, button, a, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) focusable[0].focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowForgotPassword(false); return; }
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForgotPassword, resetSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    setLoginError('');

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
    setLoginError('');

    const user = await signIn(email.trim().toLowerCase(), password);
    if (!user) {
      setLoginError('Invalid email or password');
      setPasswordError(true);
      setLoading(false);
      return;
    }

    // Cache user in localStorage for instant hydration
    localStorage.setItem('mtc-current-user', JSON.stringify(user));

    // Remember email only if checked (never store passwords client-side)
    if (rememberMe) {
      localStorage.setItem('mtc-remember-email', email.trim().toLowerCase());
    } else {
      localStorage.removeItem('mtc-remember-email');
    }
    localStorage.removeItem('mtc-remember-pwd'); // Clean up legacy password storage

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

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
                          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>Member</p>
                          <span style={{ fontSize: '0.46rem', color: '#666', textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: 2 }}>This Weekend</span>
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
                            <circle cx="50" cy="50" r="50" fill="#fce4ec"/><circle cx="50" cy="38" r="16" fill="#f5c6a0"/><ellipse cx="50" cy="28" rx="18" ry="10" fill="#d4a030"/><ellipse cx="50" cy="80" rx="24" ry="20" fill="#e91e63"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>Member</p>
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
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-12 xl:px-20 py-8 lg:py-12 animate-slideUp">

          {/* Back Link */}
          <a href="/" className="inline-flex items-center gap-2 text-sm mb-6 lg:mb-8 transition-all hover:text-[#2a2f1e]" style={{ color: '#6b7266', textDecoration: 'none' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Password Reset Mode */}
          {resetMode ? (
            <div>
              <div className="mb-6 lg:mb-8">
                <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: '#2a2f1e' }}>
                  {resetSuccess ? 'Password Updated!' : 'Set New Password'}
                </h1>
                <p className="mt-2 text-sm sm:text-base" style={{ color: '#6b7266' }}>
                  {resetSuccess ? 'You can now sign in with your new password.' : 'Enter your new password below.'}
                </p>
              </div>

              {resetSuccess ? (
                <button
                  onClick={() => { setResetMode(false); setPassword(''); setResetSuccess(false); }}
                  className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all hover:-translate-y-0.5"
                  style={{ background: '#6b7a3d' }}
                >
                  Sign In
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reset-new-password" className="block text-sm mb-2" style={{ color: '#2a2f1e' }}>New Password</label>
                    <div className="relative">
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setResetUpdateError(''); }}
                        placeholder="Min. 8 chars, uppercase, lowercase & number"
                        maxLength={128}
                        autoComplete="new-password"
                        className="w-full px-5 py-4 pr-12 rounded-xl text-base transition-all focus:outline-none"
                        style={{ background: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107,122,61,0.15)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1" style={{ color: '#6b7266' }} aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reset-confirm-password" className="block text-sm mb-2" style={{ color: '#2a2f1e' }}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        id="reset-confirm-password"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => { setConfirmNewPassword(e.target.value); setResetUpdateError(''); }}
                        placeholder="Re-enter your new password"
                        maxLength={128}
                        autoComplete="new-password"
                        className="w-full px-5 py-4 pr-12 rounded-xl text-base transition-all focus:outline-none"
                        style={{
                          background: '#fff',
                          border: `1px solid ${confirmNewPassword && confirmNewPassword !== newPassword ? '#ef4444' : '#e0dcd3'}`,
                          color: '#2a2f1e',
                        }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107,122,61,0.15)'; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1" style={{ color: '#6b7266' }} aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}>
                        {showConfirmNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                    {confirmNewPassword && confirmNewPassword !== newPassword && (
                      <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Passwords do not match</p>
                    )}
                  </div>
                  {resetUpdateError && <p className="text-sm text-center" style={{ color: '#ef4444' }}>{resetUpdateError}</p>}
                  <button
                    onClick={async () => {
                      const pwd = newPassword;
                      if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
                        setResetUpdateError('Password must be at least 8 characters with uppercase, lowercase, and a number');
                        return;
                      }
                      if (confirmNewPassword !== newPassword) {
                        setResetUpdateError('Passwords do not match');
                        return;
                      }
                      setResetUpdateLoading(true);
                      const err = await updatePassword(newPassword);
                      setResetUpdateLoading(false);
                      if (err) {
                        setResetUpdateError(err);
                      } else {
                        setResetSuccess(true);
                      }
                    }}
                    disabled={resetUpdateLoading || newPassword.length < 8 || confirmNewPassword !== newPassword}
                    className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
                    style={{
                      background: newPassword.length >= 8 && confirmNewPassword === newPassword ? '#6b7a3d' : '#e0dcd3',
                      color: newPassword.length >= 8 && confirmNewPassword === newPassword ? '#fff' : '#999',
                    }}
                  >
                    {resetUpdateLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => { setResetMode(false); setNewPassword(''); setConfirmNewPassword(''); }}
                    className="w-full text-center text-sm mt-2 hover:underline"
                    style={{ color: '#6b7266', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          ) : (
          <>
          {/* Welcome */}
          <div className="mb-6 lg:mb-8">
            <h1 className="headline-font text-2xl sm:text-3xl" style={{ color: '#2a2f1e' }}>Welcome Back</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: '#6b7266' }}>Sign in to your Mono Tennis Club account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm mb-2" style={{ color: '#2a2f1e' }}>Email</label>
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
                  className="w-full pl-12 pr-5 py-4 rounded-xl text-base transition-all focus:outline-none"
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

            <div>
              <label htmlFor="login-password" className="block text-sm mb-2" style={{ color: '#2a2f1e' }}>Password</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#6b7266' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  maxLength={128}
                  className="w-full pl-12 pr-12 py-4 rounded-xl text-base transition-all focus:outline-none"
                  style={{
                    background: '#fff',
                    border: passwordError ? '1px solid #ef4444' : '1px solid #e0dcd3',
                    color: '#2a2f1e',
                    boxShadow: passwordError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                  }}
                  onFocus={(e) => { if (!passwordError) e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = passwordError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(107,122,61,0.15)'; }}
                  onBlur={(e) => { if (!passwordError) { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; } }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#6b7266' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{loginError || 'Password is required'}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: '#2a2f1e' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#6b7a3d]"
                />
                <span className="text-sm" style={{ color: '#6b7266' }}>Remember me</span>
              </label>
              <button type="button" onClick={() => { setShowForgotPassword(true); setResetEmail(email); setResetSent(false); setResetError(''); }} className="font-medium hover:underline" style={{ color: '#6b7a3d', background: 'none', border: 'none', cursor: 'pointer' }}>Forgot password?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-semibold text-base text-white transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-6"
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

          {/* OAuth Divider + Google Sign-In */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ backgroundColor: '#e0dcd3' }} />
              <span className="text-xs font-medium" style={{ color: '#999' }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#e0dcd3' }} />
            </div>
            <button
              type="button"
              onClick={async () => {
                setLoginError('');
                const { error } = await signInWithGoogle();
                if (error) setLoginError(error);
              }}
              className="w-full py-3.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3"
              style={{ background: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6b7a3d'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dcd3'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForgotPassword(false)} role="dialog" aria-modal="true" aria-label="Reset password">
              <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#2a2f1e' }}>Reset Password</h2>
                <p className="text-sm mb-4" style={{ color: '#6b7266' }}>
                  Enter your email and we&apos;ll send a reset link.
                </p>
                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
                      <svg className="w-6 h-6" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>Check your email</p>
                    <p className="text-xs mt-1" style={{ color: '#6b7266' }}>We sent a reset link to {resetEmail}</p>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="mt-4 px-6 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ background: '#6b7a3d' }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => { setResetEmail(e.target.value); setResetError(''); }}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-3"
                      style={{ background: '#f5f2eb', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6b7a3d'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e0dcd3'; }}
                    />
                    {resetError && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{resetError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                        style={{ color: '#6b7266', border: '1px solid #e0dcd3' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={resetLoading || resetCooldown > 0}
                        onClick={async () => {
                          if (!resetEmail || !emailRegex.test(resetEmail)) {
                            setResetError('Please enter a valid email');
                            return;
                          }
                          if (resetCooldown > 0) return;
                          setResetLoading(true);
                          const err = await resetPassword(resetEmail);
                          setResetLoading(false);
                          if (err) {
                            setResetError(err);
                          } else {
                            setResetSent(true);
                            setResetCooldown(60); // 60-second cooldown between requests
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                        style={{ background: '#6b7a3d' }}
                      >
                        {resetLoading ? 'Sending...' : resetCooldown > 0 ? `Wait ${resetCooldown}s` : 'Send Reset Link'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Register Link */}
          <p className="mt-6 lg:mt-8 text-center text-sm sm:text-base" style={{ color: '#6b7266' }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-medium hover:underline" style={{ color: '#6b7a3d' }}>
              Become a Member
            </a>
          </p>
          </>
          )}

        </div>
      </div>
    </>
  );
}
