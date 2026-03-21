import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function readFile(relPath) {
  const full = resolve(root, relPath);
  if (!existsSync(full)) throw new Error(`Missing file: ${relPath}`);
  return readFileSync(full, 'utf-8');
}

function readRoute(relPath) {
  return readFile(`app/api/${relPath}/route.ts`);
}

describe('API Route Surface - Non-mobile route coverage', () => {
  const routes = [
    'booking-email',
    'email-track',
    'errors',
    'health',
    'keep-alive',
    'log-email',
    'mobile-auth/config',
    'mobile-booking',
    'notify-email',
    'notify-message',
    'notify-push',
    'public-calendar',
    'push-send',
    'push-subscribe',
  ];

  for (const route of routes) {
    it(`${route} route file exists`, () => {
      expect(existsSync(resolve(root, `app/api/${route}/route.ts`))).toBe(true);
    });
  }
});

describe('Health + warmup routes', () => {
  const health = readRoute('health');
  const keepAlive = readRoute('keep-alive');
  const loginPage = readFile('app/login/page.tsx');

  it('health is force-dynamic and returns healthy/degraded semantics', () => {
    expect(health).toContain("export const dynamic = 'force-dynamic'");
    expect(health).toContain("status: allOk ? 'healthy' : 'degraded'");
    expect(health).toMatch(/status:\s*allOk\s*\?\s*200\s*:\s*503/);
    expect(health).toContain("checks.env");
    expect(health).toContain("checks.supabase");
  });

  it('keep-alive is force-dynamic and login page warms it on mount', () => {
    expect(keepAlive).toContain("export const dynamic = 'force-dynamic'");
    expect(keepAlive).toContain("reason: 'no env'");
    expect(keepAlive).toContain("db: !dbPing.error");
    expect(loginPage).toContain("fetch('/api/keep-alive').catch(() => {})");
  });
});

describe('Public calendar route', () => {
  const route = readRoute('public-calendar');
  const schedule = readFile('app/(landing)/components/Schedule.tsx');

  it('validates year/month and protects privacy', () => {
    expect(route).toContain("Invalid year or month");
    expect(route).toContain("select('date, court_name, time')");
    expect(route).toContain("slots[row.date].push({ court: row.court_name, time: row.time })");
    expect(route).not.toMatch(/select\('.*user_id.*'\)/);
  });

  it('returns empty object when Supabase is unavailable and sets cache headers', () => {
    expect(route).toContain("supabaseUrl.includes('placeholder')");
    expect(route).toContain("NextResponse.json({})");
    expect(route).toContain("'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'");
  });

  it('is consumed by the landing schedule component', () => {
    expect(schedule).toContain('/api/public-calendar?year=');
  });
});

describe('Mobile auth config + deprecated bridge routes', () => {
  const mobileAuthConfig = readRoute('mobile-auth/config');
  const mobileAuthJs = readFile('public/mobile-app/js/auth.ts');
  const mobileBooking = readRoute('mobile-booking');

  it('mobile auth config returns public Supabase keys with cache control', () => {
    expect(mobileAuthConfig).toMatch(/export\s+async\s+function\s+GET/);
    expect(mobileAuthConfig).toContain('supabaseUrl');
    expect(mobileAuthConfig).toContain('supabaseAnonKey');
    expect(mobileAuthConfig).toContain("Supabase not configured");
    expect(mobileAuthConfig).toContain("'Cache-Control': 'public, max-age=3600'");
  });

  it('mobile app bootstraps auth from mobile-auth config route', () => {
    expect(mobileAuthJs).toContain("fetchWithRetry('/api/mobile-auth/config'");
  });

  it('mobile-booking stays as a 410 deprecated bridge to /api/mobile/bookings', () => {
    expect(mobileBooking).toMatch(/export\s+async\s+function\s+POST/);
    expect(mobileBooking).toMatch(/export\s+async\s+function\s+DELETE/);
    expect(mobileBooking).toContain('/api/mobile/bookings');
    expect(mobileBooking).toContain('status: 410');
  });
});

describe('Email routes', () => {
  const bookingEmail = readRoute('booking-email');
  const emailTrack = readRoute('email-track');
  const logEmail = readRoute('log-email');
  const emailLogger = readFile('app/api/lib/email-logger.ts');
  const dashboardMessages = readFile('app/dashboard/messages/page.tsx');
  const mobileBookings = readFile('app/api/mobile/bookings/route.ts');
  const partnersRoute = readFile('app/api/mobile/partners/route.ts');
  const programsRoute = readFile('app/api/mobile/programs/route.ts');

  it('booking-email handles confirmation and cancellation flows with ICS + rate limiting', () => {
    expect(bookingEmail).toMatch(/export\s+async\s+function\s+POST/);
    expect(bookingEmail).toMatch(/export\s+async\s+function\s+DELETE/);
    expect(bookingEmail).toContain('generateICS');
    expect(bookingEmail).toContain('generateCancelICS');
    expect(bookingEmail).toContain('20 emails per hour');
    expect(bookingEmail).toContain('Missing required fields');
    expect(bookingEmail).toContain("type: 'booking_confirmation'");
    expect(bookingEmail).toContain("type: 'booking_cancellation'");
    expect(bookingEmail).toContain('/api/email-track?');
  });

  it('booking-email validates recipients and has notification fallback wiring', () => {
    expect(bookingEmail).toContain("from('profiles')");
    expect(bookingEmail).toContain('Unknown recipient(s):');
    expect(bookingEmail).toContain("from('notifications').insert");
    expect(mobileBookings).toContain('/api/booking-email');
  });

  it('email-track supports GET redirect tracking and POST attendance confirmation', () => {
    expect(emailTrack).toMatch(/export\s+async\s+function\s+GET/);
    expect(emailTrack).toMatch(/export\s+async\s+function\s+POST/);
    expect(emailTrack).toContain("status: 'opened'");
    expect(emailTrack).toContain("confirmed_via: 'email'");
    expect(emailTrack).toContain('Missing bookingId or participantId');
    expect(emailTrack).toContain('NextResponse.redirect');
    expect(dashboardMessages).toContain("fetch('/api/email-track'");
  });

  it('log-email validates enums and normalizes recipient email', () => {
    expect(logEmail).toMatch(/export\s+async\s+function\s+POST/);
    expect(logEmail).toContain('validTypes');
    expect(logEmail).toContain('validStatuses');
    expect(logEmail).toContain('Invalid type');
    expect(logEmail).toContain('Missing recipientEmail');
    expect(logEmail).toContain('Invalid status');
    expect(logEmail).toContain('recipientEmail.trim().toLowerCase()');
    expect(emailLogger).toContain("'general_notification'");
  });

  it('notify-email is used by current dashboard/mobile flows', () => {
    expect(partnersRoute).toContain('/api/notify-email');
    expect(programsRoute).toContain('/api/notify-email');
  });
});

describe('Client error reporting route', () => {
  const errorsRoute = readRoute('errors');
  const errorReporter = readFile('app/lib/errorReporter.ts');

  it('errors route validates message, rate limits by IP, and logs safely', () => {
    expect(errorsRoute).toMatch(/export\s+async\s+function\s+POST/);
    expect(errorsRoute).toContain('x-forwarded-for');
    expect(errorsRoute).toContain('Too many requests');
    expect(errorsRoute).toContain('message required');
    expect(errorsRoute).toContain("from('error_logs').insert");
    expect(errorsRoute).toContain('[MTC Error Report]');
  });

  it('client reporter posts to /api/errors', () => {
    expect(errorReporter).toContain("fetch('/api/errors'");
  });
});

describe('Push + notification routes', () => {
  const notifyEmail = readRoute('notify-email');
  const notifyMessage = readRoute('notify-message');
  const notifyPush = readRoute('notify-push');
  const pushSend = readRoute('push-send');
  const pushSubscribe = readRoute('push-subscribe');
  const pushLib = readFile('app/api/lib/push.ts');
  const dashboardStore = readFile('app/dashboard/lib/store.tsx');
  const dashboardHeader = readFile('app/dashboard/components/DashboardHeader.tsx');
  const mobileAuthJs = readFile('public/mobile-app/js/auth.ts');

  it('notify-email enforces session auth, rate limits, and handles missing SMTP safely', () => {
    expect(notifyEmail).toContain('resolveSession');
    expect(notifyEmail).toContain('Invalid token');
    expect(notifyEmail).toContain('Missing recipientEmail, subject, or body');
    expect(notifyEmail).toContain('Rate limit');
    expect(notifyEmail).toContain("reason: 'smtp_not_configured'");
    expect(notifyEmail).toContain("type: (logType || 'general_notification')");
  });

  it('notify-message validates auth + recipient shape and cleans expired subscriptions', () => {
    expect(notifyMessage).toContain('resolveSession');
    expect(notifyMessage).toContain('Invalid recipientId');
    expect(notifyMessage).toContain("reason: 'self'");
    expect(notifyMessage).toContain("reason: 'vapid_not_configured'");
    expect(notifyMessage).toContain("reason: 'no_subscriptions'");
    expect(notifyMessage).toContain("statusCode === 410 || statusCode === 404");
    expect(notifyMessage).toContain('APP_ROUTES.dashboardMessages');
  });

  it('notify-push uses shared push utility with auth, self-guard, and rate limiting', () => {
    expect(notifyPush).toContain('resolveSession');
    expect(notifyPush).toContain("reason: 'self'");
    expect(notifyPush).toContain('Rate limit');
    expect(notifyPush).toContain('sendPushToUser');
    expect(pushLib).toContain('export async function sendPushToUser');
    expect(dashboardStore).toContain("apiCall('/api/notify-push', 'POST'");
  });

  it('push-subscribe enforces ownership for POST and DELETE and is used by clients', () => {
    expect(pushSubscribe).toMatch(/export\s+async\s+function\s+POST/);
    expect(pushSubscribe).toMatch(/export\s+async\s+function\s+DELETE/);
    expect(pushSubscribe).toContain('authenticatedUserId !== userId');
    expect(pushSubscribe).toContain("onConflict: 'user_id,endpoint'");
    expect(dashboardHeader).toContain("fetch('/api/push-subscribe'");
    expect(mobileAuthJs).toContain("fetch('/api/push-subscribe'");
  });

  it('push-send is admin-only, rate limited, and cleans dead subscriptions', () => {
    expect(pushSend).toContain('authenticateAdmin');
    expect(pushSend).toContain("profile.role !== 'admin'");
    expect(pushSend).toContain('Unauthorized: admin only');
    expect(pushSend).toContain('Rate limit exceeded');
    expect(pushSend).toContain('VAPID keys not configured');
    expect(pushSend).toContain('No push subscriptions found for user');
    expect(pushSend).toContain("statusCode === 410 || statusCode === 404");
    expect(pushSend).toContain("type: 'push_notification'");
  });
});
