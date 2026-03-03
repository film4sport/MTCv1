-- ============================================================
-- MTC Seed Data
-- Run AFTER schema.sql and rls.sql
--
-- Seeds courts, events, announcements, coaching programs,
-- and club settings. User accounts are created manually
-- via Supabase Auth Dashboard.
-- ============================================================

do $$
declare
  v_coach uuid;
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

  -- ─── Events ───────────────────────────────────────────
  -- Special one-off events (synced with data.ts + events.js)
  insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
  values
    ('euchre-tournament', 'Euchre Tournament', '2026-03-14', 'Evening', 'Clubhouse', 'free', 'Free', null, null,
     'Pre-season Euchre tournament! Open to members and guests. Prizes for top teams.', 'social'),

    ('opening-day-bbq', 'Opening Day BBQ & Round Robin', '2026-05-09', '12:30 PM - 3:00 PM', 'All Courts & Clubhouse', 'free', 'Free', null, null,
     'Kick off the 2026 season! BBQ, music, and meet our coaching staff including Mark Taylor. All members, families, and guests welcome.', 'social'),

    ('french-open-rr', 'French Open Round Robin Social', '2026-06-07', '1:00 PM - 4:00 PM', 'All Courts', 'free', 'Free', null, null,
     'Celebrate the French Open with a themed round robin social! Mixed doubles, prizes, and refreshments. All skill levels welcome.', 'social'),

    ('wimbledon-rr', 'Wimbledon Open Round Robin', '2026-07-12', '1:00 PM - 4:00 PM', 'All Courts', 'free', 'Free', null, null,
     'Wimbledon-themed round robin! Whites encouraged. Mixed doubles play, strawberries & cream, and great prizes.', 'social'),

    ('mixed-doubles-tournament-day1', '95+ Mixed Doubles Tournament (Day 1)', '2026-07-18', 'All Day', 'All Courts', 'members', 'Members', 32, 0,
     '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 1 of 2.', 'tournament'),

    ('mixed-doubles-tournament-day2', '95+ Mixed Doubles Tournament (Day 2)', '2026-07-19', 'All Day', 'All Courts', 'members', 'Members', 32, 0,
     '95+ combined age mixed doubles tournament. A+B Draw. Includes lunches at Mono Cliffs Inn and great prizes! Day 2 of 2.', 'tournament'),

    -- Recurring events (first occurrence — dashboard generates the rest dynamically)
    ('mens-round-robin', 'Men''s Round Robin', '2026-05-12', '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', null, null,
     'Weekly men''s round robin every Tuesday morning. All skill levels welcome.', 'roundrobin'),

    ('freedom-55', 'Freedom 55 League', '2026-05-14', '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', null, null,
     'Thursday morning league for the 55+ crowd. Fun and social tennis.', 'roundrobin'),

    ('interclub-league', 'Interclub Competitive League', '2026-05-14', '7:00 PM - 9:30 PM', 'Courts 1-2', 'members', 'Team Only', null, null,
     'A & B teams interclub competitive league. RSVP required.', 'match'),

    ('ladies-round-robin', 'Ladies Round Robin', '2026-05-15', '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', null, null,
     'Weekly ladies round robin every Friday morning. All skill levels welcome.', 'roundrobin'),

    ('friday-mixed', 'Friday Night Mixed Round Robin', '2026-05-15', '6:00 PM - 9:00 PM', 'All Courts', 'members', 'Members', null, null,
     'Mixed doubles round robin every Friday evening. Rotating partners, fun format!', 'roundrobin'),

    ('mark-taylor-classes', 'Mark Taylor Tennis Classes', '2026-05-11', 'Various Times', 'All Courts', 'paid', 'See Details', null, null,
     'Weekly coaching classes by Head Pro Mark Taylor. See Coaching tab for full schedule.', 'lesson')
  on conflict (id) do nothing;

  -- ─── Announcements ────────────────────────────────────
  insert into announcements (id, text, type, date)
  values
    ('a1', 'Courts 3-4 resurfacing completed! Now open for booking.', 'info', '2026-02-01'),
    ('a2', 'Spring membership registration opens March 1st.', 'info', '2026-02-05')
  on conflict (id) do nothing;

  -- ─── Coaching Programs ────────────────────────────────
  -- Only seed if a coach user exists
  if v_coach is not null then
    insert into coaching_programs (id, title, type, coach_id, coach_name, description, court_id, court_name, fee, spots_total, status)
    values
      ('prog-clinic-1', 'Beginner Group Clinic', 'clinic', v_coach, 'Mark Taylor',
       'A 4-week beginner clinic covering grips, strokes, footwork, and match play basics.',
       3, 'Court 3', 120, 8, 'active'),
      ('prog-camp-1', 'Junior Summer Camp', 'camp', v_coach, 'Mark Taylor',
       'Intensive camp for juniors aged 8-14. Daily drills, match play, fitness, and fun activities. Dates TBC.',
       1, 'Court 1', 250, 12, 'active')
    on conflict (id) do nothing;

    -- Program sessions (clinic has confirmed dates, camp TBC)
    insert into program_sessions (program_id, date, time, duration)
    values
      ('prog-clinic-1', '2026-05-10', '10:00 AM', 90),
      ('prog-clinic-1', '2026-05-17', '10:00 AM', 90),
      ('prog-clinic-1', '2026-05-24', '10:00 AM', 90),
      ('prog-clinic-1', '2026-05-31', '10:00 AM', 90);
  end if;

  -- ─── Default gate code ────────────────────────────────
  insert into club_settings (key, value) values ('gate_code', '1234') on conflict do nothing;

end;
$$;
