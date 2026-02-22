'use client';

import { useToast } from '../lib/toast';

const icons: Record<string, string> = {
  success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
};

const colors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
  error: { bg: '#fef2f2', border: '#fecaca', icon: '#ef4444', text: '#dc2626' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#2563eb' },
};

export default function Toast() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
      {toasts.map(toast => {
        const c = colors[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
            style={{ background: c.bg, borderColor: c.border, maxWidth: 360 }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke={c.icon} viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={icons[toast.type]} />
            </svg>
            <p className="text-sm font-medium" style={{ color: c.text }}>{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
