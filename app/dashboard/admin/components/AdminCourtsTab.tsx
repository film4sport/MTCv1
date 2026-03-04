'use client';

import type { Court } from '../../lib/types';

interface AdminCourtsTabProps {
  courts: Court[];
  onToggleMaintenance: (courtId: number) => void;
}

export default function AdminCourtsTab({
  courts,
  onToggleMaintenance,
}: AdminCourtsTabProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {courts.map(court => (
        <div key={court.id} className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium" style={{ color: '#2a2f1e' }}>{court.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium`} style={{
              background: court.status === 'maintenance' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              color: court.status === 'maintenance' ? '#dc2626' : '#16a34a',
            }}>
              {court.status === 'maintenance' ? 'Closed' : 'Active'}
            </span>
          </div>
          <div className="space-y-2 text-sm mb-4" style={{ color: '#6b7266' }}>
            <p>Floodlight: {court.floodlight ? 'Yes' : 'No'}</p>
            <p>Closes: {court.floodlight ? '10:00 PM' : '8:00 PM'}</p>
          </div>
          <button
            onClick={() => onToggleMaintenance(court.id)}
            className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: court.status === 'maintenance' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: court.status === 'maintenance' ? '#16a34a' : '#dc2626',
            }}
          >
            {court.status === 'maintenance' ? 'Reopen Court' : 'Close Court'}
          </button>
        </div>
      ))}
    </div>
  );
}
