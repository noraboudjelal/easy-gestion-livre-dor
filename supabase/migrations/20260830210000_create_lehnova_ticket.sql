-- Lehnova Ticket is deliberately isolated from the existing catalogue schema.
create extension if not exists pgcrypto with schema extensions;

create table public.ticket_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_queues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.ticket_businesses(id) on delete cascade,
  is_open boolean not null default true,
  current_number integer not null default 0 check (current_number >= 0),
  last_issued_number integer not null default 0 check (last_issued_number >= 0),
  updated_at timestamptz not null default now(),
  check (current_number <= last_issued_number)
);

create table public.ticket_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.ticket_businesses(id) on delete cascade,
  queue_id uuid not null references public.ticket_queues(id) on delete cascade,
  number integer not null check (number > 0),
  status text not null default 'waiting' check (status in ('waiting', 'called', 'served', 'cancelled')),
  resume_token_hash text not null check (char_length(resume_token_hash) = 64),
  issued_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz,
  unique (queue_id, number)
);

create index ticket_businesses_owner_id_idx on public.ticket_businesses(owner_id);
create index ticket_entries_business_status_number_idx on public.ticket_entries(business_id, status, number);
create index ticket_entries_token_idx on public.ticket_entries(business_id, resume_token_hash, issued_at desc);
create unique index ticket_entries_one_active_device_idx
  on public.ticket_entries(business_id, resume_token_hash)
  where status in ('waiting', 'called');

alter table public.ticket_businesses enable row level security;
alter table public.ticket_queues enable row level security;
alter table public.ticket_entries enable row level security;

revoke all on table public.ticket_businesses from anon, authenticated;
revoke all on table public.ticket_queues from anon, authenticated;
revoke all on table public.ticket_entries from anon, authenticated;

grant select on table public.ticket_businesses to authenticated;
grant select on table public.ticket_queues to anon, authenticated;
grant select on table public.ticket_entries to authenticated;

create policy "ticket owners read their businesses"
  on public.ticket_businesses for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "ticket queue state is public"
  on public.ticket_queues for select to anon, authenticated
  using (true);

create policy "ticket owners read their entries"
  on public.ticket_entries for select to authenticated
  using (
    exists (
      select 1 from public.ticket_businesses business
      where business.id = ticket_entries.business_id
        and business.owner_id = (select auth.uid())
    )
  );

create or replace function public.ticket_token_hash(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;

revoke all on function public.ticket_token_hash(text) from public, anon, authenticated;

create or replace function public.ticket_public_state(p_slug text, p_resume_token text default null)
returns table (
  business_id uuid,
  business_name text,
  is_open boolean,
  current_number integer,
  last_issued_number integer,
  ticket_number integer,
  ticket_status text,
  people_ahead bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.ticket_businesses%rowtype;
  v_queue public.ticket_queues%rowtype;
  v_ticket public.ticket_entries%rowtype;
  v_hash text;
begin
  select * into v_business from public.ticket_businesses where slug = p_slug;
  if not found then return; end if;

  select * into v_queue from public.ticket_queues where ticket_queues.business_id = v_business.id;
  if not found then return; end if;

  if p_resume_token is not null and char_length(p_resume_token) between 32 and 512 then
    v_hash := public.ticket_token_hash(p_resume_token);
    select * into v_ticket
    from public.ticket_entries
    where ticket_entries.business_id = v_business.id
      and resume_token_hash = v_hash
      and status in ('waiting', 'called')
    order by issued_at desc
    limit 1;
  end if;

  return query
  select
    v_business.id,
    v_business.name,
    v_queue.is_open,
    v_queue.current_number,
    v_queue.last_issued_number,
    v_ticket.number,
    v_ticket.status,
    case when v_ticket.id is null or v_ticket.status <> 'waiting' then 0::bigint else (
      select count(*) from public.ticket_entries entry
      where entry.queue_id = v_queue.id
        and entry.status = 'waiting'
        and entry.number < v_ticket.number
    ) end;
end;
$$;

create or replace function public.ticket_take_or_resume(p_slug text, p_resume_token text)
returns table (
  business_id uuid,
  business_name text,
  is_open boolean,
  current_number integer,
  last_issued_number integer,
  ticket_number integer,
  ticket_status text,
  people_ahead bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.ticket_businesses%rowtype;
  v_queue public.ticket_queues%rowtype;
  v_ticket public.ticket_entries%rowtype;
  v_hash text;
begin
  if p_resume_token is null or char_length(p_resume_token) not between 32 and 512 then
    raise exception 'Jeton appareil invalide.' using errcode = '22023';
  end if;

  select * into v_business from public.ticket_businesses where slug = p_slug;
  if not found then raise exception 'Commerce introuvable.' using errcode = 'P0002'; end if;

  select * into v_queue
  from public.ticket_queues
  where ticket_queues.business_id = v_business.id
  for update;
  if not found then raise exception 'File introuvable.' using errcode = 'P0002'; end if;

  v_hash := public.ticket_token_hash(p_resume_token);
  select * into v_ticket
  from public.ticket_entries
  where ticket_entries.business_id = v_business.id
    and resume_token_hash = v_hash
    and status in ('waiting', 'called')
  order by issued_at desc
  limit 1;

  if v_ticket.id is null then
    if not v_queue.is_open then
      raise exception 'La file est actuellement fermée.' using errcode = 'P0001';
    end if;

    update public.ticket_queues
    set last_issued_number = last_issued_number + 1, updated_at = now()
    where id = v_queue.id
    returning * into v_queue;

    insert into public.ticket_entries (business_id, queue_id, number, resume_token_hash)
    values (v_business.id, v_queue.id, v_queue.last_issued_number, v_hash)
    returning * into v_ticket;
  end if;

  return query
  select
    v_business.id,
    v_business.name,
    v_queue.is_open,
    v_queue.current_number,
    v_queue.last_issued_number,
    v_ticket.number,
    v_ticket.status,
    case when v_ticket.status <> 'waiting' then 0::bigint else (
      select count(*) from public.ticket_entries entry
      where entry.queue_id = v_queue.id
        and entry.status = 'waiting'
        and entry.number < v_ticket.number
    ) end;
end;
$$;

create or replace function public.ticket_merchant_queues()
returns table (
  business_id uuid,
  business_name text,
  business_slug text,
  is_open boolean,
  current_number integer,
  last_issued_number integer,
  waiting_count bigint
)
language sql
security invoker
set search_path = ''
as $$
  select business.id, business.name, business.slug, queue.is_open, queue.current_number,
    queue.last_issued_number,
    (select count(*) from public.ticket_entries entry where entry.queue_id = queue.id and entry.status = 'waiting')
  from public.ticket_businesses business
  join public.ticket_queues queue on queue.business_id = business.id
  where business.owner_id = (select auth.uid())
  order by business.name;
$$;

create or replace function public.ticket_call_next(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_queue public.ticket_queues%rowtype;
  v_next public.ticket_entries%rowtype;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.ticket_businesses
    where id = p_business_id and owner_id = (select auth.uid())
  ) then raise exception 'Accès refusé.' using errcode = '42501'; end if;

  select * into v_queue from public.ticket_queues where business_id = p_business_id for update;
  update public.ticket_entries set status = 'served', served_at = now()
    where queue_id = v_queue.id and status = 'called';

  select * into v_next from public.ticket_entries
    where queue_id = v_queue.id and status = 'waiting'
    order by number limit 1 for update;

  if v_next.id is not null then
    update public.ticket_entries set status = 'called', called_at = now(), served_at = null where id = v_next.id;
    update public.ticket_queues set current_number = v_next.number, updated_at = now() where id = v_queue.id;
  else
    update public.ticket_queues set updated_at = now() where id = v_queue.id;
  end if;
end;
$$;

create or replace function public.ticket_call_previous(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_queue public.ticket_queues%rowtype;
  v_previous public.ticket_entries%rowtype;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.ticket_businesses
    where id = p_business_id and owner_id = (select auth.uid())
  ) then raise exception 'Accès refusé.' using errcode = '42501'; end if;

  select * into v_queue from public.ticket_queues where business_id = p_business_id for update;
  select * into v_previous from public.ticket_entries
    where queue_id = v_queue.id and status = 'served' and number < v_queue.current_number
    order by number desc limit 1 for update;

  if v_previous.id is not null then
    update public.ticket_entries set status = 'waiting', called_at = null where queue_id = v_queue.id and status = 'called';
    update public.ticket_entries set status = 'called', called_at = now(), served_at = null where id = v_previous.id;
    update public.ticket_queues set current_number = v_previous.number, updated_at = now() where id = v_queue.id;
  end if;
end;
$$;

create or replace function public.ticket_set_queue_open(p_business_id uuid, p_is_open boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.ticket_businesses
    where id = p_business_id and owner_id = (select auth.uid())
  ) then raise exception 'Accès refusé.' using errcode = '42501'; end if;

  update public.ticket_queues set is_open = p_is_open, updated_at = now() where business_id = p_business_id;
end;
$$;

revoke all on function public.ticket_public_state(text, text) from public;
revoke all on function public.ticket_take_or_resume(text, text) from public;
revoke all on function public.ticket_merchant_queues() from public;
revoke all on function public.ticket_call_next(uuid) from public;
revoke all on function public.ticket_call_previous(uuid) from public;
revoke all on function public.ticket_set_queue_open(uuid, boolean) from public;

grant execute on function public.ticket_public_state(text, text) to anon, authenticated;
grant execute on function public.ticket_take_or_resume(text, text) to anon, authenticated;
grant execute on function public.ticket_merchant_queues() to authenticated;
grant execute on function public.ticket_call_next(uuid) to authenticated;
grant execute on function public.ticket_call_previous(uuid) to authenticated;
grant execute on function public.ticket_set_queue_open(uuid, boolean) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_queues'
  ) then
    alter publication supabase_realtime add table public.ticket_queues;
  end if;
end $$;

-- Example provisioning after creating a merchant in Supabase Auth:
-- with business as (
--   insert into public.ticket_businesses (owner_id, slug, name)
--   values ('AUTH_USER_UUID', 'nom-du-commerce', 'Nom du commerce') returning id
-- )
-- insert into public.ticket_queues (business_id) select id from business;

