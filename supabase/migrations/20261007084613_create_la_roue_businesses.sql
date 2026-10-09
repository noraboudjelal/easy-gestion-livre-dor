-- Independent commercial wheels. Administration uses the existing signed
-- admin cookie and server-side Supabase client; never grant client writes.
create table public.wheel_businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (char_length(slug) <= 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  lots text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wheel_businesses_eight_lots check (
    cardinality(lots) = 8 and array_ndims(lots) = 1 and array_lower(lots, 1) = 1
    and array_position(lots, null) is null
    and char_length(lots[1]) <= 60 and lots[1] ~ '[^[:space:]]'
    and char_length(lots[2]) <= 60 and lots[2] ~ '[^[:space:]]'
    and char_length(lots[3]) <= 60 and lots[3] ~ '[^[:space:]]'
    and char_length(lots[4]) <= 60 and lots[4] ~ '[^[:space:]]'
    and char_length(lots[5]) <= 60 and lots[5] ~ '[^[:space:]]'
    and char_length(lots[6]) <= 60 and lots[6] ~ '[^[:space:]]'
    and char_length(lots[7]) <= 60 and lots[7] ~ '[^[:space:]]'
    and char_length(lots[8]) <= 60 and lots[8] ~ '[^[:space:]]'
  )
);

alter table public.wheel_businesses enable row level security;
revoke all on table public.wheel_businesses from public, anon, authenticated;
grant select, insert, update on table public.wheel_businesses to service_role;
comment on table public.wheel_businesses is 'La Roue: accessed only by server routes. No anon/authenticated policies by design; existing admin session authorizes writes.';
