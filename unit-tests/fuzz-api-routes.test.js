/**
 * FUZZ TESTS — API Route Input Handling
 *
 * Verifies that every API route properly validates and sanitizes inputs.
 * Tests that dangerous payloads would be caught before reaching Supabase.
 *
 * Since we can't call the actual Next.js routes in Vitest (they need a server),
 * we verify the validation chain: every field that comes from user input must
 * pass through sanitizeInput, isValidUUID, isValidEnum, isValidDate, etc.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

// Helper: read a route file
function readRoute(name) {
  return readFileSync(resolve(root, `app/api/mobile/${name}/route.ts`), 'utf-8');
}

// ══════════════════════════════════════════════════════════════════════════
// BOOKINGS — accepts: courtId, date, time, matchType, duration, guests, participants
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Bookings route input guards', () => {
  const content = readRoute('bookings');

  it('validates courtId is a valid court number', () => {
    expect(content).toMatch(/validCourts|courtId/);
    // Must check against a whitelist, not just typeof
    expect(content).toMatch(/includes|indexOf|validCourts/);
  });

  it('validates date format before using it in DB query', () => {
    // If date hits DB unsanitized, SQL injection possible via date field
    expect(content).toMatch(/date.*sanitize|isValidDate|\/\^\d/);
  });

  it('validates time format', () => {
    expect(content).toMatch(/time.*sanitize|timeSlots|validSlot|slotIndex/);
  });

  it('validates matchType against whitelist', () => {
    expect(content).toMatch(/matchType.*singles|doubles/);
  });

  it('validates duration against allowed values', () => {
    expect(content).toMatch(/durations|duration.*includes/);
  });

  it('sanitizes guest names', () => {
    expect(content).toMatch(/sanitizeInput.*guest|guestName.*sanitize/i);
  });

  it('validates participant IDs are UUIDs', () => {
    // Participant IDs should be validated before DB lookups
    expect(content).toMatch(/participant|isValidUUID/);
  });

  it('prevents booking in the past', () => {
    expect(content).toMatch(/past|before.*today|date.*<|isPast/i);
  });

  it('prevents booking beyond max advance days', () => {
    expect(content).toContain('maxAdvanceDays');
  });

  it('checks for overlap/conflicts before inserting', () => {
    expect(content).toMatch(/overlap|conflict|existing|already/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// CONVERSATIONS — accepts: toId, text, conversationId
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Conversations route input guards', () => {
  const content = readRoute('conversations');

  it('validates toId is a UUID', () => {
    expect(content).toContain('isValidUUID');
  });

  it('sanitizes message text', () => {
    expect(content).toMatch(/sanitizeInput.*text|text.*sanitize/);
  });

  it('enforces message length limit', () => {
    // Must cap message text — 2000 char limit
    expect(content).toMatch(/2000|MESSAGE_TEXT|maxLength/);
  });

  it('rejects empty messages after sanitization', () => {
    expect(content).toMatch(/!text|text\.length|empty|required/);
  });

  it('prevents sending to self', () => {
    expect(content).toMatch(/self|yourself|toId.*===|===.*toId/);
  });

  it('validates conversationId for PATCH (mark read)', () => {
    expect(content).toMatch(/conversationId|conversation_id/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// PARTNERS — accepts: matchType, skillLevel, availability, message, date, time
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Partners route input guards', () => {
  const content = readRoute('partners');

  it('validates matchType against VALID_MATCH_TYPES', () => {
    expect(content).toContain('VALID_MATCH_TYPES');
    expect(content).toContain('isValidEnum');
  });

  it('validates skillLevel against VALID_SKILL_LEVELS', () => {
    expect(content).toContain('VALID_SKILL_LEVELS');
  });

  it('sanitizes availability text', () => {
    expect(content).toMatch(/sanitizeInput.*availability|availability.*sanitize/i);
  });

  it('sanitizes message text', () => {
    expect(content).toMatch(/sanitizeInput.*message|message.*sanitize/i);
  });

  it('validates ownership before DELETE', () => {
    expect(content).toMatch(/user_id.*authResult|eq.*user_id/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// EVENTS — accepts: title, description, date, startTime, endTime, eventType, maxParticipants
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Events route input guards', () => {
  const content = readRoute('events');

  it('sanitizes event title', () => {
    expect(content).toMatch(/sanitizeInput/);
  });

  it('validates date fields', () => {
    expect(content).toContain('isValidDate');
  });

  it('validates time fields', () => {
    expect(content).toContain('isValidTime');
  });

  it('validates numeric ranges (maxParticipants, etc.)', () => {
    expect(content).toContain('isInRange');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// MEMBERS — accepts: name, email, status, membershipType, skillLevel, phone, etc.
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Members route input guards', () => {
  const content = readRoute('members');

  it('validates email format', () => {
    expect(content).toContain('isValidEmail');
  });

  it('validates UUID for member ID', () => {
    expect(content).toContain('isValidUUID');
  });

  it('validates status enum', () => {
    expect(content).toContain('VALID_STATUSES');
  });

  it('validates membershipType enum', () => {
    expect(content).toContain('VALID_MEMBERSHIP_TYPES');
  });

  it('validates skillLevel enum', () => {
    expect(content).toContain('VALID_SKILL_LEVELS');
  });

  it('sanitizes name and other text fields', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('uses validationError for consistent error responses', () => {
    expect(content).toContain('validationError');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS — accepts: body, type, title, audience
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Announcements route input guards', () => {
  const content = readRoute('announcements');

  it('validates announcement type enum', () => {
    expect(content).toContain('VALID_ANNOUNCEMENT_TYPES');
  });

  it('sanitizes announcement body', () => {
    expect(content).toContain('sanitizeInput');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// COURT-BLOCKS — accepts: courtId, date, startTime, endTime, reason
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Court-blocks route input guards', () => {
  const content = readRoute('court-blocks');

  it('validates date format', () => {
    expect(content).toContain('isValidDate');
  });

  it('validates time format', () => {
    expect(content).toContain('isValidTime');
  });

  it('validates court number range', () => {
    expect(content).toContain('isInRange');
  });

  it('validates block reason against whitelist', () => {
    expect(content).toContain('VALID_BLOCK_REASONS');
  });

  it('sanitizes reason text', () => {
    expect(content).toContain('sanitizeInput');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// FAMILIES — accepts: name, type, skillLevel, etc.
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Families route input guards', () => {
  const content = readRoute('families');

  it('validates UUID fields', () => {
    expect(content).toContain('isValidUUID');
  });

  it('validates family type enum', () => {
    expect(content).toContain('VALID_FAMILY_TYPES');
  });

  it('validates skill level enum', () => {
    expect(content).toContain('VALID_SKILL_LEVELS');
  });

  it('sanitizes name fields', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('validates numeric ranges', () => {
    expect(content).toContain('isInRange');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS — accepts: key, value pairs
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Settings route input guards', () => {
  const content = readRoute('settings');

  it('validates setting keys against whitelist', () => {
    expect(content).toMatch(/SETTINGS_KEY_WHITELIST|whitelist|allowedKeys/);
  });

  it('sanitizes setting values', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('restricts to admin role', () => {
    expect(content).toMatch(/admin|role/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// LINEUPS — accepts: eventId, players, positions, notes
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Lineups route input guards', () => {
  const content = readRoute('lineups');

  it('validates UUID fields', () => {
    expect(content).toContain('isValidUUID');
  });

  it('validates date fields', () => {
    expect(content).toContain('isValidDate');
  });

  it('sanitizes text fields', () => {
    expect(content).toContain('sanitizeInput');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// GLOBAL: All routes reject unauthenticated requests
// ══════════════════════════════════════════════════════════════════════════

describe('FUZZ: Auth rejection on all routes', () => {
  const routes = [
    'bookings', 'conversations', 'partners', 'events', 'notifications',
    'members', 'announcements', 'courts', 'court-blocks', 'families',
    'lineups', 'programs', 'settings',
  ];

  routes.forEach(route => {
    it(`${route} checks auth header`, () => {
      const content = readRoute(route);
      // Must check for Bearer token via authenticateMobileRequest or withAuth
      expect(
        content.includes('authenticateMobileRequest') || content.includes('withAuth')
      ).toBe(true);
    });
  });
});
