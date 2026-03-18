-- Add RLS policies for bookings, conversations, and messages
-- These tables previously had no RLS, allowing any authenticated user to read/write all rows

-- ─── Bookings RLS ─────────────────────────────────────
alter table bookings enable row level security;
create policy "bookings_select" on bookings for select using (true);
create policy "bookings_insert_own" on bookings for insert
  with check (user_id = auth.uid());
create policy "bookings_update_own" on bookings for update
  using (user_id = auth.uid() or is_admin());

-- ─── Conversations RLS ─────────────────────────────────
alter table conversations enable row level security;
create policy "conversations_select_own" on conversations for select
  using (member_a = auth.uid() or member_b = auth.uid());
create policy "conversations_insert_own" on conversations for insert
  with check (member_a = auth.uid() or member_b = auth.uid());
create policy "conversations_update_own" on conversations for update
  using (member_a = auth.uid() or member_b = auth.uid());

-- ─── Messages RLS ──────────────────────────────────────
alter table messages enable row level security;
create policy "messages_select_own" on messages for select
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "messages_insert_own" on messages for insert
  with check (from_id = auth.uid());
create policy "messages_update_own" on messages for update
  using (to_id = auth.uid());
