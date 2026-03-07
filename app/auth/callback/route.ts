import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { logEmail } from '../../api/lib/email-logger';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery', 'signup', etc.
  const next = searchParams.get('next'); // custom redirect hint from OAuth flow
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.monotennisclub.com';

  if (!code) {
    // No code — redirect to login
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${siteUrl}/login?error=config`);
  }

  // Determine redirect: recovery → login reset, custom next → that path, default → dashboard
  let redirectUrl: string;
  if (type === 'recovery') {
    redirectUrl = `${siteUrl}/login?reset=true`;
  } else if (next) {
    // Custom redirect from OAuth flow (e.g. /signup?oauth=true)
    redirectUrl = `${siteUrl}${next.startsWith('/') ? next : `/${next}`}`;
  } else {
    redirectUrl = `${siteUrl}/dashboard`;
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Code was invalid or expired — redirect to login with error
    return NextResponse.redirect(`${siteUrl}/login?error=expired_link`);
  }

  // ── OAuth: detect new users who need to complete the signup wizard ──
  // If this is an OAuth login (no type=recovery, no explicit next param),
  // check if the user has a membership_type in their profile.
  // If not, redirect them to the signup wizard to complete registration.
  if (type !== 'recovery' && !next && data?.session?.user) {
    const isOAuthProvider = data.session.user.app_metadata?.provider !== 'email';
    if (isOAuthProvider) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const checkSupabase = serviceKey
        ? createClient(supabaseUrl, serviceKey)
        : createClient(supabaseUrl, supabaseAnonKey);

      const { data: profile } = await checkSupabase
        .from('profiles')
        .select('membership_type')
        .eq('id', data.session.user.id)
        .single();

      // New OAuth user with no membership type → send to signup wizard
      if (!profile?.membership_type) {
        const oauthRedirect = NextResponse.redirect(`${siteUrl}/signup?oauth=true`);
        // Copy session cookies to the new response
        response.cookies.getAll().forEach((cookie) => {
          oauthRedirect.cookies.set(cookie.name, cookie.value);
        });
        return oauthRedirect;
      }
    }
  }

  // ── Post-confirmation: welcome message + notification ──
  // Only for signup confirmations (not password recovery) and NOT OAuth signups
  // (OAuth signups get their welcome message after completing the wizard)
  if (type !== 'recovery' && data?.session?.user) {
    const user = data.session.user;
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Member';

    // Use service role to bypass RLS for server-side operations
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupabase = serviceKey
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, supabaseAnonKey);

    const now = new Date().toISOString();

    // Run all post-confirmation tasks in parallel — one failure shouldn't block others
    const results = await Promise.allSettled([
      // Send welcome message (gate code + greeting via admin conversation)
      adminSupabase.rpc('send_welcome_message', {
        new_user_id: user.id,
        new_user_name: userName,
      }),
      // Create a welcome notification (shows in the bell icon)
      adminSupabase.from('notifications').insert({
        id: `welcome-notif-${user.id}`,
        user_id: user.id,
        type: 'message',
        title: 'Welcome to Mono Tennis Club!',
        body: 'Your email has been confirmed. Check your messages for your court gate code.',
        timestamp: now,
        read: false,
      }),
      // Opening day notification
      adminSupabase.from('notifications').insert({
        id: `opening-day-${user.id}`,
        user_id: user.id,
        type: 'event',
        title: 'Opening Day — May 9th!',
        body: 'Mark your calendar! Mono Tennis Club opens for the 2026 season on May 9th. See you on the courts!',
        timestamp: new Date(Date.parse(now) + 1000).toISOString(),
        read: false,
      }),
      // Under-construction notice (shown until May 9th)
      adminSupabase.from('notifications').insert({
        id: `beta-notice-${user.id}`,
        user_id: user.id,
        type: 'info',
        title: 'App Under Construction',
        body: 'Our app and website are still in development. If you find any bugs or have feedback, please email monotennisclub1@gmail.com — we appreciate your help!',
        timestamp: new Date(Date.parse(now) + 2000).toISOString(),
        read: false,
      }),
      // Log the confirmed email to email_logs
      logEmail({
        type: 'signup_confirmation',
        recipientEmail: user.email,
        recipientUserId: user.id,
        status: 'sent',
        subject: 'Email Confirmed — Mono Tennis Club',
        metadata: { source: 'auth_callback', userName },
      }),
    ]);

    // Log any failures (non-critical — don't block redirect)
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const labels = ['welcome_message', 'welcome_notif', 'opening_day_notif', 'beta_notice_notif', 'email_log'];
        console.error(`[MTC] Post-confirmation ${labels[i]} failed:`, r.reason);
      }
    });
  }

  return response;
}
