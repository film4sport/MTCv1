'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { signUp } from '../dashboard/lib/auth';
import { createFamily, addFamilyMember } from '../dashboard/lib/db';
import { membershipTypes, signupMembershipTypes, waiverText, acknowledgementText } from '../info/data';
import { BOOKING_RULES } from '../lib/shared-constants';
import { APP_COPY, APP_ROUTES, MEMBERSHIP_SEASON_YEAR, SUPPORT_EMAIL, SUPPORT_EMAIL_MAILTO } from '../lib/site';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const waiverRef = useRef<HTMLDivElement>(null);
  const ackRef = useRef<HTMLDivElement>(null);

  const [signupStep, setSignupStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(0);
  const [signupData, setSignupData] = useState({ membershipType: '', name: '', email: '', skillLevel: '', residence: 'mono' });
  const [emailConfirm, setEmailConfirm] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [popCard, setPopCard] = useState<string | null>(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverScrolled, setWaiverScrolled] = useState(false);
  const [ackScrolled, setAckScrolled] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);
  const [familyMemberInputs, setFamilyMemberInputs] = useState<{ name: string; type: 'adult' | 'junior'; birthYear: string }[]>([]);
  const isFamily = signupData.membershipType === 'family';
  const totalSteps = 7;

  // Navigate with direction tracking for animations
  const goToStep = useCallback((target: number) => {
    setStepDirection(target > signupStep ? 'forward' : 'back');
    setAnimKey(k => k + 1);
    setSignupStep(target);
  }, [signupStep]);

  // Load existing profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mtc-current-user');
      if (stored) setExistingProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Auto-detect if waiver/ack content fits without scrolling (large screens)
  useEffect(() => {
    if (signupStep === 5) {
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

  // Scroll to top when entering E-Transfer or confirmation step so user sees content immediately
  useEffect(() => {
    if (signupStep >= 6) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [signupStep]);

  // Auto-scroll inputs into view on mobile when keyboard opens (step 2)
  useEffect(() => {
    if (signupStep !== 2) return;
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    };
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [signupStep]);

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
      const trimmedEmail = signupData.email.trim().toLowerCase();
      const trimmedName = signupData.name.trim();

      // PIN-based signup — POST to /api/auth/signup
      const result = await signUp(trimmedName, trimmedEmail, pin, signupData.membershipType, signupData.skillLevel || undefined, signupData.residence || 'mono');
      if (result.error || !result.user) {
        const msg = (result.error || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setSignupError('This email is already registered. Please log in instead.');
        } else if (msg.includes('valid email') || msg.includes('invalid')) {
          setSignupError('Please enter a valid email address.');
        } else if (msg.includes('pin')) {
          setSignupError(result.error || 'Invalid PIN. Choose a 4-digit PIN that isn\'t too easy to guess.');
        } else {
          setSignupError(result.error || 'Signup failed. Please try again.');
        }
        setSignupLoading(false);
        return;
      }

      // Create family group and add family members
      if (isFamily && familyMemberInputs.length > 0) {
        try {
          const familyName = `The ${trimmedName.split(' ').pop() || trimmedName} Family`;
          const familyId = await createFamily(result.user.id, familyName);
          if (familyId) {
            const validMembers = familyMemberInputs.filter(fm => fm.name.trim());
            await Promise.all(validMembers.map(fm =>
              addFamilyMember(familyId, {
                name: fm.name.trim(),
                type: fm.type,
                birthYear: fm.birthYear ? parseInt(fm.birthYear) : undefined,
              })
            ));
          }
        } catch (err) {
          console.error('[MTC] family creation:', err);
        }
      }

      // Cache user for dashboard hydration
      localStorage.setItem('mtc-current-user', JSON.stringify(result.user));

      setSignupLoading(false);
      setSignupStep(totalSteps);
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
      {/* Signup UX animation styles */}
      <style>{`
        @keyframes stepSlideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes stepSlideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        .step-enter-forward { animation: stepSlideInRight 0.35s ease-out both; }
        .step-enter-back { animation: stepSlideInLeft 0.35s ease-out both; }
        .signup-input:focus { box-shadow: 0 0 0 3px rgba(107, 122, 61, 0.18) !important; border-color: #6b7a3d !important; }
        .card-select-pop { animation: cardPop 0.3s ease-out; }
        @keyframes cardPop { 0% { transform: scale(1); } 40% { transform: scale(1.04); } 100% { transform: scale(1); } }
        @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .check-pop { animation: checkPop 0.5s ease-out 0.1s both; }
        .fade-up-1 { animation: fadeUp 0.4s ease-out 0.3s both; }
        .fade-up-2 { animation: fadeUp 0.4s ease-out 0.5s both; }
        .fade-up-3 { animation: fadeUp 0.4s ease-out 0.7s both; }
        .fade-up-4 { animation: fadeUp 0.4s ease-out 0.9s both; }
      `}</style>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1a1f12' }}>
        <a href={APP_ROUTES.home} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#e8e4d9' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {APP_COPY.backToHome}
        </a>
        <a href={APP_ROUTES.login} className="text-sm font-medium hover:underline" style={{ color: 'rgba(232, 228, 217, 0.7)' }}>
          Already a member? Log in
        </a>
      </header>

      {/* Final Step: Confirmation — single contained card */}
      {signupStep === totalSteps && (
        <div key={`step7-${animKey}`} className="step-enter-forward px-6 py-10 sm:py-14 max-w-xl mx-auto">
          <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)' }}>
            {/* Dark top section */}
            <div className="text-center px-8 pt-12 pb-14" style={{ background: 'linear-gradient(165deg, #1a1f12 0%, #2a2f1e 60%, #3a4028 100%)' }}>
              <div className="w-12 h-1 rounded-full mx-auto mb-8" style={{ background: 'linear-gradient(90deg, #6b7a3d, #d4e157)' }} />
              <div className="check-pop w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-5" style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #6b7a3d, #8a9f4d)', boxShadow: '0 0 0 5px rgba(107, 122, 61, 0.2), 0 6px 24px rgba(0,0,0,0.3)' }}>
                <svg className="w-9 h-9" style={{ color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="fade-up-1 headline-font text-2xl sm:text-3xl mb-2" style={{ color: '#e8e4d9' }}>
                Welcome, {signupData.name.split(' ')[0]}!
              </h3>
              <p className="fade-up-1 text-sm" style={{ color: 'rgba(232, 228, 217, 0.55)' }}>
                You&apos;re now a member of Mono Tennis Club.
              </p>
            </div>

            {/* White bottom section */}
            <div className="bg-white px-8 pb-8">
              {/* Profile header — overlapping dark section */}
              <div className="fade-up-2 flex items-center gap-3 py-5" style={{ marginTop: '-1.5rem', backgroundColor: '#fff', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6b7a3d, #8a9f4d)', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                  {signupData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{signupData.name}</p>
                  <p className="text-xs" style={{ color: '#999' }}>{signupData.email}</p>
                </div>
              </div>

              {/* Profile details */}
              <div className="fade-up-2 mt-4">
                {[
                  { label: 'Membership', value: getMembershipLabel() },
                  { label: 'Skill Level', value: signupData.skillLevel ? signupData.skillLevel.charAt(0).toUpperCase() + signupData.skillLevel.slice(1) : 'Not set' },
                  ...(familyMemberInputs.filter(f => f.name.trim()).length > 0 ? [{ label: 'Family Members', value: familyMemberInputs.filter(f => f.name.trim()).map(f => f.name.trim()).join(', ') }] : []),
                  { label: 'Waiver', value: 'Signed' },
                ].map((row, i, arr) => (
                  <div key={i} className="flex items-center justify-between py-3" style={i < arr.length - 1 ? { borderBottom: '1px solid #f0ede6' } : {}}>
                    <span className="text-sm" style={{ color: '#999' }}>{row.label}</span>
                    <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-5" style={{ borderTop: '1px solid #f0ede6' }} />

              {/* Info items */}
              <div className="fade-up-3 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)' }}>
                    <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>Gate code</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6b7266' }}>Find the court gate code in your Profile settings. It changes monthly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 225, 87, 0.12)' }}>
                    <svg className="w-4 h-4" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2a2f1e' }}>Apps in development</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6b7266' }}>Court booking, messaging, and partner matching are being built. We&apos;d love testers! Feedback: <a href={SUPPORT_EMAIL_MAILTO} style={{ color: '#6b7a3d', textDecoration: 'underline' }}>{SUPPORT_EMAIL}</a></p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="fade-up-4 mt-8 flex flex-col sm:flex-row items-center gap-3">
                <a href={APP_ROUTES.dashboard} className="w-full sm:flex-1 inline-block text-center px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6b7a3d, #8a9f4d)', color: '#fff', boxShadow: '0 4px 16px rgba(107, 122, 61, 0.25)' }}>{APP_COPY.goToDashboard}</a>
                <a href={APP_ROUTES.home} className="w-full sm:flex-1 inline-block text-center px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: '#faf8f3', color: '#6b7a3d', border: '1px solid #e0dcd3' }}>{APP_COPY.backToHome}</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steps 1-6 container — hidden on final step */}
      {signupStep < totalSteps && (
      <div className="px-6 py-12 sm:py-16 max-w-2xl mx-auto">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="headline-font text-3xl sm:text-4xl mb-2" style={{ color: '#2a2f1e' }}>Become a Member</h1>
          <p className="text-sm" style={{ color: '#6b7266' }}>Join Mono Tennis Club for the {MEMBERSHIP_SEASON_YEAR} season</p>
        </div>

        {/* Existing Member Warning */}
        {existingProfile && signupStep === 1 && (
          <div className="rounded-xl p-5 flex items-center gap-4 mb-8" style={{ background: 'linear-gradient(135deg, rgba(107, 122, 61, 0.12), rgba(212, 225, 87, 0.06))', border: '1px solid rgba(107, 122, 61, 0.2)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b7a3d', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>
              {existingProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>Already signed in as {existingProfile.name}</p>
              <a href={APP_ROUTES.dashboard} className="text-xs hover:underline" style={{ color: '#6b7a3d' }}>{APP_COPY.goToDashboard} →</a>
            </div>
          </div>
        )}

        {/* Progress Steps — skip step 3 dot for non-family */}
        {(() => {
          const visibleSteps = isFamily
            ? [1, 2, 3, 4, 5, 6, 7]
            : [1, 2, 4, 5, 6, 7];
          return (
            <div className="flex items-center justify-center gap-2 mb-10">
              {visibleSteps.map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`${visibleSteps.length > 6 ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'} rounded-full flex items-center justify-center text-xs font-bold`}
                    style={{
                      transition: 'background-color 0.4s ease, color 0.4s ease',
                      ...(signupStep >= step
                        ? { backgroundColor: '#6b7a3d', color: '#fff' }
                        : { backgroundColor: '#faf8f3', color: '#999', border: '1px solid #e0dcd3' }),
                    }}
                  >
                    {signupStep > step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < visibleSteps.length - 1 && (
                    <div className={`${visibleSteps.length > 6 ? 'w-4 sm:w-6' : 'w-6 sm:w-8'} h-0.5`} style={{ backgroundColor: signupStep > step ? '#6b7a3d' : '#e0dcd3', transition: 'background-color 0.4s ease' }} />
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Step 1: Select Membership Type */}
        {signupStep === 1 && (
          <div key={`step1-${animKey}`} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Select Membership Type</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Choose the membership that best fits your needs.</p>
            <div className="grid gap-4">
              {signupMembershipTypes.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setSignupData({ ...signupData, membershipType: m.key }); setPopCard(`mem-${m.key}`); setTimeout(() => goToStep(2), 200); }}
                  className={`flex items-center justify-between p-5 rounded-xl text-left transition-all hover:scale-[1.02]${popCard === `mem-${m.key}` ? ' card-select-pop' : ''}`}
                  onAnimationEnd={() => setPopCard(null)}
                  style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}
                >
                  <div>
                    <span className="font-semibold text-base" style={{ color: '#2a2f1e' }}>{m.label}</span>
                    {m.desc && <p className="text-xs mt-1" style={{ color: '#6b7266' }}>{m.desc}</p>}
                  </div>
                  <span className="font-bold text-xl flex-shrink-0 ml-4" style={{ color: '#4a5528' }}>${m.price}</span>
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
          <div key={`step2-${animKey}`} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Your Information</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Tell us a bit about yourself.</p>

            <div className="space-y-5">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  maxLength={80}
                  placeholder="Enter your full name"
                  aria-required="true"
                  className="signup-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  maxLength={100}
                  placeholder="your@email.com"
                  aria-required="true"
                  className="signup-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                />
              </div>
              <div>
                <label htmlFor="signup-email-confirm" className="block text-sm font-medium mb-2" style={{ color: emailConfirm && signupData.email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase() ? '#ef4444' : '#6b7266' }}>
                  Confirm Email{emailConfirm && signupData.email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase() ? ' — does not match' : ''}
                </label>
                <input
                  id="signup-email-confirm"
                  type="email"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  maxLength={100}
                  placeholder="Re-enter your email"
                  aria-required="true"
                  className="signup-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: '#faf8f3', border: `1px solid ${emailConfirm && signupData.email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase() ? '#ef4444' : '#e0dcd3'}`, color: '#2a2f1e' }}
                />
              </div>
              <div>
                <label htmlFor="signup-pin" className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>4-Digit PIN</label>
                <input
                  id="signup-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Choose a 4-digit PIN"
                  aria-required="true"
                  className="signup-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e', letterSpacing: '4px', textAlign: 'center', fontSize: '16px', fontWeight: 600 }}
                />
              </div>
              <div>
                <label htmlFor="signup-pin-confirm" className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Confirm PIN</label>
                <input
                  id="signup-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Re-enter your PIN"
                  aria-required="true"
                  className="signup-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e', letterSpacing: '4px', textAlign: 'center', fontSize: '16px', fontWeight: 600 }}
                />
              </div>
              <p className="text-sm mt-3 text-center font-medium leading-relaxed rounded-xl" style={{ color: '#6b7a3d', background: 'rgba(107, 122, 61, 0.08)', padding: '10px 14px' }}>
                You&apos;ll use your <strong style={{ color: '#2a2f1e' }}>email + 4-digit PIN</strong> to sign in.
              </p>
              <p className="text-xs mt-2 text-center leading-relaxed rounded-xl" style={{ color: '#b45309', background: 'rgba(180, 83, 9, 0.06)', padding: '8px 12px', border: '1px solid rgba(180, 83, 9, 0.12)' }}>
                Avoid easy PINs like 1234. Anyone who knows your email and PIN can access your profile and messages.
              </p>
            </div>
            {signupError && signupStep === 2 && (
              <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
            )}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => { setSignupError(''); goToStep(1); }}
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
                  if (signupData.email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
                    setSignupError('Email addresses do not match');
                    return;
                  }
                  if (!/^\d{4}$/.test(pin)) {
                    setSignupError('PIN must be exactly 4 digits');
                    return;
                  }
                  if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '4321') {
                    setSignupError('That PIN is too easy to guess. Pick something less obvious.');
                    return;
                  }
                  if (pin !== pinConfirm) {
                    setSignupError('PINs do not match');
                    return;
                  }
                  setSignupError('');
                  goToStep(isFamily ? 3 : 4);
                }}
                disabled={!signupData.name.trim() || !signupData.email.trim() || !emailConfirm.trim() || signupData.email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase() || pin.length !== 4 || pin !== pinConfirm}
                className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={
                  signupData.name.trim() && signupData.email.trim() && emailConfirm.trim() && signupData.email.trim().toLowerCase() === emailConfirm.trim().toLowerCase() && pin.length === 4 && pin === pinConfirm
                    ? { backgroundColor: '#6b7a3d', color: '#fff' }
                    : { backgroundColor: '#e0dcd3', color: '#999', cursor: 'not-allowed' }
                }
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Family Members (family only) */}
        {signupStep === 3 && isFamily && (
          <div key={`step3-${animKey}`} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Family Members</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>
              Add up to 1 additional adult and 4 juniors (under 18). You can also add members later from your dashboard.
            </p>

            <div className="space-y-4">
              {familyMemberInputs.map((fm, idx) => (
                <div key={idx} className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={fm.name}
                      onChange={e => {
                        const updated = [...familyMemberInputs];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setFamilyMemberInputs(updated);
                      }}
                      placeholder="Full name"
                      maxLength={80}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ backgroundColor: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e0dcd3' }}>
                        {(['adult', 'junior'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => {
                              const updated = [...familyMemberInputs];
                              updated[idx] = { ...updated[idx], type: t };
                              setFamilyMemberInputs(updated);
                            }}
                            className="px-3 py-1.5 text-xs font-medium transition-colors"
                            style={fm.type === t ? { backgroundColor: '#6b7a3d', color: '#fff' } : { backgroundColor: '#fff', color: '#6b7266' }}
                          >
                            {t === 'adult' ? 'Adult' : 'Junior (< 18)'}
                          </button>
                        ))}
                      </div>
                      {fm.type === 'junior' && (
                        <input
                          type="number"
                          value={fm.birthYear}
                          onChange={e => {
                            const updated = [...familyMemberInputs];
                            updated[idx] = { ...updated[idx], birthYear: e.target.value };
                            setFamilyMemberInputs(updated);
                          }}
                          placeholder="Birth year"
                          min={1950}
                          max={new Date().getFullYear()}
                          className="w-24 px-3 py-1.5 rounded-lg text-xs outline-none"
                          style={{ backgroundColor: '#fff', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setFamilyMemberInputs(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    style={{ color: '#ef4444' }}
                    aria-label="Remove family member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add member button */}
            {familyMemberInputs.length < 5 && (
              <button
                onClick={() => {
                  const adultCount = 1 + familyMemberInputs.filter(f => f.type === 'adult').length;
                  const defaultType = adultCount >= 2 ? 'junior' : 'adult';
                  setFamilyMemberInputs(prev => [...prev, { name: '', type: defaultType, birthYear: '' }]);
                }}
                disabled={
                  familyMemberInputs.filter(f => f.type === 'adult').length >= 1 &&
                  familyMemberInputs.filter(f => f.type === 'junior').length >= 4
                }
                className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'rgba(107, 122, 61, 0.08)', color: '#6b7a3d', border: '1px dashed rgba(107, 122, 61, 0.3)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Family Member
              </button>
            )}

            <p className="text-xs text-center mt-3" style={{ color: '#999' }}>
              {familyMemberInputs.length === 0 ? 'You can skip this and add family members later from your dashboard.' : `${familyMemberInputs.length} member${familyMemberInputs.length !== 1 ? 's' : ''} added`}
            </p>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => goToStep(2)}
                className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
              >
                Back
              </button>
              <button
                onClick={() => goToStep(4)}
                className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
              >
                {familyMemberInputs.length === 0 ? 'Skip for Now' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Skill Level */}
        {signupStep === 4 && (
          <div key={`step4-${animKey}`} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Your Skill Level</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>This helps us match you with the right partners and programs.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'beginner', label: 'Beginner', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', desc: 'New to tennis or learning the basics' },
                { value: 'intermediate', label: 'Intermediate', color: '#6b7a3d', bg: 'rgba(107, 122, 61, 0.08)', desc: 'Comfortable with rallying and basic strategy' },
                { value: 'advanced', label: 'Advanced', color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', desc: 'Strong all-court game with consistent play' },
                { value: 'competitive', label: 'Competitive', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', desc: 'Tournament-level player' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => { setSignupData({ ...signupData, skillLevel: level.value }); setPopCard(`skill-${level.value}`); }}
                  className={`p-5 rounded-xl text-left transition-all hover:scale-[1.02]${popCard === `skill-${level.value}` ? ' card-select-pop' : ''}`}
                  onAnimationEnd={() => setPopCard(null)}
                  style={{
                    backgroundColor: signupData.skillLevel === level.value ? level.bg : '#faf8f3',
                    border: `2px solid ${signupData.skillLevel === level.value ? level.color : '#e0dcd3'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }} />
                    <span className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{level.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7266' }}>{level.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-center mt-4" style={{ color: '#999' }}>You can change this anytime in your Profile settings.</p>

            {/* Residence: Mono vs Other */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid #e0dcd3' }}>
              <p className="text-sm font-semibold mb-3 text-center" style={{ color: '#2a2f1e' }}>Do you live in Mono?</p>
              <div className="flex gap-3">
                {[
                  { value: 'mono', label: 'Yes — Mono', desc: 'Local resident' },
                  { value: 'other', label: 'Other', desc: 'Out of town' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSignupData({ ...signupData, residence: opt.value }); setPopCard(`res-${opt.value}`); }}
                    className={`flex-1 p-4 rounded-xl text-center transition-all hover:scale-[1.02]${popCard === `res-${opt.value}` ? ' card-select-pop' : ''}`}
                    onAnimationEnd={() => setPopCard(null)}
                    style={{
                      backgroundColor: signupData.residence === opt.value ? 'rgba(107, 122, 61, 0.08)' : '#faf8f3',
                      border: `2px solid ${signupData.residence === opt.value ? '#6b7a3d' : '#e0dcd3'}`,
                    }}
                  >
                    <span className="font-semibold text-sm block" style={{ color: '#2a2f1e' }}>{opt.label}</span>
                    <span className="text-xs" style={{ color: '#6b7266' }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => { goToStep(isFamily ? 3 : 2); }}
                className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
              >
                Back
              </button>
              <button
                onClick={() => goToStep(5)}
                disabled={!signupData.skillLevel}
                className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={
                  signupData.skillLevel
                    ? { backgroundColor: '#6b7a3d', color: '#fff' }
                    : { backgroundColor: '#e0dcd3', color: '#999', cursor: 'not-allowed' }
                }
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Waiver */}
        {signupStep === 5 && (
          <div key={`step5-${animKey}`} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Waiver & Acknowledgement</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Please read both documents carefully. Scroll to the bottom of each to proceed.</p>

            <p className="text-xs font-semibold mb-2" style={{ color: '#4a5528' }}>1. Waiver & Release of Liability</p>
            <div className="relative">
              <div
                ref={waiverRef}
                onScroll={handleWaiverScroll}
                className="rounded-xl p-6 text-sm leading-relaxed overflow-y-auto"
                style={{ backgroundColor: '#faf8f3', border: `2px solid ${waiverScrolled ? '#6b7a3d' : '#e0dcd3'}`, color: '#555', maxHeight: '280px', whiteSpace: 'pre-wrap' }}
              >
                {waiverText}
              </div>
              {!waiverScrolled && (
                <div className="absolute bottom-0 left-0 right-0 rounded-b-xl pointer-events-none" style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, #faf8f3 80%)' }} />
              )}
            </div>
            {!waiverScrolled && (
              <div className="flex items-center justify-center gap-2 mt-3 py-2 px-4 rounded-full mx-auto w-fit animate-bounce" style={{ backgroundColor: '#4a5528', color: '#e8e4d9' }}>
                <span className="text-xs font-semibold">↓ Scroll to bottom to continue</span>
              </div>
            )}
            {waiverScrolled && (
              <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Waiver read
              </p>
            )}

            <p className="text-xs font-semibold mb-2 mt-6" style={{ color: '#4a5528' }}>2. Acknowledgement Agreement</p>
            <div className="relative">
              <div
                ref={ackRef}
                onScroll={handleAckScroll}
                className="rounded-xl p-6 text-sm leading-relaxed overflow-y-auto"
                style={{ backgroundColor: '#faf8f3', border: `2px solid ${ackScrolled ? '#6b7a3d' : '#e0dcd3'}`, color: '#555', maxHeight: '280px', whiteSpace: 'pre-wrap' }}
              >
                {acknowledgementText}
              </div>
              {!ackScrolled && (
                <div className="absolute bottom-0 left-0 right-0 rounded-b-xl pointer-events-none" style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, #faf8f3 80%)' }} />
              )}
            </div>
            {!ackScrolled && (
              <div className="flex items-center justify-center gap-2 mt-3 py-2 px-4 rounded-full mx-auto w-fit animate-bounce" style={{ backgroundColor: '#4a5528', color: '#e8e4d9' }}>
                <span className="text-xs font-semibold">↓ Scroll to bottom to continue</span>
              </div>
            )}
            {ackScrolled && (
              <p className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: '#6b7a3d' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Acknowledgement read
              </p>
            )}

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => { setSignupError(''); goToStep(4); }}
                className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
              >
                Back
              </button>
              <button
                onClick={() => { setWaiverAccepted(true); goToStep(6); }}
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

        {/* Step 6: E-Transfer Payment */}
        {signupStep === 6 && (
          <div key={`step6-${animKey}`} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}>
            <h3 className="headline-font text-2xl mb-2 text-center" style={{ color: '#2a2f1e' }}>Payment via E-Transfer</h3>
            <p className="text-sm text-center mb-8" style={{ color: '#6b7266' }}>Send an Interac e-transfer to complete your registration.</p>

            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3' }}>
              <div className="text-sm mb-2" style={{ color: '#6b7266' }}>Amount Due</div>
              <div className="headline-font text-4xl font-bold mb-6" style={{ color: '#4a5528' }}>${getMembershipPrice()}</div>
              <div className="text-xs mb-6 px-3 py-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(107, 122, 61, 0.12)', color: '#4a5528' }}>
                {getMembershipLabel()}
              </div>

              <div className="rounded-lg p-5 mb-4" style={{ backgroundColor: '#edeae3', border: '1px solid #e0dcd3' }}>
                <div className="text-sm mb-1" style={{ color: '#6b7266' }}>Send Interac e-transfer to:</div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="font-bold text-lg" style={{ color: '#2a2f1e' }}>{BOOKING_RULES.GUEST_FEE_EMAIL}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(BOOKING_RULES.GUEST_FEE_EMAIL);
                      const btn = document.getElementById('copy-email-btn');
                      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); }
                    }}
                    id="copy-email-btn"
                    className="text-xs px-3 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: '#6b7a3d', color: '#fff' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="text-left rounded-lg p-4 mb-6 space-y-2" style={{ backgroundColor: 'rgba(107, 122, 61, 0.06)', border: '1px solid rgba(107, 122, 61, 0.12)' }}>
                <p className="text-xs font-semibold" style={{ color: '#4a5528' }}>Instructions:</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>1. Open your banking app and select Interac e-Transfer</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>2. Send <strong style={{ color: '#2a2f1e' }}>${getMembershipPrice()}</strong> to the email above</p>
                <p className="text-xs" style={{ color: '#6b7266' }}>3. In the message field, include your <strong style={{ color: '#2a2f1e' }}>full name</strong></p>
                <p className="text-xs" style={{ color: '#6b7266' }}>4. Click &quot;I&apos;ve Sent the E-Transfer&quot; below to complete signup</p>
              </div>
            </div>

            {signupError && (
              <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
            )}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => { setSignupError(''); goToStep(5); }}
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
      </div>
      )}
    </div>
  );
}
