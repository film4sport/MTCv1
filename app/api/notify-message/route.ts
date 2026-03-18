import { NextResponse } from 'next/server';
import { createAdminClient, resolveSession } from '@/app/lib/session';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@monotennisclub.ca';

// Rate limit: 30 message pushes per minute per sender
const msgLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * POST /api/notify-message
 * Sends a push notification to a member when they receive a direct message.
 * Requires authenticated JWT (any member, not just admin).
 *
 * Body: { recipientId, senderName, preview }
 */
export async function POST(request: Request) {
  try {
    const { session } = await resolveSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const senderId = session.user_id;
    const supabase = createAdminClient();

    const body = await request.json();
    const { recipientId, senderName, preview } = body;

    if (!recipientId || !senderName) {
      return NextResponse.json({ error: 'Missing recipientId or senderName' }, { status: 400 });
    }

    // Validate recipientId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId)) {
      return NextResponse.json({ error: 'Invalid recipientId' }, { status: 400 });
    }

    // Prevent sending push to yourself
    if (recipientId === senderId) {
      return NextResponse.json({ success: true, sent: 0, reason: 'self' });
    }

    // Rate limit per sender
    const now = Date.now();
    const limit = msgLimits.get(senderId);
    if (limit && now < limit.resetAt) {
      if (limit.count >= 30) {
        return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
      }
      limit.count++;
    } else {
      msgLimits.set(senderId, { count: 1, resetAt: now + 60000 });
    }

    // Check VAPID config
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ success: true, sent: 0, reason: 'vapid_not_configured' });
    }

    // Get recipient's push subscriptions
    const adminSupabase = createAdminClient();
    const { data: subscriptions } = await adminSupabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', recipientId);

    if (!subscriptions?.length) {
      return NextResponse.json({ success: true, sent: 0, reason: 'no_subscriptions' });
    }

    // Send push
    let sentCount = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const webpush = require('web-push') as {
        setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
        sendNotification: (sub: object, payload: string) => Promise<void>;
      };

      webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

      const cleanName = String(senderName).replace(/<[^>]*>/g, '').trim().slice(0, 200);
      const truncatedPreview = String(preview || 'New message').replace(/<[^>]*>/g, '').slice(0, 100);
      const payload = JSON.stringify({
        title: `Message from ${cleanName}`,
        body: truncatedPreview,
        icon: '/mobile-app/icons/icon-192x192.png',
        badge: '/mobile-app/icons/icon-72x72.png',
        url: '/dashboard/messages',
        tag: `msg-${senderId}-${Date.now()}`,
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
          // Clean up expired subscriptions
          const statusCode = (result.reason as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            adminSupabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscriptions[i].endpoint)
              .then(() => { /* cleanup */ });
          }
        }
      });
    } catch (err) {
      console.error('[notify-message] Push send error:', err);
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (err) {
    console.error('[notify-message] Unhandled error:', err);
    return NextResponse.json({ error: 'Failed to notify' }, { status: 500 });
  }
}
