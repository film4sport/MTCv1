import { createClient } from '@supabase/supabase-js';

export const SESSION_COOKIE_NAME = 'mtc-session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_PLACEHOLDER = '__cookie_session__';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
}

export function isPlaceholderSessionToken(token: string | null | undefined) {
  return !token || token === SESSION_PLACEHOLDER;
}

export function extractSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (!isPlaceholderSessionToken(bearerToken)) {
      return bearerToken;
    }
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookieName = `${SESSION_COOKIE_NAME}=`;
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieName));

  if (!cookie) return null;
  const token = cookie.slice(cookieName.length).trim();
  return token || null;
}

export function isSessionExpired(createdAt: string | null | undefined) {
  if (!createdAt) return true;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return true;
  return createdMs + SESSION_TTL_SECONDS * 1000 <= Date.now();
}

export async function resolveSession(request: Request) {
  const token = extractSessionToken(request);
  if (!token) return { token: null, session: null };

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('token, user_id, created_at')
    .eq('token', token)
    .single();

  if (!session) {
    return { token, session: null };
  }

  if (isSessionExpired(session.created_at)) {
    await supabase.from('sessions').delete().eq('token', token);
    return { token, session: null };
  }

  return { token, session };
}
