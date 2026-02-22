'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '../dashboard/lib/auth';
import { sendWelcomeMessage } from '../dashboard/lib/db';
import { membershipTypes, signupMembershipTypes, waiverText, acknowledgementText } from '../info/data';

export default function SignupPage() {
  const router = useRouter();
  const waiverRef = useRef<HTMLDivElement>(null);
  const ackRef = useRef<HTMLDivElement>(null);

  const [signupStep, setSignupStep] = useState(1);
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
  }, []);

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
      if (scrollTop + clientHeight >= scrollHeight - 10) setWaiverScrolled(true);
    }
  };

  const handleAckScroll = () => {
    if (ackRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = ackRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) setAckScrolled(true);
    }
  };

  const completeSignup = async () => {
    setSignupError('');
    setSignupLoading(true);

    try {
      const { user, error, emailConfirmRequired } = await signUp(signupData.email, signupData.password, signupData.name, signupData.membershipType);
      if (error || !user) {
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

      if (emailConfirmRequired) {
        setEmailConfirmPending(true);
        setSignupLoading(false);
        setSignupStep(5);
        return;
      }

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
    <div className="min-h-screen" style={{ backgroundColor: '#edeae3' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1a1f12' }}>
        <a href="/" className="flex items-center gap-2 text-sm font-medium" style={{ color: '#e8e4d9' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>
        <a href="/login" className="text-sm font-medium hover:underline" style={{ color: 'rgba(232, 228, 217, 0.7)' }}>
          Already a member? Log in
        </a>
      </header>

      <div className="px-6 py-12 sm:py-16 max-w-2xl mx-auto">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="headline-font text-3xl sm:text-4xl mb-2" style={{ color: '#2a2f1e' }}>Become a Member</h1>
          <p className="text-sm" style={{ color: '#6b7266' }}>Join Mono Tennis Club for the 2026 season</p>
        </div>

        {/* Existing Member Warning */}
        {existingProfile && signupStep === 1 && (
          <div className="rounded-xl p-5 flex items-center gap-4 mb-8" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b7a3d', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>
              {existingProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>Already signed in as {existingProfile.name}</p>
              <a href="/dashboard" className="text-xs hover:underline" style={{ color: '#6b7a3d' }}>Go to Dashboard →</a>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
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
          <div>
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
            <a href="/" className="mt-6 text-sm hover:underline mx-auto block text-center" style={{ color: '#999' }}>
              Cancel
            </a>
          </div>
        )}

        {/* Step 2: Your Information */}
        {signupStep === 2 && (
          <div>
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
          <div>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Waiver & Acknowledgement</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Please read both documents carefully. Scroll to the bottom of each to proceed.</p>

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
              <p className="text-xs text-center mt-2" style={{ color: '#6b7a3d' }}>↓ Scroll to the bottom of the waiver</p>
            )}
            {waiverScrolled && (
              <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Waiver read
              </p>
            )}

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
              <p className="text-xs text-center mt-2" style={{ color: '#6b7a3d' }}>↓ Scroll to the bottom of the acknowledgement</p>
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
          <div>
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
          <div className="text-center">
            {emailConfirmPending ? (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(59, 175, 218, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#3BAFDA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="headline-font text-2xl mb-3" style={{ color: '#2a2f1e' }}>Check Your Email</h3>
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
                  <a href="/login" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>Go to Login</a>
                  <a href="/" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#faf8f3', color: '#6b7a3d', border: '1px solid #e0dcd3' }}>Back to Home</a>
                </div>
                <p className="text-xs mt-4" style={{ color: '#6b7266' }}>Didn&apos;t receive it? Check your spam folder.</p>
              </>
            ) : (
              <>
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
                  <a href="/dashboard" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#6b7a3d', color: '#fff' }}>Go to Dashboard</a>
                  <a href="/" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#faf8f3', color: '#6b7a3d', border: '1px solid #e0dcd3' }}>Back to Home</a>
                </div>
                <p className="text-xs mt-4" style={{ color: '#6b7266' }}>Redirecting to dashboard in {redirectCount}...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
