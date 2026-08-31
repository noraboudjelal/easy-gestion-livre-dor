create extension if not exists pgcrypto;

create table if not exists public.maison_homes (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Notre maison' check (char_length(name) between 1 and 80),
  share_token text not null unique check (share_token ~ '^[a-f0-9]{48}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.maison_items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.maison_homes(id) on delete cascade,
  kind text not null check (kind in ('groceries', 'todos')),
  label text not null check (char_length(label) between 1 and 120),
  created_at timestamptz not null default now()
);

create index if not exists maison_items_home_kind_created_idx
  on public.maison_items(home_id, kind, created_at);

alter table public.maison_homes enable row level security;
alter table public.maison_items enable row level security;

revoke all on table public.maison_homes from anon, authenticated;
revoke all on table public.maison_items from anon, authenticated;

create or replace function public.broadcast_maison_item_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  maison_topic text;
begin
  select 'maison:' || share_token
    into maison_topic
    from public.maison_homes
   where id = coalesce(new.home_id, old.home_id);

  if maison_topic is not null then
    perform realtime.send(
      jsonb_build_object('changed', true),
      'items-changed',
      maison_topic,
      false
    );
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.broadcast_maison_item_change() from public, anon, authenticated;

drop trigger if exists maison_items_broadcast_change on public.maison_items;
create trigger maison_items_broadcast_change
after insert or update or delete on public.maison_items
for each row execute function public.broadcast_maison_item_change();
