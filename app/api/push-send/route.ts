import { NextResponse } from 'next/server';
import { logEmailBatch } from '../lib/email-logger';
import { createAdminClient, resolveSession } from '@/app/lib/session';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@monotennisclub.ca';

// Rate limit: 50 pushes per minute globally
let pushCount = 0;
let pushResetAt = Date.now() + 60000;

/**
 * Verify the caller is an authenticated admin via session token.
 * Returns the admin's user ID or null.
 */
async function authenticateAdmin(request: Request): Promise<string | null> {
  const { session } = await resolveSession(request);
  if (!session) return null;

  const adminSupabase = createAdminClient();

  // Check admin role in profiles
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', session.user_id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return session.user_id;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, body: messageBody, icon, url, tag } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
    }

    // Authenticate: only admins can send push notifications
    const adminId = await authenticateAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: admin only' }, { status: 403 });
    }

    // Rate limit
    const now = Date.now();
    if (now > pushResetAt) { pushCount = 0; pushResetAt = now + 60000; }
    if (++pushCount > 50) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPID keys not configured. Run: npx web-push generate-vapid-keys' }, { status: 500 });
    }

    // Get user's push subscriptions from Supabase
    const supabase = createAdminClient();
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subscriptions?.length) {
      return NextResponse.json({ error: 'No push subscriptions found for user' }, { status: 404 });
    }

    // Try to load web-push (requires npm install web-push)
    let sentCount = 0;
    let failedCount = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const webpush = require('web-push') as {
        setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
        sendNotification: (sub: object, payload: string) => Promise<void>;
      };

      webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

      const payload = JSON.stringify({
        title,
        body: messageBody || '',
        icon: icon || '/mobile-app/icons/icon-192x192.png',
        badge: '/mobile-app/icons/icon-72x72.png',
        url: url || '/mobile-app/index.html',
        tag: tag || 'mtc-notification',
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      );

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          sentCount++;
        } else {
          failedCount++;
          // Remove expired subscriptions (410 Gone)
          const statusCode = (result.reason as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscriptions[i].endpoint)
              .then(() => { /* cleanup */ });
          }
        }
      });

      // Log push notifications
      await logEmailBatch(
        results.map((result, i) => ({
          type: 'push_notification' as const,
          recipientUserId: userId,
          status: result.status === 'fulfilled' ? 'sent' as const : 'failed' as const,
          subject: title,
          metadata: { body: messageBody, endpoint: subscriptions[i].endpoint, tag },
          error: result.status === 'rejected' ? String((result as PromiseRejectedResult).reason) : undefined,
        }))
      );
    } catch {
      return NextResponse.json({ error: 'web-push not installed. Run: npm install web-push' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount });
  } catch {
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
  }
}
