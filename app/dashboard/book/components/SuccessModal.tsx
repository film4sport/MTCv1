import { useEffect, useRef } from 'react';
import { downloadICS } from '../../lib/calendar';
import { useFocusTrap } from '../../lib/utils';
import { getTimeRange, formatDuration } from './booking-utils';
import { BOOKING_RULES } from '../../lib/types';

interface SuccessModalProps {
  courtName: string;
  date: string;
  time: string;
  duration?: number;
  matchType?: 'singles' | 'doubles';
  participants?: { id: string; name: string }[];
  onClose: () => void;
}

export default function SuccessModal({ courtName, date, time, duration, matchType, participants, onClose }: SuccessModalProps) {
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Full-screen confetti burst
  useEffect(() => {
    const colors = ['#6b7a3d', '#d4e157', '#16a34a', '#fbbf24', '#c8d943', '#e8e4d9'];
    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.className = 'dash-confetti-piece';
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = `${-10 - Math.random() * 20}px`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDelay = `${Math.random() * 0.4}s`;
      el.style.animationDuration = `${2 + Math.random() * 1.5}s`;
      el.style.width = `${6 + Math.random() * 6}px`;
      el.style.height = `${6 + Math.random() * 6}px`;
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(el);
      pieces.push(el);
    }
    const timer = setTimeout(() => pieces.forEach(p => p.remove()), 4000);
    return () => { clearTimeout(timer); pieces.forEach(p => p.remove()); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
      <div ref={trapRef} className="rounded-2xl p-6 w-full max-w-sm text-center animate-scaleIn" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
        {/* Confetti burst */}
        <div className="relative w-full h-0 overflow-visible pointer-events-none">
          {['#6b7a3d', '#d4e157', '#16a34a', '#fbbf24', '#6b7a3d', '#d4e157'].map((color, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti-fall"
              style={{
                backgroundColor: color,
                left: `${15 + i * 14}%`,
                top: -10,
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${1.5 + i * 0.2}s`,
                ['--rotate' as string]: `${360 + i * 120}deg`,
              }}
            />
          ))}
        </div>
        <div className="success-circle w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
          <svg className="w-8 h-8" fill="none" stroke="#16a34a" viewBox="0 0 24 24" strokeWidth="2">
            <path className="success-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 id="success-modal-title" className="font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Booked!</h3>
        <p className="text-sm mb-1" style={{ color: '#6b7266' }}>
          {courtName} on{' '}
          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-sm mb-2" style={{ color: '#2a2f1e', fontWeight: 500 }}>
          {getTimeRange(time, duration)} {matchType && duration ? `· ${matchType === 'singles' ? 'Singles' : 'Doubles'} · ${formatDuration(duration)}` : ''}
        </p>
        <div className="mb-4" />
        <div className="flex gap-3">
          <button
            onClick={() => {
              downloadICS([{
                title: `Tennis ${matchType ? (matchType === 'singles' ? 'Singles' : 'Doubles') : ''} — ${courtName}`,
                date,
                time,
                duration: duration ? duration * BOOKING_RULES.slotMinutes : 60,
                location: `${courtName} — Mono Tennis Club`,
              }], 'mtc-booking.ics');
            }}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
            style={{ background: '#6b7a3d' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
