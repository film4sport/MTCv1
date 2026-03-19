import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const captain = readFileSync(resolve(root, 'public/mobile-app/js/captain.js'), 'utf-8');
const lessons = readFileSync(resolve(root, 'public/mobile-app/js/lessons.js'), 'utf-8');
const messaging = readFileSync(resolve(root, 'public/mobile-app/js/messaging.js'), 'utf-8');

describe('Mobile polish regressions', () => {
  it('keeps captain updates empty state instructional instead of abrupt', () => {
    expect(captain).toContain('No team updates yet. Post one above when your team needs details.');
  });

  it('focuses the captain update field when submit is empty', () => {
    expect(captain).toContain("if (!textEl || !textEl.value.trim()) { showToast('Please write a message'); if (textEl) textEl.focus(); return; }");
  });

  it('keeps coaching programs empty state and toasts consistent', () => {
    expect(lessons).toContain('No programs available right now. Check back soon or contact the club for coaching details.');
    expect(lessons).toContain("MTC.fn.showToast('Enrolled in program', 'success');");
    expect(lessons).toContain("MTC.fn.showToast('Network error - please try again', 'error');");
  });

  it('uses the clearer member-search empty state copy', () => {
    expect(messaging).toContain('No members match your search yet');
  });
});
