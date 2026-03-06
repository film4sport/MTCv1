import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logEmailBatch } from '../lib/email-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ICS generator (server-compatible copy from dashboard/lib/calendar.ts)
const TIMEZONE = 'America/Toronto';

function parseTime(time: string): { hour: number; minute: number } {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 9, minute: 0 };
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

function toLocalICSDate(date: string, hour: number, minute: number): string {
  const [y, m, d] = date.split('-');
  return `${y}${m}${d}T${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`;
}

function generateICS(event: { title: string; date: string; time: string; duration?: number; location?: string; description?: string; attendees?: string[] }): string {
  const duration = event.duration || 60;
  const { hour, minute } = parseTime(event.time);
  const dtStart = toLocalICSDate(event.date, hour, minute);
  const totalMinutes = hour * 60 + minute + duration;
  const dtEnd = toLocalICSDate(event.date, Math.floor(totalMinutes / 60), totalMinutes % 60);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@mtc.ca`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mono Tennis Club//MTC//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${TIMEZONE}`,
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART;TZID=${TIMEZONE}:${dtStart}`,
    `DTEND;TZID=${TIMEZONE}:${dtEnd}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    'STATUS:CONFIRMED',
  ];

  // Add attendees to ICS for calendar integration
  if (event.attendees) {
    event.attendees.forEach(email => {
      lines.push(`ATTENDEE;RSVP=TRUE:mailto:${email}`);
    });
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n') + '\r\n';
}

// Rate limiting: 20 emails per IP per hour (raised for multi-recipient)
const emailLimits = new Map<string, { count: number; resetAt: number }>();

interface Recipient {
  email: string;
  name: string;
  role: 'booker' | 'participant';
}

// Shared email HTML template — cream theme matching site design
function buildEmailHTML(recipient: Recipient, courtName: string, formattedDate: string, time: string, matchType: string | undefined, durationMinutes: number, bookerName: string, allParticipantNames: string[], bookedFor?: string, trackingParams?: string): string {
  const isBooker = recipient.role === 'booker';
  const heading = isBooker ? 'Booking Confirmed' : 'You\'ve Been Added to a Booking';
  const greeting = `Hi ${recipient.name.split(' ')[0]},`;
  const subtext = isBooker
    ? bookedFor ? `Court booked for ${bookedFor}. A calendar invite is attached.` : 'Your court has been reserved. A calendar invite is attached.'
    : `${bookerName} added you to a court booking${bookedFor ? ` for ${bookedFor}` : ''}. A calendar invite is attached.`;

  const bookedForSection = bookedFor
    ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Booked for</td><td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #2a2f1e; text-align: right;">${bookedFor}</td></tr>`
    : '';
  const playersSection = allParticipantNames.length > 0
    ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Playing with</td><td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #2a2f1e; text-align: right;">${allParticipantNames.filter(n => n !== recipient.name).join(', ') || 'None listed'}</td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f2eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f2eb; padding: 40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #faf8f3; border-radius: 16px; border: 1px solid #e0dcd3; overflow: hidden;">

        <!-- Header accent bar -->
        <tr><td style="height: 4px; background: linear-gradient(90deg, #6b7a3d, #d4e157);"></td></tr>

        <!-- Logo -->
        <tr><td style="padding: 28px 28px 0; text-align: center;">
          <img src="https://www.monotennisclub.com/mono-logo-black.png" alt="Mono Tennis Club" width="140" height="auto" style="width: 140px; height: auto;" />
        </td></tr>

        <!-- Content -->
        <tr><td style="padding: 24px 28px 8px;">
          <h1 style="font-size: 20px; font-weight: 600; color: #2a2f1e; margin: 0 0 6px;">${heading}</h1>
          <p style="font-size: 14px; color: #6b7266; margin: 0 0 4px;">${greeting}</p>
          <p style="font-size: 13px; color: #9ca3a0; margin: 0;">${subtext}</p>
        </td></tr>

        <!-- Booking details card -->
        <tr><td style="padding: 16px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff; border: 1px solid #e8e4d9; border-radius: 12px;">
            <tr><td style="padding: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Court</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #2a2f1e; text-align: right;">${courtName}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Date</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #2a2f1e; text-align: right;">${formattedDate}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Time</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #2a2f1e; text-align: right;">${time}</td>
                </tr>
                ${matchType ? `<tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Type</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #6b7a3d; text-align: right;">${matchType.charAt(0).toUpperCase() + matchType.slice(1)} &bull; ${durationMinutes} min</td>
                </tr>` : ''}
                ${bookedForSection ? `<tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>${bookedForSection}` : ''}
                ${playersSection ? `<tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>${playersSection}` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Calendar badge -->
        <tr><td style="padding: 0 28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(107, 122, 61, 0.06); border-radius: 10px;">
            <tr><td style="padding: 14px 16px; text-align: center;">
              <span style="font-size: 12px; color: #6b7a3d; font-weight: 500;">&#128197; Calendar invite (.ics) attached — add to your calendar</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- Confirm & View button (click tracking) -->
        ${trackingParams ? `<tr><td style="padding: 0 28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.monotennisclub.com'}/api/email-track?${trackingParams}"
                 style="display: inline-block; padding: 12px 32px; background: #6b7a3d; color: #fff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                ${recipient.role === 'participant' ? 'Confirm Attendance' : 'View Booking'}
              </a>
            </td></tr>
          </table>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="padding: 16px 28px 28px; text-align: center; border-top: 1px solid #f0ede6;">
          <p style="font-size: 11px; color: #b5b0a5; margin: 0;">Mono Tennis Club &bull; Mono, Ontario</p>
          <p style="font-size: 11px; color: #c5c0b5; margin: 6px 0 0;">You can manage notification preferences in your dashboard settings.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, recipients, bookerName, bookedFor, courtName, date, time, duration, matchType } = body;

    // Support both old format (single email) and new format (recipients array)
    const recipientList: Recipient[] = recipients
      ? recipients as Recipient[]
      : body.email
        ? [{ email: body.email, name: body.userName || 'Member', role: 'booker' as const }]
        : [];

    if (recipientList.length === 0 || !courtName || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limit: 20 emails per hour per booker
    const rateLimitKey = recipientList[0]?.email || 'unknown';
    const now = Date.now();
    const limit = emailLimits.get(rateLimitKey);
    if (limit && now < limit.resetAt) {
      if (limit.count >= 20) {
        return NextResponse.json({ error: 'Too many emails. Try again later.' }, { status: 429 });
      }
      limit.count += recipientList.length;
    } else {
      emailLimits.set(rateLimitKey, { count: recipientList.length, resetAt: now + 60 * 60 * 1000 });
    }

    // Validate all recipient emails are real members
    if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
        const emails = recipientList.map(r => r.email.toLowerCase());
        // Use case-insensitive comparison: fetch all profiles and compare lowercased
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email');

        const validEmails = new Set((profiles || []).map(p => (p.email || '').toLowerCase()));
        const invalidEmails = emails.filter(e => !validEmails.has(e));

        if (invalidEmails.length > 0) {
          console.warn('[booking-email] Unknown recipients:', invalidEmails.join(', '));
          return NextResponse.json(
            { error: `Unknown recipient(s): ${invalidEmails.join(', ')}` },
            { status: 400 }
          );
        }
      } catch (err) {
        // If validation fails, continue (don't block emails over a DB issue)
        console.warn('[booking-email] Recipient validation failed, continuing:', err);
      }
    }

    // Generate ICS with all attendee emails
    const durationMinutes = duration ? duration * 30 : 60;
    const allEmails = recipientList.map(r => r.email);
    const allNames = recipientList.map(r => r.name);
    const actualBookerName = bookerName || recipientList.find(r => r.role === 'booker')?.name || 'A member';

    const icsContent = generateICS({
      title: `Tennis — ${courtName}`,
      date,
      time,
      duration: durationMinutes,
      location: `${courtName} — Mono Tennis Club, Mono, Ontario`,
      description: `${matchType || 'Singles'} booking. Players: ${allNames.join(', ')}`,
      attendees: allEmails,
    });

    // Format date for email
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    let sentCount = 0;
    let failedCount = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer') as { default?: { createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<void> } }; createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<void> } };

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        const nm = nodemailer.default || nodemailer;
        const transporter = nm.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        // Send to each recipient with personalized content
        const results = await Promise.allSettled(
          recipientList.map(recipient => {
            const isBooker = recipient.role === 'booker';
            const subject = isBooker
              ? `Booking Confirmed — ${courtName}, ${formattedDate}`
              : `Added to Booking — ${courtName}, ${formattedDate}`;

            // Build tracking URL params for the "Confirm Attendance" / "View Booking" button
            const trackParams = bookingId
              ? `booking=${encodeURIComponent(bookingId)}&email=${encodeURIComponent(recipient.email)}&redirect=${encodeURIComponent('/dashboard/schedule')}`
              : '';

            return transporter.sendMail({
              from: `"Mono Tennis Club" <${smtpUser}>`,
              to: recipient.email,
              subject,
              html: buildEmailHTML(recipient, courtName, formattedDate, time, matchType, durationMinutes, actualBookerName, allNames, bookedFor, trackParams),
              icalEvent: {
                filename: 'mtc-booking.ics',
                method: 'REQUEST',
                content: icsContent,
              },
            });
          })
        );

        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            sentCount++;
          } else {
            failedCount++;
            console.error(`[booking-email] Failed to send to ${recipientList[i]?.email}:`, r.reason);
          }
        });

        // Log each email to email_logs
        await logEmailBatch(
          recipientList.map((recipient, i) => ({
            type: 'booking_confirmation' as const,
            recipientEmail: recipient.email,
            status: results[i].status === 'fulfilled' ? 'sent' as const : 'failed' as const,
            subject: `Booking Confirmed — ${courtName}, ${formattedDate}`,
            metadata: { bookingId, courtName, date, time, matchType, role: recipient.role },
            error: results[i].status === 'rejected' ? String((results[i] as PromiseRejectedResult).reason) : undefined,
          }))
        );
      } else {
        console.warn('[booking-email] SMTP not configured. SMTP_HOST:', !!smtpHost, 'SMTP_USER:', !!smtpUser, 'SMTP_PASS:', !!smtpPass);
      }
    } catch (err) {
      console.error('[booking-email] SMTP/nodemailer error:', err);
      // Don't swallow — record the error so it surfaces in the response
      failedCount = recipientList.length;
    }

    // Stamp email_sent_at on the booking row if at least one email was sent
    if (sentCount > 0 && bookingId && supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
        await supabase.from('bookings').update({ email_sent_at: new Date().toISOString() }).eq('id', bookingId);
      } catch {
        // Non-critical — don't fail the response over a tracking update
      }
    }

    const allFailed = sentCount === 0 && recipientList.length > 0;
    return NextResponse.json({
      success: sentCount > 0,
      sent: sentCount,
      failed: failedCount,
      totalRecipients: recipientList.length,
      ics: icsContent,
      message: sentCount > 0
        ? `${sentCount} confirmation email(s) sent`
        : failedCount > 0
          ? `All ${failedCount} email(s) failed to send`
          : 'SMTP not configured — no emails sent',
    }, { status: allFailed ? 502 : 200 });
  } catch (err) {
    console.error('[booking-email] Unhandled error:', err);
    return NextResponse.json({ error: 'Failed to process booking email' }, { status: 500 });
  }
}

// Cancellation email — sends METHOD:CANCEL ICS to remove from calendars
function buildCancelEmailHTML(recipientName: string, cancelledBy: string, courtName: string, formattedDate: string, time: string): string {
  const isSelf = recipientName === cancelledBy;
  const heading = 'Booking Cancelled';
  const subtext = isSelf
    ? 'Your court booking has been cancelled.'
    : `${cancelledBy} cancelled a booking you were part of.`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f2eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f2eb; padding: 40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #faf8f3; border-radius: 16px; border: 1px solid #e0dcd3; overflow: hidden;">

        <!-- Red accent bar for cancellation -->
        <tr><td style="height: 4px; background: linear-gradient(90deg, #ef4444, #f87171);"></td></tr>

        <!-- Logo -->
        <tr><td style="padding: 28px 28px 0; text-align: center;">
          <img src="https://www.monotennisclub.com/mono-logo-black.png" alt="Mono Tennis Club" width="140" height="auto" style="width: 140px; height: auto;" />
        </td></tr>

        <!-- Content -->
        <tr><td style="padding: 24px 28px 8px;">
          <h1 style="font-size: 20px; font-weight: 600; color: #2a2f1e; margin: 0 0 6px;">${heading}</h1>
          <p style="font-size: 14px; color: #6b7266; margin: 0 0 4px;">Hi ${recipientName.split(' ')[0]},</p>
          <p style="font-size: 13px; color: #9ca3a0; margin: 0;">${subtext}</p>
        </td></tr>

        <!-- Cancelled booking details -->
        <tr><td style="padding: 16px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff; border: 1px solid #fecaca; border-radius: 12px;">
            <tr><td style="padding: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Court</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #9ca3a0; text-align: right; text-decoration: line-through;">${courtName}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Date</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #9ca3a0; text-align: right; text-decoration: line-through;">${formattedDate}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7266;">Time</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #9ca3a0; text-align: right; text-decoration: line-through;">${time}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom: 1px solid #f0ede6; height: 1px;"></td></tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #ef4444; font-weight: 500;" colspan="2">&#10060; This booking has been cancelled</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Rebook CTA -->
        <tr><td style="padding: 0 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(107, 122, 61, 0.06); border-radius: 10px;">
            <tr><td style="padding: 14px 16px; text-align: center;">
              <span style="font-size: 12px; color: #6b7a3d; font-weight: 500;">The calendar event has been removed. You can rebook from your dashboard anytime.</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding: 16px 28px 28px; text-align: center; border-top: 1px solid #f0ede6;">
          <p style="font-size: 11px; color: #b5b0a5; margin: 0;">Mono Tennis Club &bull; Mono, Ontario</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function generateCancelICS(event: { title: string; date: string; time: string; uid?: string }): string {
  const { hour, minute } = parseTime(event.time);
  const dtStart = toLocalICSDate(event.date, hour, minute);
  const uid = event.uid || `${Date.now()}-${Math.random().toString(36).slice(2)}@mtc.ca`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mono Tennis Club//MTC//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${TIMEZONE}`,
    'METHOD:CANCEL',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART;TZID=${TIMEZONE}:${dtStart}`,
    `SUMMARY:${event.title}`,
    'STATUS:CANCELLED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { recipients, cancelledBy, courtName, date, time } = body;

    const recipientList = (recipients || []) as { email: string; name: string }[];
    if (recipientList.length === 0 || !courtName || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const cancelICS = generateCancelICS({
      title: `Tennis — ${courtName} (CANCELLED)`,
      date,
      time,
    });

    let sentCount = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer') as { default?: { createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<void> } }; createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<void> } };

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        const nm = nodemailer.default || nodemailer;
        const transporter = nm.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const results = await Promise.allSettled(
          recipientList.map(recipient =>
            transporter.sendMail({
              from: `"Mono Tennis Club" <${smtpUser}>`,
              to: recipient.email,
              subject: `Booking Cancelled — ${courtName}, ${formattedDate}`,
              html: buildCancelEmailHTML(recipient.name, cancelledBy || 'A member', courtName, formattedDate, time),
              icalEvent: {
                filename: 'mtc-cancellation.ics',
                method: 'CANCEL',
                content: cancelICS,
              },
            })
          )
        );

        sentCount = results.filter(r => r.status === 'fulfilled').length;

        // Log cancellation emails
        await logEmailBatch(
          recipientList.map((recipient, i) => ({
            type: 'booking_cancellation' as const,
            recipientEmail: recipient.email,
            status: results[i].status === 'fulfilled' ? 'sent' as const : 'failed' as const,
            subject: `Booking Cancelled — ${courtName}, ${formattedDate}`,
            metadata: { courtName, date, time, cancelledBy },
            error: results[i].status === 'rejected' ? String((results[i] as PromiseRejectedResult).reason) : undefined,
          }))
        );
      }
    } catch (err) {
      console.error('[booking-email] Cancellation SMTP error:', err);
    }

    return NextResponse.json({ success: sentCount > 0, sent: sentCount });
  } catch (err) {
    console.error('[booking-email] Cancellation unhandled error:', err);
    return NextResponse.json({ error: 'Failed to send cancellation email' }, { status: 500 });
  }
}
