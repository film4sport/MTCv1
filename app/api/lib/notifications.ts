/**
 * Shared bell notification utility.
 * Used by all mobile API routes that create in-app notifications.
 * Best-effort: notification failures never block the main flow.
 */
import { SupabaseClient } from '@supabase/supabase-js';

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp: string;
}

function isDuplicateError(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message || '';
  return error?.code === '23505' || message.includes('duplicate key value') || message.includes('unique constraint');
}

/**
 * Create a bell notification in the notifications table.
 * Logs errors with the given context prefix but never throws.
 */
export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  notif: NotificationPayload,
  context = 'api'
): Promise<void> {
  await supabase.from('notifications').insert({
    id: notif.id, user_id: userId, type: notif.type,
    title: notif.title, body: notif.body, timestamp: notif.timestamp, read: false,
  }).then(({ error }) => {
    if (error && !isDuplicateError(error)) {
      console.error(`[${context}] Failed to create notification for ${userId}:`, error.message);
    }
  });
}
