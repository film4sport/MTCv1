import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase Mock ──────────────────────────────────────────

// Chainable query builder — each method returns `this` so calls can be chained.
// Terminal calls (.single(), implicit await) resolve with {data, error}.
function createQueryBuilder(resolvedData = null, resolvedError = null) {
  const builder = {
    _resolved: { data: resolvedData, error: resolvedError },
    select: vi.fn(function () { return this; }),
    insert: vi.fn(function () { return this; }),
    update: vi.fn(function () { return this; }),
    delete: vi.fn(function () { return this; }),
    upsert: vi.fn(function () { return this; }),
    eq: vi.fn(function () { return this; }),
    or: vi.fn(function () { return this; }),
    order: vi.fn(function () { return this; }),
    single: vi.fn(function () { return Promise.resolve(this._resolved); }),
    // Make the builder thenable so `await supabase.from('x').select('*').order(...)` works
    then(resolve, reject) {
      return Promise.resolve(this._resolved).then(resolve, reject);
    },
  };
  return builder;
}

let currentBuilder;
const mockFrom = vi.fn(() => {
  currentBuilder = createQueryBuilder();
  return currentBuilder;
});
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../app/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
  isSupabaseConfigured: true,
}));

// ─── Import AFTER mock ─────────────────────────────────────
const db = await import('../app/dashboard/lib/db');

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── fetchMembers ───────────────────────────────────────────

describe('db — fetchMembers', () => {
  it('returns mapped users when data exists', async () => {
    const row = { id: 'u1', name: 'Alice', email: 'a@b.com', role: 'member', status: 'active', ntrp: 3.5, member_since: '2024-01', avatar: null };
    mockFrom.mockReturnValueOnce(createQueryBuilder([row]));

    const result = await db.fetchMembers();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'u1', name: 'Alice', email: 'a@b.com', role: 'member', status: 'active',
      ntrp: 3.5, memberSince: '2024-01', avatar: undefined,
    });
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValueOnce(createQueryBuilder(null));
    const result = await db.fetchMembers();
    expect(result).toEqual([]);
  });
});

// ─── fetchBookings ──────────────────────────────────────────

describe('db — fetchBookings', () => {
  it('maps booking + nested participants correctly', async () => {
    const row = {
      id: 'b1', court_id: 1, court_name: 'Court 1', date: '2026-06-01', time: '10:00 AM',
      user_id: 'u1', user_name: 'Alice', guest_name: null, status: 'confirmed', type: 'regular',
      program_id: null,
      booking_participants: [{ participant_id: 'u2', participant_name: 'Bob' }],
    };
    mockFrom.mockReturnValueOnce(createQueryBuilder([row]));

    const result = await db.fetchBookings();
    expect(result).toHaveLength(1);
    expect(result[0].courtId).toBe(1);
    expect(result[0].participants).toEqual([{ id: 'u2', name: 'Bob' }]);
  });

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValueOnce(createQueryBuilder(null));
    const result = await db.fetchBookings();
    expect(result).toEqual([]);
  });

  it('handles missing booking_participants gracefully', async () => {
    const row = {
      id: 'b2', court_id: 2, court_name: 'Court 2', date: '2026-06-01', time: '11:00 AM',
      user_id: 'u1', user_name: 'Alice', guest_name: 'Guest', status: 'confirmed', type: 'regular',
      program_id: null, booking_participants: null,
    };
    mockFrom.mockReturnValueOnce(createQueryBuilder([row]));

    const result = await db.fetchBookings();
    expect(result[0].participants).toBeUndefined();
    expect(result[0].guestName).toBe('Guest');
  });
});

// ─── createBooking ──────────────────────────────────────────

describe('db — createBooking', () => {
  it('inserts into bookings table with correct field mapping', async () => {
    const booking = {
      id: 'b1', courtId: 1, courtName: 'Court 1', date: '2026-06-01', time: '10:00 AM',
      userId: 'u1', userName: 'Alice', status: 'confirmed', type: 'regular',
    };
    await db.createBooking(booking);

    expect(mockFrom).toHaveBeenCalledWith('bookings');
    const insertCall = currentBuilder.insert.mock.calls[0][0];
    expect(insertCall.court_id).toBe(1);
    expect(insertCall.user_name).toBe('Alice');
    expect(insertCall.guest_name).toBeNull();
  });

  it('inserts participants when they exist', async () => {
    const booking = {
      id: 'b1', courtId: 1, courtName: 'Court 1', date: '2026-06-01', time: '10:00 AM',
      userId: 'u1', userName: 'Alice', status: 'confirmed', type: 'regular',
      participants: [{ id: 'u2', name: 'Bob' }],
    };
    await db.createBooking(booking);

    // Second call should be to booking_participants
    expect(mockFrom).toHaveBeenCalledWith('booking_participants');
  });

  it('skips participant insert when no participants', async () => {
    const booking = {
      id: 'b1', courtId: 1, courtName: 'Court 1', date: '2026-06-01', time: '10:00 AM',
      userId: 'u1', userName: 'Alice', status: 'confirmed', type: 'regular',
      participants: [],
    };
    await db.createBooking(booking);

    // Only one call to 'bookings', no call to 'booking_participants'
    const tableCalls = mockFrom.mock.calls.map(c => c[0]);
    expect(tableCalls).toContain('bookings');
    expect(tableCalls).not.toContain('booking_participants');
  });
});

// ─── cancelBooking ──────────────────────────────────────────

describe('db — cancelBooking', () => {
  it('updates booking status to cancelled', async () => {
    await db.cancelBooking('b1');

    expect(mockFrom).toHaveBeenCalledWith('bookings');
    expect(currentBuilder.update).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(currentBuilder.eq).toHaveBeenCalledWith('id', 'b1');
  });
});

// ─── toggleEventRsvp ────────────────────────────────────────

describe('db — toggleEventRsvp', () => {
  it('deletes attendance when user already attending', async () => {
    // First call: check existing → found
    const checkBuilder = createQueryBuilder({ id: 'a1' });
    mockFrom.mockReturnValueOnce(checkBuilder);
    // Second call: delete
    const deleteBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(deleteBuilder);

    await db.toggleEventRsvp('e1', 'Alice');

    expect(mockFrom).toHaveBeenCalledWith('event_attendees');
    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'a1');
  });

  it('inserts attendance when user not attending', async () => {
    // First call: check existing → not found (single returns null data)
    const checkBuilder = createQueryBuilder(null);
    mockFrom.mockReturnValueOnce(checkBuilder);
    // Second call: insert
    const insertBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(insertBuilder);

    await db.toggleEventRsvp('e1', 'Alice');

    expect(insertBuilder.insert).toHaveBeenCalledWith({ event_id: 'e1', user_name: 'Alice' });
  });
});

// ─── fetchAnnouncements ─────────────────────────────────────

describe('db — fetchAnnouncements', () => {
  it('marks dismissed announcements for user', async () => {
    // First call: fetch announcements
    mockFrom.mockReturnValueOnce(createQueryBuilder([
      { id: 'a1', text: 'Hello', type: 'info', date: '2026-01-01' },
      { id: 'a2', text: 'Update', type: 'warning', date: '2026-01-02' },
    ]));
    // Second call: fetch dismissals
    mockFrom.mockReturnValueOnce(createQueryBuilder([
      { announcement_id: 'a1' },
    ]));

    const result = await db.fetchAnnouncements('u1');
    expect(result).toHaveLength(2);
    expect(result[0].dismissedBy).toEqual(['u1']); // a1 dismissed
    expect(result[1].dismissedBy).toEqual([]); // a2 not dismissed
  });

  it('returns empty array when no announcements', async () => {
    mockFrom.mockReturnValueOnce(createQueryBuilder(null));
    mockFrom.mockReturnValueOnce(createQueryBuilder(null));

    const result = await db.fetchAnnouncements('u1');
    expect(result).toEqual([]);
  });
});

// ─── deleteAnnouncement ─────────────────────────────────────

describe('db — deleteAnnouncement', () => {
  it('deletes dismissals first then announcement', async () => {
    const dismissalBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(dismissalBuilder);
    const announcementBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(announcementBuilder);

    await db.deleteAnnouncement('a1');

    const tableCalls = mockFrom.mock.calls.map(c => c[0]);
    expect(tableCalls[0]).toBe('announcement_dismissals');
    expect(tableCalls[1]).toBe('announcements');
    expect(dismissalBuilder.delete).toHaveBeenCalled();
    expect(announcementBuilder.delete).toHaveBeenCalled();
  });
});

// ─── getGateCode ────────────────────────────────────────────

describe('db — getGateCode', () => {
  it('returns gate code value when found', async () => {
    const builder = createQueryBuilder({ value: '1234' });
    mockFrom.mockReturnValueOnce(builder);

    const result = await db.getGateCode();
    expect(result).toBe('1234');
    expect(mockFrom).toHaveBeenCalledWith('club_settings');
  });

  it('returns null when not found', async () => {
    const builder = createQueryBuilder(null);
    mockFrom.mockReturnValueOnce(builder);

    const result = await db.getGateCode();
    expect(result).toBeNull();
  });
});

// ─── deleteMember ───────────────────────────────────────────

describe('db — deleteMember', () => {
  it('calls RPC with correct user ID', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    await db.deleteMember('u1');

    expect(mockRpc).toHaveBeenCalledWith('delete_member', { target_user_id: 'u1' });
  });

  it('logs error when RPC fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'unauthorized' } });

    await db.deleteMember('u1');
    // reportError formats as: console.error('[MTC] context:', stringifiedMsg)
    expect(spy).toHaveBeenCalledWith('[MTC] deleteMember:', expect.any(String));
    spy.mockRestore();
  });
});

// ─── sendMessageByUsers ─────────────────────────────────────

describe('db — sendMessageByUsers', () => {
  const msg = {
    id: 'm1', fromId: 'u1', fromName: 'Alice', toId: 'u2', toName: 'Bob', text: 'Hello',
  };

  it('reuses existing conversation when found', async () => {
    // 1. Find conversation → found
    const findBuilder = createQueryBuilder({ id: 42 });
    mockFrom.mockReturnValueOnce(findBuilder);
    // 2. Insert message
    const insertBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(insertBuilder);
    // 3. Update conversation
    const updateBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(updateBuilder);

    await db.sendMessageByUsers(msg);

    expect(mockFrom.mock.calls[1][0]).toBe('messages');
    const insertArg = insertBuilder.insert.mock.calls[0][0];
    expect(insertArg.conversation_id).toBe(42);
    expect(insertArg.text).toBe('Hello');
  });

  it('creates new conversation when none exists', async () => {
    // 1. Find conversation → not found
    const findBuilder = createQueryBuilder(null);
    mockFrom.mockReturnValueOnce(findBuilder);
    // 2. Create conversation → returns id
    const createBuilder = createQueryBuilder({ id: 99 });
    mockFrom.mockReturnValueOnce(createBuilder);
    // 3. Insert message
    const insertBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(insertBuilder);
    // 4. Update conversation
    const updateBuilder = createQueryBuilder();
    mockFrom.mockReturnValueOnce(updateBuilder);

    await db.sendMessageByUsers(msg);

    expect(mockFrom.mock.calls[1][0]).toBe('conversations');
    expect(createBuilder.insert).toHaveBeenCalled();
  });
});
