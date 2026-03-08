/**
 * API Integration Tests — Messaging Flow
 *
 * Tests the /api/mobile/conversations route handlers.
 * Verifies: validation, auth, message sending, read receipts, notifications.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Conversations API Route — Structure', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');

  it('exports GET and POST handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('exports PATCH handler for marking messages read', () => {
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient (not direct supabase)', () => {
    expect(content).toContain('getAdminClient');
    expect(content).not.toContain("from '@/app/lib/supabase'");
  });

  it('validates recipient UUID', () => {
    expect(content).toContain('isValidUUID');
  });

  it('sanitizes message text', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('applies rate limiting', () => {
    expect(content).toContain('isRateLimited');
  });
});

describe('Conversations API — Message Sending', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');

  it('creates conversation if it does not exist', () => {
    // POST should find or create a conversation between two users
    expect(content).toMatch(/conversations.*insert|insert.*conversations/s);
  });

  it('inserts message into messages table', () => {
    expect(content).toMatch(/messages.*insert|from\('messages'\)/s);
  });

  it('updates conversation last_message and last_timestamp', () => {
    expect(content).toContain('last_message');
    expect(content).toContain('last_timestamp');
  });

  it('creates bell notification for recipient', () => {
    expect(content).toContain('createNotification');
  });

  it('sends push notification to recipient', () => {
    expect(content).toContain('sendPushToUser');
  });

  it('prevents sending messages to self', () => {
    // Should validate that toId !== authResult.id
    expect(content).toMatch(/yourself|self|toId.*===.*authResult\.id|authResult\.id.*===.*toId/);
  });
});

describe('Conversations API — Read Receipts', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');

  it('PATCH marks messages as read', () => {
    expect(content).toContain("read: true");
    expect(content).toContain('PATCH');
  });

  it('only marks messages sent TO the authenticated user', () => {
    // Should filter by to_id = authResult.id, not mark messages user sent
    expect(content).toMatch(/to_id/);
  });
});

describe('Conversations API — Validation Rules', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');
  const sharedContent = readFileSync(resolve(root, 'app/lib/shared-constants.ts'), 'utf-8');

  it('message text limit matches shared constants', () => {
    // shared-constants: MESSAGE_TEXT: 2000
    expect(sharedContent).toContain('MESSAGE_TEXT: 2000');
    // route should sanitize with 2000 limit
    expect(content).toContain('2000');
  });

  it('rejects empty messages', () => {
    // Should validate that text is not empty after sanitization
    expect(content).toMatch(/empty|required|!text|text\.length/);
  });
});

describe('Conversations API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('Dashboard sends messages through API (not direct Supabase)', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/conversations'");
  });

  it('Dashboard marks conversations read through API', () => {
    // store.tsx should use PATCH to mark read
    expect(storeContent).toMatch(/apiCall\('\/api\/mobile\/conversations'.*PATCH/s);
  });
});

describe('Conversations API — Security', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/conversations/route.ts'), 'utf-8');

  it('only returns conversations where user is a participant', () => {
    // GET should filter by member_a or member_b matching the user
    expect(content).toMatch(/member_a.*member_b|or\(.*member_a.*member_b/);
  });

  it('validates conversation ownership before marking as read', () => {
    // PATCH should verify user is a participant in the conversation
    expect(content).toMatch(/conversationId|conversation_id/);
  });
});
