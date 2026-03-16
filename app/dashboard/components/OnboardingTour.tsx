'use client';

import { useState, useEffect } from 'react';
import { useAuth, apiCall } from '../lib/store';

interface TourStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  preview?: React.ReactNode;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to MTC Court',
    subtitle: 'Your tennis life, all in one place. Let\u2019s take a quick tour of what you can do.',
    iconBg: 'rgba(107, 122, 61, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    preview: (
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {[
          { label: 'Book', bg: '#d4e157', fg: '#0a0a0a', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
          { label: 'Partners', bg: '#6b7a3d', fg: '#fff', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> },
          { label: 'Events', bg: '#8b9a5e', fg: '#fff', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
          { label: 'Schedule', bg: '#1a1f12', fg: '#e8e4d9', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
        ].map(a => (
          <div key={a.label} style={{
            flex: 1, background: a.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center',
          }}>
            <svg width="16" height="16" fill="none" stroke={a.fg} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>{a.icon}</svg>
            <div style={{ fontSize: 10, fontWeight: 600, color: a.fg }}>{a.label}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Book a Court',
    subtitle: 'Reserve your court in seconds. Pick a date, time, and invite members to join you.',
    iconBg: 'rgba(212, 225, 87, 0.15)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
    preview: (
      <div style={{ background: 'rgba(107,122,61,0.06)', borderRadius: 12, padding: 14, marginTop: 8, border: '1px solid rgba(107,122,61,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ background: '#d4e157', borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 36 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#0a0a0a' }}>MAR</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', lineHeight: 1 }}>15</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f12' }}>Court 1</div>
            <div style={{ fontSize: 11, color: '#6b7266' }}>Sat, Mar 15 &bull; 9:30 AM</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(107,122,61,0.15)', color: '#6b7a3d', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>Confirmed</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['9:00', '9:30', '10:00', '10:30'].map((t, i) => (
            <div key={t} style={{
              flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, textAlign: 'center', fontWeight: 500,
              background: i === 1 ? '#6b7a3d' : 'rgba(255,255,255,0.8)',
              color: i === 1 ? '#fff' : '#6b7266',
              border: i === 1 ? 'none' : '1px solid rgba(107,122,61,0.1)',
            }}>{t}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Find a Partner',
    subtitle: 'Looking for someone to play with? Post a request or browse who\u2019s available this week.',
    iconBg: 'rgba(107, 122, 61, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    preview: (
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {[
          { name: 'Sarah M.', level: 'Intermediate', avail: 'Weekday mornings' },
          { name: 'Greg H.', level: 'Advanced', avail: 'Weekends' },
        ].map(p => (
          <div key={p.name} style={{
            flex: 1, background: 'rgba(107,122,61,0.06)', borderRadius: 12, padding: 12,
            border: '1px solid rgba(107,122,61,0.1)',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(107,122,61,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <svg width="14" height="14" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f12' }}>{p.name}</div>
            <div style={{ fontSize: 10, color: '#6b7266' }}>{p.level}</div>
            <div style={{ fontSize: 9, color: '#8a8578', marginTop: 2 }}>{p.avail}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Stay Connected',
    subtitle: 'Message members directly. Coordinate matches, share tips, or just say hello.',
    iconBg: 'rgba(107, 122, 61, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    preview: (
      <div style={{ background: 'rgba(107,122,61,0.04)', borderRadius: 12, padding: 12, marginTop: 8, border: '1px solid rgba(107,122,61,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { from: 'Sarah M.', msg: 'Want to play Thursday at 10?', time: '2m ago', align: 'left' as const },
          { from: 'You', msg: 'Sounds great! Court 2?', time: 'Just now', align: 'right' as const },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.align === 'right' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 11,
              background: m.align === 'right' ? '#6b7a3d' : 'rgba(255,255,255,0.9)',
              color: m.align === 'right' ? '#fff' : '#1a1f12',
              border: m.align === 'right' ? 'none' : '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 10, marginBottom: 2, opacity: 0.7 }}>{m.from}</div>
              {m.msg}
              <div style={{ fontSize: 8, opacity: 0.5, marginTop: 2, textAlign: 'right' as const }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Get the Mobile App',
    subtitle: 'MTC Court works as a native-feeling app on your phone or iPad \u2014 no App Store needed!',
    iconBg: 'rgba(107, 122, 61, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        <path d="M9 9l3-3 3 3M12 6v8"/>
      </svg>
    ),
    preview: (
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {[
          { device: 'iPhone / Android', steps: ['Open MTC Court App in Safari/Chrome', 'Tap the Share button', 'Select "Add to Home Screen"'] },
          { device: 'iPad / Tablet', steps: ['Open MTC Court App in Safari', 'Tap Share icon (box with arrow)', 'Select "Add to Home Screen"'] },
        ].map(d => (
          <div key={d.device} style={{
            flex: 1, background: 'rgba(107,122,61,0.06)', borderRadius: 12, padding: 12,
            border: '1px solid rgba(107,122,61,0.1)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f12', marginBottom: 6 }}>{d.device}</div>
            {d.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 3 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#6b7a3d', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                <span style={{ fontSize: 11, color: '#4a5528', lineHeight: 1.4 }}>{s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'You\u2019re All Set!',
    subtitle: 'Ready to hit the courts? Book your first session now, or explore at your own pace.',
    iconBg: 'rgba(107, 122, 61, 0.12)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    preview: (
      <a
        href="/dashboard/book"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: '#6b7a3d', color: '#faf8f3',
          borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(107, 122, 61, 0.3)',
          transition: 'all 0.2s', marginTop: 8,
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Book Your First Court
      </a>
    ),
  },
];

export default function OnboardingTour() {
  const { currentUser, isLoaded } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0); // triggers re-animation on step change

  const onboardingDone = currentUser?.preferences?.onboardingCompleted === true;

  useEffect(() => {
    if (!isLoaded || !currentUser?.id) return;
    if (onboardingDone) return;
    try {
      const key = `mtc-onboarding-done-${currentUser.id}`;
      if (localStorage.getItem(key) === 'true') return;
    } catch { /* ignore */ }
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [isLoaded, currentUser?.id, onboardingDone]);

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep(s => s + 1);
      setAnimKey(k => k + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(s => s - 1);
      setAnimKey(k => k + 1);
    }
  };

  const finish = () => {
    setVisible(false);
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`mtc-onboarding-done-${currentUser.id}`, 'true');
    } catch { /* localStorage full or blocked */ }
    apiCall('/api/mobile/members', 'PATCH', {
      preferences: { onboardingCompleted: true },
    }).catch((err) => {
      console.error('[OnboardingTour] Failed to save onboarding preference:', err);
    });
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes obFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes obSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes obIconPop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes obTextUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes obPreviewUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ob-icon-anim { animation: obIconPop 0.4s ease-out 0.1s both; }
        .ob-title-anim { animation: obTextUp 0.4s ease-out 0.2s both; }
        .ob-sub-anim { animation: obTextUp 0.4s ease-out 0.3s both; }
        .ob-preview-anim { animation: obPreviewUp 0.5s ease-out 0.35s both; }
        .ob-actions-anim { animation: obTextUp 0.3s ease-out 0.45s both; }
      ` }} />

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(26, 31, 18, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'obFadeIn 0.3s ease-out',
        }}
        onClick={finish}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed', zIndex: 9999,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 440, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          background: 'rgba(250, 248, 243, 0.85)',
          backdropFilter: 'blur(30px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.4)',
          borderRadius: 24,
          padding: '32px 28px 24px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,0.8)',
          animation: 'obSlideUp 0.4s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, justifyContent: 'center' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 28 : 8, height: 6, borderRadius: 3,
                backgroundColor: i === step ? '#6b7a3d' : 'rgba(107, 122, 61, 0.15)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          ))}
        </div>

        {/* Content — re-animated on step change */}
        <div key={animKey}>
          {/* Icon */}
          <div className="ob-icon-anim" style={{
            width: 56, height: 56, borderRadius: 16,
            background: current.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            {current.icon}
          </div>

          {/* Title */}
          <h3 className="ob-title-anim" style={{
            fontFamily: "'Gotham Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 500, fontSize: 22, color: '#1a1f12', marginBottom: 8, lineHeight: 1.2,
          }}>
            {current.title}
          </h3>

          {/* Subtitle */}
          <p className="ob-sub-anim" style={{
            fontSize: 14, lineHeight: 1.6, color: '#6b7266', marginBottom: 4,
          }}>
            {current.subtitle}
          </p>

          {/* Preview */}
          {current.preview && (
            <div className="ob-preview-anim">
              {current.preview}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ob-actions-anim" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(107, 122, 61, 0.1)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {!isFirst && (
              <button
                onClick={prev}
                style={{
                  background: 'none', border: 'none', color: '#6b7a3d', fontSize: 13,
                  cursor: 'pointer', padding: '4px 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                Back
              </button>
            )}
            <button
              onClick={finish}
              style={{
                background: 'none', border: 'none', color: '#8a8578', fontSize: 12,
                cursor: 'pointer', padding: '4px 0',
              }}
            >
              Skip tour
            </button>
          </div>
          <button
            onClick={next}
            style={{
              backgroundColor: '#6b7a3d', color: '#faf8f3', border: 'none',
              borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(107, 122, 61, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#5a6832'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#6b7a3d'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
