import { downloadICS } from '../../lib/calendar';

interface SuccessModalProps {
  courtName: string;
  date: string;
  time: string;
  participants?: { id: string; name: string }[];
  onClose: () => void;
}

export default function SuccessModal({ courtName, date, time, participants, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-sm text-center animate-scaleIn" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
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
        <h3 className="font-semibold text-lg mb-1" style={{ color: '#2a2f1e' }}>Booked!</h3>
        <p className="text-sm mb-2" style={{ color: '#6b7266' }}>
          {courtName} on{' '}
          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
          at {time}
        </p>
        {participants && participants.length > 0 && (
          <p className="text-xs mb-4" style={{ color: '#6b7a3d' }}>
            With: {participants.map(p => p.name).join(', ')}
          </p>
        )}
        {!(participants && participants.length > 0) && <div className="mb-4" />}
        <div className="flex gap-3">
          <button
            onClick={() => {
              downloadICS([{
                title: `Tennis — ${courtName}`,
                date,
                time,
                duration: 60,
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
