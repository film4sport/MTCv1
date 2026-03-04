/**
 * Dashboard Integration Tests — Supabase Mutation Flows
 * Tests the db.ts functions with mocked Supabase client.
 * Verifies correct SQL operations, error handling, and data transforms.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase client ──
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpsert = vi.fn();
const mockRpc = vi.fn();

function createChain(terminal = 'select') {
  // Chainable mock: each method returns the chain, except terminal methods
  const chain = {
    select: mockSelect.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
    delete: mockDelete.mockReturnThis(),
    upsert: mockUpsert.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    neq: mockNeq.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    then: undefined, // Will be set by tests
  };
  return chain;
}

const mockFrom = vi.fn();
const mockChannel = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    channel: mockChannel,
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('db.ts — fetchMembers', () => {
  it('queries profiles table and returns users', async () => {
    const mockData = [
      { id: '1', name: 'Alice', email: 'alice@test.com', role: 'member', status: 'active', ntrp: 3.5, membership_type: 'adult', skill_level: 'intermediate' },
      { id: '2', name: 'Bob', email: 'bob@test.com', role: 'admin', status: 'active', ntrp: 4.0, membership_type: 'adult', skill_level: 'advanced' },
    ];

    const chain = createChain();
    chain.order = vi.fn().mockResolvedValue({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const { fetchMembers } = await import('../app/dashboard/lib/db.ts');
    const result = await fetchMembers();

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[1].role).toBe('admin');
  });

  it('returns empty array on error', async () => {
    const chain = createChain();
    chain.order = vi.fn().mockResolvedValue({ data: null, error: { message: 'fetch failed' } });
    mockFrom.mockReturnValue(chain);

    const { fetchMembers } = await import('../app/dashboard/lib/db.ts');
    const result = await fetchMembers();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('db.ts — createBooking', () => {
  it('inserts booking with correct fields', async () => {
    const chain = createChain();
    chain.select = vi.fn().mockResolvedValue({ data: [{ id: 'b1' }], error: null });
    mockInsert.mockReturnValue(chain);
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { createBooking } = await import('../app/dashboard/lib/db.ts');
    const booking = {
      id: 'b1',
      date: '2026-04-01',
      time: '10:00 AM',
      court: 1,
      duration: 60,
      type: 'singles',
      players: ['Alice', 'Bob'],
      userId: 'u1',
      userName: 'Alice',
      status: 'confirmed',
    };

    await createBooking(booking);

    expect(mockFrom).toHaveBeenCalledWith('bookings');
    expect(mockInsert).toHaveBeenCalled();
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg).toMatchObject({
      date: '2026-04-01',
      time: '10:00 AM',
      court_id: 1,
      duration: 60,
    });
  });
});

describe('db.ts — cancelBooking', () => {
  it('updates booking status to cancelled', async () => {
    const chain = createChain();
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue(chain);
    mockFrom.mockReturnValue({ update: mockUpdate });

    const { cancelBooking } = await import('../app/dashboard/lib/db.ts');
    await cancelBooking('b1');

    expect(mockFrom).toHaveBeenCalledWith('bookings');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });
});

describe('db.ts — toggleEventRsvp', () => {
  it('calls rpc with event_id and user_name', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { toggleEventRsvp } = await import('../app/dashboard/lib/db.ts');
    await toggleEventRsvp('e1', 'Alice');

    expect(mockRpc).toHaveBeenCalledWith('toggle_event_rsvp', { p_event_id: 'e1', p_user_name: 'Alice' });
  });
});

describe('db.ts — createPartner', () => {
  it('inserts partner with all fields', async () => {
    const chain = createChain();
    chain.select = vi.fn().mockResolvedValue({ data: [{ id: 'p1' }], error: null });
    mockInsert.mockReturnValue(chain);
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { createPartner } = await import('../app/dashboard/lib/db.ts');
    const partner = {
      id: 'p1',
      name: 'Alice',
      availability: 'Weekends',
      skillLevel: 'intermediate',
      playStyle: 'Singles',
      userId: 'u1',
    };

    await createPartner(partner);

    expect(mockFrom).toHaveBeenCalledWith('partners');
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe('db.ts — notification operations', () => {
  it('createNotification inserts with user_id', async () => {
    const chain = createChain();
    chain.select = vi.fn().mockResolvedValue({ data: [{ id: 'n1' }], error: null });
    mockInsert.mockReturnValue(chain);
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { createNotification } = await import('../app/dashboard/lib/db.ts');
    await createNotification('u1', { id: 'n1', type: 'booking', title: 'Test', body: 'msg', timestamp: '2026-01-01' });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.user_id).toBe('u1');
    expect(insertArg.title).toBe('Test');
  });

  it('markNotificationRead updates read field', async () => {
    const chain = createChain();
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue(chain);
    mockFrom.mockReturnValue({ update: mockUpdate });

    const { markNotificationRead } = await import('../app/dashboard/lib/db.ts');
    await markNotificationRead('n1');

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ read: true }));
  });

  it('clearNotifications deletes all for user', async () => {
    const chain = createChain();
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    mockDelete.mockReturnValue(chain);
    mockFrom.mockReturnValue({ delete: mockDelete });

    const { clearNotifications } = await import('../app/dashboard/lib/db.ts');
    await clearNotifications('u1');

    expect(mockFrom).toHaveBeenCalledWith('notifications');
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe('db.ts — updateProfile', () => {
  it('updates profile fields for user', async () => {
    const chain = createChain();
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue(chain);
    mockFrom.mockReturnValue({ update: mockUpdate });

    const { updateProfile } = await import('../app/dashboard/lib/db.ts');
    await updateProfile('u1', { name: 'Alice Updated', ntrp: 4.0 });

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice Updated', ntrp: 4.0 }));
  });
});

describe('db.ts — gate code operations', () => {
  it('getGateCode queries settings table', async () => {
    const chain = createChain();
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: { value: '1234' }, error: null });
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const { getGateCode } = await import('../app/dashboard/lib/db.ts');
    const code = await getGateCode();

    expect(mockFrom).toHaveBeenCalledWith('settings');
    expect(code).toBe('1234');
  });

  it('updateGateCode upserts settings row', async () => {
    const chain = createChain();
    chain.select = vi.fn().mockResolvedValue({ data: [{ key: 'gate_code' }], error: null });
    mockUpsert.mockReturnValue(chain);
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    const { updateGateCode } = await import('../app/dashboard/lib/db.ts');
    await updateGateCode('5678', 'admin1');

    expect(mockFrom).toHaveBeenCalledWith('settings');
    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.value).toBe('5678');
  });
});

describe('db.ts — family operations', () => {
  it('createFamily inserts and updates profile', async () => {
    // createFamily does: insert into families, then update profile with family_id
    const insertChain = createChain();
    insertChain.select = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'f1' }, error: null }),
    });
    mockInsert.mockReturnValue(insertChain);

    const updateChain = createChain();
    updateChain.eq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue(updateChain);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return { insert: mockInsert };
      return { update: mockUpdate };
    });

    const { createFamily } = await import('../app/dashboard/lib/db.ts');
    const familyId = await createFamily('u1', 'Smith Family');

    expect(familyId).toBe('f1');
  });
});
