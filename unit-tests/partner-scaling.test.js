import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function read(path) {
  return readFileSync(resolve(root, path), 'utf-8');
}

describe('Partner surge hardening', () => {
  const route = read('app/api/mobile/partners/route.ts');
  const partnersJs = read('public/mobile-app/js/partners.js');
  const navigationJs = read('public/mobile-app/js/navigation.js');
  const schema = read('supabase/schema.sql');
  const migration = read('supabase/migrations/20260320_partner_request_hardening.sql');

  it('adds a client request id column and uniqueness guard', () => {
    expect(migration).toContain('add column if not exists client_request_id text;');
    expect(migration).toContain('create unique index if not exists partners_user_id_client_request_id_key');
    expect(schema).toContain('client_request_id text');
  });

  it('deduplicates repeated partner post attempts by user and request key', () => {
    expect(route).toContain('clientRequestId');
    expect(route).toContain('requestKey');
    expect(route).toContain(".eq('user_id', userId)");
    expect(route).toContain(".eq('client_request_id', requestKey)");
    expect(route).toContain('deduped: true');
  });

  it('only matches a partner request while it is still available', () => {
    expect(route).toContain(".eq('status', 'available')");
    expect(route).toContain(".is('matched_by', null)");
  });

  it('guards duplicate partner-post taps on mobile', () => {
    expect(partnersJs).toContain('if (submitPartnerRequest._posting) return;');
    expect(partnersJs).toContain('submitPartnerRequest._posting = true;');
    expect(partnersJs).toContain('clientRequestId: localId');
  });

  it('guards duplicate join taps on mobile', () => {
    expect(navigationJs).toContain('var _pendingPartnerMatches = new Set();');
    expect(navigationJs).toContain('if (partnerId && _pendingPartnerMatches.has(partnerId)) return;');
    expect(navigationJs).toContain('_pendingPartnerMatches.delete(partnerId);');
  });
});
