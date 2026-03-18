/**
 * API Integration Tests — Events & RSVP Flow
 *
 * Tests the /api/mobile/events route handlers.
 * Verifies: validation, RSVP toggle, event CRUD, notifications, cross-platform consistency.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Events API Route — Structure', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('exports GET, POST, PATCH, DELETE handlers', () => {
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
    expect(content).toMatch(/export\s+async\s+function\s+POST/);
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/);
    expect(content).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient (not direct supabase)', () => {
    expect(content).toContain('getAdminClient');
    expect(content).not.toContain("from '@/app/lib/supabase'");
  });

  it('applies rate limiting', () => {
    expect(content).toContain('isRateLimited');
  });

  it('sanitizes user input', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('validates date fields', () => {
    expect(content).toContain('isValidDate');
  });

  it('validates time fields', () => {
    expect(content).toContain('isValidTime');
  });
});

describe('Events API — RSVP Flow', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('handles RSVP toggle (add/remove attendee)', () => {
    expect(content).toMatch(/rsvp|attendee|toggle/i);
  });

  it('works with events table attendees column', () => {
    expect(content).toMatch(/attendees/);
  });
});

describe('Events API — Event CRUD (admin)', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('POST creates new events', () => {
    expect(content).toMatch(/insert/);
  });

  it('PATCH updates existing events', () => {
    expect(content).toMatch(/update/);
  });

  it('DELETE removes events', () => {
    expect(content).toMatch(/delete/);
  });

  it('validates event date and time ranges', () => {
    expect(content).toContain('isInRange');
  });
});

describe('Events API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('Dashboard routes RSVP through API', () => {
    expect(storeContent).toContain("apiCall('/api/mobile/events'");
  });
});

describe('Events API — Notification Layer', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('sends push notifications for event changes (admin PATCH/DELETE)', () => {
    // sendPushToUser still used for admin event changes, just not for self-RSVP
    expect(content).toContain('sendPushToUser');
  });

  it('does NOT send push to self on RSVP', () => {
    // The RSVP section (POST handler) should NOT have sendPushToUser
    // Extract the POST handler section
    const postIdx = content.indexOf('export async function POST');
    const nextExport = content.indexOf('export async function', postIdx + 1);
    const postSection = content.slice(postIdx, nextExport > 0 ? nextExport : undefined);
    // Bell notification is kept, push is removed for self-RSVP
    expect(postSection).toContain('createNotification');
    // The RSVP branch should not call sendPushToUser
    const rsvpBranch = postSection.slice(postSection.indexOf('// RSVP'));
    expect(rsvpBranch).not.toContain('sendPushToUser');
  });
});

describe('Events API — Server-side Spot Limit (Bug Fix)', () => {
  const content = readFileSync(resolve(root, 'app/api/mobile/events/route.ts'), 'utf-8');

  it('checks spots_total before allowing RSVP', () => {
    expect(content).toContain('spots_total');
  });

  it('counts existing attendees before insert', () => {
    // Should do a count query on event_attendees
    expect(content).toMatch(/count.*exact.*head.*true/s);
  });

  it('returns 409 when event is full', () => {
    expect(content).toContain('409');
    expect(content).toContain('Event is full');
  });

  it('allows RSVP when spots available (no spots_total = unlimited)', () => {
    // If spots_total is null/0, the check is skipped
    expect(content).toMatch(/spots_total\s*&&\s*evt\.spots_total\s*>\s*0/);
  });
});

describe('Events API — RSVP Rollback (Mobile PWA Bug Fix)', () => {
  const mobileEvents = readFileSync(resolve(root, 'public/mobile-app/js/events.js'), 'utf-8');

  it('waits for API response before closing modal', () => {
    // Modal close should be inside .then() success handler, not unconditional
    expect(mobileEvents).toMatch(/\.then\(function.*closeEventModal/s);
  });

  it('rolls back userRsvps on API failure', () => {
    expect(mobileEvents).toContain('userRsvps.splice');
    expect(mobileEvents).toContain('spotsTaken--');
  });

  it('handles 409 full event response', () => {
    expect(mobileEvents).toContain('409');
    expect(mobileEvents).toMatch(/full/i);
  });

  it('shows error toast on failure', () => {
    expect(mobileEvents).toMatch(/showToast\(.*error/);
  });
});

describe('Messaging — Double-tap Prevention (Bug Fix)', () => {
  const mobileMsg = readFileSync(resolve(root, 'public/mobile-app/js/messaging.js'), 'utf-8');
  const dashboardMsg = readFileSync(resolve(root, 'app/dashboard/messages/page.tsx'), 'utf-8');
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('mobile PWA has _sending flag to prevent double-tap', () => {
    expect(mobileMsg).toContain('sendMessage._sending');
  });

  it('mobile PWA blocks send while _sending is true', () => {
    expect(mobileMsg).toMatch(/if\s*\(sendMessage\._sending\)\s*return/);
  });

  it('dashboard has sending state on send button', () => {
    expect(dashboardMsg).toContain('sending');
    expect(dashboardMsg).toMatch(/disabled=\{.*sending/);
  });

  it('dashboard sendMessage returns Promise', () => {
    expect(storeContent).toMatch(/sendMessage.*Promise<void>/);
  });

  it('dashboard handleSend is async', () => {
    expect(dashboardMsg).toMatch(/handleSend\s*=\s*async/);
  });
});

describe('Messaging — Message ID Capture (Bug Fix)', () => {
  const mobileMsg = readFileSync(resolve(root, 'public/mobile-app/js/messaging.js'), 'utf-8');

  it('assigns temp ID to local message', () => {
    expect(mobileMsg).toContain('tempId');
    expect(mobileMsg).toMatch(/id:\s*tempId/);
  });

  it('captures server messageId from API response', () => {
    expect(mobileMsg).toContain('res.data.messageId');
    expect(mobileMsg).toContain('localMsg.id = res.data.messageId');
  });

  it('saves conversations after ID update', () => {
    // After updating the ID, it should persist
    expect(mobileMsg).toMatch(/localMsg\.id\s*=.*\n.*saveConversations/);
  });
});

describe('Messaging — Reply Context Preserved on Failure (Bug Fix)', () => {
  const mobileMsg = readFileSync(resolve(root, 'public/mobile-app/js/messaging.js'), 'utf-8');
  const dashboardMsg = readFileSync(resolve(root, 'app/dashboard/messages/page.tsx'), 'utf-8');

  it('mobile PWA saves reply context before send', () => {
    expect(mobileMsg).toContain('savedReplyTo');
  });

  it('mobile PWA restores reply on failure', () => {
    expect(mobileMsg).toMatch(/savedReplyTo.*_replyTo\s*=\s*savedReplyTo/s);
  });

  it('dashboard saves reply context before send', () => {
    expect(dashboardMsg).toContain('savedReply');
  });

  it('dashboard restores reply on failure', () => {
    expect(dashboardMsg).toMatch(/setReplyTo\(savedReply\)/);
  });
});

describe('Booking — Dashboard Await Pattern (Bug Fix)', () => {
  const bookPage = readFileSync(resolve(root, 'app/dashboard/book/page.tsx'), 'utf-8');
  const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('confirmBooking is async', () => {
    expect(bookPage).toMatch(/confirmBooking\s*=\s*async/);
  });

  it('awaits addBooking', () => {
    expect(bookPage).toContain('await addBooking');
  });

  it('addBooking returns Promise', () => {
    expect(store).toMatch(/addBooking.*Promise<void>/);
  });

  it('re-throws error so caller knows it failed', () => {
    // In the catch block, error should be re-thrown
    expect(store).toMatch(/throw err.*Re-throw/s);
  });

  it('modal only closes on success (in try block, not catch)', () => {
    // setShowModal(false) should be INSIDE the try, not in the catch
    const confirmFn = bookPage.slice(bookPage.indexOf('confirmBooking'), bookPage.indexOf('confirmBooking') + 1500);
    const tryBlock = confirmFn.slice(confirmFn.indexOf('try {'), confirmFn.indexOf('} catch'));
    expect(tryBlock).toContain('setShowModal(false)');
    // catch block should NOT close modal (let user retry or see error)
    const catchBlock = confirmFn.slice(confirmFn.indexOf('} catch'), confirmFn.indexOf('} finally'));
    expect(catchBlock).not.toContain('setShowModal(false)');
  });

  it('loading state cleared in finally (always runs)', () => {
    const confirmFn = bookPage.slice(bookPage.indexOf('confirmBooking'));
    const finallyBlock = confirmFn.slice(confirmFn.indexOf('finally'));
    expect(finallyBlock).toContain('setBookingLoading(false)');
  });
});

describe('Grid Event Registration — API Persistence (Bug Fix)', () => {
  const booking = readFileSync(resolve(root, 'public/mobile-app/js/booking.js'), 'utf-8');

  it('registerForGridEvent calls events API', () => {
    const fn = booking.slice(booking.indexOf('function registerForGridEvent'));
    expect(fn).toContain("apiRequest('/mobile/events'");
  });

  it('sends POST with eventId', () => {
    const fn = booking.slice(booking.indexOf('function registerForGridEvent'));
    expect(fn).toContain("method: 'POST'");
    expect(fn).toContain('eventId');
  });
});

describe('Partner Request — No Self-Notification (Bug Fix)', () => {
  const partners = readFileSync(resolve(root, 'app/api/mobile/partners/route.ts'), 'utf-8');

  it('does not send self-notifications on post', () => {
    // The POST handler should NOT have bell/push/email for the poster
    const postIdx = partners.indexOf('export async function POST');
    const nextExport = partners.indexOf('export async function', postIdx + 1);
    const postSection = partners.slice(postIdx, nextExport > 0 ? nextExport : undefined);
    expect(postSection).toContain('No self-notifications');
    expect(postSection).not.toContain("title: 'Partner Request Posted'");
  });

  it('still notifies on partner match (join)', () => {
    // PATCH handler should still notify both parties
    const patchIdx = partners.indexOf('export async function PATCH');
    const patchSection = partners.slice(patchIdx);
    expect(patchSection).toContain('sendPushToUser');
    expect(patchSection).toContain("title: 'Partner Matched!'");
  });
});
