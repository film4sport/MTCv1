import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for PIN auth session cookie (set on login)
  const sessionToken = request.cookies.get('mtc-session')?.value;

  // Protect dashboard routes — redirect to login if no session cookie
  if (pathname.startsWith('/dashboard') && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users from login page to dashboard
  if (pathname === '/login' && sessionToken) {
    const isReset = request.nextUrl.searchParams.get('reset') === 'true';
    if (!isReset) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
