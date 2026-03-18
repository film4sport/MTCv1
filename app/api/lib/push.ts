/**
 * Shared Web Push notification utility.
 * Used by all mobile API routes and the /api/notify-push endpoint.
 * Best-effort: push failures never block the main flow.
 */
import { SupabaseClient } from '@supabase/supabase-js';

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  /** Notification type — used for preference enforcement. 'announcement' always sends. */
  type?: 'booking' | 'event' | 'partner' | 'message' | 'program' | 'announcement';
}

const TYPE_TO_PREF: Record<string, string> = {
  booking: 'bookings',
  event: 'events',
  partner: 'partners',
  announcement: 'announcements',
  message: 'messages',
  program: 'programs',
};

/**
 * Send a Web Push notification to a user (best-effort, non-blocking).
 * Checks notification preferences before sending (announcements always send).
 * Auto-cleans expired subscriptions (410/404).
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<{ sent: number }> {
  try {
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
    const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@monotennisclub.ca';
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return { sent: 0 };

    // Check notification preferences (announcements bypass preferences)
    if (payload.type) {
      const prefCol = TYPE_TO_PREF[payload.type];
      if (prefCol) {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select(prefCol)
          .eq('user_id', userId)
          .single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (prefs && (prefs as any)[prefCol] === false) return { sent: 0 };
      }
    }

    // Fetch all push subscriptions for this user
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId);
    if (!subscriptions?.length) return { sent: 0 };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webpush = require('web-push') as {
      setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
      sendNotification: (sub: object, payload: string) => Promise<void>;
    };
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/mobile-app/icon-192.png',
      badge: '/mobile-app/badge-72.png',
      url: payload.url || '/mobile-app/index.html',
      tag: payload.tag || 'notif-' + Date.now(),
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushPayload
        )
      )
    );

    // Clean up expired subscriptions (410 Gone / 404 Not Found)
    const expiredIds: number[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(subscriptions[i].id);
        }
      }
    });
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds).then(() => {});
    }

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return { sent };
  } catch {
    // Push is best-effort — never break the calling flow
    return { sent: 0 };
  }
}
