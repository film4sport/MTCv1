import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase Mock ──────────────────────────────────────────

function createQueryBuilder(resolvedData = null) {
  const builder = {
    select: vi.fn(function () { return this; }),
    eq: vi.fn(function () { return this; }),
    single: vi.fn(function () { return Promise.resolve({ data: resolvedData, error: null }); }),
  };
  return builder;
}

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({});
const mockResetPasswordForEmail = vi.fn();
const mockGetSession = vi.fn();
const mockFrom = vi.fn(() => createQueryBuilder());

vi.mock('../app/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      getSession: mockGetSession,
    },
    from: mockFrom,
  },
  isSupabaseConfigured: true,
}));

const auth = await import('../app/dashboard/lib/auth');

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── signIn ─────────────────────────────────────────────────

describe('auth — signIn', () => {
  it('returns User when auth + profile succeed', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });
    const profileBuilder = createQueryBuilder({
      id: 'u1', name: 'Alice', email: 'a@b.com', role: 'member', status: 'active',
      ntrp: null, skill_level: null, member_since: '2024-01', avatar: null,
    });
    mockFrom.mockReturnValueOnce(profileBuilder);

    const user = await auth.signIn('a@b.com', 'pass123');
    expect(user).not.toBeNull();
    expect(user.name).toBe('Alice');
    expect(user.role).toBe('member');
    expect(user.memberSince).toBe('2024-01');
  });

  it('returns null when auth fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    });

    const user = await auth.signIn('bad@email.com', 'wrong');
    expect(user).toBeNull();
  });

  it('returns null when profile not found', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });
    const profileBuilder = createQueryBuilder(null);
    mockFrom.mockReturnValueOnce(profileBuilder);

    const user = await auth.signIn('a@b.com', 'pass123');
    expect(user).toBeNull();
  });
});

// ─── signUp ─────────────────────────────────────────────────

describe('auth — signUp', () => {
  it('returns user on success', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });

    const result = await auth.signUp('a@b.com', 'Pass1234', 'Alice');
    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user.name).toBe('Alice');
    expect(result.user.role).toBe('member');
  });

  it('returns error when auth fails', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Email taken' },
    });

    const result = await auth.signUp('a@b.com', 'Pass1234', 'Alice');
    expect(result.user).toBeNull();
    expect(result.error).toBe('Email taken');
  });

  it('returns error when no user in data', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const result = await auth.signUp('a@b.com', 'Pass1234', 'Alice');
    expect(result.user).toBeNull();
    expect(result.error).toBe('Signup failed');
  });
});

// ─── signOut ────────────────────────────────────────────────

describe('auth — signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    await auth.signOut();
    expect(mockSignOut).toHaveBeenCalled();
  });
});

// ─── getCurrentUser ─────────────────────────────────────────

describe('auth — getCurrentUser', () => {
  it('returns null when no session', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const user = await auth.getCurrentUser();
    expect(user).toBeNull();
  });

  it('returns User when session + profile exist', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
    });
    const profileBuilder = createQueryBuilder({
      id: 'u1', name: 'Alice', email: 'a@b.com', role: 'admin', status: 'active',
      ntrp: 4.0, skill_level: 'advanced', member_since: '2023-06', avatar: 'pic.jpg',
    });
    mockFrom.mockReturnValueOnce(profileBuilder);

    const user = await auth.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user.role).toBe('admin');
    expect(user.ntrp).toBe(4.0);
    expect(user.skillLevel).toBe('advanced');
    expect(user.avatar).toBe('pic.jpg');
  });
});

// ─── resetPassword (calls /api/reset-password) ─────────────

describe('auth — resetPassword', () => {
  it('returns null on success', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    const result = await auth.resetPassword('a@b.com');
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/api/reset-password', expect.objectContaining({ method: 'POST' }));
  });

  it('returns error message on failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Rate limited' }),
    });
    const result = await auth.resetPassword('a@b.com');
    expect(result).toBe('Rate limited');
  });
});
