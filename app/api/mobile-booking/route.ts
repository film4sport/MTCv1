import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED — Use /api/mobile/bookings instead.
 * This route is kept only for backward compatibility with cached service workers.
 * Returns 301 guidance to update to the new endpoint.
 */

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint has moved to /api/mobile/bookings', redirect: '/api/mobile/bookings' },
    { status: 410 }
  );
}

export async function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint has moved to /api/mobile/bookings', redirect: '/api/mobile/bookings' },
    { status: 410 }
  );
}
