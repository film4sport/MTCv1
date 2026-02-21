/**
 * Generate a unique ID with an optional prefix.
 * Uses crypto.randomUUID() in modern browsers/Node 19+.
 * Falls back to Date.now() + random for older environments.
 */
export function generateId(prefix: string = ''): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Haptic feedback for mobile devices.
 * Uses Vibration API (Android Chrome). Silently no-ops on iOS/desktop.
 * Respects user preference stored in localStorage ('mtc-haptic').
 */
export function haptic(style: 'light' | 'medium' | 'success' | 'error' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('mtc-haptic') === 'off') return;
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 25,
    success: [15, 50, 15],
    error: [30, 40, 30, 40, 30],
  };
  try { navigator.vibrate(patterns[style]); } catch { /* no-op */ }
}
