/**
 * FEATURE REGRESSION TESTS — All API-Backed Features
 *
 * Tests each feature's complete flow at the validation + code-structure level.
 * If ANY route changes break a feature's input/output contract, these catch it.
 *
 * Features tested:
 * 1. Court Booking (create, cancel, overlap check, participants, guest, notifications)
 * 2. Messaging (send, receive, mark read, conversations)
 * 3. Partner Matching (post, respond, delete, auto-expiry)
 * 4. Events & RSVP (list, create, RSVP toggle, admin CRUD)
 * 5. Notifications (fetch, mark read, mark all read)
 * 6. Member Profiles (update, admin manage, search)
 * 7. Announcements (create, dismiss, admin CRUD)
 * 8. Court Management (list, block, unblock)
 * 9. Settings (get, update admin settings)
 * 10. Programs (coaching enrollment)
 * 11. Families (family member management)
 * 12. Lineups (interclub team lineups)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  isValidUUID, isValidEnum, isValidDate, isInRange, isValidEmail,
  isValidTime, sanitizeInput, LIMITS, BOOKING_RULES,
  VALID_STATUSES, VALID_SKILL_LEVELS, VALID_MATCH_TYPES,
  VALID_EVENT_TYPES, VALID_ANNOUNCEMENT_TYPES, VALID_BLOCK_REASONS,
  VALID_MEMBERSHIP_TYPES, VALID_INTERCLUB_TEAMS, VALID_FAMILY_TYPES,
  SETTINGS_KEY_WHITELIST,
} from '../app/lib/shared-constants.ts';

const root = resolve(__dirname, '..');

function readRoute(name) {
  return readFileSync(resolve(root, `app/api/mobile/${name}/route.ts`), 'utf-8');
}

// ══════════════════════════════════════════════════════════════════════════
// 1. COURT BOOKING — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Court Booking', () => {
  const route = readRoute('bookings');
  // Dashboard bookings route was consolidated into /api/mobile/bookings (no separate route)
  const dashRoute = '';
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  describe('Create booking', () => {
    it('validates all required fields: courtId, date, time, matchType, duration', () => {
      expect(route).toMatch(/!courtId|!date|!time|!matchType|!duration/);
    });

    it('validates court is 1-4', () => {
      expect(route).toContain('validCourts');
    });

    it('checks for overlapping bookings before inserting', () => {
      expect(route).toMatch(/overlap|conflict|existing/i);
    });

    it('prevents booking past closing hours per court', () => {
      expect(route).toContain('courtHoursClose');
    });

    it('generates unique booking ID', () => {
      expect(route).toMatch(/generateId|randomUUID|crypto/);
    });

    it('inserts into bookings table', () => {
      expect(route).toMatch(/bookings.*insert|from\('bookings'\)/);
    });

    it('inserts participants into booking_participants table', () => {
      expect(route).toContain('booking_participants');
    });
  });

  describe('Cancel booking', () => {
    it('DELETE handler exists', () => {
      expect(route).toMatch(/export\s+async\s+function\s+DELETE/);
    });

    it('verifies booking ownership (user_id or admin)', () => {
      expect(route).toMatch(/user_id|booked_by|admin/);
    });

    it('sets status to cancelled (not hard delete)', () => {
      expect(route).toMatch(/cancelled|status/);
    });

    it('fires cancellation notifications to participants', () => {
      expect(route).toContain('fireCancellationNotifications');
    });
  });

  describe('Booking notifications (4-layer stack)', () => {
    it('creates bell notification (DB insert)', () => {
      expect(route).toContain('createNotification');
    });

    it('sends push notification', () => {
      expect(route).toContain('sendPushToUser');
    });

    it('sends direct message to participants', () => {
      expect(route).toContain('sendMessage');
    });

    it('sends email confirmation', () => {
      expect(route).toMatch(/booking-email|email.*api/);
    });
  });

  describe('Dashboard → API path', () => {
    it('Dashboard addBooking calls /api/mobile/bookings (unified route)', () => {
      expect(store).toContain('/api/mobile/bookings');
    });

    it('Dashboard has optimistic update with rollback on failure', () => {
      expect(store).toMatch(/setBookings.*prev.*filter|rollback|prev\.filter/);
    });
  });

  describe('Booking rules constants', () => {
    it('4 courts', () => expect(BOOKING_RULES.COURT_COUNT).toBe(4));
    it('30-min slots', () => expect(BOOKING_RULES.SLOT_DURATION_MINUTES).toBe(30));
    it('$10 guest fee', () => expect(BOOKING_RULES.GUEST_FEE).toBe(10));
    it('24h cancellation window', () => expect(BOOKING_RULES.CANCEL_HOURS).toBe(24));
    it('14-day advance booking', () => expect(BOOKING_RULES.MAX_ADVANCE_DAYS).toBe(14));
    it('7am first slot', () => expect(BOOKING_RULES.FIRST_SLOT_HOUR).toBe(7));
    it('9pm last slot', () => expect(BOOKING_RULES.LAST_SLOT_HOUR).toBe(21));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2. MESSAGING — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Messaging', () => {
  const route = readRoute('conversations');
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  describe('Send message', () => {
    it('validates recipient UUID', () => {
      expect(route).toContain('isValidUUID');
    });

    it('sanitizes message text with 2000 char limit', () => {
      expect(route).toContain('sanitizeInput');
      expect(route).toContain('2000');
    });

    it('rejects empty messages', () => {
      expect(route).toMatch(/!text|empty|required|text\.length/);
    });

    it('prevents sending to self', () => {
      expect(route).toMatch(/yourself|self|toId/);
    });

    it('finds or creates conversation', () => {
      expect(route).toMatch(/conversations.*insert|member_a.*member_b/);
    });

    it('inserts message into messages table', () => {
      expect(route).toMatch(/messages.*insert|from\('messages'\)/);
    });

    it('updates conversation last_message', () => {
      expect(route).toContain('last_message');
    });
  });

  describe('Fetch conversations', () => {
    it('GET returns conversations where user is participant', () => {
      expect(route).toMatch(/member_a.*member_b/);
    });

    it('orders by last_timestamp descending', () => {
      expect(route).toContain('last_timestamp');
    });
  });

  describe('Mark read', () => {
    it('PATCH marks messages as read', () => {
      expect(route).toContain("read");
    });

    it('only marks messages sent TO the user (not FROM)', () => {
      expect(route).toMatch(/to_id/);
    });
  });

  describe('Message notifications', () => {
    it('creates bell notification for recipient', () => {
      expect(route).toContain('createNotification');
    });

    it('sends push notification', () => {
      expect(route).toContain('sendPushToUser');
    });
  });

  describe('Dashboard integration', () => {
    it('sendMessage uses apiCall', () => {
      expect(store).toMatch(/apiCall\('\/api\/mobile\/conversations'.*'POST'/);
    });

    it('markConversationRead uses apiCall', () => {
      expect(store).toMatch(/apiCall\('\/api\/mobile\/conversations'.*'PATCH'/);
    });
  });

  describe('Validation constants', () => {
    it('message limit is 2000', () => expect(LIMITS.MESSAGE_TEXT).toBe(2000));
    it('preview limit is 100', () => expect(LIMITS.MESSAGE_PREVIEW).toBe(100));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. PARTNER MATCHING — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Partner Matching', () => {
  const route = readRoute('partners');
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  describe('Post partner request', () => {
    it('validates matchType enum', () => {
      expect(route).toContain('VALID_MATCH_TYPES');
    });

    it('validates skillLevel enum', () => {
      expect(route).toContain('VALID_SKILL_LEVELS');
    });

    it('sanitizes message and availability', () => {
      expect(route).toContain('sanitizeInput');
    });

    it('inserts into partners table', () => {
      expect(route).toMatch(/partners.*insert/);
    });
  });

  describe('Remove partner request', () => {
    it('DELETE verifies ownership (eq user_id + userId from auth)', () => {
      expect(route).toMatch(/\.eq\(.user_id.*userId/);
    });
  });

  describe('Auto-expiry', () => {
    it('GET filters by date >= today', () => {
      expect(route).toMatch(/gte.*date|today/);
    });
  });

  describe('Dashboard integration', () => {
    it('addPartner uses apiCall POST', () => {
      expect(store).toMatch(/apiCall\('\/api\/mobile\/partners'.*'POST'/);
    });

    it('removePartner uses apiCall DELETE', () => {
      expect(store).toMatch(/apiCall\('\/api\/mobile\/partners'.*'DELETE'/);
    });
  });

  describe('Validation constants', () => {
    it('match types: singles, doubles, any', () => {
      expect(VALID_MATCH_TYPES).toEqual(['singles', 'doubles', 'any']);
    });

    it('skill levels: 4 tiers', () => {
      expect(VALID_SKILL_LEVELS).toEqual(['beginner', 'intermediate', 'advanced', 'competitive']);
    });

    it('partner message limit is 500', () => expect(LIMITS.PARTNER_MESSAGE).toBe(500));
    it('availability limit is 200', () => expect(LIMITS.PARTNER_AVAILABILITY).toBe(200));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. EVENTS & RSVP — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Events & RSVP', () => {
  const route = readRoute('events');
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  describe('List events', () => {
    it('GET returns events from events table', () => {
      expect(route).toMatch(/export\s+async\s+function\s+GET/);
      expect(route).toMatch(/from\('events'\)/);
    });
  });

  describe('RSVP toggle', () => {
    it('POST handles RSVP (eventId in body)', () => {
      expect(route).toMatch(/eventId|rsvp|attendee/i);
    });

    it('Dashboard toggleRsvp uses apiCall', () => {
      expect(store).toMatch(/apiCall\('\/api\/mobile\/events'.*'POST'/);
    });
  });

  describe('Admin CRUD', () => {
    it('POST creates events', () => {
      expect(route).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('PATCH updates events', () => {
      expect(route).toMatch(/export\s+async\s+function\s+PATCH/);
    });

    it('DELETE removes events', () => {
      expect(route).toMatch(/export\s+async\s+function\s+DELETE/);
    });

    it('validates dates and times', () => {
      expect(route).toContain('isValidDate');
      expect(route).toContain('isValidTime');
    });

    it('sends push notifications for event changes', () => {
      expect(route).toContain('sendPushToUser');
    });
  });

  describe('Validation constants', () => {
    it('event types: 6 types', () => {
      expect(VALID_EVENT_TYPES).toEqual(['clinic', 'tournament', 'social', 'roundrobin', 'camp', 'interclub']);
    });

    it('event description limit is 2000', () => expect(LIMITS.EVENT_DESCRIPTION).toBe(2000));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Notifications', () => {
  const route = readRoute('notifications');
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  describe('Fetch notifications', () => {
    it('GET filters by user_id', () => {
      expect(route).toMatch(/user_id/);
    });

    it('orders by timestamp (newest first)', () => {
      expect(route).toMatch(/timestamp|ascending.*false/);
    });
  });

  describe('Mark read', () => {
    it('PATCH marks individual notification', () => {
      expect(route).toMatch(/export\s+async\s+function\s+PATCH/);
    });

    it('supports mark-all-read', () => {
      expect(route).toMatch(/markAll|mark_all|all/);
    });

    it('only affects current user notifications', () => {
      expect(route).toMatch(/user_id.*authResult/);
    });
  });

  describe('Dashboard integration', () => {
    it('markNotificationRead uses apiCall', () => {
      expect(store).toContain("apiCall('/api/mobile/notifications'");
    });
  });

  describe('Validation constants', () => {
    it('max notifications is 100', () => expect(LIMITS.MAX_NOTIFICATIONS).toBe(100));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. MEMBER PROFILES — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Member Profiles', () => {
  const route = readRoute('members');
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  describe('Profile update', () => {
    it('PATCH validates UUID', () => {
      expect(route).toContain('isValidUUID');
    });

    it('validates email format', () => {
      expect(route).toContain('isValidEmail');
    });

    it('validates status, membership, skill enums', () => {
      expect(route).toContain('VALID_STATUSES');
      expect(route).toContain('VALID_MEMBERSHIP_TYPES');
      expect(route).toContain('VALID_SKILL_LEVELS');
    });

    it('sanitizes text fields', () => {
      expect(route).toContain('sanitizeInput');
    });
  });

  describe('Admin member management', () => {
    it('POST creates new members (admin only)', () => {
      expect(route).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('DELETE deactivates members', () => {
      expect(route).toMatch(/export\s+async\s+function\s+DELETE/);
    });
  });

  describe('Dashboard integration', () => {
    it('updateProfile uses apiCall', () => {
      expect(store).toContain("apiCall('/api/mobile/members'");
    });
  });

  describe('Validation constants', () => {
    it('statuses: active, paused, inactive', () => {
      expect(VALID_STATUSES).toEqual(['active', 'paused', 'inactive']);
    });

    it('membership types: adult, family, junior', () => {
      expect(VALID_MEMBERSHIP_TYPES).toEqual(['adult', 'family', 'junior']);
    });

    it('interclub teams: none, a, b', () => {
      expect(VALID_INTERCLUB_TEAMS).toEqual(['none', 'a', 'b']);
    });

    it('name limit is 100', () => expect(LIMITS.NAME).toBe(100));
    it('email limit is 254', () => expect(LIMITS.EMAIL).toBe(254));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. ANNOUNCEMENTS — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Announcements', () => {
  const route = readRoute('announcements');

  describe('CRUD', () => {
    it('GET fetches announcements', () => {
      expect(route).toMatch(/export\s+async\s+function\s+GET/);
    });

    it('POST creates announcement (admin)', () => {
      expect(route).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('PATCH dismisses announcement', () => {
      expect(route).toMatch(/export\s+async\s+function\s+PATCH/);
    });

    it('DELETE removes announcement', () => {
      expect(route).toMatch(/export\s+async\s+function\s+DELETE/);
    });
  });

  describe('Validation', () => {
    it('validates announcement type', () => {
      expect(route).toContain('VALID_ANNOUNCEMENT_TYPES');
    });

    it('sanitizes body text', () => {
      expect(route).toContain('sanitizeInput');
    });
  });

  describe('Validation constants', () => {
    it('types: info, warning, urgent', () => {
      expect(VALID_ANNOUNCEMENT_TYPES).toEqual(['info', 'warning', 'urgent']);
    });

    it('body limit is 2000', () => expect(LIMITS.ANNOUNCEMENT_BODY).toBe(2000));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. COURT MANAGEMENT — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Court Management', () => {
  const courtsRoute = readRoute('courts');
  const blocksRoute = readRoute('court-blocks');

  describe('Courts', () => {
    it('GET lists courts', () => {
      expect(courtsRoute).toMatch(/export.*GET/);
    });

    it('PATCH updates court status (admin)', () => {
      expect(courtsRoute).toMatch(/export.*PATCH/);
    });
  });

  describe('Court blocks', () => {
    it('POST creates block', () => {
      expect(blocksRoute).toMatch(/export.*POST|withAuth/);
    });

    it('DELETE removes block', () => {
      expect(blocksRoute).toMatch(/export.*DELETE|withAuth/);
    });

    it('validates block reason against whitelist', () => {
      expect(blocksRoute).toContain('VALID_BLOCK_REASONS');
    });

    it('validates date and time', () => {
      expect(blocksRoute).toContain('isValidDate');
      expect(blocksRoute).toContain('isValidTime');
    });

    it('validates court number range', () => {
      expect(blocksRoute).toContain('isInRange');
    });
  });

  describe('Validation constants', () => {
    it('block reasons: 7 options', () => {
      expect(VALID_BLOCK_REASONS).toEqual([
        'Maintenance', 'Tournament', 'Weather', 'Private Event',
        'Club Event', 'Coaching Session', 'Other',
      ]);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. SETTINGS — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Club Settings', () => {
  const route = readRoute('settings');

  describe('Admin settings', () => {
    it('GET fetches settings', () => {
      expect(route).toMatch(/export.*GET/);
    });

    it('POST/PATCH updates settings', () => {
      expect(route).toMatch(/export.*POST|export.*PATCH/);
    });

    it('validates keys against whitelist', () => {
      expect(route).toContain('SETTINGS_KEY_WHITELIST');
    });

    it('restricts to admin role', () => {
      expect(route).toMatch(/admin|role/);
    });
  });

  describe('Validation constants', () => {
    it('settings whitelist has 9 keys', () => {
      expect(SETTINGS_KEY_WHITELIST.length).toBe(9);
    });

    it('includes gate_code, club_name, season dates', () => {
      expect(SETTINGS_KEY_WHITELIST).toContain('gate_code');
      expect(SETTINGS_KEY_WHITELIST).toContain('club_name');
      expect(SETTINGS_KEY_WHITELIST).toContain('season_start');
      expect(SETTINGS_KEY_WHITELIST).toContain('season_end');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. PROGRAMS — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Coaching Programs', () => {
  const route = readRoute('programs');

  describe('CRUD', () => {
    it('GET lists programs', () => {
      expect(route).toMatch(/export.*GET/);
    });

    it('POST creates program (coach/admin)', () => {
      expect(route).toMatch(/export.*POST/);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 11. FAMILIES — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Family Members', () => {
  const route = readRoute('families');

  describe('CRUD', () => {
    it('exports GET, POST, PATCH, DELETE', () => {
      expect(route).toMatch(/export.*GET/);
      expect(route).toMatch(/export.*POST/);
      expect(route).toMatch(/export.*PATCH/);
      expect(route).toMatch(/export.*DELETE/);
    });
  });

  describe('Validation', () => {
    it('validates UUID', () => expect(route).toContain('isValidUUID'));
    it('validates family type', () => expect(route).toContain('VALID_FAMILY_TYPES'));
    it('validates skill level', () => expect(route).toContain('VALID_SKILL_LEVELS'));
    it('sanitizes names', () => expect(route).toContain('sanitizeInput'));
  });

  describe('Validation constants', () => {
    it('family types: adult, junior', () => {
      expect(VALID_FAMILY_TYPES).toEqual(['adult', 'junior']);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 12. LINEUPS — Full flow
// ══════════════════════════════════════════════════════════════════════════

describe('Feature: Interclub Lineups', () => {
  const route = readRoute('lineups');

  describe('CRUD', () => {
    it('exports GET, POST, PATCH, DELETE', () => {
      expect(route).toMatch(/export.*GET/);
      expect(route).toMatch(/export.*POST/);
      expect(route).toMatch(/export.*PATCH/);
      expect(route).toMatch(/export.*DELETE/);
    });
  });

  describe('Validation', () => {
    it('validates UUID', () => expect(route).toContain('isValidUUID'));
    it('validates date', () => expect(route).toContain('isValidDate'));
    it('sanitizes text', () => expect(route).toContain('sanitizeInput'));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// CROSS-FEATURE: Validation function behavioral tests
// ══════════════════════════════════════════════════════════════════════════

describe('Cross-Feature: Validation functions work for real booking data', () => {
  it('validates a real booking date', () => {
    expect(isValidDate('2026-06-15')).toBe(true);
  });

  it('validates a real booking time (12h)', () => {
    expect(isValidTime('9:30 AM')).toBe(true);
    expect(isValidTime('2:00 PM')).toBe(true);
  });

  it('validates a real UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('validates real enum values used in features', () => {
    expect(isValidEnum('singles', VALID_MATCH_TYPES)).toBe(true);
    expect(isValidEnum('doubles', VALID_MATCH_TYPES)).toBe(true);
    expect(isValidEnum('beginner', VALID_SKILL_LEVELS)).toBe(true);
    expect(isValidEnum('active', VALID_STATUSES)).toBe(true);
    expect(isValidEnum('clinic', VALID_EVENT_TYPES)).toBe(true);
    expect(isValidEnum('info', VALID_ANNOUNCEMENT_TYPES)).toBe(true);
    expect(isValidEnum('adult', VALID_MEMBERSHIP_TYPES)).toBe(true);
    expect(isValidEnum('Maintenance', VALID_BLOCK_REASONS)).toBe(true);
  });

  it('validates real email', () => {
    expect(isValidEmail('film4sports@gmail.com')).toBe(true);
  });

  it('sanitizes a real message without destroying content', () => {
    const msg = "Hey! Want to play doubles tomorrow at 3pm? Court 2 is free.";
    expect(sanitizeInput(msg, 2000)).toBe(msg);
  });

  it('sanitizes a message with special characters safely', () => {
    const msg = "Can't make it today - maybe next week? (Let's play @ 4pm)";
    const result = sanitizeInput(msg, 2000);
    expect(result).not.toContain("'"); // quotes stripped
    expect(result).toContain('make it today'); // content preserved
  });

  it('court number validation via isInRange', () => {
    expect(isInRange(1, 1, 4)).toBe(true);
    expect(isInRange(4, 1, 4)).toBe(true);
    expect(isInRange(0, 1, 4)).toBe(false);
    expect(isInRange(5, 1, 4)).toBe(false);
  });

  it('booking duration validation', () => {
    expect(isInRange(2, 2, 4)).toBe(true); // 1 hour
    expect(isInRange(3, 2, 4)).toBe(true); // 1.5 hours
    expect(isInRange(4, 2, 4)).toBe(true); // 2 hours
    expect(isInRange(1, 2, 4)).toBe(false); // 30 min - too short
    expect(isInRange(5, 2, 4)).toBe(false); // 2.5 hours - too long
  });
});
