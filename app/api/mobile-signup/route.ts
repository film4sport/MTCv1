import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logEmail } from '../lib/email-logger';

/**
 * Mobile PWA Signup API
 * Creates accounts via Supabase Auth (same as dashboard signup).
 * Rate-limited to prevent abuse.
 */

const signupAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60_000; // 15 minutes
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    signupAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim().slice(0, 200);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please wait 15 minutes.' },
        { status: 429 }
      );
    }

    const { email, password, name, membershipType } = await request.json();

    // ── Validation ────────────────────────────────────
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain uppercase, lowercase, and a number' }, { status: 400 });
    }

    const cleanName = sanitize(name);
    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'Name is too short' }, { status: 400 });
    }

    const validTypes = ['single', 'family', 'junior'];
    const type = validTypes.includes(membershipType) ? membershipType : 'single';

    // ── Supabase signup ───────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured for signups' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signUp({
      email: emailLower,
      password,
      options: {
        data: {
          name: cleanName,
          role: 'member',
          membership_type: type,
        },
      },
    });

    if (error) {
      await logEmail({
        type: 'signup_confirmation',
        recipientEmail: emailLower,
        status: 'failed',
        subject: 'Signup Confirmation',
        error: error.message,
        metadata: { source: 'mobile' },
      });
      // Map common Supabase errors to user-friendly messages
      if (error.message.includes('already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
    }

    const needsConfirmation = !data.session;

    // Log the signup confirmation email (Supabase sends it automatically)
    if (needsConfirmation) {
      await logEmail({
        type: 'signup_confirmation',
        recipientEmail: emailLower,
        recipientUserId: data.user.id,
        status: 'requested',
        subject: 'Confirm Your Email — Mono Tennis Club',
        metadata: { source: 'mobile', membershipType: type },
      });
    }

    return NextResponse.json({
      success: true,
      emailConfirmRequired: needsConfirmation,
      user: {
        id: data.user.id,
        name: cleanName,
        email: emailLower,
        role: 'member',
        membershipType: type,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
