'use client';

import { useState } from 'react';
import { useApp } from '../lib/store';
import DashboardHeader from '../components/DashboardHeader';

type EventFilter = 'all' | 'social' | 'match' | 'roundrobin' | 'lesson' | 'tournament';

export default function EventsPage() {
  const { currentUser, events, toggleRsvp } = useApp();
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const filtered = events
    .filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const badgeColors: Record<string, { bg: string; color: string }> = {
    free: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' },
    members: { bg: 'rgba(107, 122, 61, 0.1)', color: '#6b7a3d' },
    paid: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
  };

  const typeLabels: Record<string, string> = {
    social: 'Social', match: 'Match', roundrobin: 'Round Robin', lesson: 'Lesson', tournament: 'Tournament',
  };

  const detail = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2eb' }}>
      <DashboardHeader title="Club Events" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'social', 'roundrobin', 'match', 'tournament', 'lesson'] as EventFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: filter === f ? '#6b7a3d' : '#fff',
                color: filter === f ? '#fff' : '#2a2f1e',
                border: filter === f ? 'none' : '1px solid #e0dcd3',
              }}
            >
              {f === 'all' ? 'All Events' : typeLabels[f] || f}
            </button>
          ))}
        </div>

        {/* Event Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(ev => {
            const bc = badgeColors[ev.badge] || badgeColors['members'];
            const attending = ev.attendees.includes(currentUser?.name || '');
            const isPast = new Date(ev.date) < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={ev.id}
                className="rounded-2xl border p-5 transition-shadow hover:shadow-md cursor-pointer"
                style={{ background: '#fff', borderColor: '#e0dcd3', opacity: isPast ? 0.6 : 1 }}
                onClick={() => setSelectedEvent(ev.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: '#f5f2eb' }}>
                      <span className="text-[0.6rem] font-semibold uppercase" style={{ color: '#6b7266' }}>
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-none" style={{ color: '#2a2f1e' }}>
                        {new Date(ev.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#2a2f1e' }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: '#6b7266' }}>{ev.time}</p>
                    </div>
                  </div>
                  <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: bc.bg, color: bc.color }}>
                    {ev.price}
                  </span>
                </div>

                <p className="text-xs mb-3" style={{ color: '#6b7266' }}>{ev.location}</p>

                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] px-2 py-0.5 rounded-full" style={{ background: '#f5f2eb', color: '#6b7266' }}>
                    {typeLabels[ev.type] || ev.type}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPast) toggleRsvp(ev.id, currentUser?.name || '');
                    }}
                    disabled={isPast}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: attending ? '#6b7a3d' : 'rgba(107, 122, 61, 0.1)',
                      color: attending ? '#fff' : '#6b7a3d',
                    }}
                  >
                    {attending ? 'Going' : 'RSVP'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedEvent(null)}>
          <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: '#2a2f1e' }}>{detail.title}</h3>
                <p className="text-sm mt-1" style={{ color: '#6b7266' }}>
                  {new Date(detail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="#6b7266" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex gap-2 text-sm" style={{ color: '#6b7266' }}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {detail.time}
              </div>
              <div className="flex gap-2 text-sm" style={{ color: '#6b7266' }}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {detail.location}
              </div>
              <p className="text-sm" style={{ color: '#2a2f1e' }}>{detail.description}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>
                Attendees
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.attendees.map(name => (
                  <span key={name} className="text-xs px-3 py-1 rounded-full" style={{ background: '#f5f2eb', color: '#2a2f1e' }}>
                    {name}
                  </span>
                ))}
                {detail.attendees.length === 0 && (
                  <p className="text-xs" style={{ color: '#6b7266' }}>No attendees yet</p>
                )}
              </div>
            </div>

            <button
              onClick={() => toggleRsvp(detail.id, currentUser?.name || '')}
              className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: detail.attendees.includes(currentUser?.name || '') ? '#ef4444' : '#6b7a3d',
                color: '#fff',
              }}
            >
              {detail.attendees.includes(currentUser?.name || '') ? 'Cancel RSVP' : 'RSVP to Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
