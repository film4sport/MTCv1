alter table public.bookings
  add column if not exists client_request_id text;

create unique index if not exists bookings_user_id_client_request_id_key
  on public.bookings (user_id, client_request_id)
  where client_request_id is not null;

create unique index if not exists booking_participants_booking_id_participant_id_key
  on public.booking_participants (booking_id, participant_id);

create or replace function public.create_booking_atomic(
  p_booking_id text,
  p_court_id integer,
  p_court_name text,
  p_date date,
  p_time text,
  p_user_id uuid,
  p_user_name text,
  p_booked_for text,
  p_match_type text,
  p_duration integer,
  p_guest_name text,
  p_client_request_id text
)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_start_minutes integer;
  requested_end_minutes integer;
  existing_booking public.bookings%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('booking:' || p_court_id::text || ':' || p_date::text));

  if p_client_request_id is not null then
    select *
      into existing_booking
      from public.bookings
     where user_id = p_user_id
       and client_request_id = p_client_request_id
     limit 1;

    if found then
      return next existing_booking;
      return;
    end if;
  end if;

  requested_start_minutes :=
    (extract(hour from to_timestamp(p_time, 'HH12:MI AM'))::integer * 60) +
    extract(minute from to_timestamp(p_time, 'HH12:MI AM'))::integer;
  requested_end_minutes := requested_start_minutes + (greatest(coalesce(p_duration, 1), 1) * 30);

  if exists (
    select 1
      from public.court_blocks cb
     where cb.block_date = p_date
       and (cb.court_id = p_court_id or cb.court_id is null)
       and (
         cb.time_start is null
         or cb.time_end is null
         or (
           requested_start_minutes <
             ((extract(hour from to_timestamp(cb.time_end, 'HH12:MI AM'))::integer * 60) +
              extract(minute from to_timestamp(cb.time_end, 'HH12:MI AM'))::integer)
           and
           ((extract(hour from to_timestamp(cb.time_start, 'HH12:MI AM'))::integer * 60) +
            extract(minute from to_timestamp(cb.time_start, 'HH12:MI AM'))::integer) < requested_end_minutes
         )
       )
  ) then
    raise exception 'COURT_BLOCKED';
  end if;

  if exists (
    select 1
      from public.bookings b
     where b.court_id = p_court_id
       and b.date = p_date
       and b.status = 'confirmed'
       and requested_start_minutes <
         (
           ((extract(hour from to_timestamp(b.time, 'HH12:MI AM'))::integer * 60) +
            extract(minute from to_timestamp(b.time, 'HH12:MI AM'))::integer)
           + (greatest(coalesce(b.duration, 1), 1) * 30)
         )
       and
         ((extract(hour from to_timestamp(b.time, 'HH12:MI AM'))::integer * 60) +
          extract(minute from to_timestamp(b.time, 'HH12:MI AM'))::integer) < requested_end_minutes
  ) then
    raise exception 'BOOKING_CONFLICT';
  end if;

  insert into public.bookings (
    id,
    court_id,
    court_name,
    date,
    time,
    user_id,
    user_name,
    booked_for,
    guest_name,
    match_type,
    duration,
    type,
    status,
    client_request_id
  ) values (
    p_booking_id,
    p_court_id,
    p_court_name,
    p_date,
    p_time,
    p_user_id,
    p_user_name,
    p_booked_for,
    p_guest_name,
    p_match_type,
    p_duration,
    'court',
    'confirmed',
    p_client_request_id
  )
  returning * into existing_booking;

  return next existing_booking;
end;
$$;
