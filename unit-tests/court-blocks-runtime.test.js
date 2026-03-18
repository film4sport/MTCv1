import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

let mockUser;
let mockSupabase;
const mockSendPushToUser = vi.fn();
const mockCreateNotification = vi.fn();
const originalFetch = global.fetch;

function resolved(result) {
  return Promise.resolve(result);
}

function makeBuilder(table, state) {
  return {
    table,
    state,
    operation: null,
    payload: undefined,
    filters: {},
    selectedColumns: null,
    select(columns) {
      if (!this.operation) this.operation = 'select';
      this.selectedColumns = columns;
      return this;
    },
    insert(payload) {
      this.operation = 'insert';
      this.payload = payload;
      return this;
    },
    update(payload) {
      this.operation = 'update';
      this.payload = payload;
      return this;
    },
    delete() {
      this.operation = 'delete';
      return this;
    },
    eq(column, value) {
      this.filters[column] = value;
      return this;
    },
    in(column, values) {
      this.filters[column] = values;
      return this;
    },
    gte(column, value) {
      this.filters[`gte:${column}`] = value;
      return this;
    },
    lte(column, value) {
      this.filters[`lte:${column}`] = value;
      return this;
    },
    order() {
      return this;
    },
    single() {
      return resolved(resolveBuilder(this));
    },
    then(resolve, reject) {
      return resolved(resolveBuilder(this)).then(resolve, reject);
    },
  };
}

function resolveBuilder(builder) {
  const { table, operation, payload, filters, state } = builder;

  if (table === 'court_blocks' && operation === 'insert') {
    const row = { id: 'block-1', ...payload };
    state.courtBlocks.push(row);
    return { data: row, error: null };
  }

  if (table === 'bookings' && operation === 'select') {
    let rows = state.bookings.filter((booking) => {
      if (filters.date && booking.date !== filters.date) return false;
      if (filters.status && booking.status !== filters.status) return false;
      if (filters.court_id !== undefined && booking.court_id !== filters.court_id) return false;
      return true;
    });
    return { data: rows, error: null };
  }

  if (table === 'bookings' && operation === 'update') {
    const ids = Array.isArray(filters.id) ? filters.id : [];
    state.bookings = state.bookings.map((booking) => ids.includes(booking.id) ? { ...booking, ...payload } : booking);
    return { data: null, error: null };
  }

  if (table === 'booking_participants' && operation === 'select') {
    const rows = state.bookingParticipants.filter((row) => row.booking_id === filters.booking_id);
    return { data: rows, error: null };
  }

  if (table === 'profiles' && operation === 'select') {
    const ids = Array.isArray(filters.id) ? filters.id : [];
    const rows = state.profiles.filter((profile) => ids.includes(profile.id));
    return { data: rows, error: null };
  }

  if (table === 'court_blocks' && operation === 'delete') {
    return { data: [], error: null };
  }

  return { data: null, error: null };
}

function createSupabase() {
  const state = {
    courtBlocks: [],
    bookings: [],
    bookingParticipants: [],
    profiles: [],
  };

  return {
    state,
    from(table) {
      return makeBuilder(table, state);
    },
  };
}

vi.mock('../app/api/mobile/auth-helper', () => ({
  withAuth: (handler) => async (request) => handler(mockUser, request, mockSupabase),
  isValidDate: vi.fn(() => true),
  isValidTime: vi.fn(() => true),
  isInRange: vi.fn(() => true),
  isValidEnum: vi.fn(() => true),
  sanitizeInput: vi.fn((value) => value),
  validationError: vi.fn((field, message) => new Response(JSON.stringify({ error: `${field}: ${message}` }), { status: 400 })),
  VALID_BLOCK_REASONS: ['maintenance', 'tournament', 'weather', 'event'],
}));

vi.mock('../app/api/lib/push', () => ({
  sendPushToUser: mockSendPushToUser,
}));

vi.mock('../app/api/lib/notifications', () => ({
  createNotification: mockCreateNotification,
}));

vi.mock('../app/api/lib/request-url', () => ({
  getRequestOrigin: vi.fn(() => 'http://localhost:3000'),
}));

const courtBlocksRoute = await import('../app/api/mobile/court-blocks/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: 'admin-1', name: 'Admin User', role: 'admin' };
  mockSupabase = createSupabase();
  mockSendPushToUser.mockResolvedValue({ sent: 1 });
  mockCreateNotification.mockResolvedValue(undefined);
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 }));
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('Court Blocks Runtime', () => {
  it('cancels conflicting bookings and fans out notifications', async () => {
    mockSupabase.state.bookings = [
      {
        id: 'booking-1',
        court_id: 1,
        court_name: 'Court 1',
        date: '2026-03-20',
        time: '10:00 AM',
        user_id: 'member-owner',
        user_name: 'Owner Member',
        status: 'confirmed',
      },
    ];
    mockSupabase.state.bookingParticipants = [
      { booking_id: 'booking-1', participant_id: 'member-participant' },
    ];
    mockSupabase.state.profiles = [
      { id: 'member-owner', name: 'Owner Member', email: 'owner@mtc.ca' },
      { id: 'member-participant', name: 'Participant Member', email: 'participant@mtc.ca' },
    ];

    const request = new Request('http://localhost/api/mobile/court-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court_id: 1,
        block_date: '2026-03-20',
        time_start: '9:30 AM',
        time_end: '10:30 AM',
        reason: 'maintenance',
        notes: 'Spring repair',
      }),
    });

    const response = await courtBlocksRoute.POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.cancelledBookings).toBe(1);
    expect(mockSupabase.state.bookings[0].status).toBe('cancelled');
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockSendPushToUser).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(json.cancelledDetails).toEqual([
      expect.objectContaining({
        id: 'booking-1',
        userName: 'Owner Member',
        time: '10:00 AM',
        court: 'Court 1',
      }),
    ]);
  });
});
