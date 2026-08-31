create or replace function public.ticket_server_reset_queue(p_business_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_queue public.ticket_queues%rowtype;
begin
  select * into v_queue
  from public.ticket_queues
  where business_id = p_business_id
  for update;

  if not found then
    raise exception 'File introuvable.' using errcode = 'P0002';
  end if;

  delete from public.ticket_entries where queue_id = v_queue.id;

  update public.ticket_queues
  set current_number = 0,
      last_issued_number = 0,
      updated_at = now()
  where id = v_queue.id;
end;
$$;

revoke all on function public.ticket_server_reset_queue(uuid) from public, anon, authenticated;
grant execute on function public.ticket_server_reset_queue(uuid) to service_role;
