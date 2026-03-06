'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../lib/store';
import * as db from '../lib/db';

interface TourStep {
  title: string;
  body: string;
  richBody?: React.ReactNode; // Optional JSX body (overrides plain text body)
  target: string; // CSS selector or 'center' for modal
  position: 'bottom' | 'right' | 'center';
  wide?: boolean; // Extra width for richer content
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to MTC Court!',
    body: 'Let\'s take a quick look around your dashboard. This is where you\'ll manage everything — courts, events, and more.',
    target: 'center',
    position: 'center',
  },
  {
    title: 'Book a Court',
    body: 'Reserve a court in seconds. Pick your date, time, and invite other members to join.',
    target: '[data-tour="book-court"]',
    position: 'bottom',
  },
  {
    title: 'Find a Partner',
    body: 'Looking for someone to play with? Post a request or browse who\'s available.',
    target: '[data-tour="find-partner"]',
    position: 'bottom',
  },
  {
    title: 'Stay Connected',
    body: 'Message other members directly. Coordinate matches, share tips, or just say hello.',
    target: '[data-tour="messages"]',
    position: 'right',
  },
  {
    title: 'Your Preferences',
    body: 'Head to Settings to manage your notification preferences and account details.',
    target: '[data-tour="settings"]',
    position: 'right',
  },
  {
    title: 'Get the App',
    body: '',
    richBody: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: '#6b7a3d', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          MTC Court works as a native-feeling app on your phone or iPad — no App Store needed!
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Phone */}
          <div style={{ flex: 1, background: 'rgba(107, 122, 61, 0.08)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="20" height="20" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span style={{ fontWeight: 600, color: '#1a1f12', fontSize: 13 }}>iPhone / Android</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: '#4a5528', fontSize: 12, lineHeight: 1.8 }}>
              <li>Open <a href="/mobile-app/index.html" target="_blank" rel="noopener" style={{ color: '#6b7a3d', fontWeight: 600 }}>MTC Court App</a> in Safari/Chrome</li>
              <li>Tap the <strong>Share</strong> button</li>
              <li>Select <strong>&quot;Add to Home Screen&quot;</strong></li>
            </ol>
          </div>
          {/* iPad */}
          <div style={{ flex: 1, background: 'rgba(107, 122, 61, 0.08)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="20" height="20" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span style={{ fontWeight: 600, color: '#1a1f12', fontSize: 13 }}>iPad / Tablet</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: '#4a5528', fontSize: 12, lineHeight: 1.8 }}>
              <li>Open <a href="/mobile-app/index.html" target="_blank" rel="noopener" style={{ color: '#6b7a3d', fontWeight: 600 }}>MTC Court App</a> in Safari</li>
              <li>Tap the <strong>Share</strong> icon (box with arrow)</li>
              <li>Select <strong>&quot;Add to Home Screen&quot;</strong></li>
            </ol>
          </div>
        </div>
      </div>
    ),
    target: 'center',
    position: 'center',
    wide: true,
  },
  {
    title: 'You\'re All Set!',
    body: 'That\'s the essentials. Explore at your own pace — check Events for upcoming socials and tournaments.',
    target: 'center',
    position: 'center',
  },
];

export default function OnboardingTour() {
  const { currentUser, isLoaded } = useApp();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  // Derive onboarding status outside useEffect so we can use it as a stable dependency
  const onboardingDone = currentUser?.preferences?.onboardingCompleted === true;

  useEffect(() => {
    // Wait for Supabase data to load so preferences are populated
    if (!isLoaded || !currentUser?.id) return;
    // Already completed — never show again
    if (onboardingDone) return;
    try {
      // Check localStorage (fast cross-session cache)
      const key = `mtc-onboarding-done-${currentUser.id}`;
      if (localStorage.getItem(key) === 'true') return;
    } catch { /* ignore */ }
    // Small delay so dashboard renders first
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [isLoaded, currentUser?.id, onboardingDone]);

  const positionTooltip = useCallback(() => {
    const current = STEPS[step];
    if (!current || current.target === 'center') {
      setTooltipPos(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (!el) { setTooltipPos(null); return; }
    const rect = el.getBoundingClientRect();
    if (current.position === 'bottom') {
      setTooltipPos({ top: rect.bottom + 12, left: Math.max(16, rect.left) });
    } else if (current.position === 'right') {
      setTooltipPos({ top: rect.top, left: rect.right + 12 });
    }
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
  }, [visible, step, positionTooltip]);

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep(s => s + 1);
    }
  };

  const finish = () => {
    setVisible(false);
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`mtc-onboarding-done-${currentUser.id}`, 'true');
    } catch { /* localStorage full or blocked */ }
    // Sync to Supabase so it persists across devices/browsers
    db.updateProfile(currentUser.id, {
      preferences: { ...(currentUser.preferences || {}), onboardingCompleted: true },
    }).catch((err) => {
      console.error('[OnboardingTour] Failed to save onboarding preference:', err);
    });
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isCenter = current.target === 'center';
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(26, 31, 18, 0.6)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.3s',
        }}
        onClick={finish}
      />

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          ...(isCenter
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : tooltipPos
              ? { top: tooltipPos.top, left: tooltipPos.left }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          ),
          width: current.wide ? 520 : isCenter ? 380 : 320,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#faf8f3',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(107, 122, 61, 0.2)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === step ? '#6b7a3d' : 'rgba(107, 122, 61, 0.2)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        <h3 style={{ color: '#1a1f12', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {current.title}
        </h3>
        {current.richBody ? (
          <div style={{ marginBottom: 20 }}>{current.richBody}</div>
        ) : (
          <p style={{ color: '#6b7a3d', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            {current.body}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={finish}
            style={{
              background: 'none', border: 'none', color: '#6b7a3d', fontSize: 13,
              cursor: 'pointer', padding: '4px 0', opacity: 0.7,
            }}
          >
            Skip tour
          </button>
          <button
            onClick={next}
            style={{
              backgroundColor: '#6b7a3d', color: '#faf8f3', border: 'none',
              borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', transition: 'background-color 0.2s',
            }}
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
