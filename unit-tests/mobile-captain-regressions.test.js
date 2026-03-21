import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const captain = readFileSync(resolve(root, 'public/mobile-app/js/captain.ts'), 'utf-8');

describe('Mobile captain regressions', () => {
  it('normalizes lineups responses so wrapped or bare arrays both render', () => {
    expect(captain).toContain('function normalizeLineupsResponse(payload) {');
    expect(captain).toContain("return Array.isArray(payload) ? payload : (payload && payload.lineups) || [];");
    expect(captain).toContain('return normalizeLineupsResponse(res.data);');
  });

  it('keeps the captain matches empty state when the API returns no lineups', () => {
    expect(captain).toContain('No upcoming matches');
  });
});
