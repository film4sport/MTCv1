import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient, cachedJson, withAuth } from '../auth-helper';
import { sendPushToUser } from '../../lib/push';
import crypto from 'crypto';

/** List all coaching programs with enrollment counts and user enrollment status */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const userId = authResult.id;

    // Fetch all programs
    const { data: programs, error } = await supabase
      .from('coaching_programs')
      .select('*')
      .order('title', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });

    // Fetch enrollment counts per program
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('program_id, member_id');

    const enrollmentsByProgram: Record<string, string[]> = {};
    (enrollments || []).forEach(e => {
      if (!enrollmentsByProgram[e.program_id]) enrollmentsByProgram[e.program_id] = [];
      enrollmentsByProgram[e.program_id].push(e.member_id);
    });

    const result = (programs || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coach: p.coach,
      schedule: p.schedule,
      spotsTotal: p.spots_total,
      spotsFilled: (enrollmentsByProgram[p.id] || []).length,
      price: p.price,
      level: p.level,
      enrolled: (enrollmentsByProgram[p.id] || []).includes(userId),
    }));

    return cachedJson(result, 300, { swr: 60 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Enroll or withdraw from a coaching program */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { programId, action } = await request.json();
    if (!programId || !['enroll', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Missing programId or invalid action' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const memberId = authResult.id;

    if (action === 'enroll') {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('program_id', programId)
        .eq('member_id', memberId)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
      }

      // Check spot availability + get program details for notifications
      const { data: program } = await supabase
        .from('coaching_programs')
        .select('spots_total, title, coach_id, coach')
        .eq('id', programId)
        .single();

      if (program) {
        const { count } = await supabase
          .from('program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', programId);

        if (count !== null && program.spots_total && count >= program.spots_total) {
          return NextResponse.json({ error: 'Program is full' }, { status: 409 });
        }
      }

      const { error } = await supabase.from('program_enrollments').insert({
        program_id: programId,
        member_id: memberId,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Enrollment notifications (non-blocking, best-effort)
      if (program?.title) {
        const notifTitle = `Enrolled in ${program.title}`;
        const notifBody = `Enrollment confirmed. See you on the court!`;
        const notifId = `n-${crypto.randomUUID().slice(0, 8)}`;
        try {
          // Bell notification
          await supabase.from('notifications').insert({
            id: notifId, user_id: memberId, type: 'program',
            title: notifTitle, body: notifBody,
            timestamp: new Date().toISOString(), read: false,
          });
          // Push notification
          await sendPushToUser(supabase, memberId, {
            title: notifTitle, body: notifBody,
            type: 'program', tag: `program-enroll-${programId}`,
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
                recipientUserId: memberId,
                subject: `Enrollment Confirmed — ${program.title}`,
                heading: 'Enrollment Confirmed',
                body: `You're enrolled in ${program.title}! See you on the court.`,
                ctaText: 'View Programs', ctaUrl: `${siteUrl}/mobile-app/index.html#events`,
                logType: 'program_enrollment',
              }),
            }).catch(() => { /* email is best-effort */ });
          }
          // Welcome message from coach
          if (program.coach_id) {
            const timestamp = new Date().toISOString();
            const convFilter = `and(member_a.eq.${program.coach_id},member_b.eq.${memberId}),and(member_a.eq.${memberId},member_b.eq.${program.coach_id})`;
            const { data: conv } = await supabase
              .from('conversations').select('id').or(convFilter).single();
            let conversationId: number;
            if (conv) {
              conversationId = conv.id;
            } else {
              const { data: newConv } = await supabase
                .from('conversations')
                .insert({ member_a: program.coach_id, member_b: memberId, last_message: `Welcome to ${program.title}!`, last_timestamp: timestamp })
                .select('id').single();
              if (!newConv) throw new Error('Failed to create conversation');
              conversationId = newConv.id;
            }
            await supabase.from('messages').insert({
              id: `msg-${crypto.randomUUID().slice(0, 8)}`, conversation_id: conversationId,
              from_id: program.coach_id, from_name: program.coach || 'Coach',
              to_id: memberId, to_name: authResult.name || 'Member',
              text: `Welcome to ${program.title}! Your enrollment is confirmed. Looking forward to seeing you on the court!`,
              timestamp, read: false,
            });
            await supabase.from('conversations').update({ last_message: `Welcome to ${program.title}!`, last_timestamp: timestamp }).eq('id', conversationId);
          }
        } catch { /* notifications are non-critical */ }
      }

      return NextResponse.json({ success: true, action: 'enrolled' });
    } else {
      // Withdraw
      const { error } = await supabase.from('program_enrollments')
        .delete()
        .eq('program_id', programId)
        .eq('member_id', memberId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Withdrawal notifications (non-blocking, best-effort)
      try {
        const { data: prog } = await supabase
          .from('coaching_programs').select('title, coach_id, coach').eq('id', programId).single();
        if (prog?.title) {
          const wTitle = `Withdrawn from ${prog.title}`;
          const wBody = `You have been withdrawn from ${prog.title}.`;
          // Bell + push for member
          await supabase.from('notifications').insert({
            id: `n-${crypto.randomUUID().slice(0, 8)}`, user_id: memberId, type: 'program',
            title: wTitle, body: wBody, timestamp: new Date().toISOString(), read: false,
          });
          await sendPushToUser(supabase, memberId, {
            title: wTitle, body: wBody, type: 'program', tag: `program-withdraw-${programId}`,
          });
          // Message to coach
          if (prog.coach_id) {
            const timestamp = new Date().toISOString();
            const convFilter = `and(member_a.eq.${prog.coach_id},member_b.eq.${memberId}),and(member_a.eq.${memberId},member_b.eq.${prog.coach_id})`;
            const { data: conv } = await supabase
              .from('conversations').select('id').or(convFilter).single();
            let conversationId: number;
            if (conv) {
              conversationId = conv.id;
            } else {
              const { data: newConv } = await supabase
                .from('conversations')
                .insert({ member_a: memberId, member_b: prog.coach_id, last_message: wTitle, last_timestamp: timestamp })
                .select('id').single();
              if (!newConv) throw new Error('conv');
              conversationId = newConv.id;
            }
            await supabase.from('messages').insert({
              id: `msg-${crypto.randomUUID().slice(0, 8)}`, conversation_id: conversationId,
              from_id: memberId, from_name: authResult.name || 'Member',
              to_id: prog.coach_id, to_name: prog.coach || 'Coach',
              text: `${authResult.name || 'A member'} has withdrawn from ${prog.title}.`,
              timestamp, read: false,
            });
            await supabase.from('conversations').update({ last_message: wTitle, last_timestamp: timestamp }).eq('id', conversationId);
          }
        }
      } catch { /* non-critical */ }

      return NextResponse.json({ success: true, action: 'withdrawn' });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Update a coaching program (admin/coach only) */
export const PATCH = withAuth(async (_user, request, supabase) => {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing program id' }, { status: 400 });
  }

  // Map camelCase fields to snake_case DB columns
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.coach !== undefined) dbUpdates.coach_name = updates.coach;
  if (updates.coachId !== undefined) dbUpdates.coach_id = updates.coachId;
  if (updates.spotsTotal !== undefined) dbUpdates.spots_total = parseInt(updates.spotsTotal);
  if (updates.price !== undefined) dbUpdates.fee = parseFloat(updates.price);
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.courtId !== undefined) dbUpdates.court_id = parseInt(updates.courtId);
  if (updates.courtName !== undefined) dbUpdates.court_name = updates.courtName;
  if (updates.type !== undefined) dbUpdates.type = updates.type;

  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('coaching_programs')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}, { role: 'admin|coach' });

/** Delete a coaching program (admin only) */
export const DELETE = withAuth(async (_user, request, supabase) => {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Missing program id' }, { status: 400 });
  }

  // Check for active enrollments and notify before deletion
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('member_id')
    .eq('program_id', id);

  const { data: program } = await supabase
    .from('coaching_programs')
    .select('title')
    .eq('id', id)
    .single();

  if (enrollments && enrollments.length > 0 && program) {
    const timestamp = new Date().toISOString();
    const notifications = enrollments.map((e: { member_id: string }) => ({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      user_id: e.member_id,
      type: 'program',
      title: `${program.title} Cancelled`,
      body: `The program "${program.title}" has been cancelled. If you were charged, a refund will be processed.`,
      timestamp,
      read: false,
    }));
    await supabase.from('notifications').insert(notifications);

    // Push notifications (fire and forget)
    for (const e of enrollments) {
      sendPushToUser(supabase, e.member_id, {
        title: `${program.title} Cancelled`,
        body: 'The program has been cancelled.',
        type: 'program',
        tag: `program-cancel-${id}`,
      }).catch(() => {});
    }
  }

  // CASCADE will clean up program_sessions and program_enrollments
  const { error } = await supabase
    .from('coaching_programs')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}, { role: 'admin' });
