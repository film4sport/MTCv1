/**
 * Centralized error reporting utility.
 * Logs errors with [MTC] prefix and optional context.
 * Future: POST to /api/errors or integrate Sentry here.
 */
export function reportError(error: unknown, context?: string) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[MTC] ${context || 'Error'}:`, msg);
  // Future: POST to /api/errors or Sentry here
}
