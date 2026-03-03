import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

/**
 * Mobile PWA Auth Proxy
 * Validates credentials against Supabase and returns user data.
 * The mobile PWA (at /mobile-app/) calls this instead of its old Express server.
 */

// Demo credentials — same as the main app, for development/demo mode
const DEMO_CREDENTIALS: Record<string, { password: string; role: string; name: string }> = {
  'member@mtc.ca': { password: process.env.DEMO_MEMBER_PW || 'member123', role: 'member', name: 'Alex Thompson' },
  'coach@mtc.ca':  { password: process.env.DEMO_COACH_PW  || 'coach123',  role: 'coach',  name: 'Mark Taylor' },
  'admin@mtc.ca':  { password: process.env.DEMO_ADMIN_PW  || 'admin123',  role: 'admin',  name: 'Admin' },
};

// Simple in-memory rate limiter: max 5 attempts per email per 60 seconds
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(email);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(email, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // Rate limit check
    if (isRateLimited(emailLower)) {
      return NextResponse.json({ error: 'Too many login attempts. Please wait a minute.' }, { status: 429 });
    }

    // Try Supabase auth first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password });

        if (!error && data.user && data.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            return NextResponse.json({
              role: profile.role || 'member',
              name: profile.name || emailLower.split('@')[0],
              email: emailLower,
              userId: data.user.id,
              accessToken: data.session.access_token,
            });
          }
        }
      } catch {
        // Supabase failed — fall through to demo credentials
      }
    }

    // Fallback to demo credentials (development only)
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'unknown_account' }, { status: 401 });
    }
    const account = DEMO_CREDENTIALS[emailLower];
    if (!account) {
      return NextResponse.json({ error: 'unknown_account' }, { status: 401 });
    }
    // Timing-safe comparison to prevent timing attacks
    const expected = Buffer.from(account.password);
    const received = Buffer.from(password);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
    }

    return NextResponse.json({ role: account.role, name: account.name, email: emailLower });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
