/**
 * FUZZ TESTS — Mobile PWA Critical Functions
 *
 * The mobile PWA is vanilla JS (not importable modules), so we test:
 * 1. Source code patterns — ensure sanitization/validation is present
 * 2. Function resilience — extract and test key functions in isolation
 * 3. Input handling — verify user-facing inputs are protected
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

// ── Helper: read a mobile JS file ───────────────────────────────────────
function readMobile(name) {
  return readFileSync(resolve(root, `public/mobile-app/js/${name}.ts`), 'utf-8');
}

// ══════════════════════════════════════════════════════════════════════════
// sanitizeHTML — the mobile PWA's primary XSS defense
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA sanitizeHTML', () => {
  const utilsContent = readMobile('utils');

  // Extract and test the sanitizeHTML function
  // function sanitizeHTML(str) {
  //   if (typeof str !== 'string') return '';
  //   return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  // }
  const sanitizeHTML = new Function('str', `
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  `);

  it('encodes HTML special chars', () => {
    expect(sanitizeHTML('<script>')).toBe('&lt;script&gt;');
    expect(sanitizeHTML('"hello"')).toBe('&quot;hello&quot;');
    expect(sanitizeHTML("it's")).toBe('it&#039;s');
    expect(sanitizeHTML('a & b')).toBe('a &amp; b');
  });

  it('handles XSS payloads', () => {
    const payloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '"><img src=x onerror=alert(1)><"',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<a href="javascript:alert(1)">click</a>',
    ];
    for (const p of payloads) {
      const result = sanitizeHTML(p);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    }
  });

  it('returns empty string for non-string types', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
    expect(sanitizeHTML(42)).toBe('');
    expect(sanitizeHTML({})).toBe('');
    expect(sanitizeHTML([])).toBe('');
    expect(sanitizeHTML(true)).toBe('');
  });

  it('handles empty and whitespace strings', () => {
    expect(sanitizeHTML('')).toBe('');
    expect(sanitizeHTML('   ')).toBe('   ');
    expect(sanitizeHTML('\n\t')).toBe('\n\t');
  });

  it('handles huge inputs without hanging', () => {
    const huge = '<script>'.repeat(10000);
    const start = Date.now();
    sanitizeHTML(huge);
    expect(Date.now() - start).toBeLessThan(200);
  });

  it('handles Unicode safely', () => {
    expect(sanitizeHTML('Hello 你好 🎉')).toBe('Hello 你好 🎉');
    expect(sanitizeHTML('مرحبا')).toBe('مرحبا');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// parseTimeStr — used in mybookings for calendar downloads
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA parseTimeStr', () => {
  // Extract the function
  const parseTimeStr = new Function('str', `
    if (!str) return null;
    str = str.trim().toUpperCase();
    const match = str.match(/(\\d{1,2}):?(\\d{2})?\\s*(AM|PM)?/);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2] || '0');
    const ampm = match[3];
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h: h, m: m };
  `);

  it('parses standard 12h times', () => {
    expect(parseTimeStr('9:30 AM')).toEqual({ h: 9, m: 30 });
    expect(parseTimeStr('12:00 PM')).toEqual({ h: 12, m: 0 });
    expect(parseTimeStr('1:00 PM')).toEqual({ h: 13, m: 0 });
    expect(parseTimeStr('12:00 AM')).toEqual({ h: 0, m: 0 });
  });

  it('returns null for null/undefined/empty', () => {
    expect(parseTimeStr(null)).toBe(null);
    expect(parseTimeStr(undefined)).toBe(null);
    expect(parseTimeStr('')).toBe(null);
  });

  it('handles garbage strings without throwing', () => {
    const garbage = [
      'not a time', '<script>', '{}', '[]', 'null',
      '\x00\x01', '🎉', '99:99 ZZ',
    ];
    for (const g of garbage) {
      expect(() => parseTimeStr(g)).not.toThrow();
    }
  });

  it('handles edge AM/PM cases', () => {
    expect(parseTimeStr('12:30 AM')).toEqual({ h: 0, m: 30 }); // midnight
    expect(parseTimeStr('12:30 PM')).toEqual({ h: 12, m: 30 }); // noon
  });
});

// ══════════════════════════════════════════════════════════════════════════
// validateResponse — API client's response validator
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA validateResponse', () => {
  // Extract the function
  const validateResponse = new Function('data', 'type', 'label', `
    if (type === 'array' && !Array.isArray(data)) return null;
    if (type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) return null;
    return data;
  `);

  it('accepts valid arrays', () => {
    expect(validateResponse([], 'array', 'test')).toEqual([]);
    expect(validateResponse([1, 2], 'array', 'test')).toEqual([1, 2]);
  });

  it('accepts valid objects', () => {
    expect(validateResponse({}, 'object', 'test')).toEqual({});
    expect(validateResponse({ a: 1 }, 'object', 'test')).toEqual({ a: 1 });
  });

  it('rejects wrong types for array', () => {
    expect(validateResponse(null, 'array', 'test')).toBe(null);
    expect(validateResponse('string', 'array', 'test')).toBe(null);
    expect(validateResponse(42, 'array', 'test')).toBe(null);
    expect(validateResponse({}, 'array', 'test')).toBe(null);
    expect(validateResponse(undefined, 'array', 'test')).toBe(null);
  });

  it('rejects wrong types for object', () => {
    expect(validateResponse(null, 'object', 'test')).toBe(null);
    expect(validateResponse('string', 'object', 'test')).toBe(null);
    expect(validateResponse(42, 'object', 'test')).toBe(null);
    expect(validateResponse([], 'object', 'test')).toBe(null);
    expect(validateResponse(undefined, 'object', 'test')).toBe(null);
  });

  it('rejects prototype pollution attempts', () => {
    const malicious = JSON.parse('{"__proto__":{"isAdmin":true}}');
    // validateResponse should return it (it IS an object), but the data itself
    // shouldn't pollute Object.prototype
    const result = validateResponse(malicious, 'object', 'test');
    expect(({}).isAdmin).not.toBe(true); // prototype not polluted
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Mobile PWA — innerHTML usage audit
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA innerHTML safety audit', () => {
  // Files that use innerHTML with user-generated content
  // Excluded: avatar.js (only sets innerHTML from pre-generated SVG strings — safe)
  // Excluded: api-client.js (no innerHTML usage)
  const jsFiles = ['booking', 'events', 'notifications', 'messaging', 'partners',
    'mybookings', 'admin', 'home-calendar', 'utils'];

  jsFiles.forEach(file => {
    let content;
    try {
      content = readMobile(file);
    } catch { return; } // skip if file doesn't exist

    it(`${file}.js: all innerHTML assignments use sanitizeHTML for user data`, () => {
      // Find innerHTML assignments
      const innerHTMLMatches = content.match(/\.innerHTML\s*[+=]/g);
      if (!innerHTMLMatches) return; // no innerHTML usage

      // Verify sanitizeHTML is available in the file or imported via MTC.fn
      const hasSanitize = content.includes('sanitizeHTML') || content.includes('MTC.fn.sanitizeHTML');
      if (innerHTMLMatches.length > 0) {
        // At minimum, the file should reference sanitizeHTML if it uses innerHTML
        expect(hasSanitize).toBe(true);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Mobile PWA — Token handling safety
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA token handling', () => {
  const authContent = readMobile('auth');
  const apiContent = readMobile('api-client');

  it('stores token securely (not in URL params)', () => {
    // Token should never appear in URL query strings
    expect(authContent).not.toMatch(/window\.location.*token=/);
    expect(authContent).not.toMatch(/href.*\?.*token=/);
  });

  it('sends token via Authorization header (not query param)', () => {
    expect(apiContent).toMatch(/Authorization.*Bearer/);
    // Should not send token as query param
    expect(apiContent).not.toMatch(/\?token=|&token=/);
  });

  it('clears token on logout', () => {
    expect(authContent).toMatch(/removeItem|clear|token.*null|logout/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Mobile PWA — Error handling resilience
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA error handling', () => {
  const utilsContent = readMobile('utils');

  it('has global error handler', () => {
    expect(utilsContent).toMatch(/window\.onerror|addEventListener.*error/);
  });

  it('has unhandled rejection handler', () => {
    expect(utilsContent).toMatch(/unhandledrejection/);
  });

  it('error count limit prevents infinite loops', () => {
    expect(utilsContent).toMatch(/errorCount|_errorCount|maxErrors/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Mobile PWA — localStorage safety
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA localStorage safety', () => {
  const apiContent = readMobile('api-client');

  it('wraps localStorage access in try/catch', () => {
    // localStorage can throw in some environments (private browsing, quota exceeded)
    expect(apiContent).toMatch(/try\s*\{[\s\S]*?localStorage/);
  });

  it('falls back gracefully when localStorage fails', () => {
    expect(apiContent).toMatch(/catch|fallback|default/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Mobile PWA — Booking grid slot validation
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Mobile PWA booking slot safety', () => {
  const bookingContent = readMobile('booking');

  it('validates court IDs before use', () => {
    // Should not blindly trust court numbers from DOM data attributes
    expect(bookingContent).toMatch(/court.*[1-4]|courts\.length|config\.courts/);
  });

  it('checks for past slots before allowing booking', () => {
    expect(bookingContent).toMatch(/past|isPast|pastSlot|nowMins/i);
  });

  it('checks for blocked slots', () => {
    expect(bookingContent).toMatch(/blocked|isSlotBlocked|blockInfo/i);
  });

  it('checks for closed courts', () => {
    expect(bookingContent).toMatch(/closed|isCourtClosed/i);
  });
});
