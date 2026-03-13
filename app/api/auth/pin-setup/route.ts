import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rate limit: 5 attempts per 15 min per IP
const setupAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW = 15 * 60_000;
const RATE_MAX = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = setupAttempts.get(key);
  if (!entry || now - entry.firstAttempt > RATE_WINDOW) {
    setupAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

/**
 * POST /api/auth/pin-setup
 * Set or change PIN for an existing user (migration from old auth).
 * Also used to change PIN when already logged in (pass session token).
 *
 * Body: { email: string, pin: string, token?: string (session token for already-logged-in users) }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });
    }

    const { email, pin, token } = await request.json();

    if (!pin?.trim()) {
      return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    }

    const pinClean = pin.trim();
    if (!/^\d{4}$/.test(pinClean)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Reject trivially weak PINs
    if (/^(\d)\1{3}$/.test(pinClean) || pinClean === '1234' || pinClean === '4321') {
      return NextResponse.json({ error: 'PIN is too easy to guess. Choose a stronger PIN.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let userId: string;

    if (token) {
      // Logged-in user changing their PIN — validate session
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', token)
        .single();

      if (!session) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      userId = session.user_id;
    } else if (email?.trim()) {
      // Migration flow: user enters email, then sets PIN
      const emailLower = email.trim().toLowerCase();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, pin_hash')
        .eq('email', emailLower)
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
      }

      // Only allow setup if PIN is not already set (migration)
      // If PIN is already set, user must use forgot-pin flow to change it
      if (profile.pin_hash) {
        return NextResponse.json({ error: 'PIN already set. Use "Forgot PIN" to change it.' }, { status: 409 });
      }
      userId = profile.id;
    } else {
      return NextResponse.json({ error: 'Email or session token required' }, { status: 400 });
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pinClean, 12);

    // Save PIN hash, reset attempts
    const { error } = await supabase
      .from('profiles')
      .update({
        pin_hash: pinHash,
        pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_code: null,
        pin_reset_expires: null,
      })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
    }

    // If this was a migration (no token), auto-create a session so user is logged in
    if (!token) {
      const userAgent = request.headers.get('user-agent') || '';
      const { data: session } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          user_agent: userAgent.slice(0, 500),
          ip_address: ip.slice(0, 45),
        })
        .select('token')
        .single();

      // Fetch user profile for response
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, skill_level, skill_level_set, membership_type, family_id, avatar, residence, interclub_team, interclub_captain, member_since, preferences')
        .eq('id', userId)
        .single();

      // Fetch family members
      let familyMembers: Array<{ id: string; name: string; type: string; skillLevel: string; avatar: string }> = [];
      if (profile?.family_id) {
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
        token: session?.token,
        user: profile ? {
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
        } : undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
