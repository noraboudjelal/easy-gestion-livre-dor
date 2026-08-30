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

    update public.ticket_queues as queue
    set last_issued_number = queue.last_issued_number + 1, updated_at = now()
    where queue.id = v_queue.id
    returning queue.* into v_queue;

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

revoke all on function public.ticket_take_or_resume(text, text) from public;
grant execute on function public.ticket_take_or_resume(text, text) to anon, authenticated;

