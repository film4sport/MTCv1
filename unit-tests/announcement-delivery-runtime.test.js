import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockAuthResult;
let mockSupabase;
const mockSendPushToUser = vi.fn();

function createResolved(result) {
  return Promise.resolve(result);
}

function createBuilder(table, state) {
  const builder = {
    table,
    state,
    operation: null,
    payload: undefined,
    selectedColumns: null,
    filters: {},
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
    upsert(payload) {
      this.operation = 'upsert';
      this.payload = payload;
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
    or(value) {
      this.filters.or = value;
      return this;
    },
    single() {
      return createResolved(resolveBuilder(this));
    },
    then(resolve, reject) {
      return createResolved(resolveBuilder(this)).then(resolve, reject);
    },
  };
  return builder;
}

function resolveBuilder(builder) {
  const { table, operation, payload, filters, state } = builder;

  if (table === 'announcements' && operation === 'insert') {
    state.announcements.push(payload);
    return { data: payload, error: null };
  }

  if (table === 'profiles' && operation === 'select') {
    return { data: state.profiles, error: null };
  }

  if (table === 'notification_preferences' && operation === 'select') {
    if (Array.isArray(filters.user_id)) {
      const rows = state.notificationPreferences.filter((row) => filters.user_id.includes(row.user_id));
      return { data: rows, error: null };
    }
    const row = state.notificationPreferences.find((pref) => pref.user_id === filters.user_id) || null;
    return { data: row, error: null };
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
    const conversation = {
      id: state.nextConversationId++,
      member_a: payload.member_a,
      member_b: payload.member_b,
      last_message: payload.last_message,
      last_timestamp: payload.last_timestamp,
    };
    state.conversations.push(conversation);
    state.currentMessageFrom = payload.member_a;
    state.currentMessageTo = payload.member_b;
    return { data: { id: conversation.id }, error: null };
  }

  if (table === 'conversations' && operation === 'update') {
    const conversation = state.conversations.find((row) => row.id === filters.id);
    if (conversation) Object.assign(conversation, payload);
    return { data: conversation || null, error: null };
  }

  if (table === 'messages' && operation === 'insert') {
    state.messages.push(payload);
    state.currentMessageFrom = payload.from_id;
    state.currentMessageTo = payload.to_id;
    return { data: payload, error: null };
  }

  if (table === 'notification_preferences' && operation === 'upsert') {
    state.preferenceUpserts.push(payload);
    return { data: payload, error: null };
  }

  return { data: null, error: null };
}

function createSupabaseState() {
  const state = {
    announcements: [],
    notifications: [],
    messages: [],
    conversations: [],
    notificationPreferences: [],
    preferenceUpserts: [],
    profiles: [],
    nextConversationId: 1,
    currentMessageFrom: null,
    currentMessageTo: null,
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
  sanitizeInput: vi.fn((value) => value),
  isRateLimited: vi.fn(() => false),
  isValidEnum: vi.fn((value, valid) => valid.includes(value)),
  cachedJson: vi.fn((value) => value),
  VALID_ANNOUNCEMENT_TYPES: ['info', 'warning', 'urgent'],
  SETTINGS_KEY_WHITELIST: [],
}));

vi.mock('../app/api/lib/push', () => ({
  sendPushToUser: mockSendPushToUser,
}));

const announcementsRoute = await import('../app/api/mobile/announcements/route');
const settingsRoute = await import('../app/api/mobile/settings/route');

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
});

describe('Announcement Delivery Runtime', () => {
  it('sends notifications, push, and inbox messages only to opted-in members', async () => {
    mockSupabase.state.profiles = [
      { id: 'member-opt-in', name: 'Opted In Member', interclub_team: 'none' },
      { id: 'member-opt-out', name: 'Opted Out Member', interclub_team: 'none' },
    ];
    mockSupabase.state.notificationPreferences = [
      { user_id: 'member-opt-in', announcements: true },
      { user_id: 'member-opt-out', announcements: false },
    ];
    mockSendPushToUser.mockResolvedValue({ sent: 1 });

    const request = new Request('http://localhost/api/mobile/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Courts will open 30 minutes later tomorrow.',
        title: 'Morning Delay',
        type: 'info',
        audience: 'all',
      }),
    });

    const response = await announcementsRoute.POST(request);
    const json = await response.json();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockSupabase.state.announcements).toHaveLength(1);
    expect(mockSupabase.state.notifications).toHaveLength(1);
    expect(mockSupabase.state.notifications[0].user_id).toBe('member-opt-in');
    expect(mockSupabase.state.messages).toHaveLength(1);
    expect(mockSupabase.state.messages[0].to_id).toBe('member-opt-in');
    expect(mockSupabase.state.messages[0].text).toContain('Morning Delay');
    expect(mockSendPushToUser).toHaveBeenCalledTimes(1);
    expect(mockSendPushToUser).toHaveBeenCalledWith(
      mockSupabase,
      'member-opt-in',
      expect.objectContaining({ type: 'announcement', title: 'Morning Delay' })
    );
  });
});

describe('Settings Notification Preferences Runtime', () => {
  it('returns announcements as part of notification preferences', async () => {
    mockAuthResult = { id: 'member-1', role: 'member', name: 'Member' };
    mockSupabase.state.notificationPreferences = [
      {
        user_id: 'member-1',
        bookings: true,
        events: true,
        partners: true,
        announcements: false,
        messages: true,
        programs: true,
      },
    ];

    const request = new Request('http://localhost/api/mobile/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getNotifPrefs' }),
    });

    const response = await settingsRoute.PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.announcements).toBe(false);
  });

  it('persists announcements when notification preferences are updated', async () => {
    mockAuthResult = { id: 'member-1', role: 'member', name: 'Member' };

    const request = new Request('http://localhost/api/mobile/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setNotifPrefs',
        prefs: {
          bookings: true,
          partners: true,
          announcements: false,
          messages: true,
          events: true,
          programs: true,
        },
      }),
    });

    const response = await settingsRoute.PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockSupabase.state.preferenceUpserts).toHaveLength(1);
    expect(mockSupabase.state.preferenceUpserts[0]).toEqual(
      expect.objectContaining({
        user_id: 'member-1',
        announcements: false,
      })
    );
  });
});
