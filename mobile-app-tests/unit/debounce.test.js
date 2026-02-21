import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const utilsCode = readFileSync(resolve(__dirname, '../js/utils.js'), 'utf-8');

describe('MTC.debounce', () => {
  let MTC;

  beforeEach(() => {
    vi.useFakeTimers();
    const fn = new Function(utilsCode + '\nreturn MTC;');
    MTC = fn();
  });

  it('debounces rapid calls (only fires once)', () => {
    const spy = vi.fn();
    const debounced = MTC.debounce(spy, 100);

    debounced();
    debounced();
    debounced();

    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('fires after delay expires', () => {
    const spy = vi.fn();
    const debounced = MTC.debounce(spy, 200);

    debounced();
    vi.advanceTimersByTime(100);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('resets timer on each call', () => {
    const spy = vi.fn();
    const debounced = MTC.debounce(spy, 100);

    debounced();
    vi.advanceTimersByTime(80);
    debounced(); // reset
    vi.advanceTimersByTime(80);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
