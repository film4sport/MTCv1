import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const adminHelpers = readFileSync(resolve(root, 'public/mobile-app/js/admin-helpers.js'), 'utf-8');
const profile = readFileSync(resolve(root, 'public/mobile-app/js/profile.js'), 'utf-8');

describe('Mobile admin export regressions', () => {
  it('falls back to memberSince when created_at is unavailable in member exports', () => {
    expect(adminHelpers).toContain('function getMemberStartDate(member) {');
    expect(adminHelpers).toContain('if (member.created_at) return String(member.created_at).split(\'T\')[0];');
    expect(adminHelpers).toContain('if (member.memberSince) return String(member.memberSince).split(\'T\')[0];');
  });

  it('uses normalized start dates in member and payment exports', () => {
    expect(adminHelpers).toContain('var startDate = getMemberStartDate(m);');
    expect(adminHelpers).toContain("rows.push([m.name || '', m.email || '', m.role || 'member'");
    expect(adminHelpers).toContain("rows.push([m.name || '', m.email || '', m.membership_type || 'adult'");
  });
});

describe('Mobile family profile regressions', () => {
  it('focuses the family member name field when submit is empty', () => {
    expect(profile).toContain("if (!name) { showToast('Please enter a name', 'error'); if (nameInput) nameInput.focus(); return; }");
  });
});
