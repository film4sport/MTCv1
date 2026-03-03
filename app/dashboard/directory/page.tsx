'use client';

import { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import Link from 'next/link';
import type { SkillLevel } from '../lib/types';

const SKILL_FILTERS: { label: string; value: SkillLevel | 'all' }[] = [
  { label: 'All Levels', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Competitive', value: 'competitive' },
];

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a' },
  intermediate: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb' },
  advanced: { bg: 'rgba(168, 85, 247, 0.1)', text: '#7c3aed' },
  competitive: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
};

export default function DirectoryPage() {
  const { members, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<SkillLevel | 'all'>('all');

  const filteredMembers = useMemo(() => {
    return members
      .filter(m => m.status !== 'paused')
      .filter(m => m.id !== currentUser?.id) // Don't show yourself
      .filter(m => {
        if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (skillFilter !== 'all' && m.skillLevel && m.skillLevel !== skillFilter) return false;
        if (skillFilter !== 'all' && !m.skillLevel) return false; // Hide members without skill level when filtering
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, currentUser, search, skillFilter]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Members" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6b7a3d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors"
              style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3', color: '#1a1f12' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {SKILL_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setSkillFilter(f.value)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={skillFilter === f.value
                  ? { backgroundColor: '#6b7a3d', color: '#faf8f3' }
                  : { backgroundColor: 'rgba(107, 122, 61, 0.08)', color: '#6b7a3d' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Member count */}
        <p className="text-sm" style={{ color: '#6b7a3d' }}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </p>

        {/* Member Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
            <p className="text-sm" style={{ color: '#6b7a3d' }}>No members found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map(member => {
              const skill = member.skillLevel;
              const colors = skill ? SKILL_COLORS[skill] : null;

              return (
                <div
                  key={member.id}
                  className="rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#e0dcd3' }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                      style={{ backgroundColor: '#6b7a3d', color: '#faf8f3' }}
                    >
                      {getInitials(member.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate" style={{ color: '#1a1f12' }}>
                          {member.name}
                        </h3>
                        {member.role !== 'member' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: member.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: member.role === 'admin' ? '#dc2626' : '#2563eb',
                            }}
                          >
                            {member.role === 'admin' ? 'Admin' : 'Coach'}
                          </span>
                        )}
                        {member.membershipType === 'family' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', color: '#7c3aed' }}
                          >
                            Family
                          </span>
                        )}
                      </div>

                      {/* Skill Level */}
                      {skill && colors && (
                        <span
                          className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-1"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </span>
                      )}

                      {/* Member since */}
                      {member.memberSince && (
                        <p className="text-[11px] mt-1" style={{ color: 'rgba(107, 122, 61, 0.6)' }}>
                          Member since {member.memberSince}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message button */}
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/dashboard/messages?to=${member.id}`}
                      className="text-xs px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}
                    >
                      Message
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
