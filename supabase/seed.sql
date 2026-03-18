-- ============================================================
-- MTC Seed Data
-- Run AFTER schema.sql and migrations are applied.
-- Safe to re-run: uses ON CONFLICT DO NOTHING throughout.
--
-- Seeds courts, events (full season of recurring + specials),
-- announcements, coaching programs (if coach exists), and
-- club settings.
-- ============================================================

do $$
declare
  v_coach uuid;
  d date;
  dow integer;
  ds text;
begin
  -- Look up a coach user (if one exists) for coaching programs
  select id into v_coach from profiles where role = 'coach' limit 1;

  -- ─── Courts ───────────────────────────────────────────
  insert into courts (id, name, floodlight, status)
  values
    (1, 'Court 1', true, 'available'),
    (2, 'Court 2', true, 'available'),
    (3, 'Court 3', false, 'available'),
    (4, 'Court 4', false, 'available')
  on conflict (id) do nothing;

  -- ─── Special Events ──────────────────────────────────
  insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
  values
    ('euchre-tournament', 'Euchre Tournament', '2026-03-14', 'Evening', 'Clubhouse', 'free', 'Free', 40, 0,
     'Pre-season Euchre tournament! Open to members and guests. Prizes for top teams.', 'social'),

    ('opening-day-bbq', 'Opening Day BBQ & Round Robin', '2026-05-09', '12:30 PM - 3:00 PM', 'All Courts & Clubhouse', 'free', 'Free', 60, 0,
     'Kick off the 2026 season! BBQ, music, and meet our coaching staff including Mark Taylor. All members, families, and guests welcome.', 'social'),

    ('french-open-rr', 'French Open Round Robin Social', '2026-06-07', '1:00 PM - 4:00 PM', 'All Courts', 'free', 'Free', 40, 0,
     'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.', 'social'),

    ('wimbledon-rr', 'Wimbledon Open Round Robin', '2026-07-12', '1:00 PM - 4:00 PM', 'All Courts', 'free', 'Free', 40, 0,
     'Wimbledon-themed round robin! Whites encouraged. Mixed doubles play, strawberries & cream, and great prizes.', 'social'),

    ('mixed-doubles-tournament-day1', '95+ Mixed Doubles Tournament (Day 1)', '2026-07-18', 'All Day', 'All Courts', 'paid', '$180/Team', 32, 0,
     '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 1 of 2.', 'tournament'),

    ('mixed-doubles-tournament-day2', '95+ Mixed Doubles Tournament (Day 2)', '2026-07-19', 'All Day', 'All Courts', 'paid', '$180/Team', 32, 0,
     '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 2 of 2.', 'tournament'),

    ('junior-summer-camp', 'Junior Summer Camp', '2026-07-01', 'Dates TBA', 'All Courts', 'paid', 'See Details', 12, 0,
     'Intensive camp for juniors aged 8-14 with Mark Taylor. Daily drills, match play, fitness, and fun activities. Exact dates coming soon!', 'lesson')
  on conflict (id) do nothing;

  -- ─── Recurring Events (May 10 – Oct 31, 2026 season) ─
  -- Generates ~125 weekly events matching dashboard data.ts templates.
  d := '2026-05-10'::date;
  while d <= '2026-10-31'::date loop
    dow := extract(dow from d);
    ds := to_char(d, 'YYYY-MM-DD');

    -- Tuesday: Men's Round Robin
    if dow = 2 then
      insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
      values ('mens-rr-' || ds, 'Men''s Round Robin', d, '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', 16, 0,
              'Weekly men''s round robin every Tuesday morning. All skill levels welcome.', 'social')
      on conflict (id) do nothing;
    end if;

    -- Thursday: Freedom 55 League
    if dow = 4 then
      insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
      values ('freedom-55-' || ds, 'Freedom 55 League', d, '9:00 AM - 11:00 AM', 'All Courts', 'members', 'Members', 16, 0,
              'Thursday morning league for the 55+ crowd. Fun and social tennis.', 'social')
      on conflict (id) do nothing;
    end if;

    -- Thursday: Interclub Competitive League
    if dow = 4 then
      insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
      values ('interclub-' || ds, 'Interclub Competitive League', d, '7:00 PM - 9:30 PM', 'All Courts', 'members', 'Team Only', 12, 0,
              'A & B teams interclub competitive league. RSVP required for team selection.', 'match')
      on conflict (id) do nothing;
    end if;

    -- Friday: Ladies Round Robin
    if dow = 5 then
      insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
      values ('ladies-rr-' || ds, 'Ladies Round Robin', d, '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', 16, 0,
              'Weekly ladies round robin every Friday morning. All skill levels welcome.', 'social')
      on conflict (id) do nothing;
    end if;

    -- Friday: Friday Night Mixed Round Robin
    if dow = 5 then
      insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
      values ('friday-mixed-' || ds, 'Friday Night Mixed Round Robin', d, '6:00 PM - 9:00 PM', 'All Courts', 'members', 'Members', 24, 0,
              'Mixed doubles round robin every Friday evening. Rotating partners, fun format!', 'social')
      on conflict (id) do nothing;
    end if;

    d := d + 1;
  end loop;

  -- ─── Announcements ────────────────────────────────────
  insert into announcements (id, text, type, date)
  values
    ('a1', 'Courts 3-4 resurfacing completed! Now open for booking.', 'info', '2026-03-01'),
    ('a2', 'Spring 2026 season begins May 1st — register now!', 'info', '2026-03-04')
  on conflict (id) do nothing;

  -- ─── Coaching Programs ────────────────────────────────
  -- Only inserts if a coach profile exists in the DB.
  -- If no coach yet: create the Mark Taylor account in Supabase Auth,
  -- set role='coach' in profiles, then re-run this seed.
  if v_coach is not null then
    insert into coaching_programs (id, title, type, coach_id, coach_name, description, court_id, court_name, fee, spots_total, status)
    values
      ('prog-clinic-1', 'Beginner Group Clinic', 'clinic', v_coach, 'Mark Taylor',
       'A 4-week beginner clinic covering grips, strokes, footwork, and match play basics. Perfect for new players looking to build a solid foundation.',
       3, 'Court 3', 120, 8, 'active'),
      ('prog-camp-1', 'Junior Summer Camp Week 1', 'camp', v_coach, 'Mark Taylor',
       '5-day intensive camp for juniors aged 8-14. Daily drills, match play, fitness, and fun activities. All skill levels welcome.',
       1, 'Court 1', 250, 12, 'active')
    on conflict (id) do nothing;

    -- Program sessions
    insert into program_sessions (program_id, date, time, duration)
    values
      ('prog-clinic-1', '2026-05-10', '10:00 AM', 90),
      ('prog-clinic-1', '2026-05-17', '10:00 AM', 90),
      ('prog-clinic-1', '2026-05-24', '10:00 AM', 90),
      ('prog-clinic-1', '2026-05-31', '10:00 AM', 90),
      ('prog-camp-1',   '2026-07-06', '9:30 AM',  180),
      ('prog-camp-1',   '2026-07-07', '9:30 AM',  180),
      ('prog-camp-1',   '2026-07-08', '9:30 AM',  180),
      ('prog-camp-1',   '2026-07-09', '9:30 AM',  180),
      ('prog-camp-1',   '2026-07-10', '9:30 AM',  180);
  end if;

  -- ─── Club Settings ───────────────────────────────────
  insert into club_settings (key, value) values ('gate_code', '1234') on conflict do nothing;

end;
$$;
