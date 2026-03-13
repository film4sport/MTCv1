import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logEmail, type EmailLogType } from '../lib/email-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@monotennisclub.com';

// Rate limit: 20 emails per hour per sender
const emailLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * POST /api/notify-email
 * Generic notification email endpoint for partner requests, program enrollment, etc.
 * Requires authenticated JWT (any member).
 *
 * Body: { recipientEmail, recipientName, recipientUserId?, subject, heading, body, ctaText?, ctaUrl?, logType? }
 */
export async function POST(request: Request) {
  try {
    // Authenticate sender
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .single();
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const user = { id: session.user_id };

    const reqBody = await request.json();
    const { recipientEmail, recipientName, recipientUserId, subject, heading, body: emailBody, ctaText, ctaUrl, logType } = reqBody;

    if (!recipientEmail || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing recipientEmail, subject, or body' }, { status: 400 });
    }

    // Rate limit per sender
    const now = Date.now();
    const limit = emailLimits.get(user.id);
    if (limit && now < limit.resetAt) {
      if (limit.count >= 20) {
        return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
      }
      limit.count++;
    } else {
      emailLimits.set(user.id, { count: 1, resetAt: now + 3600000 });
    }

    // Check SMTP config
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ success: false, reason: 'smtp_not_configured' });
    }

    // Build HTML email (matching site cream theme)
    const ctaSection = ctaText && ctaUrl
      ? `<tr><td style="padding: 8px 28px 24px; text-align: center;">
          <a href="${ctaUrl}" style="display: inline-block; background: #6b7a3d; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; text-decoration: none;">${ctaText}</a>
        </td></tr>`
      : '';

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f2eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f2eb; padding: 40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #faf8f3; border-radius: 16px; border: 1px solid #e0dcd3; overflow: hidden;">
        <tr><td style="height: 4px; background: linear-gradient(90deg, #6b7a3d, #d4e157);"></td></tr>
        <tr><td style="padding: 28px 28px 0; text-align: center;">
          <img src="https://www.monotennisclub.com/mono-logo-black.png" alt="Mono Tennis Club" width="140" style="width: 140px; height: auto;" />
        </td></tr>
        <tr><td style="padding: 24px 28px 8px;">
          <h1 style="font-size: 20px; font-weight: 600; color: #2a2f1e; margin: 0 0 6px;">${heading || subject}</h1>
          <p style="font-size: 14px; color: #6b7266; margin: 0 0 4px;">Hi ${(recipientName || '').split(' ')[0] || 'there'},</p>
          <p style="font-size: 13px; color: #9ca3a0; margin: 0;">${emailBody}</p>
        </td></tr>
        ${ctaSection}
        <tr><td style="padding: 16px 28px 24px; border-top: 1px solid #e0dcd3;">
          <p style="font-size: 11px; color: #b0ada6; margin: 0; text-align: center;">
            Mono Tennis Club &bull; 754483 Mono Centre Rd, Mono, ON
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    // Send via nodemailer
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"Mono Tennis Club" <${SMTP_FROM}>`,
      to: recipientEmail,
      subject,
      html,
    });

    // Log success
    logEmail({
      type: (logType || 'general_notification') as EmailLogType,
      recipientEmail,
      recipientUserId: recipientUserId || undefined,
      status: 'sent',
      subject,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notify-email] Error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
