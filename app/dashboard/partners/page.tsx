'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import Link from 'next/link';
import { generateId } from '../lib/utils';

type FilterType = 'all' | 'singles' | 'doubles' | 'mixed';
type SkillFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function PartnersPage() {
  const { partners, currentUser, addPartner, removePartner, showToast } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [showPost, setShowPost] = useState(false);
  const [postDate, setPostDate] = useState('');
  const [postTime, setPostTime] = useState('');
  const [postType, setPostType] = useState<'singles' | 'doubles' | 'mixed' | 'any'>('any');

  const getSkillLevel = (ntrp: number): SkillFilter => {
    if (ntrp <= 2.5) return 'beginner';
    if (ntrp <= 3.5) return 'intermediate';
    return 'advanced';
  };

  const getSkillBadge = (ntrp: number) => {
    const level = getSkillLevel(ntrp);
    const colors = {
      beginner: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' },
      intermediate: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
      advanced: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
    };
    return { ...colors[level], label: level.charAt(0).toUpperCase() + level.slice(1) };
  };

  const filtered = partners.filter(p => {
    if (filter !== 'all' && p.matchType !== filter && p.matchType !== 'any') return false;
    if (skillFilter !== 'all' && getSkillLevel(p.ntrp) !== skillFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Find a Partner" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-slideUp">

        {/* Filters + Post Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Match Type filters */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
              {(['all', 'singles', 'doubles', 'mixed'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: filter === f ? '#6b7a3d' : 'transparent',
                    color: filter === f ? '#fff' : '#6b7266',
                  }}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {/* Skill Level filters */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
              {(['all', 'beginner', 'intermediate', 'advanced'] as SkillFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSkillFilter(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: skillFilter === s ? '#6b7a3d' : 'transparent',
                    color: skillFilter === s ? '#fff' : '#6b7266',
                  }}
                >
                  {s === 'all' ? 'All Levels' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowPost(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: '#6b7a3d' }}
          >
            + Post Request
          </button>
        </div>

        {/* Partner Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <p className="text-sm" style={{ color: '#6b7266' }}>No partners match your filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const badge = getSkillBadge(p.ntrp);
              return (
                <div key={p.id} className="rounded-2xl border p-5 card-hover" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: '#6b7266' }}>NTRP {p.ntrp}</p>
                      </div>
                    </div>
                    <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7266' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {p.availability}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7266' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                      {p.matchType === 'any' ? 'Any format' : p.matchType.charAt(0).toUpperCase() + p.matchType.slice(1)}
                    </div>
                  </div>

                  {p.userId === currentUser?.id ? (
                    <button
                      onClick={() => {
                        removePartner(p.id);
                        showToast('Partner request removed');
                      }}
                      className="block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md btn-press"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                      Cancel Request
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/messages?to=${p.userId}`}
                      className="block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md btn-press"
                      style={{ background: '#6b7a3d', color: '#fff' }}
                    >
                      Message
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Request Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff' }}>
            <h3 className="font-semibold text-lg mb-4" style={{ color: '#2a2f1e' }}>Post Partner Request</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#2a2f1e' }}>Date</label>
                <input
                  type="date"
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#2a2f1e' }}>Time</label>
                <input
                  type="time"
                  value={postTime}
                  onChange={(e) => setPostTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#2a2f1e' }}>Match Type</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as typeof postType)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                >
                  <option value="any">Any</option>
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                  <option value="mixed">Mixed Doubles</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPost(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>Cancel</button>
              <button
                onClick={() => {
                  if (!postDate || !postTime) {
                    showToast('Please select a date and time', 'error');
                    return;
                  }
                  if (!currentUser) return;
                  const partner: import('../lib/types').Partner = {
                    id: generateId('p'),
                    userId: currentUser.id,
                    name: currentUser.name,
                    ntrp: currentUser.ntrp ?? 3.0,
                    availability: new Date(postDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + postTime,
                    matchType: postType,
                    date: postDate,
                    time: postTime,
                    status: 'available',
                  };
                  addPartner(partner);
                  setShowPost(false);
                  setPostDate('');
                  setPostTime('');
                  setPostType('any');
                  showToast('Partner request posted!');
                }}
                disabled={!postDate || !postTime}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: '#6b7a3d' }}
              >
                Post Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
