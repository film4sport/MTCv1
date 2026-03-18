import { NextResponse } from 'next/server';

/** Returns public Supabase config for mobile PWA client-side auth */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  return NextResponse.json(
    { supabaseUrl, supabaseAnonKey },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
