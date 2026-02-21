import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API: Returns booked court slots per day for a given month.
 * No auth required — exposes court + time only, no personal data.
 * Used by the landing page calendar to show real court activity.
 *
 * GET /api/public-calendar?year=2026&month=5
 * Returns: { "2026-05-09": [{ court: "Court 1", time: "10:00 AM" }, ...], ... }
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || '', 10);
  const month = parseInt(searchParams.get('month') || '', 10); // 1-12

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({});
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('bookings')
    .select('date, court_name, time')
    .eq('status', 'confirmed')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('time', { ascending: true });

  if (error) {
    return NextResponse.json({});
  }

  // Group by date — only expose court name + time (no user info)
  const slots: Record<string, { court: string; time: string }[]> = {};
  (data || []).forEach((row: { date: string; court_name: string; time: string }) => {
    if (!slots[row.date]) slots[row.date] = [];
    slots[row.date].push({ court: row.court_name, time: row.time });
  });

  return NextResponse.json(slots, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
