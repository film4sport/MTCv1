import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    // Authenticate the sender via JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, senderName, preview } = body;

    if (!recipientId || !senderName) {
      return NextResponse.json({ error: 'Missing recipientId or senderName' }, { status: 400 });
    }

    // Prevent sending push to yourself
    if (recipientId === user.id) {
      return NextResponse.json({ success: true, sent: 0, reason: 'self' });
    }

    // Rate limit per sender
    const now = Date.now();
    const limit = msgLimits.get(user.id);
    if (limit && now < limit.resetAt) {
      if (limit.count >= 30) {
        return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
      }
      limit.count++;
    } else {
      msgLimits.set(user.id, { count: 1, resetAt: now + 60000 });
    }

    // Check VAPID config
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ success: true, sent: 0, reason: 'vapid_not_configured' });
    }

    // Get recipient's push subscriptions
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
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

      const truncatedPreview = (preview || 'New message').slice(0, 100);
      const payload = JSON.stringify({
        title: `Message from ${senderName}`,
        body: truncatedPreview,
        icon: '/mobile-app/icons/icon-192x192.png',
        badge: '/mobile-app/icons/icon-72x72.png',
        url: '/dashboard/messages',
        tag: `msg-${user.id}-${Date.now()}`,
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
