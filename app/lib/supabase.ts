import { createBrowserClient } from '@supabase/ssr';

// Fallback placeholders prevent createBrowserClient from throwing during
// Next.js static page generation (build step) when env vars aren't set.
// The client won't work without real keys, but pages that use it are all
// 'use client' + force-dynamic, so the placeholder is never hit at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
