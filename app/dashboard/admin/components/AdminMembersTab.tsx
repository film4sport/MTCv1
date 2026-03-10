'use client';

import type { User } from '../../lib/types';
import { useMemo, useState, useCallback } from 'react';

interface AdminMembersTabProps {
  currentUser: User | null;
  members: User[];
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  onActionClick: (id: string, name: string, action: 'pause' | 'unpause' | 'cancel') => void;
  onSetCaptain?: (userId: string, captain: boolean) => void;
}

type SortKey = 'name' | 'role' | 'skill' | 'status' | 'since';
type SortDir = 'asc' | 'desc';

const SKILL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2, competitive: 3 };

function roleBadge(role: string) {
  const styles = {
    admin: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
    coach: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
    member: { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' },
  }[role] || { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold" style={styles}>
      {role}
    </span>
  );
}

function skillBadge(skill?: string) {
  if (!skill) return <span className="text-[10px]" style={{ color: '#999' }}>—</span>;
  const styles: Record<string, { bg: string; color: string }> = {
    beginner: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' },
    intermediate: { bg: 'rgba(59, 175, 218, 0.1)', color: '#3BAFDA' },
    advanced: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
    competitive: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
  };
  const s = styles[skill] || { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7266' };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium" style={s}>
      {skill}
    </span>
  );
}

function membershipBadge(type?: string) {
  const t = type || 'adult';
  const styles: Record<string, { bg: string; color: string }> = {
    family: { bg: 'rgba(147, 51, 234, 0.1)', color: '#7c3aed' },
    junior: { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' },
    adult: { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' },
  };
  const s = styles[t] || styles.adult;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium" style={s}>
      {t}
    </span>
  );
}

export default function AdminMembersTab({
  currentUser,
  members,
  memberSearch,
  onMemberSearchChange,
  onActionClick,
  onSetCaptain,
}: AdminMembersTabProps) {
  const [teamFilter, setTeamFilter] = useState<'all' | 'a' | 'b'>('all');
  const [residenceFilter, setResidenceFilter] = useState<'all' | 'mono' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'coach' | 'admin'>('all');
  const [skillFilter, setSkillFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'competitive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => (m.status || 'active') === 'active').length;
    const paused = members.filter(m => m.status === 'paused').length;
    const mono = members.filter(m => (m.residence || 'mono') === 'mono').length;
    const outOfTown = members.filter(m => m.residence === 'other').length;
    return { total, active, paused, mono, outOfTown };
  }, [members]);

  // Filter
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = memberSearch.toLowerCase();
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (teamFilter !== 'all' && m.interclubTeam !== teamFilter) return false;
      if (residenceFilter !== 'all' && (m.residence || 'mono') !== residenceFilter) return false;
      if (statusFilter !== 'all' && (m.status || 'active') !== statusFilter) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (skillFilter !== 'all' && m.skillLevel !== skillFilter) return false;
      return true;
    });
  }, [members, memberSearch, teamFilter, residenceFilter, statusFilter, roleFilter, skillFilter]);

  // Sort
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'role': cmp = a.role.localeCompare(b.role); break;
        case 'skill': cmp = (SKILL_ORDER[a.skillLevel || ''] ?? -1) - (SKILL_ORDER[b.skillLevel || ''] ?? -1); break;
        case 'status': cmp = (a.status || 'active').localeCompare(b.status || 'active'); break;
        case 'since': cmp = (a.memberSince || '').localeCompare(b.memberSince || ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredMembers, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return <span style={{ color: '#ccc', fontSize: 10 }}>↕</span>;
    return <span style={{ color: '#6b7a3d', fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  type FilterChip<T extends string> = { value: T; label: string };

  function renderFilterGroup<T extends string>(
    chips: FilterChip<T>[],
    active: T,
    onChange: (v: T) => void,
    accent: string
  ) {
    return chips.map(c => (
      <button
        key={c.value}
        onClick={() => onChange(c.value)}
        className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
        style={{
          background: active === c.value ? accent : `${accent}14`,
          color: active === c.value ? '#fff' : '#6b7266',
        }}
      >
        {c.label}
      </button>
    ));
  }

  return (
    <div>
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, accent: '#6b7a3d' },
          { label: 'Active', value: stats.active, accent: '#16a34a' },
          { label: 'Paused', value: stats.paused, accent: '#d97706' },
          { label: 'Mono', value: stats.mono, accent: '#6b7a3d' },
          { label: 'Out of Town', value: stats.outOfTown, accent: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: `${s.accent}0a`, border: `1px solid ${s.accent}1a` }}>
            <div className="text-lg font-bold" style={{ color: s.accent }}>{s.value}</div>
            <div className="text-[10px] font-medium" style={{ color: '#6b7266' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#999' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          type="text"
          value={memberSearch}
          onChange={(e) => onMemberSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search members"
          className="w-full max-w-md pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
          style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
        />
        {memberSearch && (
          <button onClick={() => onMemberSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#e0dcd3', color: '#6b7266', fontSize: 11 }}>✕</button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[10px] font-semibold uppercase mr-1" style={{ color: '#999', letterSpacing: '0.05em' }}>Status</span>
        {renderFilterGroup(
          [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }],
          statusFilter, setStatusFilter, '#6b7a3d'
        )}
        <span className="mx-1.5" style={{ borderLeft: '1px solid #e0dcd3', height: 16, display: 'inline-block' }} />

        <span className="text-[10px] font-semibold uppercase mr-1" style={{ color: '#999', letterSpacing: '0.05em' }}>Role</span>
        {renderFilterGroup(
          [{ value: 'all', label: 'All' }, { value: 'member', label: 'Members' }, { value: 'coach', label: 'Coaches' }, { value: 'admin', label: 'Admins' }],
          roleFilter, setRoleFilter, '#8b5cf6'
        )}
        <span className="mx-1.5" style={{ borderLeft: '1px solid #e0dcd3', height: 16, display: 'inline-block' }} />

        <span className="text-[10px] font-semibold uppercase mr-1" style={{ color: '#999', letterSpacing: '0.05em' }}>Team</span>
        {renderFilterGroup(
          [{ value: 'all', label: 'All' }, { value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
          teamFilter, setTeamFilter, '#3BAFDA'
        )}
        <span className="mx-1.5" style={{ borderLeft: '1px solid #e0dcd3', height: 16, display: 'inline-block' }} />

        <span className="text-[10px] font-semibold uppercase mr-1" style={{ color: '#999', letterSpacing: '0.05em' }}>Residence</span>
        {renderFilterGroup(
          [{ value: 'all', label: 'All' }, { value: 'mono', label: 'Mono' }, { value: 'other', label: 'Out of Town' }],
          residenceFilter, setResidenceFilter, '#3b82f6'
        )}
      </div>

      {/* Skill filter on second row if needed */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <span className="text-[10px] font-semibold uppercase mr-1" style={{ color: '#999', letterSpacing: '0.05em' }}>Skill</span>
        {renderFilterGroup(
          [{ value: 'all', label: 'All' }, { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }, { value: 'competitive', label: 'Competitive' }],
          skillFilter, setSkillFilter, '#d97706'
        )}
      </div>

      {/* ── Sort Bar ── */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <span className="text-[10px] font-semibold uppercase" style={{ color: '#999', letterSpacing: '0.05em' }}>Sort by</span>
        {([['name', 'Name'], ['role', 'Role'], ['skill', 'Skill'], ['status', 'Status'], ['since', 'Since']] as [SortKey, string][]).map(([key, label]) => (
          <button key={key} onClick={() => handleSort(key)} className="text-[11px] font-medium flex items-center gap-1 transition-colors" style={{ color: sortKey === key ? '#6b7a3d' : '#999' }}>
            {label} {sortArrow(key)}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: '#999' }}>
          {filteredMembers.length} of {members.length}
        </span>
      </div>

      {/* ── Member Cards ── */}
      <div className="space-y-2">
        {sortedMembers.map(m => {
          const isExpanded = expandedId === m.id;
          const isActive = (m.status || 'active') === 'active';
          const isSelf = m.id === currentUser?.id;
          const isAdmin = m.role === 'admin';
          const hasTeam = m.interclubTeam && m.interclubTeam !== 'none';

          return (
            <div
              key={m.id}
              className="rounded-xl border transition-all"
              style={{
                background: isExpanded ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
                borderColor: isExpanded ? 'rgba(107,122,61,0.2)' : 'rgba(255,255,255,0.5)',
                boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              {/* Primary row — always visible, clickable */}
              <button
                onClick={() => toggleExpand(m.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                aria-expanded={isExpanded}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                  {m.name.split(' ').map((n: string) => n[0]).join('')}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate" style={{ color: '#2a2f1e' }}>{m.name}</span>
                    {roleBadge(m.role)}
                    {/* Status dot */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      title={isActive ? 'Active' : 'Paused'}
                      style={{ background: isActive ? '#16a34a' : '#d97706' }}
                    />
                    {m.interclubCaptain && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>CAPT</span>
                    )}
                  </div>
                  {/* Secondary info line */}
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs truncate" style={{ color: '#999' }}>{m.email}</span>
                    <span style={{ color: '#ddd' }}>·</span>
                    {membershipBadge(m.membershipType)}
                    {skillBadge(m.skillLevel)}
                    {hasTeam && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                        background: m.interclubTeam === 'a' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(59, 175, 218, 0.1)',
                        color: m.interclubTeam === 'a' ? '#6b7a3d' : '#3BAFDA',
                      }}>
                        Team {m.interclubTeam!.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand chevron */}
                <svg
                  className="w-4 h-4 flex-shrink-0 transition-transform"
                  style={{ color: '#999', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-0 border-t" style={{ borderColor: '#f0ede6' }}>
                  <div className="flex flex-wrap gap-x-8 gap-y-2 py-3 text-xs" style={{ color: '#6b7266' }}>
                    <div>
                      <span className="font-semibold" style={{ color: '#999' }}>Residence: </span>
                      <span className="font-medium" style={{ color: m.residence === 'other' ? '#3b82f6' : '#6b7a3d' }}>
                        {m.residence === 'other' ? 'Out of Town' : 'Mono'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold" style={{ color: '#999' }}>Member Since: </span>
                      <span>{m.memberSince || '—'}</span>
                    </div>
                    <div>
                      <span className="font-semibold" style={{ color: '#999' }}>Status: </span>
                      <span style={{ color: isActive ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                        {isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    {hasTeam && (
                      <div>
                        <span className="font-semibold" style={{ color: '#999' }}>Team: </span>
                        <span style={{ color: m.interclubTeam === 'a' ? '#6b7a3d' : '#3BAFDA', fontWeight: 600 }}>
                          {m.interclubTeam!.toUpperCase()}
                          {m.interclubCaptain ? ' (Captain)' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isSelf && !isAdmin && (
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: '#f0ede6' }}>
                      {hasTeam && onSetCaptain && (
                        <button
                          onClick={() => onSetCaptain(m.id, !m.interclubCaptain)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                          style={{
                            background: m.interclubCaptain ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 122, 61, 0.06)',
                            color: m.interclubCaptain ? '#d97706' : '#6b7266',
                          }}
                          title={m.interclubCaptain ? 'Remove captain' : 'Set as captain'}
                        >
                          {m.interclubCaptain ? '★ Remove Captain' : '☆ Set Captain'}
                        </button>
                      )}
                      {isActive ? (
                        <button
                          onClick={() => onActionClick(m.id, m.name, 'pause')}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                          style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#d97706' }}
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => onActionClick(m.id, m.name, 'unpause')}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                          style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#16a34a' }}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => onActionClick(m.id, m.name, 'cancel')}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                        style={{ background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444' }}
                      >
                        Cancel Membership
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sortedMembers.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: '#999' }}>
            No members match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
