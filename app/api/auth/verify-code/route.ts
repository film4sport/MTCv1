import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rate limit: 10 attempts per 15 min per IP
const verifyAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW = 15 * 60_000;
const RATE_MAX = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = verifyAttempts.get(key);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW) {
    verifyAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

/**
 * POST /api/auth/verify-code
 * Verify the 4-digit reset code and set a new PIN.
 * User types the code from their email + their new PIN, all in-app.
 *
 * Body: { email: string, code: string, newPin: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });
    }

    const { email, code, newPin } = await request.json();

    if (!email?.trim() || !code?.trim() || !newPin?.trim()) {
      return NextResponse.json({ error: 'Email, code, and new PIN required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();
    const codeClean = code.trim();
    const pinClean = newPin.trim();

    if (!/^\d{4}$/.test(codeClean)) {
      return NextResponse.json({ error: 'Code must be exactly 4 digits' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(pinClean)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Reject trivially weak PINs
    if (/^(\d)\1{3}$/.test(pinClean) || pinClean === '1234' || pinClean === '4321') {
      return NextResponse.json({ error: 'PIN is too easy to guess. Choose a stronger PIN.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, pin_reset_code, pin_reset_expires')
      .eq('email', emailLower)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    // Verify code matches
    if (!profile.pin_reset_code || profile.pin_reset_code !== codeClean) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    // Check expiry
    if (profile.pin_reset_expires && new Date(profile.pin_reset_expires) < new Date()) {
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 410 });
    }

    // Hash the new PIN
    const pinHash = await bcrypt.hash(pinClean, 12);

    // Update profile with new PIN, clear reset fields, clear lockout
    const { error } = await supabase
      .from('profiles')
      .update({
        pin_hash: pinHash,
        pin_reset_code: null,
        pin_reset_expires: null,
        pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq('id', profile.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
    }

    // Auto-login: create session
    const userAgent = request.headers.get('user-agent') || '';
    const { data: session } = await supabase
      .from('sessions')
      .insert({
        user_id: profile.id,
        user_agent: userAgent.slice(0, 500),
        ip_address: ip.slice(0, 45),
      })
      .select('token')
      .single();

    // Fetch full profile for response
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, skill_level, skill_level_set, membership_type, family_id, avatar, residence, interclub_team, interclub_captain, member_since, preferences')
      .eq('id', profile.id)
      .single();

    const response = NextResponse.json({
      success: true,
      token: session?.token,
      user: fullProfile ? {
        id: fullProfile.id,
        name: fullProfile.name,
        email: fullProfile.email,
        role: fullProfile.role,
        status: fullProfile.status,
        skillLevel: fullProfile.skill_level,
        skillLevelSet: fullProfile.skill_level_set,
        membershipType: fullProfile.membership_type,
        familyId: fullProfile.family_id,
        avatar: fullProfile.avatar,
        residence: fullProfile.residence,
        interclubTeam: fullProfile.interclub_team || 'none',
        interclubCaptain: fullProfile.interclub_captain || false,
        memberSince: fullProfile.member_since,
        preferences: fullProfile.preferences || {},
      } : undefined,
    });
    // Set session cookie for middleware auth check
    if (session?.token) {
      response.cookies.set('mtc-session', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
