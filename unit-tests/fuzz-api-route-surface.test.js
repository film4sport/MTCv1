import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function readRoute(path) {
  return readFileSync(resolve(root, `app/api/${path}/route.ts`), 'utf-8');
}

describe('FUZZ: Non-mobile API route input guards', () => {
  describe('booking-email route', () => {
    const content = readRoute('booking-email');

    it('rejects missing required fields before any email work', () => {
      expect(content).toContain('Missing required fields');
      expect(content).toMatch(/recipientList\.length === 0.*\|\| !courtName \|\| !date \|\| !time/s);
      expect(content).toMatch(/status:\s*400/);
    });

    it('rate limits email bursts and surfaces 429', () => {
      expect(content).toContain('20 emails per hour');
      expect(content).toContain('Too many emails. Try again later.');
      expect(content).toMatch(/status:\s*429/);
    });

    it('validates recipient emails against profiles before sending', () => {
      expect(content).toContain("from('profiles')");
      expect(content).toContain('Unknown recipient(s):');
      expect(content).toMatch(/invalidEmails\.length > 0/);
    });

    it('handles SMTP failures with fallback notifications instead of crashing', () => {
      expect(content).toContain("from('notifications').insert");
      expect(content).toContain('Fallback notification');
      expect(content).toContain('Failed to process booking email');
      expect(content).toMatch(/status:\s*500|status:\s*502/);
    });
  });

  describe('email-track route', () => {
    const content = readRoute('email-track');

    it('rejects malformed POST bodies missing booking or participant ids', () => {
      expect(content).toContain('Missing bookingId or participantId');
      expect(content).toMatch(/!bookingId \|\| !participantId/);
      expect(content).toMatch(/status:\s*400/);
    });

    it('handles missing Supabase config defensively', () => {
      expect(content).toContain('Supabase not configured');
      expect(content).toMatch(/status:\s*500/);
    });

    it('GET path treats query params as optional and redirects safely', () => {
      expect(content).toContain("searchParams.get('booking')");
      expect(content).toContain("searchParams.get('email')");
      expect(content).toContain("searchParams.get('redirect')");
      expect(content).toContain('NextResponse.redirect');
    });
  });

  describe('errors route', () => {
    const content = readRoute('errors');

    it('rate limits repeated error spam by forwarded IP', () => {
      expect(content).toContain("request.headers.get('x-forwarded-for')");
      expect(content).toContain('Too many requests');
      expect(content).toMatch(/status:\s*429/);
    });

    it('rejects missing or non-string message payloads', () => {
      expect(content).toContain('message required');
      expect(content).toMatch(/!message \|\| typeof message !== 'string'/);
      expect(content).toMatch(/status:\s*400/);
    });

    it('sanitizes stored error fields to bounded lengths', () => {
      expect(content).toContain('const clean = (s: unknown, max = 500)');
      expect(content).toContain('message: clean(message, 1000)');
      expect(content).toContain('stack: clean(stack, 2000)');
      expect(content).toContain('user_agent: clean(userAgent, 300)');
      expect(content).toContain('ip.slice(0, 45)');
    });
  });

  describe('mobile-auth/config route', () => {
    const content = readRoute('mobile-auth/config');

    it('fails closed when public Supabase config is incomplete', () => {
      expect(content).toContain('Supabase not configured');
      expect(content).toMatch(/status:\s*500/);
    });

    it('only returns public keys and sets cache headers', () => {
      expect(content).toContain('{ supabaseUrl, supabaseAnonKey }');
      expect(content).toContain("'Cache-Control': 'public, max-age=3600'");
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });
  });

  describe('mobile-booking deprecated bridge route', () => {
    const content = readRoute('mobile-booking');

    it('returns a hard 410 instead of silently accepting stale cached clients', () => {
      expect(content).toContain('/api/mobile/bookings');
      expect(content).toContain('This endpoint has moved to /api/mobile/bookings');
      expect(content).toContain('status: 410');
    });
  });

  describe('notify-email route', () => {
    const content = readRoute('notify-email');

    it('rejects unauthenticated, malformed, and rate-limited requests', () => {
      expect(content).toContain('resolveSession');
      expect(content).toContain('Invalid token');
      expect(content).toContain('Missing recipientEmail, subject, or body');
      expect(content).toContain('Rate limit');
      expect(content).toMatch(/status:\s*401/);
      expect(content).toMatch(/status:\s*400/);
      expect(content).toMatch(/status:\s*429/);
    });

    it('fails soft when SMTP config is absent', () => {
      expect(content).toContain("reason: 'smtp_not_configured'");
      expect(content).toContain('success: false');
    });
  });

  describe('notify-message route', () => {
    const content = readRoute('notify-message');

    it('rejects invalid recipient ids and self-sends', () => {
      expect(content).toContain('Invalid recipientId');
      expect(content).toContain("reason: 'self'");
      expect(content).toMatch(/uuidRegex/);
    });

    it('fails soft on missing VAPID or subscriptions', () => {
      expect(content).toContain("reason: 'vapid_not_configured'");
      expect(content).toContain("reason: 'no_subscriptions'");
      expect(content).toContain('sent: 0');
    });

    it('cleans up dead push endpoints after failed deliveries', () => {
      expect(content).toContain("statusCode === 410 || statusCode === 404");
      expect(content).toContain("from('push_subscriptions')");
      expect(content).toContain('.delete()');
    });
  });

  describe('notify-push + push-send routes', () => {
    const notifyPush = readRoute('notify-push');
    const pushSend = readRoute('push-send');

    it('notify-push rejects malformed/self/rate-limited member sends', () => {
      expect(notifyPush).toContain('Invalid token');
      expect(notifyPush).toContain('Missing recipientId, title, or body');
      expect(notifyPush).toContain("reason: 'self'");
      expect(notifyPush).toContain('Rate limit');
    });

    it('push-send is admin-only, rate-limited, and VAPID-gated', () => {
      expect(pushSend).toContain('Unauthorized: admin only');
      expect(pushSend).toContain('Rate limit exceeded');
      expect(pushSend).toContain('VAPID keys not configured');
      expect(pushSend).toMatch(/status:\s*403/);
      expect(pushSend).toMatch(/status:\s*429/);
      expect(pushSend).toMatch(/status:\s*500/);
    });

    it('push-send handles missing subscriptions and cleans expired endpoints', () => {
      expect(pushSend).toContain('No push subscriptions found for user');
      expect(pushSend).toContain("statusCode === 410 || statusCode === 404");
      expect(pushSend).toContain("from('push_subscriptions')");
    });
  });

  describe('push-subscribe route', () => {
    const content = readRoute('push-subscribe');

    it('rejects malformed subscription payloads', () => {
      expect(content).toContain('Missing required fields');
      expect(content).toMatch(/!subscription\?\.endpoint \|\| !subscription\?\.keys\?\.p256dh \|\| !subscription\?\.keys\?\.auth/);
      expect(content).toMatch(/status:\s*400/);
    });

    it('enforces ownership on both subscribe and unsubscribe paths', () => {
      expect(content).toContain('authenticatedUserId !== userId');
      expect(content).toContain('Unauthorized');
      expect(content).toMatch(/status:\s*401/);
    });

    it('uses upsert conflict protection for duplicate endpoints', () => {
      expect(content).toContain("onConflict: 'user_id,endpoint'");
    });
  });

  describe('public-calendar route', () => {
    const content = readRoute('public-calendar');

    it('rejects malformed month/year query fuzz cleanly', () => {
      expect(content).toContain('parseInt(searchParams.get(\'year\') || \'\', 10)');
      expect(content).toContain('parseInt(searchParams.get(\'month\') || \'\', 10)');
      expect(content).toContain('Invalid year or month');
      expect(content).toMatch(/month < 1 \|\| month > 12/);
      expect(content).toMatch(/status:\s*400/);
    });

    it('fails closed to empty JSON when backing data is unavailable', () => {
      expect(content).toContain("supabaseUrl.includes('placeholder')");
      expect(content).toContain('NextResponse.json({})');
      expect(content).toContain("select('date, court_name, time')");
      expect(content).not.toMatch(/select\('.*email.*'\)/);
    });
  });
});
