-- Auto-cleanup welcome-only conversations where member never replied
-- Call: SELECT cleanup_stale_welcomes(7); -- deletes welcome-only convos older than 7 days
create or replace function cleanup_stale_welcomes(older_than_days integer default 7)
returns integer as $$
declare
  v_deleted integer := 0;
  v_conv record;
begin
  for v_conv in
    select c.id from public.conversations c
    where c.last_timestamp < now() - (older_than_days || ' days')::interval
      and (select count(*) from public.messages m where m.conversation_id = c.id) = 1
      and exists (
        select 1 from public.messages m
        where m.conversation_id = c.id and m.id like 'welcome-%'
      )
  loop
    delete from public.messages where conversation_id = v_conv.id;
    delete from public.conversations where id = v_conv.id;
    v_deleted := v_deleted + 1;
  end loop;
  return v_deleted;
end;
$$ language plpgsql security definer set search_path = '';
