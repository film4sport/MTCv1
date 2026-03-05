import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const dynamic = 'force-dynamic';

/**
 * Lightweight Supabase keep-alive ping.
 * Called every 4 minutes by Vercel Cron to prevent free-tier cold starts
 * that cause 10-second login delays.
 */
export async function GET() {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({ ok: false, reason: 'no env' }, { status: 503 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return NextResponse.json({ ok: !error, ts: Date.now() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
