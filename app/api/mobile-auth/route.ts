import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';

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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // Try Supabase auth first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      try {
        const supabase = createBrowserClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password });

        if (!error && data.user) {
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
            });
          }
        }
      } catch {
        // Supabase failed — fall through to demo credentials
      }
    }

    // Fallback to demo credentials
    const account = DEMO_CREDENTIALS[emailLower];
    if (!account) {
      return NextResponse.json({ error: 'unknown_account' }, { status: 401 });
    }
    if (account.password !== password) {
      return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
    }

    return NextResponse.json({ role: account.role, name: account.name, email: emailLower });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
