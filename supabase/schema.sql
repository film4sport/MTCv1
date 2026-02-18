-- ============================================================
-- MTC Supabase Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- ─── Profiles ───────────────────────────────────────────
-- Extends Supabase auth.users with app-specific fields
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'coach', 'admin')),
  ntrp numeric(2,1) check (ntrp >= 1.0 and ntrp <= 7.0),
  member_since text,
  avatar text,
  created_at timestamptz default now()
);

-- ─── Courts ─────────────────────────────────────────────
create table if not exists courts (
  id integer primary key,
  name text not null,
  floodlight boolean not null default false,
  status text not null default 'available' check (status in ('available', 'in-use', 'reserved', 'maintenance')),
  current_user_name text,
  ends_at text,
  starts_in integer
);

-- ─── Bookings ───────────────────────────────────────────
create table if not exists bookings (
  id text primary key,
  court_id integer not null references courts(id),
  court_name text not null,
  date date not null,
  time text not null,
  user_id uuid not null references profiles(id),
  user_name text not null,
  guest_name text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  type text not null default 'court' check (type in ('court', 'partner', 'ball-machine', 'program')),
  program_id text,
  created_at timestamptz default now()
);

-- ─── Booking Participants ───────────────────────────────
create table if not exists booking_participants (
  id serial primary key,
  booking_id text not null references bookings(id) on delete cascade,
  participant_id uuid not null references profiles(id),
  participant_name text not null
);

-- ─── Events ─────────────────────────────────────────────
create table if not exists events (
  id text primary key,
  title text not null,
  date date not null,
  time text not null,
  location text not null,
  badge text not null default 'members' check (badge in ('free', 'members', 'paid')),
  price text not null,
  spots_total integer,
  spots_taken integer default 0,
  description text not null,
  type text not null check (type in ('social', 'match', 'roundrobin', 'lesson', 'tournament')),
  created_at timestamptz default now()
);

-- ─── Event Attendees ────────────────────────────────────
create table if not exists event_attendees (
  id serial primary key,
  event_id text not null references events(id) on delete cascade,
  user_name text not null,
  unique(event_id, user_name)
);

-- ─── Partners ───────────────────────────────────────────
create table if not exists partners (
  id text primary key,
  user_id uuid not null references profiles(id),
  name text not null,
  ntrp numeric(2,1) not null,
  availability text not null,
  match_type text not null check (match_type in ('singles', 'doubles', 'mixed', 'any')),
  date text not null,
  time text not null,
  avatar text,
  status text not null default 'available' check (status in ('available', 'matched')),
  created_at timestamptz default now()
);

-- ─── Conversations ──────────────────────────────────────
create table if not exists conversations (
  id serial primary key,
  member_a uuid not null references profiles(id),
  member_b uuid not null references profiles(id),
  last_message text,
  last_timestamp timestamptz,
  unique(member_a, member_b)
);

-- ─── Messages ───────────────────────────────────────────
create table if not exists messages (
  id text primary key,
  conversation_id integer not null references conversations(id) on delete cascade,
  from_id uuid not null references profiles(id),
  from_name text not null,
  to_id uuid not null references profiles(id),
  to_name text not null,
  text text not null,
  timestamp timestamptz not null default now(),
  read boolean not null default false
);

-- ─── Announcements ──────────────────────────────────────
create table if not exists announcements (
  id text primary key,
  text text not null,
  type text not null default 'info' check (type in ('info', 'warning', 'urgent')),
  date date not null,
  created_at timestamptz default now()
);

-- ─── Announcement Dismissals ────────────────────────────
create table if not exists announcement_dismissals (
  id serial primary key,
  announcement_id text not null references announcements(id) on delete cascade,
  user_id uuid not null references profiles(id),
  unique(announcement_id, user_id)
);

-- ─── Notifications ──────────────────────────────────────
create table if not exists notifications (
  id text primary key,
  user_id uuid not null references profiles(id),
  type text not null check (type in ('booking', 'event', 'partner', 'message', 'payment', 'announcement')),
  title text not null,
  body text not null,
  timestamp timestamptz not null default now(),
  read boolean not null default false
);

-- ─── Payments ───────────────────────────────────────────
create table if not exists payments (
  id serial primary key,
  user_id uuid not null references profiles(id),
  user_name text not null,
  balance numeric(10,2) not null default 0
);

-- ─── Payment Entries ────────────────────────────────────
create table if not exists payment_entries (
  id text primary key,
  payment_id integer not null references payments(id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('charge', 'payment')),
  created_at timestamptz default now()
);

-- ─── Coaching Programs ──────────────────────────────────
create table if not exists coaching_programs (
  id text primary key,
  title text not null,
  type text not null check (type in ('clinic', 'camp')),
  coach_id uuid not null references profiles(id),
  coach_name text not null,
  description text not null,
  court_id integer not null references courts(id),
  court_name text not null,
  fee numeric(10,2) not null default 0,
  spots_total integer not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'completed')),
  created_at timestamptz default now()
);

-- ─── Program Sessions ───────────────────────────────────
create table if not exists program_sessions (
  id serial primary key,
  program_id text not null references coaching_programs(id) on delete cascade,
  date date not null,
  time text not null,
  duration integer not null -- minutes
);

-- ─── Program Enrollments ────────────────────────────────
create table if not exists program_enrollments (
  id serial primary key,
  program_id text not null references coaching_programs(id) on delete cascade,
  member_id uuid not null references profiles(id),
  enrolled_at timestamptz default now(),
  unique(program_id, member_id)
);

-- ─── Notification Preferences ───────────────────────────
create table if not exists notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  bookings boolean not null default true,
  events boolean not null default true,
  payments boolean not null default true,
  partners boolean not null default true,
  messages boolean not null default true,
  programs boolean not null default true
);

-- ─── Indexes ────────────────────────────────────────────
create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_date on bookings(date);
create index if not exists idx_bookings_court_date on bookings(court_id, date);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_user_read on notifications(user_id, read);
create index if not exists idx_partners_status on partners(status);
create index if not exists idx_program_enrollments_member on program_enrollments(member_id);

-- ─── Auto-create profile on signup ──────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, member_since)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    to_char(now(), 'YYYY-MM')
  );

  -- Create default notification preferences
  insert into public.notification_preferences (user_id)
  values (new.id);

  -- Create payment record
  insert into public.payments (user_id, user_name, balance)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 0);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger: create profile when a new auth user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
