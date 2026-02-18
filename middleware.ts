import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase auth tokens in cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase isn't configured, allow all requests
    return NextResponse.next();
  }

  // Supabase stores auth tokens in cookies with the project ref
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const accessToken = request.cookies.get(`sb-${projectRef}-auth-token`)?.value;

  const isAuthenticated = !!accessToken;

  // Protect dashboard routes — redirect to login if not authenticated
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users from login page to dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
