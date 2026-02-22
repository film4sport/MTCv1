import { useState, useEffect, useRef } from 'react';
import { FEES } from '../../lib/types';
import type { User } from '../../lib/types';
import { getTimeRange } from './booking-utils';
import { useFocusTrap } from '../../lib/utils';

interface ModalData {
  courtId: number;
  courtName: string;
  date: string;
  time: string;
}

interface BookingModalProps {
  modalData: ModalData;
  members: User[];
  currentUser: User | null;
  onConfirm: (isGuest: boolean, guestName: string, participants: { id: string; name: string }[]) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function BookingModal({ modalData, members, currentUser, onConfirm, onCancel, loading }: BookingModalProps) {
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<{ id: string; name: string }[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef);

  // Compute participant search results
  const participantResults = participantSearch.trim().length >= 2
    ? members.filter(m =>
        m.id !== currentUser?.id &&
        !selectedParticipants.some(p => p.id === m.id) &&
        m.name.toLowerCase().includes(participantSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  // Reset active index when search changes
  useEffect(() => { setActiveIndex(-1); }, [participantSearch]);

  const handleParticipantKeyDown = (e: React.KeyboardEvent) => {
    if (participantResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % participantResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev <= 0 ? participantResults.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const m = participantResults[activeIndex];
      setSelectedParticipants(prev => [...prev, { id: m.id, name: m.name }]);
      setParticipantSearch('');
    } else if (e.key === 'Escape') {
      setParticipantSearch('');
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div ref={trapRef} className="rounded-2xl p-6 w-full max-w-md animate-scaleIn" style={{ background: '#fff' }}>
        <h3 id="booking-modal-title" className="font-semibold text-lg mb-4" style={{ color: '#2a2f1e' }}>Confirm Booking</h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6b7266' }}>Court</span>
            <span className="font-medium" style={{ color: '#2a2f1e' }}>{modalData.courtName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6b7266' }}>Date</span>
            <span className="font-medium" style={{ color: '#2a2f1e' }}>
              {new Date(modalData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6b7266' }}>Time</span>
            <span className="font-medium" style={{ color: '#2a2f1e' }}>{getTimeRange(modalData.time)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6b7266' }}>Cost</span>
            <span className="font-medium" style={{ color: '#2a2f1e' }}>{isGuest ? `$${FEES.guest} (guest fee)` : 'Free'}</span>
          </div>
        </div>

        {/* Guest toggle */}
        <div className="rounded-xl p-4 mb-4" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isGuest}
              onChange={(e) => { setIsGuest(e.target.checked); if (!e.target.checked) setGuestName(''); }}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#6b7a3d' }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: '#2a2f1e' }}>Bringing a guest?</p>
              <p className="text-xs" style={{ color: '#6b7266' }}>Guest fee: ${FEES.guest}</p>
            </div>
          </label>
          {isGuest && (
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name"
              aria-label="Guest name"
              className="mt-3 w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
              style={{ borderColor: '#e0dcd3', background: '#fff', color: '#2a2f1e' }}
            />
          )}
        </div>

        {/* Add Participants */}
        <div className="rounded-xl p-4 mb-6" style={{ background: '#faf8f3', border: '1px solid #e0dcd3' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#2a2f1e' }}>Add Participants</p>
          <p className="text-xs mb-3" style={{ color: '#6b7266' }}>Search members to add (max 3)</p>
          {selectedParticipants.length < 3 && (
            <div className="relative">
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                onKeyDown={handleParticipantKeyDown}
                placeholder="Search members..."
                role="combobox"
                aria-label="Search members to add as participants"
                aria-expanded={participantResults.length > 0}
                aria-controls="participant-listbox"
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `participant-option-${activeIndex}` : undefined}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#6b7a3d]/20"
                style={{ borderColor: '#e0dcd3', background: '#fff', color: '#2a2f1e' }}
              />
              {participantResults.length > 0 && (
                <div role="listbox" id="participant-listbox" className="absolute left-0 right-0 top-full mt-1 rounded-lg border shadow-lg z-10 max-h-40 overflow-y-auto" style={{ background: '#fff', borderColor: '#e0dcd3' }}>
                  {participantResults.map((m, i) => (
                    <button
                      key={m.id}
                      id={`participant-option-${i}`}
                      role="option"
                      aria-selected={activeIndex === i}
                      onClick={() => {
                        setSelectedParticipants(prev => [...prev, { id: m.id, name: m.name }]);
                        setParticipantSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03] transition-colors"
                      style={{ color: '#2a2f1e', backgroundColor: activeIndex === i ? 'rgba(107, 122, 61, 0.08)' : undefined }}
                    >
                      {m.name}
                      {m.ntrp && <span className="text-xs ml-2" style={{ color: '#6b7266' }}>NTRP {m.ntrp}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedParticipants.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(107, 122, 61, 0.12)', color: '#6b7a3d' }}>
                  {p.name}
                  <button
                    onClick={() => setSelectedParticipants(prev => prev.filter(x => x.id !== p.id))}
                    className="hover:opacity-70"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ background: '#f5f2eb', color: '#2a2f1e' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(isGuest, guestName, selectedParticipants)}
            disabled={(isGuest && !guestName.trim()) || loading}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: '#6b7a3d' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Booking…
              </span>
            ) : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
