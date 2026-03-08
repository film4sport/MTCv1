'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Court } from '../../lib/types';
import type { CourtBlock } from '../../lib/db';
import { fetchCourtBlocks } from '../../lib/db';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../lib/toast';

interface AdminCourtsTabProps {
  courts: Court[];
  onToggleMaintenance: (courtId: number) => void;
}

export default function AdminCourtsTab({
  courts,
  onToggleMaintenance,
}: AdminCourtsTabProps) {
  const { showToast } = useToast();
  const [blocks, setBlocks] = useState<CourtBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [courtId, setCourtId] = useState<string>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [fullDay, setFullDay] = useState(true);
  const [timeStart, setTimeStart] = useState('08:00');
  const [timeEnd, setTimeEnd] = useState('17:00');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const loadBlocks = useCallback(async () => {
    try {
      const data = await fetchCourtBlocks();
      setBlocks(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // Listen for realtime court_blocks changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-court-blocks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_blocks' }, () => {
        loadBlocks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadBlocks]);

  const today = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!dateStart) { showToast('Start date is required', 'error'); return; }
    if (!reason.trim()) { showToast('Reason is required', 'error'); return; }

    const endDate = dateEnd || dateStart;
    if (endDate < dateStart) { showToast('End date must be on or after start date', 'error'); return; }

    setLoading(true);
    try {
      // Generate array of dates in the range
      const dates: string[] = [];
      const cur = new Date(dateStart + 'T12:00:00');
      const end = new Date(endDate + 'T12:00:00');
      while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }

      // Create a block for each date
      const promises = dates.map(d =>
        supabase.from('court_blocks').insert({
          court_id: courtId === 'all' ? null : parseInt(courtId),
          block_date: d,
          time_start: fullDay ? null : timeStart,
          time_end: fullDay ? null : timeEnd,
          reason: reason.trim(),
          notes: notes.trim() || null,
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => r.error);

      if (failed.length > 0) {
        showToast(`Failed to create ${failed.length} of ${dates.length} blocks`, 'error');
      } else {
        showToast(`Created ${dates.length} court block${dates.length > 1 ? 's' : ''}`);
        // Reset form
        setCourtId('all');
        setDateStart('');
        setDateEnd('');
        setFullDay(true);
        setTimeStart('08:00');
        setTimeEnd('17:00');
        setReason('');
        setNotes('');
      }
      await loadBlocks();
    } catch {
      showToast('Failed to create court block', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('court_blocks').delete().eq('id', id);
      if (error) throw error;
      showToast('Court block removed');
      await loadBlocks();
    } catch {
      showToast('Failed to delete court block', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const getCourtName = (id: number | null) => {
    if (!id) return 'All Courts';
    const court = courts.find(c => c.id === id);
    return court?.name || `Court ${id}`;
  };

  const formatTime12 = (t: string | null) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-8">
      {/* Court Status Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#2a2f1e' }}>Court Status</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {courts.map(court => (
            <div key={court.id} className="glass-card rounded-2xl border p-5" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium" style={{ color: '#2a2f1e' }}>{court.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
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
      </div>

      {/* Block Court Time Form */}
      <div className="glass-card rounded-2xl border p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#2a2f1e' }}>Block Court Time</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {/* Court selector */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>Court</label>
            <select
              value={courtId}
              onChange={e => setCourtId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
            >
              <option value="all">All Courts</option>
              {courts.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
            >
              <option value="">Select reason...</option>
              <option value="maintenance">Maintenance</option>
              <option value="event">Club Event</option>
              <option value="weather">Weather</option>
              <option value="tournament">Tournament</option>
              <option value="coaching">Coaching Session</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>Start Date</label>
            <input
              type="date"
              value={dateStart}
              min={today}
              onChange={e => setDateStart(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>End Date <span className="font-normal">(optional)</span></label>
            <input
              type="date"
              value={dateEnd}
              min={dateStart || today}
              onChange={e => setDateEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
            />
          </div>
        </div>

        {/* Full day toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setFullDay(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: fullDay ? 'rgba(107, 122, 61, 0.15)' : 'transparent',
              color: fullDay ? '#6b7a3d' : '#6b7266',
              border: `1px solid ${fullDay ? 'rgba(107, 122, 61, 0.3)' : '#e0dcd3'}`,
            }}
          >
            Full Day
          </button>
          <button
            onClick={() => setFullDay(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: !fullDay ? 'rgba(107, 122, 61, 0.15)' : 'transparent',
              color: !fullDay ? '#6b7a3d' : '#6b7266',
              border: `1px solid ${!fullDay ? 'rgba(107, 122, 61, 0.3)' : '#e0dcd3'}`,
            }}
          >
            Time Range
          </button>
        </div>

        {/* Time range inputs */}
        {!fullDay && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>From</label>
              <input
                type="time"
                value={timeStart}
                onChange={e => setTimeStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>To</label>
              <input
                type="time"
                value={timeEnd}
                onChange={e => setTimeEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: '#6b7266' }}>Notes <span className="font-normal">(optional)</span></label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional details..."
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ borderColor: '#e0dcd3', color: '#2a2f1e', background: '#faf8f3' }}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !dateStart || !reason}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: '#6b7a3d', color: '#fff' }}
        >
          {loading ? 'Creating...' : 'Block Court Time'}
        </button>
      </div>

      {/* Existing Blocks List */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#2a2f1e' }}>
          Upcoming Blocks {blocks.length > 0 && <span className="font-normal" style={{ color: '#6b7266' }}>({blocks.length})</span>}
        </h3>
        {blocks.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#999' }}>No upcoming court blocks</p>
        ) : (
          <div className="space-y-2">
            {blocks.map(block => (
              <div
                key={block.id}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{ background: 'rgba(255, 255, 255, 0.5)', borderColor: '#e0dcd3' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: '#2a2f1e' }}>
                      {new Date(block.block_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' }}>
                      {getCourtName(block.court_id)}
                    </span>
                    {block.time_start && block.time_end ? (
                      <span className="text-xs" style={{ color: '#6b7266' }}>
                        {formatTime12(block.time_start)} – {formatTime12(block.time_end)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: '#6b7266' }}>Full day</span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#999' }}>
                    {block.reason}{block.notes ? ` — ${block.notes}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(block.id)}
                  disabled={deleting === block.id}
                  className="ml-3 p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: '#dc2626', background: deleting === block.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}
                  title="Remove block"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
