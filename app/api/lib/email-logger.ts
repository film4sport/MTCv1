import { createClient } from '@supabase/supabase-js';

export type EmailLogType =
  | 'booking_confirmation'
  | 'booking_cancellation'
  | 'signup_confirmation'
  | 'password_reset'
  | 'push_notification'
  | 'program_enrollment'
  | 'program_withdrawal'
  | 'event_rsvp';

export type EmailLogStatus = 'sent' | 'failed' | 'requested';

interface LogEntry {
  type: EmailLogType;
  recipientEmail?: string;
  recipientUserId?: string;
  status: EmailLogStatus;
  subject?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Log an outbound email or notification to the email_logs table.
 * Uses service role key for insert (bypasses RLS).
 * Non-blocking — failures are silently caught so logging never breaks the main flow.
 */
export async function logEmail(entry: LogEntry): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('email_logs').insert({
      type: entry.type,
      recipient_email: entry.recipientEmail || null,
      recipient_user_id: entry.recipientUserId || null,
      status: entry.status,
      subject: entry.subject || null,
      metadata: entry.metadata || {},
      error: entry.error || null,
    });
  } catch {
    // Non-critical — never let logging break the main flow
  }
}

/**
 * Log multiple emails at once (e.g. multi-recipient booking confirmations).
 */
export async function logEmailBatch(entries: LogEntry[]): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || entries.length === 0) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('email_logs').insert(
      entries.map(e => ({
        type: e.type,
        recipient_email: e.recipientEmail || null,
        recipient_user_id: e.recipientUserId || null,
        status: e.status,
        subject: e.subject || null,
        metadata: e.metadata || {},
        error: e.error || null,
      }))
    );
  } catch {
    // Non-critical
  }
}
