import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { logEmail } from '../../lib/email-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rate limit: keep abuse protection, but avoid blocking whole households/venues.
// Scope attempts to IP + email so multiple legitimate signups on one network can proceed.
const signupAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW = 15 * 60_000;
const RATE_MAX = 8;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(key);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW) {
    signupAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim().slice(0, 200);
}

/**
 * POST /api/auth/signup
 * Create a new account with name + email + 4-digit PIN.
 * No email confirmation — if someone types a fake email, they can't recover PIN.
 *
 * Body: { name, email, pin, membershipType?, skillLevel?, residence? }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { name, email, pin, membershipType, skillLevel, residence } = await request.json();

    // ── Validation ────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !pin?.trim()) {
      return NextResponse.json({ error: 'Name, email, and PIN are required' }, { status: 400 });
    }

    const cleanName = sanitize(name);
    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'Name is too short' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const rateLimitKey = `${ip}:${emailLower}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many signup attempts for this email. Please wait 15 minutes.' },
        { status: 429 }
      );
    }

    const pinClean = pin.trim();
    if (!/^\d{4}$/.test(pinClean)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Reject trivially weak PINs
    if (/^(\d)\1{3}$/.test(pinClean) || pinClean === '1234' || pinClean === '4321') {
      return NextResponse.json({ error: 'PIN is too easy to guess. Choose a stronger PIN.' }, { status: 400 });
    }

    const validMembershipTypes = ['adult', 'family', 'junior'];
    const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'competitive'];
    const validResidences = ['mono', 'other'];

    const memType = validMembershipTypes.includes(membershipType) ? membershipType : 'adult';
    const skill = validSkillLevels.includes(skillLevel) ? skillLevel : 'intermediate';
    const res = validResidences.includes(residence) ? residence : 'mono';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Check email uniqueness ──────────────────────
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailLower)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // ── Hash PIN ────────────────────────────────────
    const pinHash = await bcrypt.hash(pinClean, 12);

    // ── Create profile ──────────────────────────────
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        name: cleanName,
        email: emailLower,
        pin_hash: pinHash,
        role: 'member',
        status: 'active',
        skill_level: skill,
        skill_level_set: skillLevel ? true : false,
        membership_type: memType,
        residence: res,
        avatar: 'tennis-male-1',
        member_since: new Date().toISOString().slice(0, 7), // YYYY-MM
        pin_attempts: 0,
      })
      .select('id')
      .single();

    if (insertError || !profile) {
      console.error('[signup] Insert error:', insertError?.message);
      return NextResponse.json({ error: insertError?.message || 'Failed to create account' }, { status: 500 });
    }

    // ── Create default notification preferences ─────
    await supabase
      .from('notification_preferences')
      .insert({ user_id: profile.id })
      .single();

    // ── Create session ──────────────────────────────
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

    // Log signup
    await logEmail({
      type: 'signup_confirmation',
      recipientEmail: emailLower,
      recipientUserId: profile.id,
      status: 'sent',
      subject: 'New signup (PIN auth)',
      metadata: { source: 'pin-signup', membershipType: memType },
    });

    const response = NextResponse.json({
      success: true,
      token: session?.token,
      user: {
        id: profile.id,
        name: cleanName,
        email: emailLower,
        role: 'member',
        status: 'active',
        skillLevel: skill,
        skillLevelSet: !!skillLevel,
        membershipType: memType,
        familyId: null,
        avatar: 'tennis-male-1',
        residence: res,
        interclubTeam: 'none',
        interclubCaptain: false,
        memberSince: new Date().toISOString().slice(0, 7),
        preferences: {},
        familyMembers: [],
      },
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
