/**
 * Shared helper functions for the dashboard store.
 * Extracted from store.tsx for reusability and testability.
 * No React dependencies -- these are plain utility functions.
 */
import type { ClubEvent } from './types';
import { DEFAULT_EVENTS } from './data';
import { reportError } from '../../lib/errorReporter';

// -- localStorage helpers --

/** Parse JSON from localStorage with fallback on error. */
export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    reportError(err, `localStorage parse: ${key}`);
    return fallback;
  }
}

/** Load an array from localStorage, defensively ensuring the result is always an array. */
export function safeLoadArray<T>(key: string, fallback: T[]): T[] {
  const loaded = loadJSON(key, fallback);
  return Array.isArray(loaded) ? loaded : fallback;
}

/** Write JSON to localStorage with quota error handling. */
export function saveJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    reportError(err, `localStorage quota: ${key}`);
  }
}

// -- Data safety helpers --

/** Ensure data is always an array (defensive against corrupted data). */
export function safeArray<T>(data: T[]): T[] {
  return Array.isArray(data) ? data : [];
}

/**
 * Merge Supabase events with DEFAULT_EVENTS.
 * Supabase rows win by ID; any defaults not in Supabase are preserved.
 * This prevents losing hardcoded events (tournaments, specials) when
 * Supabase only returns a partial set (e.g. just recurring events).
 */
export function mergeEventsWithDefaults(supabaseEvents: ClubEvent[]): ClubEvent[] {
  const arr = safeArray(supabaseEvents);
  if (arr.length === 0) return DEFAULT_EVENTS;
  const supabaseIds = new Set(arr.map(e => e.id));
  const defaultsNotInSupabase = DEFAULT_EVENTS.filter(e => !supabaseIds.has(e.id));
  return [...arr, ...defaultsNotInSupabase];
}

/**
 * Extract value from a PromiseSettledResult, returning fallback on rejection.
 * Used by both initial data load and refreshData to avoid duplicating the pattern.
 */
export function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}
