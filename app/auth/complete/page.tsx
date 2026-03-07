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
    try {
      const redirect = localStorage.getItem('mtc-auth-redirect');
      if (redirect) {
        localStorage.removeItem('mtc-auth-redirect');
        window.location.replace(redirect);
        return;
      }
    } catch {
      // localStorage unavailable — fall through to dashboard
    }
    // Default: desktop dashboard
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
