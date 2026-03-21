import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const realtimeSync = readFileSync(resolve(root, 'public/mobile-app/js/realtime-sync.ts'), 'utf-8');
const authJs = readFileSync(resolve(root, 'public/mobile-app/js/auth.ts'), 'utf-8');
const eventsJs = readFileSync(resolve(root, 'public/mobile-app/js/events.ts'), 'utf-8');
const programsRoute = readFileSync(resolve(root, 'app/api/mobile/programs/route.ts'), 'utf-8');

describe('Mobile realtime sync regressions', () => {
  it('refetchAll includes members so member search can self-heal after reconnect', () => {
    expect(realtimeSync).toMatch(/function refetchAll\(\)\s*{[\s\S]*refetchMembers\(\)/);
  });

  it('refetchAll includes courts so booking/admin views refresh after reconnect', () => {
    expect(realtimeSync).toMatch(/function refetchAll\(\)\s*{[\s\S]*refetchCourts\(\)/);
  });

  it('applies event sync updates even when the API returns an empty array', () => {
    expect(authJs).toContain("if (Array.isArray(events) && typeof window.updateEventsFromAPI === 'function') {");
    expect(realtimeSync).toContain("if (Array.isArray(events) && typeof window.updateEventsFromAPI === 'function') {");
  });

  it('applies shared mobile feed updates even when auth bootstrap gets empty arrays back', () => {
    expect(authJs).toContain("if (Array.isArray(partners) && typeof window.updatePartnersFromAPI === 'function') {");
    expect(authJs).toContain("if (Array.isArray(announcements) && typeof window.updateAnnouncementsFromAPI === 'function') {");
    expect(authJs).toContain("if (Array.isArray(bookings) && typeof window.updateBookingsFromAPI === 'function') {");
    expect(authJs).toContain("if (Array.isArray(courts) && typeof window.updateCourtsFromAPI === 'function') {");
    expect(authJs).toContain("if (Array.isArray(blocks) && typeof window.updateCourtBlocksFromAPI === 'function') {");
    expect(authJs).toContain("if (Array.isArray(notifications) && typeof window.updateNotificationsFromAPI === 'function') {");
    expect(authJs).toContain("if (Array.isArray(programs) && typeof window.updateProgramsFromAPI === 'function') {");
  });

  it('removes stale server-managed events when they disappear from the API', () => {
    expect(eventsJs).toContain('var serverManagedEventIds = [];');
    expect(eventsJs).toContain('delete clubEventsData[eventId];');
    expect(eventsJs).toContain('serverManagedEventIds = nextServerEventIds;');
  });

  it('routes announcement realtime refresh through the live announcement updater', () => {
    expect(realtimeSync).toContain("if (typeof window.updateAnnouncementsFromAPI === 'function') {");
    expect(realtimeSync).toContain('window.updateAnnouncementsFromAPI(announcements);');
  });
});

describe('Programs API response shape regressions', () => {
  it('maps coach_name to both coachName and legacy coach', () => {
    expect(programsRoute).toContain('coachName: p.coach_name');
    expect(programsRoute).toContain('coach: p.coach_name');
  });

  it('maps fee to both numeric fee and legacy price string', () => {
    expect(programsRoute).toContain('fee: p.fee');
    expect(programsRoute).toContain("price: typeof p.fee === 'number' ? `$${p.fee}` : String(p.fee ?? '')");
  });

  it('includes program sessions in the GET response', () => {
    expect(programsRoute).toContain("from('program_sessions')");
    expect(programsRoute).toContain('sessions: sessionsByProgram[p.id] || []');
  });

  it('includes enrolledMembers along with enrolled boolean and spotsFilled', () => {
    expect(programsRoute).toContain('enrolledMembers: enrollmentsByProgram[p.id] || []');
    expect(programsRoute).toContain('spotsFilled: (enrollmentsByProgram[p.id] || []).length');
    expect(programsRoute).toContain('enrolled: (enrollmentsByProgram[p.id] || []).includes(userId)');
  });
});
