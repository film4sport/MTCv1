/**
 * Centralized error reporting utility.
 * Logs errors locally and POSTs to /api/errors for server-side persistence.
 * Non-blocking — never throws or interrupts the caller.
 * Batches errors with a 2s debounce to avoid flooding the API.
 */
let errorQueue: Array<{ message: string; context?: string; stack?: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushErrors() {
  if (errorQueue.length === 0) return;
  const batch = errorQueue.splice(0, 10); // max 10 per flush
  batch.forEach((entry) => {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    }).catch(() => { /* non-critical — don't recurse into reportError */ });
  });
}

export function reportError(error: unknown, context?: string) {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[MTC] ${context || 'Error'}:`, msg);

  // Only queue client-side errors (server-side errors go to console only)
  if (typeof window !== 'undefined') {
    errorQueue.push({ message: msg, context, stack });
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushErrors, 2000);
  }
}
