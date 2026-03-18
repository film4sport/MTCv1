-- Add individual indexes on conversations.member_a and conversations.member_b
-- The existing composite index (member_a, member_b) doesn't help OR queries
-- used in RLS policies: WHERE member_a = uid OR member_b = uid
-- Individual indexes allow Postgres to use BitmapOr scan for these queries.

create index if not exists idx_conversations_member_a on conversations(member_a);
create index if not exists idx_conversations_member_b on conversations(member_b);
