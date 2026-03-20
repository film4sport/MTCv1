alter table public.partners
  add column if not exists client_request_id text;

create unique index if not exists partners_user_id_client_request_id_key
  on public.partners (user_id, client_request_id)
  where client_request_id is not null;
