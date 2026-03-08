-- Add DELETE RLS policies for conversations and messages
-- Previously no delete policies existed, causing dashboard deletes via Supabase client to silently fail
-- (Dashboard now routes deletes through API admin client, but these policies ensure direct client deletes also work)

-- Conversations: participants can delete their own conversations
create policy "conversations_delete_own" on conversations for delete
  using (member_a = auth.uid() or member_b = auth.uid());

-- Messages: senders can delete their own messages
create policy "messages_delete_own" on messages for delete
  using (from_id = auth.uid());
