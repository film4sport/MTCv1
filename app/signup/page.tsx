'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '../dashboard/lib/auth';
import { sendWelcomeMessage, createFamily, addFamilyMember } from '../dashboard/lib/db';
import { membershipTypes, signupMembershipTypes, waiverText, acknowledgementText } from '../info/data';

export default function SignupPage() {
  const router = useRouter();
  const waiverRef = useRef<HTMLDivElement>(null);
  const ackRef = useRef<HTMLDivElement>(null);

  const [signupStep, setSignupStep] = useState(1);
  const [redirectCount, setRedirectCount] = useState(5);
  const [signupData, setSignupData] = useState({ membershipType: '', name: '', email: '', password: '', skillLevel: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverScrolled, setWaiverScrolled] = useState(false);
  const [ackScrolled, setAckScrolled] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ name: string; email: string; role?: string; status?: string } | null>(null);
  const [familyMemberInputs, setFamilyMemberInputs] = useState<{ name: string; type: 'adult' | 'junior'; birthYear: string }[]>([]);
  const isFamily = signupData.membershipType === 'family';
  const totalSteps = isFamily ? 7 : 6;

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

  // Auto-redirect to dashboard after signup completion (skip if email verification pending)
  useEffect(() => {
    if (signupStep !== totalSteps || emailConfirmPending) return;
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
  }, [signupStep, totalSteps, router, emailConfirmPending]);

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
      const { user, error, emailConfirmRequired } = await signUp(trimmedEmail, signupData.password, trimmedName, signupData.membershipType, signupData.skillLevel || undefined);
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
        setSignupStep(totalSteps);
        return;
      }

      let loggedInUser = await signIn(trimmedEmail, signupData.password);
      if (!loggedInUser) {
        await new Promise(r => setTimeout(r, 1500));
        loggedInUser = await signIn(trimmedEmail, signupData.password);
      }
      if (!loggedInUser) {
        console.error('[MTC] signIn after signUp returned null — profile may not be ready yet');
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

      localStorage.setItem('mtc-current-user', JSON.stringify(loggedInUser || user));

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
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`${totalSteps > 6 ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'} rounded-full flex items-center justify-center text-xs font-bold transition-colors`}
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
              {step < totalSteps && (
                <div className={`${totalSteps > 6 ? 'w-4 sm:w-6' : 'w-6 sm:w-8'} h-0.5`} style={{ backgroundColor: signupStep > step ? '#6b7a3d' : '#e0dcd3' }} />
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    maxLength={100}
                    placeholder="Min. 8 chars, uppercase, lowercase & number"
                    aria-required="true"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-colors"
                    style={{ backgroundColor: '#faf8f3', border: '1px solid #e0dcd3', color: '#2a2f1e' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
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
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#6b7266' }}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={100}
                    placeholder="Re-enter your password"
                    aria-required="true"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: '#faf8f3',
                      border: `1px solid ${confirmPassword && confirmPassword !== signupData.password ? '#ef4444' : '#e0dcd3'}`,
                      color: '#2a2f1e',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: '#6b7266' }}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== signupData.password && (
                  <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>Passwords do not match</p>
                )}
              </div>
            </div>
            {signupError && signupStep === 2 && (
              <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>{signupError}</p>
            )}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => { setSignupError(''); setSignupStep(1); }}
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
                  if (confirmPassword !== signupData.password) {
                    setSignupError('Passwords do not match');
                    return;
                  }
                  setSignupError('');
                  setSignupStep(isFamily ? 3 : 4);
                }}
                disabled={!signupData.name.trim() || !signupData.email.trim() || signupData.password.length < 8 || confirmPassword !== signupData.password}
                className="flex-1 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={
                  signupData.name.trim() && signupData.email.trim() && signupData.password.length >= 8 && confirmPassword === signupData.password
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
          <div>
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
                onClick={() => setSignupStep(2)}
                className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
              >
                Back
              </button>
              <button
                onClick={() => setSignupStep(4)}
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
          <div>
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
                  onClick={() => setSignupData({ ...signupData, skillLevel: level.value })}
                  className="p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
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
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => { setSignupStep(isFamily ? 3 : 2); }}
                className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
              >
                Back
              </button>
              <button
                onClick={() => setSignupStep(5)}
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
                onClick={() => { setSignupError(''); setSignupStep(4); }}
                className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                style={{ backgroundColor: '#faf8f3', color: '#6b7266', border: '1px solid #e0dcd3' }}
              >
                Back
              </button>
              <button
                onClick={() => { setWaiverAccepted(true); setSignupStep(6); }}
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
          <div>
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
                onClick={() => { setSignupError(''); setSignupStep(5); }}
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
                <p className="text-xs mt-4" style={{ color: '#6b7266' }}>Redirecting to dashboard in {redirectCount}...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
