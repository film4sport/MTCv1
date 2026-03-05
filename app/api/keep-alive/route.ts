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
    const dbPing = supabase.from('profiles').select('id').limit(1);

    // Warm up auth service (GoTrue) — getSession is a lightweight auth call
    const authPing = supabase.auth.getSession();

    const [db, auth] = await Promise.all([dbPing, authPing]);

    return NextResponse.json({
      ok: !db.error,
      db: !db.error,
      auth: !auth.error,
      ts: Date.now(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
