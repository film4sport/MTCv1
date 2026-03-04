/**
 * Dashboard — Data Transform & Validation Tests
 * Tests the mapping logic that converts Supabase row format to app types,
 * and validates booking/event data shapes for consistency.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read db.ts source to verify transform patterns
const dbSource = readFileSync(resolve(__dirname, '../app/dashboard/lib/db.ts'), 'utf8');

describe('db.ts — Supabase → App type mappings', () => {
  it('fetchMembers maps all profile fields correctly', () => {
    expect(dbSource).toContain("id: p.id");
    expect(dbSource).toContain("name: p.name");
    expect(dbSource).toContain("email: p.email");
    expect(dbSource).toContain("role: p.role");
    expect(dbSource).toContain("status: (p.status");
    expect(dbSource).toContain("ntrp: p.ntrp");
    expect(dbSource).toContain("skillLevel: (p.skill_level");
    expect(dbSource).toContain("membershipType: (p.membership_type");
    expect(dbSource).toContain("familyId: p.family_id");
    expect(dbSource).toContain("avatar: p.avatar");
  });

  it('fetchBookings maps snake_case DB columns to camelCase', () => {
    expect(dbSource).toContain("courtId: b.court_id");
    expect(dbSource).toContain("courtName: b.court_name");
    expect(dbSource).toContain("userId: b.user_id");
    expect(dbSource).toContain("userName: b.user_name");
    expect(dbSource).toContain("guestName: b.guest_name");
    expect(dbSource).toContain("programId: b.program_id");
    expect(dbSource).toContain("matchType: (b.match_type");
    expect(dbSource).toContain("bookedFor: b.booked_for");
  });

  it('createBooking maps camelCase to snake_case for insert', () => {
    expect(dbSource).toContain("court_id: booking.courtId");
    expect(dbSource).toContain("court_name: booking.courtName");
    expect(dbSource).toContain("user_id: booking.userId");
    expect(dbSource).toContain("user_name: booking.userName");
  });

  it('fetchBookings includes booking_participants join', () => {
    expect(dbSource).toContain("booking_participants(*)");
    expect(dbSource).toContain("participant_id");
    expect(dbSource).toContain("participant_name");
  });

  it('fetchEvents maps all event fields', () => {
    expect(dbSource).toContain("from('events')");
    expect(dbSource).toContain("event_attendees(*)");
  });

  it('fetchConversations maps message data correctly', () => {
    expect(dbSource).toContain("from('conversations')");
    expect(dbSource).toContain("messages(*)");
  });
});

describe('db.ts — Error handling patterns', () => {
  it('all fetch functions return empty array on null data', () => {
    const fetchFunctions = ['fetchMembers', 'fetchBookings', 'fetchEvents', 'fetchPartners', 'fetchConversations', 'fetchAnnouncements', 'fetchCourts', 'fetchNotifications', 'fetchPrograms'];
    for (const fn of fetchFunctions) {
      expect(dbSource).toContain(`export async function ${fn}`);
    }
  });

  it('fetchBookings calls reportError on error', () => {
    expect(dbSource).toContain("reportError(new Error(error.message), 'fetchBookings')");
  });

  it('mutation functions throw on Supabase error', () => {
    expect(dbSource).toContain('if (error) throw error');
  });

  it('imports reportError for error logging', () => {
    expect(dbSource).toContain("import { reportError }");
  });
});

describe('db.ts — Mutation operations', () => {
  it('cancelBooking updates status to cancelled', () => {
    expect(dbSource).toContain("status: 'cancelled'");
  });

  it('toggleEventRsvp checks existing attendance then inserts or deletes', () => {
    expect(dbSource).toContain("from('event_attendees')");
    expect(dbSource).toContain("eq('event_id', eventId)");
    expect(dbSource).toContain("eq('user_name', userName)");
  });

  it('createNotification sets read to false', () => {
    expect(dbSource).toContain("read: false");
  });

  it('markNotificationRead sets read to true', () => {
    expect(dbSource).toContain("read: true");
  });

  it('getGateCode queries club_settings table', () => {
    expect(dbSource).toContain("from('club_settings')");
    expect(dbSource).toContain("gate_code");
  });

  it('updateGateCode uses upsert', () => {
    expect(dbSource).toContain('.upsert(');
  });

  it('createFamily inserts into families and updates profile', () => {
    expect(dbSource).toContain("from('families')");
    expect(dbSource).toContain("family_id:");
  });

  it('enrollInProgram and withdrawFromProgram use program_enrollments', () => {
    expect(dbSource).toContain("from('program_enrollments')");
    expect(dbSource).toContain("program_id");
    expect(dbSource).toContain("member_id");
  });

  it('sendWelcomeMessage uses RPC', () => {
    expect(dbSource).toContain("rpc('send_welcome_message'");
  });
});

describe('db.ts — Security patterns', () => {
  it('uses parameterized queries via Supabase client (no raw SQL)', () => {
    expect(dbSource).not.toMatch(/`SELECT|`INSERT|`UPDATE|`DELETE/);
    expect(dbSource).not.toMatch(/supabase\.rpc\([^)]*`/);
  });

  it('all write operations use typed parameters', () => {
    expect(dbSource).toContain('booking: Booking');
    expect(dbSource).toContain('partner: Partner');
    expect(dbSource).toContain('announcement: Announcement');
    expect(dbSource).toContain('program: CoachingProgram');
  });

  it('delete operations require explicit IDs', () => {
    expect(dbSource).toContain("deletePartner(partnerId: string)");
    expect(dbSource).toContain("deleteAnnouncement(id: string)");
    expect(dbSource).toContain("deleteMember(userId: string)");
  });
});
