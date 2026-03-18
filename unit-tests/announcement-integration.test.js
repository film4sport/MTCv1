/**
 * ANNOUNCEMENT INTEGRATION TESTS
 *
 * Verifies that the mobile PWA client (admin.js) sends requests in the exact
 * format the API route (announcements/route.ts) expects. Catches mismatches
 * between client-side fetch calls and server-side request parsing.
 *
 * Also verifies dashboard admin/captain pages use apiCall() (not direct Supabase)
 * for announcement mutations, per Rule #21.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const ADMIN_JS_FILES = [
  'public/mobile-app/js/admin-helpers.js',
  'public/mobile-app/js/admin-dashboard.js',
  'public/mobile-app/js/admin-members.js',
  'public/mobile-app/js/admin-courts.js',
  'public/mobile-app/js/admin-announcements.js',
  'public/mobile-app/js/admin-events.js',
];

function readFile(relPath) {
  return readFileSync(resolve(root, relPath), 'utf-8');
}

function readAdminBundle() {
  return ADMIN_JS_FILES.map(readFile).join('\n\n');
}

const adminJs = readAdminBundle();
const routeTs = readFile('app/api/mobile/announcements/route.ts');

describe('Announcement Client-Server Contract', () => {

  describe('POST (create announcement)', () => {
    it('mobile sends JSON body with text, type, audience fields', () => {
      // Mobile client must send these fields
      expect(adminJs).toContain("JSON.stringify({");
      expect(adminJs).toContain("text: msg.value.trim()");
      expect(adminJs).toContain("type: type ? type.value");
      expect(adminJs).toContain("audience: audience ? audience.value");
    });

    it('mobile sends Content-Type application/json header', () => {
      expect(adminJs).toContain("'Content-Type': 'application/json'");
    });

    it('API route reads text, type, audience from request.json()', () => {
      expect(routeTs).toContain('const { text, type, title, audience } = await request.json()');
    });

    it('mobile sends POST method to /api/mobile/announcements', () => {
      // Verify the fetch URL and method match
      expect(adminJs).toMatch(/fetch\(['"]\/api\/mobile\/announcements['"]/);
      expect(adminJs).toContain("method: 'POST'");
    });
  });

  describe('DELETE (remove announcement)', () => {
    it('mobile sends id in JSON body (not query param)', () => {
      // This was a bug: client sent ?id= query param, but API reads from body
      // Verify the fix: body: JSON.stringify({ id: id })
      expect(adminJs).toContain("body: JSON.stringify({ id: id })");
    });

    it('mobile sends DELETE with Content-Type header', () => {
      // DELETE with JSON body needs Content-Type
      const deleteSection = adminJs.slice(adminJs.indexOf('deleteAdminAnnouncement'));
      expect(deleteSection).toContain("'Content-Type': 'application/json'");
    });

    it('API route reads id from request.json() not query params', () => {
      // The DELETE handler must parse body
      const deleteHandler = routeTs.slice(routeTs.indexOf('export async function DELETE'));
      expect(deleteHandler).toContain('const { id } = await request.json()');
      // Must NOT use searchParams for id
      expect(deleteHandler).not.toContain('searchParams');
    });
  });

  describe('GET (fetch announcements)', () => {
    it('mobile handles both array and object response formats', () => {
      // API returns raw array, client must handle it
      expect(adminJs).toContain('Array.isArray(data) ? data : (data.announcements || [])');
    });

    it('mobile reads date field (not created_at) in announcement history', () => {
      // The DB column is "date", not "created_at"
      expect(adminJs).toContain("a.date || ''");
      // The announcement history render line must not use created_at
      const renderLine = adminJs.split('\n').find(line =>
        line.includes('font-size:12px') && line.includes('icon + audience')
      );
      expect(renderLine).toBeDefined();
      expect(renderLine).not.toContain('created_at');
      expect(renderLine).toContain('a.date');
    });
  });

  describe('Error handling', () => {
    it('POST shows actual API error message (not generic)', () => {
      // Must parse error response body for real message
      expect(adminJs).toContain("r.json().then(function(err) { throw new Error(err.error");
    });

    it('DELETE shows actual API error message (not generic)', () => {
      const deleteSection = adminJs.slice(adminJs.indexOf('deleteAdminAnnouncement'));
      expect(deleteSection).toContain("r.json().then(function(err) { throw new Error(err.error");
    });
  });
});

describe('Rule #21: Dashboard uses API routes (not direct Supabase)', () => {
  it('admin page uses apiCall for createAnnouncement, not db.createAnnouncement', () => {
    const adminPage = readFile('app/dashboard/admin/page.tsx');
    // Must use API route
    expect(adminPage).toContain("apiCall('/api/mobile/announcements', 'POST'");
    // Must NOT use direct Supabase
    expect(adminPage).not.toContain('db.createAnnouncement');
  });

  it('admin page uses apiCall for deleteAnnouncement, not db.deleteAnnouncement', () => {
    const adminPage = readFile('app/dashboard/admin/page.tsx');
    expect(adminPage).toContain("apiCall('/api/mobile/announcements', 'DELETE'");
    expect(adminPage).not.toContain('db.deleteAnnouncement');
  });

  it('captain page uses apiCall for postTeamAnnouncement, not db.createAnnouncement', () => {
    const captainPage = readFile('app/dashboard/captain/page.tsx');
    expect(captainPage).toContain("apiCall('/api/mobile/announcements', 'POST'");
    expect(captainPage).not.toContain('db.createAnnouncement');
  });

  it('apiCall is exported from store.tsx', () => {
    const store = readFile('app/dashboard/lib/store.tsx');
    expect(store).toContain('export async function apiCall');
  });
});

describe('Notification pipeline completeness', () => {
  it('API POST route creates bell notifications for targeted members', () => {
    expect(routeTs).toContain("from('notifications').insert(notifications)");
  });

  it('API POST route sends push notifications', () => {
    expect(routeTs).toContain('sendPushToUser');
  });

  it('API POST route sends inbox messages for announcement recipients', () => {
    expect(routeTs).toContain('sendAnnouncementInboxMessage');
    expect(routeTs).toContain("from('messages').insert");
  });

  it('API POST route filters recipients by audience', () => {
    expect(routeTs).toContain("announcementAudience === 'all'");
    expect(routeTs).toContain("announcementAudience === 'interclub_a'");
    expect(routeTs).toContain("announcementAudience === 'interclub_b'");
    expect(routeTs).toContain("announcementAudience === 'interclub_all'");
  });

  it('API POST route filters recipients by announcement preference opt-out', () => {
    expect(routeTs).toContain("from('notification_preferences')");
    expect(routeTs).toContain(".select('user_id, announcements')");
    expect(routeTs).toContain("preferenceMap.get(member.id) !== false");
  });
});
