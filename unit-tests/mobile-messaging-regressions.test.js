import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const messaging = readFileSync(resolve(root, 'public/mobile-app/js/messaging.js'), 'utf-8');

describe('Mobile messaging member search regressions', () => {
  it('preserves member role during API normalization so admin pin/search logic still works', () => {
    expect(messaging).toContain("role: m.role || 'member'");
  });

  it('guards skill search against missing skill values', () => {
    expect(messaging).toContain("(m.skill || '').toLowerCase()");
  });

  it('guards display skill rendering for members without a skill label', () => {
    expect(messaging).toContain("var displaySkill = member.role === 'admin' ? 'Club Admin' : (member.skill || '');");
  });
});
