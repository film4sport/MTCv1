'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { signUp, signInWithGoogle, completeOAuthProfile } from '../dashboard/lib/auth';
import { supabase } from '../lib/supabase';
import { sendWelcomeMessage, createFamily, addFamilyMember } from '../dashboard/lib/db';
import { membershipTypes, signupMembershipTypes, waiverText, acknowledgementText } from '../info/data';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const waiverRef = useRef<HTMLDivElement>(null);
  const ackRef = useRef<HTMLDivElement>(null);

  const [signupStep, setSignupStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(0);
  const [signupData, setSignupData] = useState({ membershipType: '', name: '', email: '', skillLevel: '', residence: 'mono' });
  const [popCard, setPopCard] = useState<string | null>(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverScrolled, setWaiverScrolled] = useState(false);
  const [ackScrolled, setAckScrolled] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);
  const [familyMemberInputs, setFamilyMemberInputs] = useState<{ name: string; type: 'adult' | 'junior'; birthYear: string }[]>([]);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oauthUserId, setOauthUserId] = useState<string | null>(null);
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

  // Detect OAuth return — user is coming back from Google with an active session
  useEffect(() => {
    if (searchParams.get('oauth') !== 'true') return;

    const detectOAuthUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const user = session.user;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const userEmail = user.email || '';

      setIsOAuthUser(true);
      setOauthUserId(user.id);

      // Pre-fill name and email from Google
      setSignupData((prev) => ({
        ...prev,
        name: fullName || prev.name,
        email: userEmail || prev.email,
      }));

      // Restore membership type from localStorage (saved before OAuth redirect)
      const savedType = localStorage.getItem('mtc-oauth-membership-type');
      if (savedType) {
        setSignupData((prev) => ({ ...prev, membershipType: savedType }));
        localStorage.removeItem('mtc-oauth-membership-type');
        // Skip to the step after info (family members or skill level)
        const isFam = savedType === 'family';
        setSignupStep(isFam ? 3 : 4);
      } else {
        // No saved membership type — start from step 1
        setSignupStep(1);
      }
    };

    detectOAuthUser();
  }, [searchParams]);

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

      // ── OAuth path: user already authenticated via Google ──
      if (isOAuthUser && oauthUserId) {
        const { error: profileError } = await completeOAuthProfile(oauthUserId, {
          membershipType: signupData.membershipType,
          skillLevel: signupData.skillLevel || undefined,
          name: trimmedName || undefined,
          residence: signupData.residence || 'mono',
        });
        if (profileError) {
          setSignupError(profileError);
          setSignupLoading(false);
          return;
        }

        // Send welcome message
        sendWelcomeMessage(oauthUserId, trimmedName).catch(err => console.error('[MTC] welcome message:', err));

        // Create family group and add family members if this is a family membership
        if (isFamily && familyMemberInputs.length > 0) {
          try {
            const familyName = `The ${trimmedName.split(' ').pop() || trimmedName} Family`;
            const familyId = await createFamily(oauthUserId, familyName);
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
        localStorage.setItem('mtc-current-user', JSON.stringify({
          id: oauthUserId,
          name: trimmedName,
          email: trimmedEmail,
          role: 'member',
          membershipType: signupData.membershipType,
          skillLevel: signupData.skillLevel || undefined,
          memberSince: new Date().toISOString().slice(0, 7),
        }));

        // OAuth users skip email confirmation — go straight to confirmation step
        setEmailConfirmPending(false);
        setSignupLoading(false);
        setSignupStep(totalSteps);
        return;
      }

      // ── Passwordless signup (user logs in via Google or Magic Link) ──
      const { user, error, emailConfirmRequired } = await signUp(trimmedEmail, trimmedName, signupData.membershipType, signupData.skillLevel || undefined, signupData.residence || 'mono');
      if (error || !user) {
        const msg = error?.toLowerCase() || '';
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          setSignupError('This email is already registered. Please log in instead.');
        } else if (msg.includes('valid email') || msg.includes('invalid')) {
          setSignupError('Please enter a valid email address.');
        } else {
          setSignupError(error || 'Signup failed. Please try again.');
        }
        setSignupLoading(false);
        return;
      }

      if (emailConfirmRequired) {
        // Log the Supabase-sent confirmation email
        fetch('/api/log-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'signup_confirmation',
            recipientEmail: trimmedEmail,
            recipientUserId: user.id,
            status: 'requested',
            subject: 'Confirm Your Email — Mono Tennis Club',
            metadata: { source: 'desktop', membershipType: signupData.membershipType },
          }),
        }).catch(() => { /* non-critical */ });
        setEmailConfirmPending(true);
        setSignupLoading(false);
        setSignupStep(totalSteps);
        return;
      }

      sendWelcomeMessage(user.id, user.name).catch(err => console.error('[MTC] welcome message:', err));

      // Create family group and add family members if this is a family membership
      if (isFamily && familyMemberInputs.length > 0) {
        try {
          const familyName = `The ${trimmedName.split(' ').pop() || trimmedName} Family`;
          const familyId = await createFamily(user.id, familyName);
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
          // Don't block signup — family members can be added later
        }
      }

      localStorage.setItem('mtc-current-user', JSON.stringify(user));

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
      `}</style>
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

            {/* Google OAuth option (only for non-OAuth users — OAuth users already authenticated) */}
            {!isOAuthUser && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={async () => {
                    // Save membership type before redirecting to Google
                    localStorage.setItem('mtc-oauth-membership-type', signupData.membershipType);
                    const { error } = await signInWithGoogle('/signup?oauth=true');
                    if (error) setSignupError(error);
                  }}
                  className="w-full py-3.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3"
                  style={{ background: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </button>
                <div className="flex items-center gap-3 mt-5 mb-1">
                  <div className="flex-1 h-px" style={{ backgroundColor: '#e0dcd3' }} />
                  <span className="text-xs font-medium" style={{ color: '#999' }}>or continue with email</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#e0dcd3' }} />
                </div>
              </div>
            )}

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
              <p className="text-sm mt-3 text-center font-medium leading-relaxed rounded-xl" style={{ color: '#6b7a3d', background: 'rgba(107, 122, 61, 0.08)', padding: '10px 14px' }}>
                You&apos;ll sign in with Google or a magic email link — <strong style={{ color: '#2a2f1e' }}>no password needed</strong>.
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
                  setSignupError('');
                  goToStep(isFamily ? 3 : 4);
                }}
                disabled={!signupData.name.trim() || !signupData.email.trim()}
                className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={
                  signupData.name.trim() && signupData.email.trim()
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
                  <span className="font-bold text-lg" style={{ color: '#2a2f1e' }}>monotennis.payment@gmail.com</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('monotennis.payment@gmail.com');
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

        {/* Final Step: Confirmation */}
        {signupStep === totalSteps && (
          <div key={`step7-${animKey}`} className={`text-center ${stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-back'}`}>
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
                      { label: 'Skill Level', value: signupData.skillLevel ? signupData.skillLevel.charAt(0).toUpperCase() + signupData.skillLevel.slice(1) : 'Not set' },
                      ...(familyMemberInputs.filter(f => f.name.trim()).length > 0 ? [{ label: 'Family Members', value: familyMemberInputs.filter(f => f.name.trim()).map(f => f.name.trim()).join(', ') }] : []),
                      { label: 'Waiver', value: 'Signed' },
                    ].map((row, i, arr) => (
                      <div key={i} className="flex items-center justify-between py-2" style={i < arr.length - 1 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
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
                      { label: 'Skill Level', value: signupData.skillLevel ? signupData.skillLevel.charAt(0).toUpperCase() + signupData.skillLevel.slice(1) : 'Not set' },
                      ...(familyMemberInputs.filter(f => f.name.trim()).length > 0 ? [{ label: 'Family Members', value: familyMemberInputs.filter(f => f.name.trim()).map(f => f.name.trim()).join(', ') }] : []),
                      { label: 'Waiver', value: 'Signed' },
                    ].map((row, i, arr) => (
                      <div key={i} className="flex items-center justify-between py-2" style={i < arr.length - 1 ? { borderBottom: '1px solid #e0dcd3' } : {}}>
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
                <p className="text-xs mt-4" style={{ color: '#6b7266' }}>Your membership will be activated once payment is confirmed.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
