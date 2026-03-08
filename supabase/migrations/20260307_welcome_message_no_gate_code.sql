-- Remove gate code from welcome message template
-- Gate code will be provided separately after Opening Day
create or replace function send_welcome_message(new_user_id uuid, new_user_name text)
returns void as $$
declare
  v_admin_id uuid;
  v_conv_id integer;
  v_msg text;
begin
  -- Find first admin
  select id into v_admin_id from public.profiles where role = 'admin' limit 1;
  if v_admin_id is null then return; end if;

  -- Build message (gate code provided separately after Opening Day)
  v_msg := 'Welcome to Mono Tennis Club, ' || split_part(new_user_name, ' ', 1) || '!' ||
    E'\n\nYour court gate code will be provided after Opening Day.' ||
    E'\n\nIn the meantime, explore the app — book courts, find partners, and check out upcoming events. See you on the court!';

  -- Create conversation
  insert into public.conversations (member_a, member_b, last_message, last_timestamp)
  values (v_admin_id, new_user_id, v_msg, now())
  returning id into v_conv_id;

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
