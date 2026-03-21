import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function read(path) {
  return readFileSync(resolve(root, path), 'utf-8');
}

describe('Messaging surge hardening', () => {
  const route = read('app/api/mobile/conversations/route.ts');
  const mobileMessaging = read('public/mobile-app/js/messaging.ts');
  const schema = read('supabase/schema.sql');

  it('keeps conversations unique at the schema level', () => {
    expect(schema).toContain('unique(member_a, member_b)');
  });

  it('normalizes member ordering before conversation lookup and insert', () => {
    expect(route).toContain('const normalizedMemberA = fromId < toId ? fromId : toId;');
    expect(route).toContain('const normalizedMemberB = fromId < toId ? toId : fromId;');
    expect(route).toContain(".eq('member_a', normalizedMemberA)");
    expect(route).toContain(".insert({ member_a: normalizedMemberA, member_b: normalizedMemberB");
  });

  it('deduplicates retried sends with a client message id', () => {
    expect(route).toContain('clientMessageId');
    expect(route).toContain('const msgId = requestMessageId ||');
    expect(route).toContain(".eq('id', requestMessageId)");
    expect(route).toContain('duplicateMessage');
  });

  it('sends the client message id from the mobile PWA', () => {
    expect(mobileMessaging).toContain('clientMessageId: tempId');
  });

  it('still keeps the client-side sending guard in place', () => {
    expect(mobileMessaging).toContain('if (sendMessage._sending) return;');
    expect(mobileMessaging).toContain('sendMessage._sending = true;');
  });
});
