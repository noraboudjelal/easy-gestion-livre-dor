begin;

-- Independent tables: no change to existing catalogue/product access policies.
create table public.catalog_statistics_members (
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (catalog_id, user_id)
);
create index catalog_statistics_members_user_idx on public.catalog_statistics_members(user_id, catalog_id);
alter table public.catalog_statistics_members enable row level security;
revoke all on public.catalog_statistics_members from public, anon, authenticated;
grant select on public.catalog_statistics_members to authenticated;
grant all on public.catalog_statistics_members to service_role;
create policy statistics_members_own on public.catalog_statistics_members for select to authenticated
  using (user_id = (select auth.uid()));

-- Pseudonymous data. Never expose visitor histories to anonymous users or merchants.
create table public.catalog_statistics_events (
  event_id uuid primary key,
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  product_id uuid references public.catalog_products(id) on delete set null,
  kind text not null check (kind in ('visit','product_click','whatsapp','phone','instagram','facebook','tiktok','social_other')),
  visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
  session_id uuid not null,
  consent_version integer not null check (consent_version = 1),
  received_at timestamptz not null default now(),
  check (kind = 'product_click' or product_id is null)
);
create index catalog_statistics_period_idx on public.catalog_statistics_events(catalog_id, received_at);
create index catalog_statistics_retention_idx on public.catalog_statistics_events(received_at);
create index catalog_statistics_product_idx on public.catalog_statistics_events(product_id) where product_id is not null;
create index catalog_statistics_visitor_idx on public.catalog_statistics_events(catalog_id, visitor_hash, received_at);
create unique index catalog_statistics_visit_session_idx on public.catalog_statistics_events(catalog_id, session_id) where kind = 'visit';
alter table public.catalog_statistics_events enable row level security;
revoke all on public.catalog_statistics_events from public, anon, authenticated;
grant all on public.catalog_statistics_events to service_role;

create function public.record_catalog_statistic(p_event_id uuid, p_catalog_id uuid, p_product_id uuid,
  p_kind text, p_visitor_hash text, p_session_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_kind not in ('visit','product_click','whatsapp','phone','instagram','facebook','tiktok','social_other') then
    raise exception 'Invalid event';
  end if;
  if not exists (select 1 from public.catalogs where id = p_catalog_id) then return false; end if;
  if p_kind = 'product_click' and not exists (
    select 1 from public.catalog_products where id = p_product_id and catalog_id = p_catalog_id
  ) then return false; end if;
  if p_kind <> 'product_click' and p_product_id is not null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_catalog_id::text || p_visitor_hash, 0));
  if (select count(*) from public.catalog_statistics_events where catalog_id = p_catalog_id
    and visitor_hash = p_visitor_hash and received_at > now() - interval '1 hour') >= 120 then return false; end if;
  insert into public.catalog_statistics_events(event_id,catalog_id,product_id,kind,visitor_hash,session_id,consent_version)
    values (p_event_id,p_catalog_id,p_product_id,p_kind,p_visitor_hash,p_session_id,1)
    on conflict do nothing;
  return found;
end $$;
revoke all on function public.record_catalog_statistic(uuid,uuid,uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.record_catalog_statistic(uuid,uuid,uuid,text,text,uuid) to service_role;

create function public.catalog_statistics_report(p_catalog_id uuid, p_from date, p_to date, p_bucket text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if p_bucket not in ('day','week','month','year') or p_from > p_to or p_to - p_from > 366
    or p_from < (now() - interval '13 months')::date or p_to > (now() at time zone 'Europe/Paris')::date then
    raise exception 'Invalid statistics range';
  end if;
  with selected as materialized (
    select * from public.catalog_statistics_events
    where catalog_id = p_catalog_id and received_at >= (p_from::timestamp at time zone 'Europe/Paris')
      and received_at < ((p_to + 1)::timestamp at time zone 'Europe/Paris')
      and received_at >= now() - interval '13 months'
  ), series as (
    select date_trunc(p_bucket, d)::date as period from generate_series(p_from::timestamp,p_to::timestamp,interval '1 day') d
    group by 1
  ), evolution as (
    select date_trunc(p_bucket,received_at at time zone 'Europe/Paris')::date as period,
      count(*) filter(where kind='visit') as visits,
      count(distinct visitor_hash) filter(where kind='visit') as unique_visitors,
      count(*) filter(where kind='product_click') as product_clicks
    from selected group by 1
  ), clicked as (
    select e.product_id, coalesce(p.name,'Produit supprimé') as name, count(*) as clicks
    from selected e left join public.catalog_products p on p.id=e.product_id and p.catalog_id=p_catalog_id
    where e.kind='product_click' group by e.product_id,p.name
  ), ranking as (
    select p.id as product_id,p.name,coalesce(c.clicks,0) as clicks from public.catalog_products p
    left join clicked c on c.product_id=p.id where p.catalog_id=p_catalog_id
    union all select * from clicked where product_id is null
  ), contacts as (
    select kind, count(*) as clicks from selected where kind not in ('visit','product_click') group by kind
  )
  select jsonb_build_object(
    'visits',(select count(*) from selected where kind='visit'),
    'uniqueVisitors',(select count(distinct visitor_hash) from selected where kind='visit'),
    'productClicks',(select count(*) from selected where kind='product_click'),
    'contactClicks',(select count(*) from selected where kind not in ('visit','product_click')),
    'series',coalesce((select jsonb_agg(jsonb_build_object('period',s.period,'visits',coalesce(e.visits,0),
      'uniqueVisitors',coalesce(e.unique_visitors,0),'productClicks',coalesce(e.product_clicks,0)) order by s.period)
      from series s left join evolution e using(period)),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(to_jsonb(r) order by clicks desc,name) from ranking r),'[]'::jsonb),
    'contacts',coalesce((select jsonb_object_agg(kind,clicks) from contacts),'{}'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.catalog_statistics_report(uuid,date,date,text) from public, anon, authenticated;
grant execute on function public.catalog_statistics_report(uuid,date,date,text) to service_role;

create function public.purge_catalog_statistics() returns bigint
language plpgsql security invoker set search_path = '' as $$
declare removed bigint;
begin
  delete from public.catalog_statistics_events where received_at < now() - interval '13 months';
  get diagnostics removed = row_count;
  return removed;
end $$;
revoke all on function public.purge_catalog_statistics() from public, anon, authenticated;
grant execute on function public.purge_catalog_statistics() to service_role;

-- Supabase: enable pg_cron before applying, or configure the protected HTTP purge job.
do $$ begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.schedule('lehnova-statistics-retention','17 2 * * *','select public.purge_catalog_statistics()');
  end if;
end $$;
commit;
