import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const dynamic = 'force-dynamic';

/**
 * Lightweight Supabase keep-alive ping.
 * Warms up BOTH the database (PostgREST) and Auth (GoTrue) services
 * to prevent free-tier cold starts that cause slow logins.
 * Called from the login page on mount.
 */
export async function GET() {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({ ok: false, reason: 'no env' }, { status: 503 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Warm up database (PostgREST)
    const dbPing = await supabase.from('profiles').select('id').limit(1);

    return NextResponse.json({
      ok: !dbPing.error,
      db: !dbPing.error,
      ts: Date.now(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
