'use client';

import type { Announcement } from '../../lib/types';

interface AdminAnnouncementsTabProps {
  announcements: Announcement[];
  newAnnouncement: string;
  newAnnouncementType: 'info' | 'warning' | 'urgent';
  onAnnouncementChange: (value: string) => void;
  onAnnouncementTypeChange: (value: 'info' | 'warning' | 'urgent') => void;
  onAddAnnouncement: () => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function AdminAnnouncementsTab({
  announcements,
  newAnnouncement,
  newAnnouncementType,
  onAnnouncementChange,
  onAnnouncementTypeChange,
  onAddAnnouncement,
  onDeleteAnnouncement,
}: AdminAnnouncementsTabProps) {
  return (
    <div className="space-y-4">
      {/* New Announcement */}
      <div className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
        <h4 className="font-medium text-sm mb-3" style={{ color: '#2a2f1e' }}>New Announcement</h4>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={newAnnouncement}
            onChange={(e) => onAnnouncementChange(e.target.value)}
            placeholder="Write an announcement..."
            aria-label="Announcement message"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
            style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
          />
          <select
            value={newAnnouncementType}
            onChange={(e) => onAnnouncementTypeChange(e.target.value as typeof newAnnouncementType)}
            className="px-3 py-2 rounded-xl text-sm border focus:outline-none"
            style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={onAddAnnouncement}
            disabled={!newAnnouncement.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#6b7a3d' }}
          >
            Post
          </button>
        </div>
      </div>

      {/* Existing Announcements */}
      {announcements.map(a => (
        <div key={a.id} className="glass-card rounded-2xl border p-4 flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{a.type === 'urgent' ? '🔴' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <p className="text-sm" style={{ color: '#2a2f1e' }}>{a.text}</p>
              <p className="text-xs" style={{ color: '#6b7266' }}>{a.date}</p>
            </div>
          </div>
          <button
            onClick={() => onDeleteAnnouncement(a.id)}
            className="text-xs px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
            style={{ color: '#ef4444' }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
