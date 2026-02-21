import { createBrowserClient } from '@supabase/ssr';

// Fallback placeholders prevent createBrowserClient from throwing during
// Next.js static page generation (build step) when env vars aren't set.
// The client won't work without real keys, but pages that use it are all
// 'use client' + force-dynamic, so the placeholder is never hit at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * True if Supabase env vars are properly configured.
 * Use this to gate Supabase calls and show user-facing errors.
 */
export const isSupabaseConfigured =
  !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder');

// Runtime validation: warn if env vars are missing (only in browser, not during SSG)
if (typeof window !== 'undefined' && !isSupabaseConfigured) {
  console.error('[MTC] Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
