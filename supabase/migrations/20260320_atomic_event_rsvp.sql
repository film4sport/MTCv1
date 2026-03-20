alter table public.event_attendees
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create unique index if not exists event_attendees_event_id_user_id_key
  on public.event_attendees (event_id, user_id)
  where user_id is not null;

create index if not exists event_attendees_event_id_user_id_lookup
  on public.event_attendees (event_id, user_id);

create or replace function public.toggle_event_rsvp_atomic(
  p_event_id text,
  p_user_id uuid,
  p_user_name text
)
returns table (
  action text,
  title text,
  event_date date,
  spots_total integer,
  spots_taken integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id integer;
  v_title text;
  v_event_date date;
  v_spots_total integer;
  v_spots_taken integer;
begin
  if p_event_id is null or btrim(p_event_id) = '' then
    raise exception 'Missing eventId';
  end if;
  if p_user_id is null then
    raise exception 'Missing userId';
  end if;
  if p_user_name is null or btrim(p_user_name) = '' then
    raise exception 'Missing userName';
  end if;

  perform pg_advisory_xact_lock(hashtext('event-rsvp:' || p_event_id));

  select e.title, e.date, e.spots_total
    into v_title, v_event_date, v_spots_total
  from public.events e
  where e.id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  select ea.id
    into v_existing_id
  from public.event_attendees ea
  where ea.event_id = p_event_id
    and (
      ea.user_id = p_user_id
      or (ea.user_id is null and ea.user_name = p_user_name)
    )
  order by case when ea.user_id = p_user_id then 0 else 1 end
  limit 1
  for update;

  if found then
    delete from public.event_attendees
    where id = v_existing_id;

    select count(*)
      into v_spots_taken
    from public.event_attendees
    where event_id = p_event_id;

    return query
    select 'removed'::text, v_title, v_event_date, v_spots_total, v_spots_taken;
    return;
  end if;

  if v_spots_total is not null and v_spots_total > 0 then
    select count(*)
      into v_spots_taken
    from public.event_attendees
    where event_id = p_event_id;

    if v_spots_taken >= v_spots_total then
      return query
      select 'full'::text, v_title, v_event_date, v_spots_total, v_spots_taken;
      return;
    end if;
  end if;

  insert into public.event_attendees (event_id, user_id, user_name)
  values (p_event_id, p_user_id, p_user_name)
  on conflict (event_id, user_name) do update
    set user_id = coalesce(public.event_attendees.user_id, excluded.user_id),
        user_name = excluded.user_name;

  select count(*)
    into v_spots_taken
  from public.event_attendees
  where event_id = p_event_id;

  return query
  select 'added'::text, v_title, v_event_date, v_spots_total, v_spots_taken;
end;
$$;
