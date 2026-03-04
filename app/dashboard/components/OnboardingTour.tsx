'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../lib/store';
import * as db from '../lib/db';

interface TourStep {
  title: string;
  body: string;
  target: string; // CSS selector or 'center' for modal
  position: 'bottom' | 'right' | 'center';
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
    body: 'Head to Settings to manage your notification preferences and access the MTC Court mobile app.',
    target: '[data-tour="settings"]',
    position: 'right',
  },
  {
    title: 'You\'re All Set!',
    body: 'That\'s the essentials. Explore at your own pace — check Events for upcoming socials and tournaments.',
    target: 'center',
    position: 'center',
  },
];

export default function OnboardingTour() {
  const { currentUser } = useApp();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      // Check localStorage first (fast), then Supabase preferences as fallback
      const key = `mtc-onboarding-done-${currentUser.id}`;
      if (localStorage.getItem(key) === 'true') return;
      // Also check Supabase preferences (synced across devices)
      const prefs = currentUser.preferences;
      if (prefs?.onboardingCompleted) {
        localStorage.setItem(key, 'true'); // cache locally
        return;
      }
    } catch { /* ignore */ }
    // Small delay so dashboard renders first
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);

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
    try {
      if (currentUser?.id) {
        localStorage.setItem(`mtc-onboarding-done-${currentUser.id}`, 'true');
        // Sync to Supabase so it persists across devices
        db.updateProfile(currentUser.id, { preferences: { ...(currentUser.preferences || {}), onboardingCompleted: true } }).catch(() => {});
      }
    } catch { /* ignore */ }
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
          width: isCenter ? 380 : 320,
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
        <p style={{ color: '#6b7a3d', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          {current.body}
        </p>

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
