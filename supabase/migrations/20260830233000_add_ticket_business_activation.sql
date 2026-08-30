alter table public.ticket_businesses
  add column if not exists is_active boolean not null default true;

create or replace function public.ticket_prevent_inactive_queue_open()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_open and exists (
    select 1
    from public.ticket_businesses business
    where business.id = new.business_id
      and not business.is_active
  ) then
    raise exception 'Ce commerce Ticket est désactivé.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists ticket_prevent_inactive_queue_open on public.ticket_queues;
create trigger ticket_prevent_inactive_queue_open
before insert or update of is_open on public.ticket_queues
for each row execute function public.ticket_prevent_inactive_queue_open();

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
    and business.is_active
  order by business.name;
$$;

revoke all on function public.ticket_prevent_inactive_queue_open() from public, anon, authenticated;
revoke all on function public.ticket_merchant_queues() from public, anon;
grant execute on function public.ticket_merchant_queues() to authenticated;

