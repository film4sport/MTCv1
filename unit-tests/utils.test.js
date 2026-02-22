import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateId, haptic } from '../app/dashboard/lib/utils';

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

// ─── haptic ─────────────────────────────────────────────────

describe('utils — haptic', () => {
  it('calls navigator.vibrate with correct pattern', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, writable: true, configurable: true });
    localStorage.removeItem('mtc-haptic');

    haptic('light');
    expect(vibrateMock).toHaveBeenCalledWith(10);

    haptic('medium');
    expect(vibrateMock).toHaveBeenCalledWith(25);

    haptic('success');
    expect(vibrateMock).toHaveBeenCalledWith([15, 50, 15]);

    haptic('error');
    expect(vibrateMock).toHaveBeenCalledWith([30, 40, 30, 40, 30]);
  });

  it('no-ops when navigator.vibrate is undefined', () => {
    const original = navigator.vibrate;
    Object.defineProperty(navigator, 'vibrate', { value: undefined, writable: true, configurable: true });

    // Should not throw
    expect(() => haptic('light')).not.toThrow();

    Object.defineProperty(navigator, 'vibrate', { value: original, writable: true, configurable: true });
  });

  it('respects localStorage haptic-off preference', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, writable: true, configurable: true });
    localStorage.setItem('mtc-haptic', 'off');

    haptic('light');
    expect(vibrateMock).not.toHaveBeenCalled();

    localStorage.removeItem('mtc-haptic');
  });

  it('handles vibrate throwing an error gracefully', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => { throw new Error('NotAllowedError'); },
      writable: true,
      configurable: true,
    });
    localStorage.removeItem('mtc-haptic');

    // Should not throw
    expect(() => haptic('medium')).not.toThrow();
  });
});
