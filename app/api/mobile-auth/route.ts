import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Mobile PWA Auth Proxy
 * Validates credentials against Supabase and returns user data.
 * The mobile PWA (at /mobile-app/) calls this instead of its old Express server.
 */

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
            .select('name, role, membership_type, family_id, interclub_team')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            // Fetch family members if family membership
            let familyMembers: { id: string; name: string; type: string; skillLevel: string; avatar: string; birthYear: number | null }[] = [];
            if (profile.family_id) {
              const { data: members } = await supabase
                .from('family_members')
                .select('*')
                .eq('family_id', profile.family_id)
                .order('created_at');
              if (members) {
                familyMembers = members.map((m: Record<string, unknown>) => ({
                  id: m.id as string,
                  name: m.name as string,
                  type: m.type as string,
                  skillLevel: (m.skill_level as string) || 'intermediate',
                  avatar: (m.avatar as string) || 'tennis-male-1',
                  birthYear: (m.birth_year as number) || null,
                }));
              }
            }

            return NextResponse.json({
              role: profile.role || 'member',
              name: profile.name || emailLower.split('@')[0],
              email: emailLower,
              userId: data.user.id,
              accessToken: data.session.access_token,
              membershipType: profile.membership_type || 'adult',
              familyId: profile.family_id || null,
              interclubTeam: profile.interclub_team || 'none',
              familyMembers,
            });
          }
        }
      } catch {
        // Supabase connection failed
      }
    }

    // No valid credentials found
    return NextResponse.json({ error: 'unknown_account' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
