import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '../../dashboard/lib/auth';
import { sendWelcomeMessage } from '../../dashboard/lib/db';
import { membershipTypes, signupMembershipTypes, waiverText, acknowledgementText } from '../data';

export default function MembershipTab() {
  const router = useRouter();
  const waiverRef = useRef<HTMLDivElement>(null);
  const ackRef = useRef<HTMLDivElement>(null);

  const [signupStep, setSignupStep] = useState(0);
  const [redirectCount, setRedirectCount] = useState(5);
  const [signupData, setSignupData] = useState({ membershipType: '', name: '', email: '', password: '' });
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverScrolled, setWaiverScrolled] = useState(false);
  const [ackScrolled, setAckScrolled] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);

  // Load existing profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mtc-current-user');
      if (stored) setExistingProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [signupStep]);

  // Auto-detect if waiver/ack content fits without scrolling (large screens)
  useEffect(() => {
    if (signupStep === 3) {
      const checkFit = () => {
        if (waiverRef.current) {
          const { scrollHeight, clientHeight } = waiverRef.current;
          if (scrollHeight <= clientHeight + 10) setWaiverScrolled(true);
        }
        if (ackRef.current) {
          const { scrollHeight, clientHeight } = ackRef.current;
          if (scrollHeight <= clientHeight + 10) setAckScrolled(true);
        }
      };
      requestAnimationFrame(checkFit);
    }
  }, [signupStep]);

  // Animate fade-in elements when signup step changes
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    // Small delay to let DOM update
    const timer = setTimeout(() => {
      document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => observer.observe(el));
    }, 50);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [signupStep]);

  // Auto-redirect to dashboard after signup completion (skip if email verification pending)
  useEffect(() => {
    if (signupStep !== 5 || emailConfirmPending) return;
    const interval = setInterval(() => {
      setRedirectCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [signupStep, router, emailConfirmPending]);

  const handleWaiverScroll = () => {
    if (waiverRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = waiverRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setWaiverScrolled(true);
      }
    }
  };

  const handleAckScroll = () => {
    if (ackRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = ackRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setAckScrolled(true);
      }
    }
  };

  const completeSignup = async () => {
    setSignupError('');
    setSignupLoading(true);

    try {
      const { user, error, emailConfirmRequired } = await signUp(signupData.email, signupData.password, signupData.name, signupData.membershipType);
      if (error || !user) {
        // Map Supabase auth errors to user-friendly messages
        const msg = error?.toLowerCase() || '';
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          setSignupError('This email is already registered. Please log in instead.');
        } else if (msg.includes('password')) {
          setSignupError('Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.');
        } else if (msg.includes('valid email') || msg.includes('invalid')) {
          setSignupError('Please enter a valid email address.');
        } else {
          setSignupError(error || 'Signup failed. Please try again.');
        }
        setSignupLoading(false);
        return;
      }

      // If Supabase requires email confirmation, show "check your email" step
      if (emailConfirmRequired) {
        setEmailConfirmPending(true);
        setSignupLoading(false);
        setSignupStep(5);
        return;
      }

      // No email confirmation required — sign in directly
      // Retry signIn with short delay — DB trigger may need a moment to create profile
      let loggedInUser = await signIn(signupData.email, signupData.password);
      if (!loggedInUser) {
        await new Promise(r => setTimeout(r, 1500));
        loggedInUser = await signIn(signupData.email, signupData.password);
      }
      if (!loggedInUser) {
        console.error('[MTC] signIn after signUp returned null — profile may not be ready yet');
      }

      sendWelcomeMessage(user.id, user.name).catch(err => console.error('[MTC] welcome message:', err));
      localStorage.setItem('mtc-current-user', JSON.stringify(loggedInUser || user));

      setSignupLoading(false);
      setSignupStep(5);
    } catch {
      setSignupError('Something went wrong. Please try again.');
      setSignupLoading(false);
    }
  };

  const getMembershipPrice = () => {
    const found = membershipTypes.find((m) => m.key === signupData.membershipType);
    return found ? found.price : 0;
  };

  const getMembershipLabel = () => {
    const found = membershipTypes.find((m) => m.key === signupData.membershipType);
    return found ? found.label : '';
  };

  return (
    <>
      {/* Existing Member Profile Banner */}
      {existingProfile && signupStep === 0 && (
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
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={existingProfile.status === 'paused'
                ? { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#92400e' }
                : { backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }
              }>
                {existingProfile.status === 'paused' ? 'Paused' : 'Active'}
              </span>
            </div>
          </div>
        </section>
      )}

      {signupStep === 0 ? (
        <>
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
                <button
                  onClick={() => setSignupStep(1)}
                  className="px-10 py-4 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
                >
                  Join Now
                </button>
              </div>
            </div>
          </section>

          {/* Season & Facilities */}
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#f5f2eb' }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label">// Facilities</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                  Season &amp; Facilities
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in">
                {[
                  { icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', title: 'Season', desc: 'May through October' },
                  { icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', title: '4 Courts', desc: 'Courts 1 & 2 have lights' },
                  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', title: 'Clubhouse', desc: 'Washrooms & facilities' },
                  { icon: 'M5 13l4 4L19 7', title: 'Accessible', desc: 'Wheelchair accessible & free parking' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-6 text-center" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                      <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <h4 className="font-bold mb-2" style={{ color: '#2a2f1e' }}>{item.title}</h4>
                    <p className="text-sm" style={{ color: '#6b7266' }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 rounded-xl p-8 fade-in" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107, 122, 61, 0.12)' }}>
                    <svg className="w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1" style={{ color: '#2a2f1e' }}>Location</h4>
                    <address className="not-italic text-sm leading-relaxed" style={{ color: '#6b7266' }}>
                      754883 Mono Centre Road, Mono, Ontario, L9W 6S3
                    </address>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* News & Updates */}
          <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 fade-in">
                <span className="section-label">// News</span>
                <h2 className="headline-font text-2xl md:text-3xl lg:text-4xl leading-tight mt-4 mb-4" style={{ color: '#2a2f1e' }}>
                  News &amp; Updates
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 fade-in">
                {[
                  { badge: 'Announcement', date: 'March 2026', title: 'Registration Opens March 1st', desc: 'The 2026 season registration opens on March 1st. Pay online via Interac e-transfer or credit/debit card. Early bird discounts may apply.' },
                  { badge: 'Newsletter', date: 'April 2026', title: 'Spring Newsletter', desc: 'Get the latest updates on the upcoming season, new programs, coaching staff changes, and social events planned for the summer.' },
                  { badge: 'Fundraiser', date: 'Ongoing', title: 'Court Resurfacing Fund', desc: 'Help us maintain and improve our courts. Donations go toward resurfacing and upgrading our facilities for future seasons.' },
                ].map((news, i) => (
                  <div key={i} className="rounded-xl p-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)', color: '#4a5528' }}>
                        {news.badge}
                      </span>
                      <span className="text-xs" style={{ color: '#999' }}>{news.date}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-3" style={{ color: '#2a2f1e' }}>{news.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b7266' }}>{news.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* =================== SIGNUP FLOW =================== */
        <section className="py-16 lg:py-20 px-8 lg:px-16" style={{ backgroundColor: '#edeae3' }}>
          <div className="max-w-2xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-12">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={
                      signupStep >= step
                        ? { backgroundColor: '#6b7a3d', color: '#fff' }
                        : { backgroundColor: '#faf8f3', color: '#999', border: '1px solid #e0dcd3' }
                    }
                  >
                    {signupStep > step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  {step < 5 && (
                    <div className="w-8 h-0.5" style={{ backgroundColor: signupStep > step ? '#6b7a3d' : '#e0dcd3' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Select Membership Type */}
            {signupStep === 1 && (
              <div className="fade-in">
                <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Select Membership Type</h3>
                <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Choose the membership that best fits your needs.</p>
                <div className="grid gap-4">
                  {signupMembershipTypes.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setSignupData({ ...signupData, membershipType: m.key }); setSignupStep(2); }}
                      className="flex items-center justify-between p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
                      style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}
                    >
                      <div>
                        <span className="font-semibold text-base" style={{ color: '#2a2f1e' }}>{m.label}</span>
                      </div>
                      <span className="font-bold text-xl" style={{ color: '#4a5528' }}>${m.price}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setSignupStep(0)} className="mt-6 text-sm hover:underline mx-auto block" style={{ color: '#999' }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Step 2: Your Information */}
            {signupStep === 2 && (
              <div className="fade-in">
                <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Your Information</h3>
                <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Tell us a bit about yourself.</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Full Name</label>
                    <input
                      type="text"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      maxLength={80}
                      placeholder="Enter your full name"
                      aria-required="true"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Email</label>
                    <input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      maxLength={100}
                      placeholder="your@email.com"
                      aria-required="true"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Password</label>
                    <input
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      maxLength={100}
                      placeholder="Min. 8 chars, uppercase, lowercase & number"
                      aria-required="true"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                    />
                  </div>
                </div>
                {signupError && signupStep === 2 && (
                  <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
                )}
                <div className="flex items-center gap-4 mt-8">
                  <button
                    onClick={() => setSignupStep(1)}
                    className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                    style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
                      if (!emailRegex.test(signupData.email)) {
                        setSignupError('Please enter a valid email address');
                        return;
                      }
                      const pwd = signupData.password;
                      if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
                        setSignupError('Password must be at least 8 characters with uppercase, lowercase, and a number');
                        return;
                      }
                      setSignupError('');
                      setSignupStep(3);
                    }}
                    disabled={!signupData.name.trim() || !signupData.email.trim() || signupData.password.length < 8}
                    className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                    style={
                      signupData.name.trim() && signupData.email.trim() && signupData.password.length >= 8
                        ? { backgroundColor: '#6b7a3d', color: '#fff' }
                        : { backgroundColor: '#e0dcd3', color: '#999', cursor: 'not-allowed' }
                    }
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Waiver */}
            {signupStep === 3 && (
              <div className="fade-in">
                <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Waiver & Acknowledgement</h3>
                <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Please read both documents carefully. Scroll to the bottom of each to proceed.</p>

                {/* Waiver */}
                <p className="text-xs font-semibold mb-2" style={{ color: '#4a5528' }}>1. Waiver & Release of Liability</p>
                <div
                  ref={waiverRef}
                  onScroll={handleWaiverScroll}
                  className="rounded-xl p-6 text-sm leading-relaxed overflow-y-auto"
                  style={{ backgroundColor: '#faf8f3', border: `1px solid ${waiverScrolled ? '#6b7a3d' : '#e0dcd3'}`, color: '#555', maxHeight: '280px', whiteSpace: 'pre-wrap' }}
                >
                  {waiverText}
                </div>
                {!waiverScrolled && (
                  <p className="text-xs text-center mt-2" style={{ color: '#6b7a3d' }}>
                    ↓ Scroll to the bottom of the waiver
                  </p>
                )}
                {waiverScrolled && (
                  <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Waiver read
                  </p>
                )}

                {/* Acknowledgement Agreement */}
                <p className="text-xs font-semibold mb-2 mt-6" style={{ color: '#4a5528' }}>2. Acknowledgement Agreement</p>
                <div
                  ref={ackRef}
                  onScroll={handleAckScroll}
                  className="rounded-xl p-6 text-sm leading-relaxed overflow-y-auto"
                  style={{ backgroundColor: '#faf8f3', border: `1px solid ${ackScrolled ? '#6b7a3d' : '#e0dcd3'}`, color: '#555', maxHeight: '280px', whiteSpace: 'pre-wrap' }}
                >
                  {acknowledgementText}
                </div>
                {!ackScrolled && (
                  <p className="text-xs text-center mt-2" style={{ color: '#6b7a3d' }}>
                    ↓ Scroll to the bottom of the acknowledgement
                  </p>
                )}
                {ackScrolled && (
                  <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Acknowledgement read
                  </p>
                )}

                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={() => setSignupStep(2)}
                    className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                    style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { setWaiverAccepted(true); setSignupStep(4); }}
                    disabled={!waiverScrolled || !ackScrolled}
                    className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                    style={
                      waiverScrolled && ackScrolled
                        ? { backgroundColor: '#6b7a3d', color: '#fff' }
                        : { backgroundColor: '#e0dcd3', color: '#999', cursor: 'not-allowed' }
                    }
                  >
                    I Agree
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: E-Transfer Payment */}
            {signupStep === 4 && (
              <div className="fade-in">
                <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Payment via E-Transfer</h3>
                <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Send an Interac e-transfer to complete your registration.</p>

                <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                  <div className="text-sm mb-2" style={{ color: '#6b7266' }}>Amount Due</div>
                  <div className="headline-font text-4xl font-bold mb-6" style={{ color: '#4a5528' }}>${getMembershipPrice()}</div>
                  <div className="text-xs mb-6 px-3 py-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>
                    {getMembershipLabel()}
                  </div>

                  <div className="rounded-lg p-5 mb-6" style={{ backgroundColor: '#edeae3', border: '1px solid #e0dcd3' }}>
                    <div className="text-sm mb-1" style={{ color: '#6b7266' }}>Send Interac e-transfer to:</div>
                    <div className="font-bold text-lg" style={{ color: '#2a2f1e' }}>monotennis.payment@gmail.com</div>
                  </div>

                </div>

                {signupError && (
                  <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
                )}
                <div className="flex items-center gap-4 mt-8">
                  <button
                    onClick={() => setSignupStep(3)}
                    className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                    style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={completeSignup}
                    disabled={signupLoading}
                    className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
                  >
                    {signupLoading ? 'Creating Account...' : "I've Sent the E-Transfer"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {signupStep === 5 && (
              <div className="fade-in text-center">
                {emailConfirmPending ? (
                  <>
                    {/* Email verification required */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(59, 175, 218, 0.15)' }}>
                      <svg className="w-8 h-8" style={{ color: '#3BAFDA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="headline-font text-2xl mb-3" style={{ color: '#2a2f1e' }}>
                      Check Your Email
                    </h3>
                    <p className="text-sm mb-6" style={{ color: '#6b7266' }}>
                      We&apos;ve sent a verification link to <strong style={{ color: '#2a2f1e' }}>{signupData.email}</strong>.
                      Click the link to verify your account, then log in to get started.
                    </p>

                    <div className="rounded-xl p-6 text-left" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                      <h4 className="font-semibold text-sm mb-4" style={{ color: '#999' }}>Your Profile</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Name', value: signupData.name },
                          { label: 'Email', value: signupData.email },
                          { label: 'Membership', value: getMembershipLabel() },
                          { label: 'Waiver', value: 'Signed' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                            <span className="text-sm" style={{ color: '#999' }}>{row.label}</span>
                            <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                      <a href="/login" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                        Go to Login
                      </a>
                      <a href="/" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#faf8f3', color: '#6b7a3d', border: '1px solid #e0dcd3' }}>
                        Back to Home
                      </a>
                    </div>
                    <p className="text-xs mt-4" style={{ color: '#6b7266' }}>
                      Didn&apos;t receive it? Check your spam folder.
                    </p>
                  </>
                ) : (
                  <>
                    {/* Direct signup — no email confirmation needed */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(107, 122, 61, 0.15)' }}>
                      <svg className="w-8 h-8" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="headline-font text-2xl mb-3" style={{ color: '#2a2f1e' }}>
                      Welcome to Mono Tennis Club, {signupData.name.split(' ')[0]}!
                    </h3>
                    <p className="text-sm mb-10" style={{ color: '#6b7266' }}>
                      Your profile has been created. We&apos;ll confirm your payment and activate your membership shortly.
                    </p>

                    <div className="rounded-xl p-6 text-left" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                      <h4 className="font-semibold text-sm mb-4" style={{ color: '#999' }}>Your Profile</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Name', value: signupData.name },
                          { label: 'Email', value: signupData.email },
                          { label: 'Membership', value: getMembershipLabel() },
                          { label: 'Waiver', value: 'Signed' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between py-2" style={i < 3 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
                            <span className="text-sm" style={{ color: '#999' }}>{row.label}</span>
                            <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                      <a href="/dashboard" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>
                        Go to Dashboard
                      </a>
                      <a href="/" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#faf8f3', color: '#6b7a3d', border: '1px solid #e0dcd3' }}>
                        Back to Home
                      </a>
                    </div>
                    <p className="text-xs mt-4" style={{ color: '#6b7266' }}>
                      Redirecting to dashboard in {redirectCount}...
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
