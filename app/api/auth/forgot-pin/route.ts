import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logEmail } from '../../lib/email-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rate limit: 3 forgot-PIN requests per 15 min per IP
const forgotAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW = 15 * 60_000;
const RATE_MAX = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = forgotAttempts.get(key);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW) {
    forgotAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

/**
 * POST /api/auth/forgot-pin
 * Sends a 4-digit reset code to the user's email.
 * User enters the code in-app (no link to click, never leaves app).
 *
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait 15 minutes.' }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user — don't reveal whether email exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', emailLower)
      .single();

    // Always return success to prevent email enumeration
    if (!profile) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
    }

    // Generate 4-digit code
    const resetCode = String(Math.floor(1000 + Math.random() * 9000));
    const resetExpires = new Date(Date.now() + 10 * 60_000).toISOString(); // 10 min expiry

    // Save code to profile
    await supabase
      .from('profiles')
      .update({
        pin_reset_code: resetCode,
        pin_reset_expires: resetExpires,
      })
      .eq('id', profile.id);

    // Send email via SMTP
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'noreply@monotennisclub.com';

    if (smtpHost && smtpUser && smtpPass) {
      const nodemailer = await import('nodemailer');
      const nm = nodemailer.default || nodemailer;
      const transporter = (nm as unknown as { createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<void> } }).createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const firstName = profile.name.split(' ')[0];

      await transporter.sendMail({
        from: `"Mono Tennis Club" <${smtpFrom}>`,
        to: profile.email,
        subject: 'Your PIN Reset Code — Mono Tennis Club',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #1a1f12; margin-bottom: 8px;">Reset Your PIN</h2>
            <p style="color: #4a4a4a; line-height: 1.5;">Hi ${firstName},</p>
            <p style="color: #4a4a4a; line-height: 1.5;">Enter this code in the app to reset your PIN:</p>
            <div style="background: #f5f2eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; letter-spacing: 8px; font-weight: 700; color: #1a1f12;">${resetCode}</span>
            </div>
            <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px;">Mono Tennis Club</p>
          </div>
        `,
      });

      await logEmail({
        type: 'password_reset',
        recipientEmail: profile.email,
        recipientUserId: profile.id,
        status: 'sent',
        subject: 'Your PIN Reset Code — Mono Tennis Club',
        metadata: { source: 'forgot-pin' },
      });
    } else {
      console.warn('[forgot-pin] SMTP not configured — cannot send reset code email');
      await logEmail({
        type: 'password_reset',
        recipientEmail: profile.email,
        recipientUserId: profile.id,
        status: 'failed',
        subject: 'Your PIN Reset Code — Mono Tennis Club',
        error: 'SMTP not configured',
        metadata: { source: 'forgot-pin' },
      });
    }

    return NextResponse.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
