import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// In-memory rate limiter: max 20 error reports per IP per minute
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.firstAttempt > 60_000) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > 20;
}

/**
 * POST /api/errors — Client-side error logging endpoint.
 * Stores errors in Supabase `error_logs` table (if it exists), otherwise logs to server console.
 * Body: { message: string, context?: string, stack?: string, url?: string, userAgent?: string }
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { message, context, stack, url, userAgent } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    // Sanitize inputs
    const clean = (s: unknown, max = 500) => typeof s === 'string' ? s.slice(0, max) : undefined;
    const errorEntry = {
      message: clean(message, 1000),
      context: clean(context),
      stack: clean(stack, 2000),
      url: clean(url),
      user_agent: clean(userAgent, 300),
      ip: ip.slice(0, 45),
      created_at: new Date().toISOString(),
    };

    // Try to persist to Supabase error_logs table
    if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
      const { error } = await supabase.from('error_logs').insert(errorEntry);
      if (error) {
        // Table may not exist yet — fall back to console logging
        console.error('[MTC Error Report]', errorEntry.message, errorEntry.context || '');
      }
    } else {
      console.error('[MTC Error Report]', errorEntry.message, errorEntry.context || '');
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
