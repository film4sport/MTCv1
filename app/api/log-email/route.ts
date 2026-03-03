import { NextRequest, NextResponse } from 'next/server';
import { logEmail, type EmailLogType, type EmailLogStatus } from '../lib/email-logger';

/**
 * Lightweight endpoint for client-side code to log emails.
 * Used by the desktop signup page to log Supabase-sent confirmation emails.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipientEmail, recipientUserId, status, subject, metadata } = body;

    const validTypes: EmailLogType[] = ['signup_confirmation', 'password_reset'];
    const validStatuses: EmailLogStatus[] = ['sent', 'failed', 'requested'];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return NextResponse.json({ error: 'Missing recipientEmail' }, { status: 400 });
    }
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await logEmail({
      type,
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientUserId: recipientUserId || undefined,
      status: status || 'requested',
      subject: subject || undefined,
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
