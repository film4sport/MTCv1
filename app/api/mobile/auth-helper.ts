import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
  interclubTeam: string;
}

/**
 * Validate a Bearer token from the mobile PWA and return the authenticated user.
 * Returns the user profile or a NextResponse error.
 */
export async function authenticateMobileRequest(
  request: Request
): Promise<AuthenticatedUser | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const token = authHeader.slice(7);

  // Verify token with Supabase auth (use anon key for auth verification)
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Fetch user profile using service role (bypasses RLS)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const { data: profile } = await adminClient
    .from('profiles')
    .select('name, role, email, interclub_team')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  return {
    id: user.id,
    email: profile.email,
    role: profile.role,
    name: profile.name,
    interclubTeam: profile.interclub_team || 'none',
  };
}

/**
 * Get a Supabase admin client (service role, bypasses RLS).
 * Use this for server-side queries in mobile API endpoints.
 */
export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
}

/**
 * Sanitize user input — strips HTML tags and dangerous characters, trims, limits length.
 */
export function sanitizeInput(str: string, maxLength = 500): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '').trim().slice(0, maxLength);
}

/**
 * In-memory rate limiter for mobile API routes.
 * Tracks requests per user per window (default: 30 requests per minute).
 */
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 30;

export function isRateLimited(userId: string, max = RATE_MAX, windowMs = RATE_WINDOW_MS): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.firstAttempt > windowMs) {
    rateLimitMap.set(userId, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

/**
 * Route handler wrapper — extracts the repetitive auth + try/catch boilerplate.
 * Usage:
 *   export const GET = withAuth(async (user, request, supabase) => { ... });
 *   export const POST = withAuth(async (user, request, supabase) => { ... }, { role: 'admin' });
 */
type RouteHandler = (
  user: AuthenticatedUser,
  request: Request,
  supabase: ReturnType<typeof getAdminClient>
) => Promise<NextResponse>;

interface WithAuthOptions {
  role?: 'admin' | 'coach' | 'admin|coach';
  rateLimit?: number; // max requests per minute (0 = no limit)
}

export function withAuth(handler: RouteHandler, options?: WithAuthOptions) {
  return async (request: Request): Promise<NextResponse> => {
    const authResult = await authenticateMobileRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    // Role check
    if (options?.role) {
      const allowedRoles = options.role.split('|');
      if (!allowedRoles.includes(authResult.role)) {
        return NextResponse.json(
          { error: `${options.role.replace('|', ' or ')} only` },
          { status: 403 }
        );
      }
    }

    // Rate limit check
    if (options?.rateLimit && isRateLimited(authResult.id, options.rateLimit)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
      const supabase = getAdminClient();
      return await handler(authResult, request, supabase);
    } catch {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  };
}
