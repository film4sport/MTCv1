import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const notifications = readFileSync(resolve(root, 'public/mobile-app/js/notifications.ts'), 'utf-8');

describe('Mobile notification regressions', () => {
  it('marks individual notifications read in the local cache before dismissing', () => {
    expect(notifications).toContain("function updateCachedNotification(id, updates) {");
    expect(notifications).toContain("updateCachedNotification(notifId, { read: true });");
  });

  it('persists individual notification reads through the notifications API', () => {
    expect(notifications).toContain("body: JSON.stringify({ id: notifId })");
    expect(notifications).toContain("method: 'PATCH'");
  });

  it('persists mark-all-read to both local cache and server', () => {
    expect(notifications).toContain("MTC.storage.set('mtc-api-notifications', cached.map(function(n) {");
    expect(notifications).toContain("body: JSON.stringify({ markAll: true })");
  });

  it('hides summary chrome when the notifications API returns an empty list', () => {
    expect(notifications).toContain("if (summary) summary.style.display = apiNotifications.length > 0 ? '' : 'none';");
    expect(notifications).toContain("header.style.display = apiNotifications.length > 0 ? '' : 'none';");
  });

  it('rechecks the empty state after clearing read notifications', () => {
    expect(notifications).toContain('checkNotificationsEmpty();');
  });
});
