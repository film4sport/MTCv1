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
