import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery', 'signup', etc.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.monotennisclub.com';

  if (!code) {
    // No code — redirect to login
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const redirectUrl = type === 'recovery'
    ? `${siteUrl}/login?reset=true`
    : `${siteUrl}/dashboard`;

  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Code was invalid or expired — redirect to login with error
    return NextResponse.redirect(`${siteUrl}/login?error=expired_link`);
  }

  return response;
}
