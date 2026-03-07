import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, isRateLimited } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';
import crypto from 'crypto';

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

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

    // Notifications (non-blocking, best-effort)
    const notifBody = `Looking for ${type === 'any' ? 'any match type' : type} on ${todayStr} at ${timeStr}.`;
    try {
      // Bell notification
      await supabase.from('notifications').insert({
        id: generateId('n'), user_id: userId, type: 'partner',
        title: 'Partner Request Posted', body: notifBody,
        timestamp: new Date().toISOString(), read: false,
      });
      // Push notification
      await sendPushToUser(supabase, userId, {
        title: 'Partner Request Posted', body: notifBody,
        type: 'partner', tag: `partner-post-${partnerId}`,
      });
      // Email confirmation
      const token = request.headers.get('authorization')?.slice(7);
      if (token && authResult.email) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://monotennisclub.com';
        fetch(`${siteUrl}/api/notify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            recipientEmail: authResult.email, recipientName: authResult.name,
            recipientUserId: userId,
            subject: 'Partner Request Posted — Mono Tennis Club',
            heading: 'Partner Request Posted',
            body: `Your partner request is live! Looking for ${type === 'any' ? 'any match type' : type} on ${todayStr} at ${timeStr}. You'll be notified when someone responds.`,
            ctaText: 'View Requests', ctaUrl: `${siteUrl}/mobile-app/index.html#partners`,
            logType: 'partner_request',
          }),
        }).catch(() => { /* email is best-effort */ });
      }
    } catch { /* notifications are non-critical */ }

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
      .select('user_id, status, name')
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

    // Notify both parties about the match (non-critical)
    const now = new Date().toISOString();
    const matchBody = `${authResult.name} wants to play with you!`;
    const joinerBody = `You joined ${partner.name || 'a member'}'s partner request!`;
    try {
      // Bell + push for joiner (confirmation)
      await supabase.from('notifications').insert({
        id: generateId('n'), user_id: userId, type: 'partner',
        title: 'Partner Match Joined', body: joinerBody,
        timestamp: now, read: false,
      });
      await sendPushToUser(supabase, userId, {
        title: 'Partner Match Joined', body: joinerBody,
        type: 'partner', tag: `partner-joined-${partnerId}`,
      });
      // Bell notification for poster
      await supabase.from('notifications').insert({
        id: generateId('n'), user_id: partner.user_id, type: 'partner',
        title: 'Partner Matched!', body: matchBody,
        timestamp: now, read: false,
      });
      // Push notification (shared utility — checks preferences, cleans expired subs)
      await sendPushToUser(supabase, partner.user_id, {
        title: 'Partner Matched!', body: matchBody,
        type: 'partner', tag: `partner-match-${partnerId}`,
      });
      // Email to poster
      const token = request.headers.get('authorization')?.slice(7);
      if (token) {
        const { data: posterProfile } = await supabase
          .from('profiles').select('email, name').eq('id', partner.user_id).single();
        if (posterProfile?.email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://monotennisclub.com';
          fetch(`${siteUrl}/api/notify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              recipientEmail: posterProfile.email, recipientName: posterProfile.name || partner.name,
              recipientUserId: partner.user_id,
              subject: 'Partner Match — Someone Wants to Play!',
              heading: 'Partner Match Found',
              body: `${authResult.name} wants to play with you! Open the app to confirm your match.`,
              ctaText: 'View Match', ctaUrl: `${siteUrl}/mobile-app/index.html#partners`,
              logType: 'partner_match',
            }),
          }).catch(() => { /* email is best-effort */ });
        }
      }
    } catch { /* notifications are non-critical */ }

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

    // Fetch partner before deleting (to notify matched person if any)
    const { data: partner } = await supabase
      .from('partners')
      .select('user_id, matched_by, name, match_type')
      .eq('id', partnerId)
      .eq('user_id', userId)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner request not found or not yours' }, { status: 404 });
    }

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', partnerId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove partner request' }, { status: 500 });
    }

    // If someone had matched, notify them (non-critical)
    if (partner.matched_by) {
      try {
        const cancelBody = `${authResult.name || 'A member'} cancelled their partner request.`;
        await supabase.from('notifications').insert({
          id: generateId('n'), user_id: partner.matched_by, type: 'partner',
          title: 'Partner Request Cancelled', body: cancelBody,
          timestamp: new Date().toISOString(), read: false,
        });
        await sendPushToUser(supabase, partner.matched_by, {
          title: 'Partner Request Cancelled', body: cancelBody,
          type: 'partner', tag: `partner-cancel-${partnerId}`,
        });
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
