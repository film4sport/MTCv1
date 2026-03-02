import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side rate-limited password reset endpoint.
 * Max 3 reset requests per email per 15 minutes.
 */

const resetAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60_000; // 15 minutes
const RATE_LIMIT_MAX = 3;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = resetAttempts.get(email);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    resetAttempts.set(email, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();

    // Server-side rate limit
    if (isRateLimited(emailLower)) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please wait 15 minutes before trying again.' },
        { status: 429 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.monotennisclub.com';

    const { error } = await supabase.auth.resetPasswordForEmail(emailLower, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
