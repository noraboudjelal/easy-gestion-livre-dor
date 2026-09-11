-- Additive settings: existing ticket attribution, tokens and resets stay unchanged.
alter table public.ticket_businesses
  add column if not exists offers_url text,
  add column if not exists public_screen_enabled boolean not null default true;
alter table public.ticket_businesses add constraint ticket_offers_url_length
  check (offers_url is null or char_length(offers_url) <= 2000);

-- One anonymous statistical record per ticket; deliberately no FK to the live
-- entry or queue, so resetting a queue never deletes its history. No device token.
create table public.ticket_history (
  ticket_id uuid primary key,
  business_id uuid not null references public.ticket_businesses(id) on delete cascade,
  issued_at timestamptz not null,
  first_called_at timestamptz,
  first_served_at timestamptz
);
create index ticket_history_business_issued_idx on public.ticket_history(business_id, issued_at);
alter table public.ticket_history enable row level security;
revoke all on public.ticket_history from public, anon, authenticated;
grant select, insert, update, delete on public.ticket_history to service_role;

create function public.ticket_record_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.ticket_history(ticket_id, business_id, issued_at, first_called_at, first_served_at)
  values(new.id, new.business_id, new.issued_at, new.called_at, new.served_at)
  on conflict (ticket_id) do update set
    first_called_at = coalesce(ticket_history.first_called_at, excluded.first_called_at),
    first_served_at = coalesce(ticket_history.first_served_at, excluded.first_served_at);
  return new;
end; $$;
revoke all on function public.ticket_record_history() from public, anon, authenticated;
create trigger ticket_history_on_change after insert or update on public.ticket_entries
  for each row execute function public.ticket_record_history();
insert into public.ticket_history(ticket_id,business_id,issued_at,first_called_at,first_served_at)
select id,business_id,issued_at,called_at,served_at from public.ticket_entries
on conflict (ticket_id) do nothing;

-- Aggregation stays in Postgres: no 1,000-row API limit and no public raw history.
create function public.ticket_server_affluence(p_business_id uuid, p_day date, p_period text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_start date; v_end date; v_result jsonb;
begin
  if p_day is null or p_period is null or p_period not in ('day','week','month') then
    raise exception 'Période invalide.' using errcode = '22023';
  end if;
  v_start := case p_period when 'week' then date_trunc('week',p_day)::date
    when 'month' then date_trunc('month',p_day)::date else p_day end;
  v_end := case p_period when 'week' then v_start + 7
    when 'month' then (v_start + interval '1 month')::date else v_start + 1 end;
  with entries as (
    select *, (issued_at at time zone 'Europe/Paris')::date as day,
      extract(hour from issued_at at time zone 'Europe/Paris')::int as hour
    from public.ticket_history where business_id = p_business_id
      and issued_at >= (v_start::timestamp at time zone 'Europe/Paris')
      and issued_at < (v_end::timestamp at time zone 'Europe/Paris')
  ), hourly as (
    select h as hour, count(e.ticket_id) as tickets from generate_series(0,23) h
    left join entries e on e.hour = h group by h order by h
  ), daily as (
    select d::date as day, count(e.ticket_id) as tickets,
      count(e.first_served_at) as served,
      round((avg(extract(epoch from (e.first_called_at-e.issued_at))/60)
        filter(where e.first_called_at >= e.issued_at))::numeric,1) as average_wait
    from generate_series(v_start::timestamp,(v_end-1)::timestamp,interval '1 day') d
    left join entries e on e.day=d::date group by d order by d
  )
  select jsonb_build_object(
    'start',v_start,'end',v_end-1,'timezone','Europe/Paris',
    'tickets',(select count(*) from entries),
    'served',(select count(first_served_at) from entries),
    'today',(select count(*) from public.ticket_history where business_id=p_business_id
      and issued_at >= (((now() at time zone 'Europe/Paris')::date)::timestamp at time zone 'Europe/Paris')
      and issued_at < ((((now() at time zone 'Europe/Paris')::date)+1)::timestamp at time zone 'Europe/Paris')),
    'waiting',(select count(*) from public.ticket_entries where business_id=p_business_id and status='waiting'),
    'average_wait',(select round((avg(extract(epoch from (first_called_at-issued_at))/60)
      filter(where first_called_at >= issued_at))::numeric,1) from entries),
    'wait_samples',(select count(*) from entries where first_called_at >= issued_at),
    'peak_hour',(select hour from hourly where tickets>0 order by tickets desc,hour limit 1),
    'hourly',(select jsonb_agg(to_jsonb(hourly)) from hourly),
    'daily',(select jsonb_agg(to_jsonb(daily)) from daily)
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.ticket_server_affluence(uuid,date,text) from public,anon,authenticated;
grant execute on function public.ticket_server_affluence(uuid,date,text) to service_role;
