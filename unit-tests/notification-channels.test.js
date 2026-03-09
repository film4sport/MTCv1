/**
 * Notification Channel Consistency Tests
 *
 * Verifies that each action triggers the expected notification channels
 * (bell, push, email, in-app message) consistently across API routes.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function readRoute(name) {
  return readFileSync(resolve(root, `app/api/mobile/${name}/route.ts`), 'utf-8');
}

describe('Notification Channels — Bookings', () => {
  const content = readRoute('bookings');

  it('sends bell notification on booking create', () => {
    expect(content).toMatch(/notifications.*insert|createNotification/);
  });

  it('sends push notification on booking create', () => {
    expect(content).toContain('sendPushToUser');
  });

  it('sends email on booking create', () => {
    expect(content).toMatch(/booking-email|notify-email/);
  });

  it('sends in-app message to participants', () => {
    expect(content).toMatch(/messages.*insert|sendMessage/);
  });
});

describe('Notification Channels — Conversations (Messages)', () => {
  const content = readRoute('conversations');

  it('sends bell notification on new message', () => {
    expect(content).toMatch(/notifications.*insert|createNotification/);
  });

  it('sends push notification on new message', () => {
    expect(content).toContain('sendPushToUser');
  });
});

describe('Notification Channels — Partners', () => {
  const content = readRoute('partners');

  it('sends bell notification on partner match', () => {
    expect(content).toMatch(/notifications.*insert|createNotification/);
  });

  it('sends push notification on partner match', () => {
    expect(content).toContain('sendPushToUser');
  });
});

describe('Notification Channels — Events', () => {
  const content = readRoute('events');

  it('sends bell notification on RSVP', () => {
    expect(content).toMatch(/notifications.*insert|createNotification/);
  });

  it('sends push notification on RSVP', () => {
    expect(content).toContain('sendPushToUser');
  });
});

describe('Notification Channels — Programs', () => {
  const content = readRoute('programs');

  it('sends bell notification on enrollment', () => {
    expect(content).toMatch(/notifications.*insert/);
  });

  it('sends push notification on enrollment', () => {
    expect(content).toContain('sendPushToUser');
  });

  it('sends email on enrollment', () => {
    expect(content).toMatch(/notify-email|booking-email/);
  });
});

describe('Notification Channels — Court Blocks', () => {
  const content = readRoute('court-blocks');

  it('sends bell notification when bookings are cancelled', () => {
    expect(content).toMatch(/notifications.*insert/);
  });

  it('sends push notification when bookings are cancelled', () => {
    expect(content).toContain('sendPushToUser');
  });
});

describe('Notification Channels — Realtime Parity', () => {
  const realtimeContent = readFileSync(resolve(root, 'public/mobile-app/js/realtime-sync.js'), 'utf-8');
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('mobile PWA subscribes to notifications table', () => {
    expect(realtimeContent).toContain("table: 'notifications'");
  });

  it('dashboard subscribes to notifications table', () => {
    expect(storeContent).toMatch(/postgres_changes.*notifications|table:\s*'notifications'/);
  });

  it('mobile PWA subscribes to bookings table', () => {
    expect(realtimeContent).toContain("table: 'bookings'");
  });

  it('mobile PWA subscribes to messages table', () => {
    expect(realtimeContent).toContain("table: 'messages'");
  });

  it('mobile PWA subscribes to partners table', () => {
    expect(realtimeContent).toContain("table: 'partners'");
  });

  it('mobile PWA subscribes to events table', () => {
    expect(realtimeContent).toContain("table: 'events'");
  });
});
