import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // 1. Environment variables
  checks.env = {
    ok: !!supabaseUrl && !supabaseUrl.includes('placeholder') && !!supabaseAnonKey,
  };

  // 2. Supabase connectivity
  if (checks.env.ok) {
    const dbStart = Date.now();
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.from('profiles').select('id').limit(1);
      checks.supabase = { ok: !error, ms: Date.now() - dbStart };
      if (error) checks.supabase.error = error.message;
    } catch (err) {
      checks.supabase = { ok: false, ms: Date.now() - dbStart, error: String(err) };
    }
  } else {
    checks.supabase = { ok: false, error: 'Missing env vars' };
  }

  const allOk = Object.values(checks).every(c => c.ok);

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      responseMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
