import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function read(relPath) {
  return readFileSync(resolve(root, relPath), 'utf-8');
}

const authJs = read('public/mobile-app/js/auth.js');
const realtimeSync = read('public/mobile-app/js/realtime-sync.js');
const bookingJs = read('public/mobile-app/js/booking.js');
const navigationJs = read('public/mobile-app/js/navigation.js');
const notificationsJs = read('public/mobile-app/js/notifications.js');
const lessonsJs = read('public/mobile-app/js/lessons.js');
const courtBlocksRoute = read('app/api/mobile/court-blocks/route.ts');
const programsRoute = read('app/api/mobile/programs/route.ts');
const membersRoute = read('app/api/mobile/members/route.ts');
const partnersRoute = read('app/api/mobile/partners/route.ts');
const eventsRoute = read('app/api/mobile/events/route.ts');
const notificationsRoute = read('app/api/mobile/notifications/route.ts');
const courtsRoute = read('app/api/mobile/courts/route.ts');
const settingsRoute = read('app/api/mobile/settings/route.ts');
const familiesRoute = read('app/api/mobile/families/route.ts');
const lineupsRoute = read('app/api/mobile/lineups/route.ts');

describe('Shared API contracts', () => {
  it('members route returns the camelCase fields used across clients', () => {
    expect(membersRoute).toContain('skillLevel: m.skill_level');
    expect(membersRoute).toContain('memberSince: m.member_since');
    expect(membersRoute).toContain('interclubTeam: m.interclub_team');
    expect(membersRoute).toContain('interclubCaptain: !!m.interclub_captain');
  });

  it('court-blocks route returns a bare array to match auth/realtime/booking consumers', () => {
    expect(courtBlocksRoute).toContain('return NextResponse.json(data || [])');
    expect(authJs).toContain("MTC.fn.loadFromAPI('/mobile/court-blocks'");
    expect(realtimeSync).toContain("MTC.fn.loadFromAPI('/mobile/court-blocks'");
    expect(bookingJs).toContain('window.updateCourtBlocksFromAPI = function(apiBlocks) {');
  });

  it('programs route returns both dashboard fields and legacy mobile compatibility fields', () => {
    expect(programsRoute).toContain('coachName: p.coach_name');
    expect(programsRoute).toContain('coach: p.coach_name');
    expect(programsRoute).toContain('sessions: sessionsByProgram[p.id] || []');
    expect(programsRoute).toContain('fee: p.fee');
    expect(programsRoute).toContain("price: typeof p.fee === 'number' ? `$${p.fee}` : String(p.fee ?? '')");
    expect(programsRoute).toContain('enrolledMembers: enrollmentsByProgram[p.id] || []');
    expect(programsRoute).toContain('spotsFilled: (enrollmentsByProgram[p.id] || []).length');
    expect(programsRoute).toContain('enrolled: (enrollmentsByProgram[p.id] || []).includes(userId)');
  });

  it('partners route returns the camelCase fields used by the mobile partners screen', () => {
    expect(partnersRoute).toContain('userId: p.user_id');
    expect(partnersRoute).toContain('skillLevel: p.skill_level');
    expect(partnersRoute).toContain('matchType: p.match_type');
    expect(navigationJs).toContain('userId: p.userId ||');
    expect(navigationJs).toContain('level: p.skillLevel ||');
    expect(navigationJs).toContain("matchType: p.matchType || 'singles'");
  });

  it('events route returns attendee and capacity fields used across screens', () => {
    expect(eventsRoute).toContain('spotsTotal: e.spots_total');
    expect(eventsRoute).toContain('spotsTaken: eventAttendees.length');
    expect(eventsRoute).toContain('attendees: eventAttendees');
    expect(eventsRoute).toContain('price: e.price');
  });

  it('notifications route returns the fields required by the mobile notifications screen', () => {
    expect(notificationsRoute).toContain('title: n.title');
    expect(notificationsRoute).toContain('body: n.body');
    expect(notificationsRoute).toContain('timestamp: n.timestamp');
    expect(notificationsRoute).toContain('read: n.read');
    expect(notificationsJs).toContain('sanitizeHTML(n.title)');
    expect(notificationsJs).toContain('sanitizeHTML(n.body)');
    expect(notificationsJs).toContain('formatRelativeTime(n.timestamp)');
  });

  it('courts route returns the core fields shared by admin and booking clients', () => {
    expect(courtsRoute).toContain('id: c.id');
    expect(courtsRoute).toContain('name: c.name');
    expect(courtsRoute).toContain('floodlight: c.floodlight');
    expect(courtsRoute).toContain('status: c.status');
    expect(authJs).toContain("MTC.fn.loadFromAPI('/mobile/courts'");
    expect(bookingJs).toContain('window.updateCourtsFromAPI = function(apiCourts) {');
  });

  it('settings route keeps object-shaped settings and notification prefs for both clients', () => {
    expect(settingsRoute).toContain('return cachedJson(settings, 300, { swr: 60 })');
    expect(settingsRoute).toContain("return NextResponse.json({ bookings: true, events: true, partners: true, announcements: true, messages: true, programs: true })");
    expect(authJs).toContain("MTC.fn.loadFromAPI('/mobile/settings', 'mtc-club-settings', null)");
    expect(authJs).toContain("MTC.fn.apiRequest('/mobile/settings', {");
  });

  it('families route returns the family object and camelCase members used by profile switching', () => {
    expect(familiesRoute).toContain('return NextResponse.json({ family, members })');
    expect(familiesRoute).toContain('familyId: m.family_id');
    expect(familiesRoute).toContain('skillLevel: m.skill_level');
    expect(familiesRoute).toContain('birthYear: m.birth_year');
    expect(authJs).toContain("MTC.fn.loadFromAPI('/mobile/families', 'mtc-api-families', null)");
  });

  it('lineups route returns camelCase lineup fields and enriched entry names for captain screens', () => {
    expect(lineupsRoute).toContain('matchDate: l.match_date');
    expect(lineupsRoute).toContain('matchTime: l.match_time');
    expect(lineupsRoute).toContain('memberName: memberMap[e.member_id]?.name || \'Unknown\'');
    expect(lineupsRoute).toContain('memberSkillLevel: memberMap[e.member_id]?.skill_level');
  });

  it('lessons screen still receives the legacy display fields it renders', () => {
    expect(lessonsJs).toContain("escHtml(p.schedule || '')");
    expect(lessonsJs).toContain('(p.price ?');
    expect(lessonsJs).toContain('(p.coach ?');
    expect(programsRoute).toContain('schedule: (sessionsByProgram[p.id] || []).map(session => `${session.date} ${session.time}`).join(\' • \')');
    expect(programsRoute).toContain("price: typeof p.fee === 'number' ? `$${p.fee}` : String(p.fee ?? '')");
    expect(programsRoute).toContain('coach: p.coach_name');
  });
});
