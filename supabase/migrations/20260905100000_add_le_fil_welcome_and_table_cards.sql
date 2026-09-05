create table if not exists public.event_fil_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  welcome_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_fil_settings_welcome_message_length
    check (welcome_message is null or char_length(welcome_message) <= 500)
);

alter table public.event_fil_settings enable row level security;

revoke all on table public.event_fil_settings from anon, authenticated;
grant select on table public.event_fil_settings to anon, authenticated;

create policy "Le Fil settings are publicly readable"
  on public.event_fil_settings
  for select
  to anon, authenticated
  using (true);

create table if not exists public.event_table_cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  table_number text not null,
  table_name text,
  guest_names text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_table_cards_table_number_required
    check (char_length(btrim(table_number)) between 1 and 40),
  constraint event_table_cards_table_name_length
    check (table_name is null or char_length(table_name) <= 100),
  constraint event_table_cards_guest_count
    check (cardinality(guest_names) <= 100),
  constraint event_table_cards_position_non_negative
    check (position >= 0)
);

create index if not exists event_table_cards_event_position_idx
  on public.event_table_cards(event_id, position, created_at);

alter table public.event_table_cards enable row level security;

revoke all on table public.event_table_cards from anon, authenticated;
