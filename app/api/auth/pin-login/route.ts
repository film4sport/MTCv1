import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rate limit: 10 login attempts per minute per IP
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW = 60_000;
const RATE_MAX = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    if (loginAttempts.size > 200) {
      loginAttempts.forEach((val, k) => {
        if (now - val.firstAttempt > RATE_WINDOW) loginAttempts.delete(k);
      });
    }
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

/**
 * POST /api/auth/pin-login
 * Login with email + 4-digit PIN.
 * Returns session token + user profile on success.
 *
 * Body: { email: string, pin: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });
    }

    const { email, pin } = await request.json();

    if (!email?.trim() || !pin?.trim()) {
      return NextResponse.json({ error: 'Email and PIN required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();
    const pinClean = pin.trim();

    if (!/^\d{4}$/.test(pinClean)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      // Don't reveal whether email exists — same 401 as "not found"
      return NextResponse.json({ error: 'Invalid email or PIN' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, pin_hash, pin_attempts, pin_locked_until, skill_level, skill_level_set, membership_type, family_id, avatar, residence, interclub_team, interclub_captain, member_since, preferences')
      .eq('email', emailLower)
      .single();

    if (profileError || !profile) {
      // Don't reveal whether email exists
      return NextResponse.json({ error: 'Invalid email or PIN' }, { status: 401 });
    }

    // Check account status
    if (profile.status === 'paused') {
      return NextResponse.json({ error: 'Account is paused. Contact club admin.' }, { status: 403 });
    }

    // Check lockout (5 wrong attempts → 15 min lockout)
    if (profile.pin_locked_until) {
      const lockExpiry = new Date(profile.pin_locked_until);
      if (lockExpiry > new Date()) {
        const minutesLeft = Math.ceil((lockExpiry.getTime() - Date.now()) / 60_000);
        return NextResponse.json({
          error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        }, { status: 429 });
      }
      // Lock expired — reset attempts
      await supabase.from('profiles').update({ pin_attempts: 0, pin_locked_until: null }).eq('id', profile.id);
    }

    // Check if user has a PIN set
    if (!profile.pin_hash) {
      // Existing member migrating from old auth — needs to set PIN first
      return NextResponse.json({
        error: 'PIN not set',
        needsPinSetup: true,
        userId: profile.id,
        name: profile.name,
      }, { status: 403 });
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pinClean, profile.pin_hash);

    if (!pinValid) {
      const newAttempts = (profile.pin_attempts || 0) + 1;
      const updates: Record<string, unknown> = { pin_attempts: newAttempts };

      if (newAttempts >= 5) {
        updates.pin_locked_until = new Date(Date.now() + 15 * 60_000).toISOString();
        await supabase.from('profiles').update(updates).eq('id', profile.id);
        return NextResponse.json({
          error: 'Too many wrong attempts. Account locked for 15 minutes.',
        }, { status: 429 });
      }

      await supabase.from('profiles').update(updates).eq('id', profile.id);
      return NextResponse.json({
        error: 'Invalid email or PIN',
        attemptsRemaining: 5 - newAttempts,
      }, { status: 401 });
    }

    // PIN correct — reset attempts & create session
    await supabase.from('profiles').update({ pin_attempts: 0, pin_locked_until: null }).eq('id', profile.id);

    const userAgent = request.headers.get('user-agent') || '';

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: profile.id,
        user_agent: userAgent.slice(0, 500),
        ip_address: ip.slice(0, 45),
      })
      .select('token')
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Fetch family members if applicable
    let familyMembers: Array<{ id: string; name: string; type: string; skillLevel: string; avatar: string }> = [];
    if (profile.family_id) {
      const { data: members } = await supabase
        .from('family_members')
        .select('id, name, type, skill_level, avatar')
        .eq('family_id', profile.family_id)
        .order('name');
      if (members) {
        familyMembers = members.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          skillLevel: m.skill_level,
          avatar: m.avatar || 'tennis-male-1',
        }));
      }
    }

    return NextResponse.json({
      success: true,
      token: session.token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        skillLevel: profile.skill_level,
        skillLevelSet: profile.skill_level_set,
        membershipType: profile.membership_type,
        familyId: profile.family_id,
        avatar: profile.avatar,
        residence: profile.residence,
        interclubTeam: profile.interclub_team || 'none',
        interclubCaptain: profile.interclub_captain || false,
        memberSince: profile.member_since,
        preferences: profile.preferences || {},
        familyMembers,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
