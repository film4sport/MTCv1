import { NextResponse } from 'next/server';
import { sendPushToUser } from '../lib/push';
import { createAdminClient, resolveSession } from '@/app/lib/session';

// Rate limit: 30 pushes per minute per sender
const pushLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * POST /api/notify-push
 * Generic push notification endpoint for Dashboard actions.
 * Sends a Web Push to a recipient using the shared push utility.
 * Requires authenticated JWT (any member).
 *
 * Body: { recipientId, title, body, tag?, url?, type? }
 */
export async function POST(request: Request) {
  try {
    const { session } = await resolveSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = session.user_id;

    const body = await request.json();
    const { recipientId, title, body: msgBody, tag, url, type } = body;

    if (!recipientId || !title || !msgBody) {
      return NextResponse.json({ error: 'Missing recipientId, title, or body' }, { status: 400 });
    }

    // Prevent sending push to yourself
    if (recipientId === userId) {
      return NextResponse.json({ success: true, sent: 0, reason: 'self' });
    }

    // Rate limit per sender
    const now = Date.now();
    const limit = pushLimits.get(userId);
    if (limit && now < limit.resetAt) {
      if (limit.count >= 30) {
        return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
      }
      limit.count++;
    } else {
      pushLimits.set(userId, { count: 1, resetAt: now + 60000 });
    }

    // Use shared push utility (handles VAPID config, preferences, cleanup)
    const adminSupabase = createAdminClient();
    const result = await sendPushToUser(adminSupabase, recipientId, {
      title,
      body: (msgBody as string).slice(0, 200),
      tag: tag || `notif-${type || 'general'}-${Date.now()}`,
      url: url || '/dashboard',
      type: type || undefined,
    });

    return NextResponse.json({ success: true, sent: result.sent });
  } catch (err) {
    console.error('[notify-push] Unhandled error:', err);
    return NextResponse.json({ error: 'Failed to notify' }, { status: 500 });
  }
}
