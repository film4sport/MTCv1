import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Detect mobile phones and tablets from User-Agent header.
 * Dashboard is desktop-only — these devices get redirected to mobile PWA.
 */
function isMobileOrTablet(ua: string): boolean {
  // iPad (older UA strings)
  if (/iPad/.test(ua)) return true;
  // iPad pretending to be Mac (iPadOS 13+): "Macintosh" with no real desktop indicators
  // We can't check ontouchend server-side, but iPadOS sends "Macintosh" with "Intel Mac OS X"
  // and a mobile-like viewport — we catch this with a broad Mobile/Android/iPhone check below
  // iPhone / iPod
  if (/iPhone|iPod/.test(ua)) return true;
  // Android phone (has "Mobile") or Android tablet (no "Mobile")
  if (/Android/.test(ua)) return true;
  // Other mobile browsers
  if (/webOS|BlackBerry|Opera Mini|IEMobile|Windows Phone/i.test(ua)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';

  // Dashboard is desktop-only — redirect mobile/tablet to mobile PWA
  if (pathname.startsWith('/dashboard') && isMobileOrTablet(ua)) {
    return NextResponse.redirect(new URL('/mobile-app/index.html', request.url));
  }

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
