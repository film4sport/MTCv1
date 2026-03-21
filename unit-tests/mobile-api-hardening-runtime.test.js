import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockAuthResult;
let mockSupabase;

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

function createResolved(result) {
  return Promise.resolve(result);
}

function createBuilder(table, state) {
  return {
    table,
    state,
    operation: null,
    payload: undefined,
    filters: {},
    select() {
      if (!this.operation) this.operation = 'select';
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
    upsert(payload) {
      this.operation = 'upsert';
      this.payload = payload;
      return this;
    },
    delete() {
      this.operation = 'delete';
      return this;
    },
    order() { return this; },
    limit() { return this; },
    eq(column, value) {
      this.filters[column] = value;
      return this;
    },
    in(column, values) {
      this.filters[column] = values;
      return this;
    },
    single() {
      return createResolved(resolveBuilder(this));
    },
    then(resolve, reject) {
      return createResolved(resolveBuilder(this)).then(resolve, reject);
    },
  };
}

function resolveBuilder(builder) {
  const { table, operation, payload, filters, state } = builder;

  if (table === 'announcements' && operation === 'insert') {
    const existing = state.announcements.find((row) => row.id === payload.id);
    if (existing) {
      return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
    }
    state.announcements.push(payload);
    return { data: payload, error: null };
  }

  if (table === 'announcements' && operation === 'delete') {
    state.announcements = state.announcements.filter((row) => row.id !== filters.id);
    return { data: null, error: null };
  }

  if (table === 'profiles' && operation === 'select') {
    return { data: state.profiles, error: null };
  }

  if (table === 'notification_preferences' && operation === 'select') {
    const row = state.notificationPreferences.find((pref) => pref.user_id === filters.user_id) || null;
    return { data: row, error: null };
  }

  if (table === 'notification_preferences' && operation === 'upsert') {
    state.preferenceUpserts.push(payload);
    return { data: payload, error: null };
  }

  if (table === 'notifications' && operation === 'update') {
    return { data: null, error: null };
  }

  if (table === 'notifications' && operation === 'delete') {
    return { data: null, error: null };
  }

  if (table === 'notifications' && operation === 'insert') {
    const rows = Array.isArray(payload) ? payload : [payload];
    state.notifications.push(...rows);
    return { data: rows, error: null };
  }

  if (table === 'conversations' && operation === 'select') {
    return { data: null, error: null };
  }

  if (table === 'conversations' && operation === 'insert') {
    state.nextConversationId += 1;
    return { data: { id: state.nextConversationId }, error: null };
  }

  if (table === 'conversations' && operation === 'update') {
    return { data: null, error: null };
  }

  if (table === 'messages' && operation === 'insert') {
    state.messages.push(payload);
    return { data: payload, error: null };
  }

  if (table === 'profiles' && operation === 'update') {
    state.profileUpdates.push({ filters, payload });
    return { data: null, error: null };
  }

  if (table === 'club_settings' && operation === 'upsert') {
    state.settingUpserts.push(payload);
    return { data: payload, error: null };
  }

  if (table === 'club_settings' && operation === 'select') {
    return { data: [], error: null };
  }

  if (table === 'announcement_dismissals' && (operation === 'upsert' || operation === 'delete')) {
    return { data: null, error: null };
  }

  return { data: null, error: null };
}

function createSupabaseState() {
  const state = {
    announcements: [],
    notifications: [],
    notificationPreferences: [],
    preferenceUpserts: [],
    profiles: [],
    messages: [],
    profileUpdates: [],
    settingUpserts: [],
    nextConversationId: 1,
  };

  return {
    state,
    from(table) {
      return createBuilder(table, state);
    },
  };
}

vi.mock('../app/api/mobile/auth-helper', () => ({
  authenticateMobileRequest: vi.fn(async () => mockAuthResult),
  getAdminClient: vi.fn(() => mockSupabase),
  sanitizeInput: vi.fn((value) => String(value)),
  isRateLimited: vi.fn(() => false),
  isValidEnum: vi.fn((value, valid) => valid.includes(value)),
  cachedJson: vi.fn((value) => jsonResponse(value)),
  VALID_ANNOUNCEMENT_TYPES: ['info', 'warning', 'urgent'],
  SETTINGS_KEY_WHITELIST: ['gate_code', 'club_name'],
  apiError: vi.fn((message, status, code, details) => jsonResponse(details ? { error: message, code, ...details } : { error: message, code }, { status })),
  successResponse: vi.fn((data, status) => jsonResponse({ success: true, ...(data || {}) }, { status })),
  readJsonObject: vi.fn(async (request) => {
    try {
      const body = await request.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonResponse({ error: 'Request body must be a JSON object', code: 'invalid_body' }, { status: 400 });
      }
      return body;
    } catch {
      return jsonResponse({ error: 'Invalid JSON body', code: 'invalid_json' }, { status: 400 });
    }
  }),
  findUnknownFields: vi.fn((body, allowedFields) => Object.keys(body).filter((key) => !allowedFields.includes(key))),
}));

vi.mock('../app/api/lib/push', () => ({
  sendPushToUser: vi.fn(async () => ({ sent: 1 })),
}));

const announcementsRoute = await import('../app/api/mobile/announcements/route');
const settingsRoute = await import('../app/api/mobile/settings/route');
const notificationsRoute = await import('../app/api/mobile/notifications/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthResult = {
    id: 'admin-1',
    role: 'admin',
    name: 'Club Admin',
    interclubCaptain: false,
    interclubTeam: 'none',
  };
  mockSupabase = createSupabaseState();
  mockSupabase.state.profiles = [{ id: 'member-1', name: 'Member One', interclub_team: 'none' }];
});

describe('Mobile API hardening runtime', () => {
  it('dedupes announcement creation by clientRequestId', async () => {
    const makeRequest = () => new Request('http://localhost/api/mobile/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Courts open late tomorrow.',
        type: 'info',
        audience: 'all',
        clientRequestId: 'req-123',
      }),
    });

    const first = await announcementsRoute.POST(makeRequest());
    const second = await announcementsRoute.POST(makeRequest());
    const firstJson = await first.json();
    const secondJson = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstJson.success).toBe(true);
    expect(secondJson.deduped).toBe(true);
    expect(mockSupabase.state.announcements).toHaveLength(1);
  });

  it('rejects announcement creation for non-admin non-captain users', async () => {
    mockAuthResult = {
      id: 'member-1',
      role: 'member',
      name: 'Member',
      interclubCaptain: false,
      interclubTeam: 'none',
    };

    const response = await announcementsRoute.POST(new Request('http://localhost/api/mobile/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hi there', type: 'info', audience: 'all' }),
    }));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.code).toBe('admin_or_captain_only');
  });

  it('rejects unknown notification preference keys', async () => {
    mockAuthResult = { id: 'member-1', role: 'member', name: 'Member' };

    const response = await settingsRoute.PATCH(new Request('http://localhost/api/mobile/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setNotifPrefs',
        prefs: { bookings: true, mysteryToggle: true },
      }),
    }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.code).toBe('unknown_pref_keys');
  });

  it('rejects unknown notification mutation fields and keeps delete idempotent', async () => {
    mockAuthResult = { id: 'member-1', role: 'member', name: 'Member' };

    const badPatch = await notificationsRoute.PATCH(new Request('http://localhost/api/mobile/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'n1', extra: true }),
    }));
    const badPatchJson = await badPatch.json();

    expect(badPatch.status).toBe(400);
    expect(badPatchJson.code).toBe('unknown_fields');

    const deleteResponse = await notificationsRoute.DELETE(new Request('http://localhost/api/mobile/notifications', {
      method: 'DELETE',
    }));
    const deleteJson = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteJson.action).toBe('deleteRead');
  });
});
