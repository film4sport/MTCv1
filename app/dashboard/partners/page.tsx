'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useSocial } from '../lib/store';
import { useToast } from '../lib/toast';
import DashboardHeader from '../components/DashboardHeader';
import { AvatarDisplay } from '../lib/avatars';
import Link from 'next/link';
import { generateId, useFocusTrap } from '../lib/utils';
import type { SkillLevel } from '../lib/types';

type FilterType = 'all' | 'singles' | 'doubles' | 'mixed';
type SkillFilter = 'all' | SkillLevel;

const SKILL_BADGES: Record<SkillLevel, { bg: string; color: string; label: string }> = {
  beginner: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', label: 'Beginner' },
  intermediate: { bg: 'rgba(59, 175, 218, 0.1)', color: '#3BAFDA', label: 'Intermediate' },
  advanced: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', label: 'Advanced' },
  competitive: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', label: 'Competitive' },
};

export default function PartnersPage() {
  const { currentUser } = useAuth();
  const { partners, addPartner, removePartner } = useSocial();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [showPost, setShowPost] = useState(false);
  const [postDate, setPostDate] = useState('');
  const [postTime, setPostTime] = useState('');
  const [postType, setPostType] = useState<'singles' | 'doubles' | 'mixed' | 'any'>('any');
  const [postSkillLevel, setPostSkillLevel] = useState<SkillLevel | 'any'>('any');
  const [postMessage, setPostMessage] = useState('');
  const postModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(postModalRef, showPost);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Esc key closes post modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && showPost) setShowPost(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPost]);

  const filtered = partners.filter(p => {
    if (filter !== 'all' && p.matchType !== filter && p.matchType !== 'any') return false;
    if (skillFilter !== 'all' && p.skillLevel && p.skillLevel !== skillFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen dashboard-gradient-bg">
      <DashboardHeader title="Find a Partner" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-slideUp space-y-5">
        <div className="dashboard-panel rounded-[32px] border p-5 sm:p-6 shadow-[0_28px_70px_rgba(31,40,23,0.14)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="dashboard-soft-pill mb-3 inline-flex">Matchmaking</span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em]" style={{ color: '#24301c' }}>
                Help members find the right game faster.
              </h2>
              <p className="mt-3 text-sm leading-6" style={{ color: '#6d685e' }}>
                Surface the right partner requests quickly, then move straight into messaging or booking.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:min-w-[320px]">
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(107,122,61,0.08)', border: '1px solid rgba(107,122,61,0.12)' }}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Open Posts</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: '#24301c' }}>{filtered.length}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.55)' }}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Format</p>
                <p className="mt-1 text-sm font-semibold capitalize" style={{ color: '#24301c' }}>{filter === 'all' ? 'All types' : filter}</p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,248,231,0.74)', border: '1px solid rgba(214,188,123,0.2)' }}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8c866f' }}>Level</p>
                <p className="mt-1 text-sm font-semibold capitalize" style={{ color: '#24301c' }}>{skillFilter === 'all' ? 'Any level' : skillFilter}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Post Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Match Type filters */}
            <div className="dashboard-panel flex items-center gap-1.5 p-1.5 rounded-2xl">
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
            <div className="dashboard-panel flex items-center gap-1.5 p-1.5 rounded-2xl">
              {(['all', 'beginner', 'intermediate', 'advanced', 'competitive'] as SkillFilter[]).map(s => (
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
          <div className="dashboard-panel text-center py-16 rounded-[30px] border animate-scaleIn shadow-[0_24px_52px_rgba(31,40,23,0.12)]">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="font-medium text-sm mb-1" style={{ color: '#2a2f1e' }}>No partners found</p>
            <p className="text-xs mb-4" style={{ color: '#6b7266' }}>Post a request and find someone to play with</p>
            <button onClick={() => setShowPost(true)} className="px-4 py-2 rounded-xl text-sm font-medium text-white btn-press" style={{ background: '#6b7a3d' }}>
              Post a Request
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const badge = p.skillLevel ? SKILL_BADGES[p.skillLevel] : null;
              return (
                <div key={p.id} className={`dashboard-panel rounded-[28px] border p-5 card-hover ${removingId === p.id ? 'animate-exit' : ''}`} style={{ boxShadow: '0 18px 40px rgba(31, 40, 23, 0.1)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatar={p.avatar} name={p.name} size={40} />
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: badge?.color ?? '#6b7a3d' }}>
                          {badge ? `Looking for ${badge.label}` : 'Any level'}
                        </p>
                      </div>
                    </div>
                    {badge ? (
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                        Any Level
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {p.date && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7266' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                        </svg>
                        {new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {p.time ? ` at ${p.time}` : ''}
                      </div>
                    )}
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
                    {p.message && (
                      <p className="text-xs italic mt-1" style={{ color: '#6b7266' }}>
                        &ldquo;{p.message}&rdquo;
                      </p>
                    )}
                  </div>

                  {p.userId === currentUser?.id ? (
                    <button
                      onClick={() => {
                        setRemovingId(p.id);
                        setTimeout(() => {
                          removePartner(p.id);
                          showToast('Partner request removed');
                          setRemovingId(null);
                        }, 280);
                      }}
                      className="block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md btn-press"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                      Cancel Request
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/messages?to=${p.userId}`}
                        className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md btn-press"
                        style={{ background: '#6b7a3d', color: '#fff' }}
                      >
                        Message
                      </Link>
                      <Link
                        href={`/dashboard/book?partner=${p.userId}&partnerName=${encodeURIComponent(p.name)}`}
                        className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md btn-press flex items-center justify-center gap-1"
                        style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d', border: '1px solid rgba(107, 122, 61, 0.2)' }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        Book
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Request Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowPost(false)} role="dialog" aria-modal="true" aria-labelledby="partner-modal-title">
          <div ref={postModalRef} className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <h3 id="partner-modal-title" className="font-semibold text-lg mb-4" style={{ color: '#2a2f1e' }}>Post Partner Request</h3>

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
                {[
                  { label: 'Morning', times: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'] },
                  { label: 'Afternoon', times: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'] },
                  { label: 'Evening', times: ['4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'] },
                ].map(group => {
                  const to24 = (t: string) => {
                    const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
                    if (!m) return '';
                    let h = parseInt(m[1]);
                    if (m[3] === 'PM' && h !== 12) h += 12;
                    if (m[3] === 'AM' && h === 12) h = 0;
                    return `${String(h).padStart(2, '0')}:${m[2]}`;
                  };
                  return (
                    <div key={group.label} className="mb-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9a9590' }}>{group.label}</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {group.times.map(t => {
                          const val24 = to24(t);
                          const active = postTime === val24;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setPostTime(active ? '' : val24)}
                              className="px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                              style={{
                                background: active ? '#6b7a3d' : 'rgba(245, 242, 235, 0.8)',
                                color: active ? '#fff' : '#6b7266',
                                border: `1px solid ${active ? '#6b7a3d' : '#e0dcd3'}`,
                              }}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPostTime('flexible')}
                  className="w-full mt-1 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: postTime === 'flexible' ? '#6b7a3d' : 'rgba(245, 242, 235, 0.8)',
                    color: postTime === 'flexible' ? '#fff' : '#6b7266',
                    border: `1px solid ${postTime === 'flexible' ? '#6b7a3d' : '#e0dcd3'}`,
                  }}
                >
                  I&apos;m Flexible — Any Time Works
                </button>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#2a2f1e' }}>Match Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['any', 'singles', 'doubles', 'mixed'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPostType(t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: postType === t ? '#6b7a3d' : 'rgba(245, 242, 235, 0.8)',
                        color: postType === t ? '#fff' : '#6b7266',
                        border: `1px solid ${postType === t ? '#6b7a3d' : '#e0dcd3'}`,
                      }}
                    >
                      {t === 'any' ? 'Any' : t === 'mixed' ? 'Mixed Doubles' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#2a2f1e' }}>Preferred Skill Level</label>
                <div className="flex flex-wrap gap-2">
                  {(['any', 'beginner', 'intermediate', 'advanced', 'competitive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPostSkillLevel(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: postSkillLevel === s ? '#6b7a3d' : 'rgba(245, 242, 235, 0.8)',
                        color: postSkillLevel === s ? '#fff' : '#6b7266',
                        border: `1px solid ${postSkillLevel === s ? '#6b7a3d' : '#e0dcd3'}`,
                      }}
                    >
                      {s === 'any' ? 'Any Level' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#2a2f1e' }}>Message <span className="text-xs font-normal" style={{ color: '#6b7266' }}>(optional)</span></label>
                <textarea
                  value={postMessage}
                  onChange={(e) => setPostMessage(e.target.value)}
                  placeholder="Looking for a rally partner..."
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 resize-none"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPost(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>Cancel</button>
              <button
                onClick={() => {
                  if (!postDate || !postTime) {
                    showToast('Please select a date and time preference', 'error');
                    return;
                  }
                  if (!currentUser) return;
                  // Prevent posting for past date+time
                  const postDateTime = new Date(postDate + 'T00:00:00');
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (postDateTime < today) {
                    showToast('Cannot post for a past date', 'error');
                    return;
                  }
                  if (postDateTime.getTime() === today.getTime() && postTime && postTime !== 'flexible') {
                    const [hours, minutes] = postTime.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                      const slotTime = new Date();
                      slotTime.setHours(hours, minutes, 0, 0);
                      if (slotTime < new Date()) {
                        showToast('Cannot post for a past time', 'error');
                        return;
                      }
                    }
                  }
                  const dateLabel = new Date(postDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeLabel = postTime === 'flexible' ? 'Flexible' : postTime;
                  const partner: import('../lib/types').Partner = {
                    id: generateId('p'),
                    userId: currentUser.id,
                    name: currentUser.name,
                    ntrp: currentUser.ntrp ?? 3.0,
                    skillLevel: postSkillLevel === 'any' ? undefined : postSkillLevel,
                    availability: dateLabel + (postTime === 'flexible' ? ' — Flexible time' : ' at ' + timeLabel),
                    matchType: postType,
                    date: postDate,
                    time: postTime,
                    avatar: currentUser.avatar,
                    message: postMessage.trim() || undefined,
                    status: 'available',
                  };
                  addPartner(partner);
                  setShowPost(false);
                  setPostDate('');
                  setPostTime('');
                  setPostType('any');
                  setPostSkillLevel('any');
                  setPostMessage('');
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
