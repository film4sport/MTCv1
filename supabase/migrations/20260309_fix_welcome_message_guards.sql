-- Fix welcome message: skip admin self-welcome + idempotency guard + conversation dedup
create or replace function send_welcome_message(new_user_id uuid, new_user_name text)
returns void as $$
declare
  v_admin_id uuid;
  v_conv_id integer;
  v_msg text;
begin
  -- Find first admin
  select id into v_admin_id from public.profiles where role = 'admin' order by created_at asc limit 1;
  if v_admin_id is null then return; end if;

  -- Don't send welcome to the admin themselves
  if v_admin_id = new_user_id then return; end if;

  -- Skip if welcome already sent (idempotency guard)
  perform 1 from public.messages where id = 'welcome-' || new_user_id::text;
  if found then return; end if;

  -- Build welcome message
  v_msg := 'Welcome to Mono Tennis Club, ' || split_part(new_user_name, ' ', 1) || '!' ||
    E'\n\nExplore the app — book courts, find partners, and check out upcoming events. See you on the court!';

  -- Reuse existing conversation if one exists (e.g. admin already messaged this member)
  select id into v_conv_id from public.conversations
    where (member_a = v_admin_id and member_b = new_user_id)
       or (member_a = new_user_id and member_b = v_admin_id)
    limit 1;

  if v_conv_id is null then
    -- Create new conversation
    insert into public.conversations (member_a, member_b, last_message, last_timestamp)
    values (v_admin_id, new_user_id, v_msg, now())
    returning id into v_conv_id;
  else
    -- Update existing conversation's last message
    update public.conversations set last_message = v_msg, last_timestamp = now() where id = v_conv_id;
  end if;

  -- Insert message
  insert into public.messages (id, conversation_id, from_id, from_name, to_id, to_name, text, timestamp, read)
  values (
    'welcome-' || new_user_id::text,
    v_conv_id,
    v_admin_id,
    'Mono Tennis Club',
    new_user_id,
    new_user_name,
    v_msg,
    now(),
    false
  );
end;
$$ language plpgsql security definer set search_path = '';
