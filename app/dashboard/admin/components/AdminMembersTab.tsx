'use client';

import type { User } from '../../lib/types';
import { useMemo } from 'react';

interface AdminMembersTabProps {
  currentUser: User | null;
  members: User[];
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  onActionClick: (id: string, name: string, action: 'pause' | 'unpause' | 'cancel') => void;
}

export default function AdminMembersTab({
  currentUser,
  members,
  memberSearch,
  onMemberSearchChange,
  onActionClick,
}: AdminMembersTabProps) {
  const filteredMembers = useMemo(
    () => members.filter(m =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
    ),
    [members, memberSearch]
  );

  return (
    <div>
      <input
        type="text"
        value={memberSearch}
        onChange={(e) => onMemberSearchChange(e.target.value)}
        placeholder="Search members..."
        aria-label="Search members"
        className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 mb-4"
        style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
      />
      <div className="glass-card rounded-2xl border overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#faf8f3' }}>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Membership</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Skill</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Since</th>
              <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#6b7266' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(m => (
              <tr key={m.id} className="border-t" style={{ borderColor: '#f0ede6' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                      {m.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#6b7266' }}>{m.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium" style={{
                    background: m.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : m.role === 'coach' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                    color: m.role === 'admin' ? '#dc2626' : m.role === 'coach' ? '#d97706' : '#6b7a3d',
                  }}>
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{
                    background: m.membershipType === 'family' ? 'rgba(147, 51, 234, 0.1)' : m.membershipType === 'junior' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                    color: m.membershipType === 'family' ? '#7c3aed' : m.membershipType === 'junior' ? '#2563eb' : '#6b7a3d',
                  }}>
                    {m.membershipType || 'adult'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{
                    background: m.skillLevel === 'beginner' ? 'rgba(34, 197, 94, 0.1)' : m.skillLevel === 'intermediate' ? 'rgba(59, 175, 218, 0.1)' : m.skillLevel === 'advanced' ? 'rgba(245, 158, 11, 0.1)' : m.skillLevel === 'competitive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 122, 61, 0.1)',
                    color: m.skillLevel === 'beginner' ? '#16a34a' : m.skillLevel === 'intermediate' ? '#3BAFDA' : m.skillLevel === 'advanced' ? '#d97706' : m.skillLevel === 'competitive' ? '#dc2626' : '#6b7266',
                  }}>
                    {m.skillLevel || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    background: (m.status || 'active') === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: (m.status || 'active') === 'active' ? '#16a34a' : '#d97706',
                  }}>
                    {(m.status || 'active') === 'active' ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#6b7266' }}>{m.memberSince || '—'}</td>
                <td className="px-4 py-3 text-right">
                  {m.id !== currentUser?.id && m.role !== 'admin' && (
                    <div className="flex items-center justify-end gap-1.5">
                      {(m.status || 'active') === 'active' ? (
                        <button
                          onClick={() => onActionClick(m.id, m.name, 'pause')}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-amber-50"
                          style={{ color: '#d97706' }}
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => onActionClick(m.id, m.name, 'unpause')}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-green-50"
                          style={{ color: '#16a34a' }}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => onActionClick(m.id, m.name, 'cancel')}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: '#ef4444' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
