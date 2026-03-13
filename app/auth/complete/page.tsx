'use client';

import { useEffect } from 'react';

/**
 * /auth/complete — Client-side redirect router after OAuth callback.
 *
 * The server-side /auth/callback can't read localStorage, so when the
 * Supabase OAuth flow strips the ?next= query param, the callback
 * redirects here. This page checks localStorage for a mobile PWA
 * redirect hint and navigates accordingly.
 */
export default function AuthCompletePage() {
  useEffect(() => {
    // 1. Check explicit redirect hint (set by mobile PWA before magic link)
    try {
      const redirect = localStorage.getItem('mtc-auth-redirect');
      if (redirect) {
        localStorage.removeItem('mtc-auth-redirect');
        const separator = redirect.includes('?') ? '&' : '?';
        window.location.replace(redirect + separator + 'auth=callback');
        return;
      }
    } catch {
      // localStorage unavailable — fall through
    }

    // 2. Auto-detect mobile/tablet: send to mobile PWA instead of dashboard
    const ua = navigator.userAgent || '';
    const isIPhone = /iPhone/.test(ua);
    const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
    const isAndroidMobile = /Android/.test(ua) && /Mobile/.test(ua);
    const isAndroidTablet = /Android/.test(ua) && !/Mobile/.test(ua);
    if (isIPhone || isIPad || isAndroidMobile || isAndroidTablet) {
      window.location.replace('/mobile-app/index.html?auth=callback');
      return;
    }

    // 3. Default: desktop dashboard
    window.location.replace('/dashboard');
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1f12',
        color: '#e8e4d9',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <p>Signing you in...</p>
    </div>
  );
}
