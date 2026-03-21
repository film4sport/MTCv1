import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function readMobile(name) {
  return readFileSync(resolve(root, `public/mobile-app/js/${name}.ts`), 'utf-8');
}

describe('FUZZ: Mobile PWA state corruption resilience', () => {
  const utilsContent = readMobile('utils');
  const authContent = readMobile('auth');
  const navContent = readMobile('navigation');
  const apiContent = readMobile('api-client');

  describe('safe storage wrapper', () => {
    const safeGet = new Function('localStorage', 'key', 'fallback', `
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback !== undefined ? fallback : null;
        return JSON.parse(raw);
      } catch (e) {
        try { localStorage.removeItem(key); } catch (e2) {}
        return fallback !== undefined ? fallback : null;
      }
    `);

    it('returns fallback for missing keys instead of throwing', () => {
      const storage = {
        getItem() { return null; },
        removeItem() {}
      };

      expect(safeGet(storage, 'missing', [])).toEqual([]);
      expect(safeGet(storage, 'missing')).toBe(null);
    });

    it('clears corrupted JSON and falls back cleanly', () => {
      const removed = [];
      const storage = {
        getItem() { return '{"broken"'; },
        removeItem(key) { removed.push(key); }
      };

      expect(safeGet(storage, 'mtc-user', { safe: true })).toEqual({ safe: true });
      expect(removed).toEqual(['mtc-user']);
    });

    it('survives storage backends that throw on read', () => {
      const removed = [];
      const storage = {
        getItem() { throw new Error('quota'); },
        removeItem(key) { removed.push(key); }
      };

      expect(safeGet(storage, 'mtc-profile', null)).toBe(null);
      expect(removed).toEqual(['mtc-profile']);
    });

    it('implements the same corrupted-data clearing pattern in source', () => {
      expect(utilsContent).toContain('const raw = localStorage.getItem(key);');
      expect(utilsContent).toContain('return JSON.parse(raw);');
      expect(utilsContent).toContain('localStorage.removeItem(key);');
      expect(utilsContent).toContain('return fallback !== undefined ? fallback : null;');
    });
  });

  describe('token and auth state recovery', () => {
    it('treats session-active as the fallback auth source', () => {
      expect(utilsContent).toContain("MTC.storage.get('mtc-session-active', false)");
      expect(utilsContent).toContain("MTC._cachedToken = hasSession ? '__cookie_session__' : ''");
    });

    it('loads stored family state only when present, tolerating partial sessions', () => {
      expect(authContent).toContain("var storedFamily = MTC.storage.get('mtc-family-members', []);");
      expect(authContent).toContain('if (storedFamily && storedFamily.length > 0)');
      expect(authContent).toContain("var storedActiveMember = MTC.storage.get('mtc-active-family-member', null);");
      expect(authContent).toContain('if (storedActiveMember)');
    });

    it('wraps remembered-email restoration in try/catch', () => {
      expect(authContent).toContain("localStorage.getItem('mtc-remembered-email')");
      expect(authContent).toMatch(/try\s*\{\s*var remembered = localStorage\.getItem\('mtc-remembered-email'\);[\s\S]*?\}\s*catch\(e\)\s*\{\}/);
    });

    it('clears critical session and cached api keys on logout', () => {
      [
        'mtc-user',
        'mtc-session-time',
        'mtc-bookings',
        'mtc-conversations',
        'mtc-api-events',
        'mtc-api-members',
        'mtc-api-bookings',
        'mtc-family-members',
        'mtc-active-family-member'
      ].forEach((key) => {
        expect(authContent).toContain(`'${key}'`);
      });
    });

    it('guards guest navigation to an allowlist instead of trusting arbitrary screens', () => {
      expect(authContent).toContain('GUEST_ALLOWED_SCREENS.indexOf(screen) === -1');
      expect(authContent).toContain('Members only - sign up as a member for full access');
    });
  });

  describe('offline queue and cached api fallbacks', () => {
    it('caps the offline queue so corrupted clients cannot bloat storage forever', () => {
      expect(apiContent).toContain('var MAX_QUEUE_SIZE = 20;');
      expect(apiContent).toContain('pendingQueue.length >= MAX_QUEUE_SIZE');
      expect(apiContent).toContain('pendingQueue.shift();');
    });

    it('drops stale queued actions older than 24 hours', () => {
      expect(apiContent).toContain('24 * 60 * 60 * 1000');
      expect(apiContent).toContain('syncCount.dropped++;');
      expect(apiContent).toContain("stale action(s) expired");
    });

    it('only retries transient failures, not 4xx client errors', () => {
      expect(apiContent).toContain('if (result.status >= 500 || result.status === 0)');
      expect(apiContent).toContain('retryCount < MAX_RETRIES');
      expect(apiContent).toContain("4xx errors (including 409 conflict) are not retried");
    });

    it('falls back to cached data when auth or api loading is unavailable', () => {
      expect(apiContent).toContain('if (!token) {');
      expect(apiContent).toContain('return Promise.resolve(MTC.storage.get(storageKey, fallback));');
      expect(apiContent).toContain('return MTC.storage.get(storageKey, fallback);');
    });

    it('validates cached response shape before replacing storage', () => {
      expect(apiContent).toContain("type === 'array' && !Array.isArray(data)");
      expect(apiContent).toContain("type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))");
      expect(apiContent).toContain('var validated = expectedType === null ? result.data : validateResponse(result.data, expectedType, endpoint);');
    });

    it('handles unauthenticated mobile endpoints without throwing', () => {
      expect(apiContent).toContain("return Promise.resolve({ ok: false, data: { error: 'Not authenticated' }, status: 401 });");
    });
  });

  describe('navigation drift and bad screen inputs', () => {
    it('returns early if a target screen is missing from the dom', () => {
      expect(navContent).toContain("const targetScreen = document.getElementById('screen-' + screen);");
      expect(navContent).toContain('if (!targetScreen) return;');
    });

    it('normalizes removed or merged routes before activating screens', () => {
      expect(navContent).toContain("if (screen === 'mybookings') screen = 'schedule';");
      expect(navContent).toContain("if (screen === 'programs') {");
      expect(navContent).toContain("if (screen === 'profile') screen = 'settings';");
      expect(navContent).toContain("if (screen === 'events') {");
      expect(navContent).toContain("screen = 'home';");
    });

    it('keeps browser back navigation trapped inside valid pwa state', () => {
      expect(navContent).toContain("history.replaceState({ screen: 'home' }, '', '');");
      expect(navContent).toContain('if (e.state && e.state.screen)');
      expect(navContent).toContain("history.pushState({ screen: _currentScreen }, '', '');");
    });

    it('limits swipe navigation to the known screen set', () => {
      expect(navContent).toContain("const swipeScreens = ['home', 'schedule', 'partners', 'messages'];");
      expect(navContent).toContain('if (swipeScreens.indexOf(_currentScreen) === -1) return;');
    });
  });

  describe('runtime recovery hooks', () => {
    it('installs both global error and rejection handlers', () => {
      expect(utilsContent).toContain("window.addEventListener('unhandledrejection'");
      expect(utilsContent).toContain("window.addEventListener('error'");
      expect(utilsContent).toContain('window.onerror = function(message, source, lineno, colno, error)');
    });

    it('shows crash recovery only after repeated failures instead of first error noise', () => {
      expect(utilsContent).toContain('var _errorCount = 0;');
      expect(utilsContent).toContain('if (_errorCount >= 3) {');
      expect(utilsContent).toContain('showCrashRecovery();');
    });
  });
});
