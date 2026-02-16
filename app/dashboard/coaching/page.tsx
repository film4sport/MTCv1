'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';
import { COURTS_CONFIG, TIME_SLOTS } from '../lib/types';
import type { CoachingProgram } from '../lib/types';

type Tab = 'programs' | 'create' | 'enrollments';

export default function CoachingPanelPage() {
  const { currentUser, programs, addProgram, cancelProgram, bookings, showToast, members } = useApp();
  const [tab, setTab] = useState<Tab>('programs');

  // Form state
  const [title, setTitle] = useState('');
  const [programType, setProgramType] = useState<'clinic' | 'camp'>('clinic');
  const [courtId, setCourtId] = useState(1);
  const [fee, setFee] = useState('');
  const [spots, setSpots] = useState('');
  const [description, setDescription] = useState('');
  // Clinic: individual sessions
  const [clinicSessions, setClinicSessions] = useState<{ date: string; time: string }[]>([{ date: '', time: '10:00 AM' }]);
  // Camp: start date + number of days
  const [campStart, setCampStart] = useState('');
  const [campDays, setCampDays] = useState('5');
  const [campTime, setCampTime] = useState('9:30 AM');
  const [duration, setDuration] = useState('90');
  // Enrollment viewer
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  const isCoachOrAdmin = currentUser?.role === 'coach' || currentUser?.role === 'admin';

  if (!isCoachOrAdmin) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
        <DashboardHeader title="Coaching Panel" />
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: '#6b7266' }}>You do not have access to this page.</p>
        </div>
      </div>
    );
  }

  const myPrograms = programs.filter(p => p.coachId === currentUser?.id);
  const court = COURTS_CONFIG.find(c => c.id === courtId);

  const checkConflicts = (sessions: { date: string; time: string }[]): string | null => {
    for (const s of sessions) {
      const conflict = bookings.find(b => b.courtId === courtId && b.date === s.date && b.time === s.time && b.status === 'confirmed');
      if (conflict) return `Conflict: ${court?.name || 'Court'} on ${s.date} at ${s.time} is already booked.`;
    }
    return null;
  };

  const handleCreate = () => {
    if (!title.trim() || !fee || !spots) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    let sessions: { date: string; time: string; duration: number }[] = [];
    const dur = parseInt(duration) || 60;

    if (programType === 'clinic') {
      const validSessions = clinicSessions.filter(s => s.date && s.time);
      if (validSessions.length === 0) {
        showToast('Add at least one session', 'error');
        return;
      }
      sessions = validSessions.map(s => ({ date: s.date, time: s.time, duration: dur }));
    } else {
      if (!campStart || !campDays) {
        showToast('Set camp start date and number of days', 'error');
        return;
      }
      const numDays = parseInt(campDays) || 1;
      for (let i = 0; i < numDays; i++) {
        const d = new Date(campStart + 'T00:00:00');
        d.setDate(d.getDate() + i);
        sessions.push({ date: d.toISOString().split('T')[0], time: campTime, duration: dur });
      }
    }

    const conflict = checkConflicts(sessions);
    if (conflict) {
      showToast(conflict, 'error');
      return;
    }

    const program: CoachingProgram = {
      id: `prog-${Date.now()}`,
      title: title.trim(),
      type: programType,
      coachId: currentUser?.id || '',
      coachName: currentUser?.name || '',
      description: description.trim(),
      courtId,
      courtName: court?.name || `Court ${courtId}`,
      sessions,
      fee: parseFloat(fee),
      spotsTotal: parseInt(spots),
      enrolledMembers: [],
      status: 'active',
    };

    addProgram(program);
    showToast('Program created, courts blocked');
    // Reset form
    setTitle('');
    setFee('');
    setSpots('');
    setDescription('');
    setClinicSessions([{ date: '', time: '10:00 AM' }]);
    setCampStart('');
    setCampDays('5');
    setTab('programs');
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Coaching Panel" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-slideUp">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: '#fff', border: '1px solid #e0dcd3' }}>
          {([
            { key: 'programs', label: 'My Programs' },
            { key: 'create', label: 'Create Program' },
            { key: 'enrollments', label: 'Enrollments' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.key ? '#6b7a3d' : 'transparent',
                color: tab === t.key ? '#fff' : '#6b7266',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* My Programs Tab */}
        {tab === 'programs' && (
          <div className="space-y-4">
            {myPrograms.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(107, 122, 61, 0.08)' }}>
                  <svg className="w-8 h-8" fill="none" stroke="#6b7a3d" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="font-medium text-sm mb-1" style={{ color: '#2a2f1e' }}>No programs yet</p>
                <p className="text-xs mb-4" style={{ color: '#6b7266' }}>Create a clinic or camp to get started</p>
                <button onClick={() => setTab('create')} className="px-4 py-2 rounded-xl text-sm font-medium text-white btn-press" style={{ background: '#6b7a3d' }}>
                  Create Program
                </button>
              </div>
            ) : (
              myPrograms.map(prog => (
                <div key={prog.id} className="rounded-2xl border p-5 section-card" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base" style={{ color: '#2a2f1e' }}>{prog.title}</h3>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium" style={{
                          background: prog.type === 'clinic' ? 'rgba(107, 122, 61, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: prog.type === 'clinic' ? '#6b7a3d' : '#d97706',
                        }}>
                          {prog.type === 'clinic' ? 'Clinic' : 'Camp'}
                        </span>
                        {prog.status === 'cancelled' && (
                          <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500">Cancelled</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#6b7266' }}>{prog.courtName} &bull; {prog.sessions.length} sessions &bull; ${prog.fee}</p>
                    </div>
                    {prog.status === 'active' && (
                      <button
                        onClick={() => { cancelProgram(prog.id); showToast('Program cancelled'); }}
                        className="text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: '#ef4444' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <p className="text-sm mb-3" style={{ color: '#6b7266' }}>{prog.description}</p>

                  {/* Sessions */}
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: '#999' }}>Sessions</p>
                    <div className="flex flex-wrap gap-2">
                      {prog.sessions.map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#f5f2eb', color: '#4a5528' }}>
                          {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {s.time}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Enrollment */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f5f2eb' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(prog.enrolledMembers.length / prog.spotsTotal) * 100}%`, background: '#6b7a3d' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#6b7266' }}>
                      {prog.enrolledMembers.length}/{prog.spotsTotal} enrolled
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Program Tab */}
        {tab === 'create' && (
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2a2f1e' }}>Program Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Beginner Group Clinic"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>

              {/* Type toggle */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2a2f1e' }}>Type</label>
                <div className="flex gap-2">
                  {(['clinic', 'camp'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setProgramType(t)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        background: programType === t ? '#6b7a3d' : '#f5f2eb',
                        color: programType === t ? '#fff' : '#2a2f1e',
                      }}
                    >
                      {t === 'clinic' ? 'Clinic' : 'Camp'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Court + Fee + Spots */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7266' }}>Court</label>
                  <select
                    value={courtId}
                    onChange={e => setCourtId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                    style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                  >
                    {COURTS_CONFIG.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7266' }}>Fee ($)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                    style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7266' }}>Spots</label>
                  <input
                    type="number"
                    value={spots}
                    onChange={e => setSpots(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                    style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7266' }}>Session Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="90"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2a2f1e' }}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the program..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20 resize-none"
                  style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                />
              </div>

              {/* Session Builder */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Sessions</label>

                {programType === 'clinic' ? (
                  <div className="space-y-2">
                    {clinicSessions.map((s, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={s.date}
                          onChange={e => {
                            const updated = [...clinicSessions];
                            updated[i] = { ...updated[i], date: e.target.value };
                            setClinicSessions(updated);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                          style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                        />
                        <select
                          value={s.time}
                          onChange={e => {
                            const updated = [...clinicSessions];
                            updated[i] = { ...updated[i], time: e.target.value };
                            setClinicSessions(updated);
                          }}
                          className="px-3 py-2 rounded-lg text-sm border focus:outline-none"
                          style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                        >
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {clinicSessions.length > 1 && (
                          <button
                            onClick={() => setClinicSessions(clinicSessions.filter((_, j) => j !== i))}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setClinicSessions([...clinicSessions, { date: '', time: '10:00 AM' }])}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-[rgba(107,122,61,0.06)]"
                      style={{ color: '#6b7a3d' }}
                    >
                      + Add Session
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#6b7266' }}>Start Date</label>
                        <input
                          type="date"
                          value={campStart}
                          onChange={e => setCampStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                          style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#6b7266' }}>Days</label>
                        <input
                          type="number"
                          value={campDays}
                          onChange={e => setCampDays(e.target.value)}
                          min="1"
                          max="14"
                          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                          style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#6b7266' }}>Time</label>
                        <select
                          value={campTime}
                          onChange={e => setCampTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                          style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
                        >
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    {campStart && campDays && (
                      <p className="text-xs" style={{ color: '#6b7266' }}>
                        {parseInt(campDays)} sessions: {campStart} to{' '}
                        {(() => {
                          const end = new Date(campStart + 'T00:00:00');
                          end.setDate(end.getDate() + (parseInt(campDays) || 1) - 1);
                          return end.toISOString().split('T')[0];
                        })()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 btn-press"
                style={{ background: '#6b7a3d' }}
              >
                Create Program
              </button>
            </div>
          </div>
        )}

        {/* Enrollments Tab */}
        {tab === 'enrollments' && (
          <div className="space-y-4">
            <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Select Program</label>
              <select
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                style={{ borderColor: '#e0dcd3', color: '#2a2f1e' }}
              >
                <option value="">Choose a program...</option>
                {myPrograms.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.enrolledMembers.length}/{p.spotsTotal})</option>
                ))}
              </select>
            </div>

            {selectedProgram && (
              <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm" style={{ color: '#2a2f1e' }}>{selectedProgram.title}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                    {selectedProgram.enrolledMembers.length}/{selectedProgram.spotsTotal} spots filled
                  </span>
                </div>

                {/* Spots bar */}
                <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: '#f5f2eb' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(selectedProgram.enrolledMembers.length / selectedProgram.spotsTotal) * 100}%`, background: '#6b7a3d' }} />
                </div>

                {selectedProgram.enrolledMembers.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: '#6b7266' }}>No members enrolled yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProgram.enrolledMembers.map(mId => {
                      const member = members.find(m => m.id === mId);
                      return (
                        <div key={mId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#faf8f3' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                            {(member?.name || mId).split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>{member?.name || mId}</p>
                            <p className="text-xs" style={{ color: '#6b7266' }}>{member?.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
