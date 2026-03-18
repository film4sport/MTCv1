import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient, resolveSession } from '@/app/lib/session';

// Re-export shared constants & validators so existing route imports don't break
export {
  LIMITS,
  VALID_STATUSES, VALID_MEMBERSHIP_TYPES, VALID_SKILL_LEVELS, VALID_MATCH_TYPES,
  VALID_EXTENDED_MATCH_TYPES, VALID_EVENT_TYPES, VALID_ANNOUNCEMENT_TYPES,
  VALID_COURT_STATUSES, VALID_BLOCK_REASONS, VALID_AUDIENCES, VALID_FAMILY_TYPES,
  VALID_INTERCLUB_TEAMS, VALID_BOOKING_MATCH_TYPES, SETTINGS_KEY_WHITELIST,
  BOOKING_RULES, NOTIFICATION_TYPES,
  isValidUUID, isValidEnum, isValidDate, isInRange, isValidEmail, isValidTime,
  sanitizeInput,
} from '@/app/lib/shared-constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
  interclubTeam: string;
  interclubCaptain: boolean;
}

/**
 * Validate a Bearer token (session token) and return the authenticated user.
 * PIN auth: tokens are from the `sessions` table, not Supabase Auth.
 * Returns the user profile or a NextResponse error.
 */
export async function authenticateMobileRequest(
  request: Request
): Promise<AuthenticatedUser | NextResponse> {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { token, session } = await resolveSession(request);
  if (!token || !session) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Update last_used (fire-and-forget, don't block the request)
  adminClient
    .from('sessions')
    .update({ last_used: new Date().toISOString() })
    .eq('token', token)
    .then(() => {});

  // Fetch user profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('name, role, email, status, interclub_team, interclub_captain')
    .eq('id', session.user_id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  if (profile.status === 'paused') {
    return NextResponse.json({ error: 'Account paused' }, { status: 403 });
  }

  return {
    id: session.user_id,
    email: profile.email,
    role: profile.role,
    name: profile.name,
    interclubTeam: profile.interclub_team || 'none',
    interclubCaptain: profile.interclub_captain === true,
  };
}

/**
 * Get a Supabase admin client (service role, bypasses RLS).
 * Use this for server-side queries in mobile API endpoints.
 */
export function getAdminClient() {
  return createAdminClient();
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
    // Prune expired entries to prevent memory leak (every 100th unique user)
    if (rateLimitMap.size > 100) {
      rateLimitMap.forEach((val, key) => {
        if (now - val.firstAttempt > windowMs) rateLimitMap.delete(key);
      });
    }
    return false;
  }
  entry.count++;
  return entry.count > max;
}

/** Return 400 error with validation message (Next.js-specific, stays here) */
export function validationError(field: string, detail: string) {
  return NextResponse.json({ error: `Invalid ${field}: ${detail}` }, { status: 400 });
}

/**
 * Cache policy tiers:
 *   Public/static  (300s + 60s SWR): events, courts, programs, settings
 *   Semi-static    (60s  + 30s SWR): members, partners, announcements
 *   Personal       (30s,  private):  bookings
 *   Real-time      (no cache):       conversations, notifications
 */

/**
 * Return JSON response with Cache-Control headers.
 * @param data - Response body
 * @param maxAge - max-age in seconds (0 = no-cache)
 * @param options - { public?: boolean, swr?: number (stale-while-revalidate seconds) }
 */
export function cachedJson(
  data: unknown,
  maxAge: number,
  options: { isPublic?: boolean; swr?: number } = {}
) {
  const parts: string[] = [];
  parts.push(options.isPublic ? 'public' : 'private');
  if (maxAge === 0) {
    parts.push('no-cache');
  } else {
    parts.push(`max-age=${maxAge}`);
    if (options.swr) parts.push(`stale-while-revalidate=${options.swr}`);
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': parts.join(', ') },
  });
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
