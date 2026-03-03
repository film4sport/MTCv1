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
