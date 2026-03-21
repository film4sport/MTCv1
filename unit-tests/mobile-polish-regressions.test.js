import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const captain = readFileSync(resolve(root, 'public/mobile-app/js/captain.ts'), 'utf-8');
const lessons = readFileSync(resolve(root, 'public/mobile-app/js/lessons.ts'), 'utf-8');
const messaging = readFileSync(resolve(root, 'public/mobile-app/js/messaging.ts'), 'utf-8');
const profile = readFileSync(resolve(root, 'public/mobile-app/js/profile.ts'), 'utf-8');
const eventDelegation = readFileSync(resolve(root, 'public/mobile-app/js/event-delegation.ts'), 'utf-8');
const account = readFileSync(resolve(root, 'public/mobile-app/js/account.ts'), 'utf-8');
const adminEvents = readFileSync(resolve(root, 'public/mobile-app/js/admin-events.ts'), 'utf-8');

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

  it('keeps family empty state instructional instead of abrupt', () => {
    expect(profile).toContain('No family members added yet. Add one above to manage bookings for them here.');
  });

  it('keeps delegated partner-removal toasts aligned with the main partner flow', () => {
    expect(eventDelegation).toContain("showToast('Removing partner request...');");
    expect(eventDelegation).toContain("showToast('Partner request removed');");
    expect(eventDelegation).toContain("showToast('Failed to remove the partner request. Please try again.', 'error');");
  });

  it('guides focus in account recovery and keeps account copy concise', () => {
    expect(account).toContain("if (emailInput) emailInput.focus();");
    expect(account).toContain("showToast('Password reset link sent');");
    expect(account).toContain('No recorded matches yet. Completed match results will show up here.');
    expect(account).toContain("showToast('Push notifications enabled');");
  });

  it('guides focus in admin event and payment settings validation', () => {
    expect(adminEvents).toContain("if (!title && titleInput) titleInput.focus();");
    expect(adminEvents).toContain("else if (!date && dateInput) dateInput.focus();");
    expect(adminEvents).toContain("else if (!time && timeInput) timeInput.focus();");
    expect(adminEvents).toContain("showToast('Event created');");
    expect(adminEvents).toContain("if (emailInput) emailInput.focus();");
    expect(adminEvents).toContain("showToast('E-transfer settings saved');");
  });
});
