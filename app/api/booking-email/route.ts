import { NextResponse } from 'next/server';

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

function generateICS(event: { title: string; date: string; time: string; duration?: number; location?: string; description?: string }): string {
  const duration = event.duration || 60;
  const { hour, minute } = parseTime(event.time);
  const dtStart = toLocalICSDate(event.date, hour, minute);
  const totalMinutes = hour * 60 + minute + duration;
  const dtEnd = toLocalICSDate(event.date, Math.floor(totalMinutes / 60), totalMinutes % 60);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@mtc.ca`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mono Tennis Club//MTC//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${TIMEZONE}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART;TZID=${TIMEZONE}:${dtStart}`,
    `DTEND;TZID=${TIMEZONE}:${dtEnd}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n') + '\r\n';
}

// Rate limiting: 10 emails per user per hour
const emailLimits = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, userName, courtName, date, time, duration, matchType, participants } = body;

    if (!email || !courtName || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limit check
    const now = Date.now();
    const limit = emailLimits.get(email);
    if (limit && now < limit.resetAt) {
      if (limit.count >= 10) {
        return NextResponse.json({ error: 'Too many emails. Try again later.' }, { status: 429 });
      }
      limit.count++;
    } else {
      emailLimits.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 });
    }

    // Generate ICS
    const durationMinutes = duration ? duration * 30 : 60;
    const icsContent = generateICS({
      title: `Tennis — ${courtName}`,
      date,
      time,
      duration: durationMinutes,
      location: `${courtName} — Mono Tennis Club, Mono, Ontario`,
      description: `${matchType || 'Singles'} booking${participants?.length ? ` with ${participants.map((p: { name: string }) => p.name).join(', ')}` : ''}`,
    });

    // Format date for email
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Try to send email via nodemailer (requires npm install nodemailer)
    let emailSent = false;
    try {
      // Dynamic import so the app doesn't crash if nodemailer isn't installed yet
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

        await transporter.sendMail({
          from: `"Mono Tennis Club" <${smtpUser}>`,
          to: email,
          subject: `Booking Confirmed — ${courtName} on ${formattedDate}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #faf8f3; border-radius: 16px;">
              <h1 style="font-size: 20px; color: #1a1f12; margin: 0 0 8px;">Booking Confirmed</h1>
              <p style="font-size: 14px; color: #6b7266; margin: 0 0 24px;">Hi ${userName || 'there'},</p>

              <div style="background: #fff; border: 1px solid #e0dcd3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="font-size: 16px; font-weight: 600; color: #2a2f1e; margin: 0 0 4px;">${courtName}</p>
                <p style="font-size: 14px; color: #6b7266; margin: 0;">${formattedDate} at ${time}</p>
                ${matchType ? `<p style="font-size: 13px; color: #6b7a3d; margin: 8px 0 0;">${matchType.charAt(0).toUpperCase() + matchType.slice(1)} • ${durationMinutes} minutes</p>` : ''}
                ${participants?.length ? `<p style="font-size: 13px; color: #6b7266; margin: 4px 0 0;">With: ${participants.map((p: { name: string }) => p.name).join(', ')}</p>` : ''}
              </div>

              <p style="font-size: 12px; color: #9ca3a0; margin: 0;">A calendar invite (.ics) is attached. See you on the court!</p>
              <p style="font-size: 12px; color: #9ca3a0; margin: 8px 0 0;">— Mono Tennis Club</p>
            </div>
          `,
          icalEvent: {
            filename: 'mtc-booking.ics',
            method: 'REQUEST',
            content: icsContent,
          },
        });
        emailSent = true;
      }
    } catch {
      // nodemailer not installed or SMTP not configured — return ICS only
    }

    return NextResponse.json({
      success: true,
      emailSent,
      ics: icsContent,
      message: emailSent ? 'Confirmation email sent' : 'Email not configured — ICS generated',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process booking email' }, { status: 500 });
  }
}
