import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateId } from '../app/dashboard/lib/utils';

beforeEach(() => {
  vi.restoreAllMocks();
});

// ─── generateId ─────────────────────────────────────────────

describe('utils — generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('prepends prefix when given', () => {
    const id = generateId('booking');
    expect(id.startsWith('booking-')).toBe(true);
  });

  it('returns different IDs on multiple calls', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });

  it('works when crypto.randomUUID is unavailable', () => {
    const original = crypto.randomUUID;
    try {
      // Temporarily remove randomUUID
      crypto.randomUUID = undefined;
      const id = generateId('test');
      expect(id.startsWith('test-')).toBe(true);
      expect(id.length).toBeGreaterThan(5);
    } finally {
      crypto.randomUUID = original;
    }
  });
});

