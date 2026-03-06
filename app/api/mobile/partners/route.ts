import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, isRateLimited } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    const { data: partners, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    // Build response in camelCase matching mobile PWA shape
    const result = (partners || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      ntrp: p.ntrp,
      skillLevel: p.skill_level,
      availability: p.availability,
      matchType: p.match_type,
      date: p.date,
      time: p.time,
      avatar: p.avatar,
      message: p.message,
      status: p.status,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.id;

  if (isRateLimited(userId, 5)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { matchType, skillLevel, availability, message } = body;

    const validTypes = ['singles', 'doubles', 'mixed', 'any'];
    const type = validTypes.includes(matchType) ? matchType : 'any';

    const supabase = getAdminClient();
    const partnerId = `pr-${Date.now()}-${userId.slice(0, 8)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Fetch full profile for ntrp + avatar (auth-helper only returns name/role/email)
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('ntrp, skill_level, avatar')
      .eq('id', userId)
      .single();

    const { error } = await supabase.from('partners').insert({
      id: partnerId,
      user_id: userId,
      name: authResult.name || 'Member',
      ntrp: fullProfile?.ntrp || 3.0,
      skill_level: skillLevel || fullProfile?.skill_level || 'intermediate',
      availability: availability || 'Anytime',
      match_type: type,
      date: todayStr,
      time: timeStr,
      avatar: fullProfile?.avatar || 'tennis-male-1',
      message: message || null,
      status: 'available',
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to create partner request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: partnerId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Join/match a partner request — sets status to 'matched' */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.id;

  try {
    const { partnerId } = await request.json();
    if (!partnerId) {
      return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Can't join your own request
    const { data: partner } = await supabase
      .from('partners')
      .select('user_id, status')
      .eq('id', partnerId)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner request not found' }, { status: 404 });
    }
    if (partner.user_id === userId) {
      return NextResponse.json({ error: 'Cannot join your own request' }, { status: 400 });
    }
    if (partner.status === 'matched') {
      return NextResponse.json({ error: 'Already matched' }, { status: 409 });
    }

    const { error } = await supabase
      .from('partners')
      .update({
        status: 'matched',
        matched_by: userId,
        matched_at: new Date().toISOString(),
      })
      .eq('id', partnerId);

    if (error) {
      return NextResponse.json({ error: 'Failed to join partner request' }, { status: 500 });
    }

    // Notify the original poster that someone joined (non-critical)
    const notifId = `notif-partner-${partnerId}-${userId.slice(0, 8)}`;
    try {
      await supabase.from('notifications').insert({
        id: notifId,
        user_id: partner.user_id,
        type: 'partner',
        title: 'Partner Matched!',
        body: `${authResult.name} wants to play with you!`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    } catch { /* non-critical */ }

    // Web Push notification (best-effort)
    try {
      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
      const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@monotennisclub.ca';
      if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', partner.user_id);
        if (subs?.length) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const webpush = require('web-push') as {
            setVapidDetails: (s: string, p: string, k: string) => void;
            sendNotification: (sub: object, payload: string) => Promise<void>;
          };
          webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
          const payload = JSON.stringify({
            title: 'Partner Matched!',
            body: `${authResult.name} wants to play with you!`,
            icon: '/mobile-app/icon-192.png',
            badge: '/mobile-app/badge-72.png',
            url: '/mobile-app/index.html',
            tag: 'partner-match-' + partnerId,
          });
          await Promise.allSettled(subs.map(sub =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          ));
        }
      }
    } catch { /* push is best-effort */ }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.id;

  try {
    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Only allow deleting own requests
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', partnerId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove partner request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
