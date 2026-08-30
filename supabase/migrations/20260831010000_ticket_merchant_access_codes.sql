-- Access by per-business code, independent from Supabase Auth users.
alter table public.ticket_businesses
  alter column owner_id drop not null,
  add column if not exists access_code_hash text,
  add column if not exists access_code_encrypted text;

create unique index if not exists ticket_businesses_access_code_hash_idx
  on public.ticket_businesses(access_code_hash)
  where access_code_hash is not null;

alter table public.ticket_businesses
  add constraint ticket_businesses_access_code_hash_format
  check (access_code_hash is null or char_length(access_code_hash) = 64) not valid;

alter table public.ticket_businesses validate constraint ticket_businesses_access_code_hash_format;

create or replace function public.ticket_server_call_next(p_business_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_queue public.ticket_queues%rowtype; v_next public.ticket_entries%rowtype;
begin
  select * into v_queue from public.ticket_queues where business_id = p_business_id for update;
  if not found then raise exception 'File introuvable.' using errcode = 'P0002'; end if;
  update public.ticket_entries set status = 'served', served_at = now() where queue_id = v_queue.id and status = 'called';
  select * into v_next from public.ticket_entries where queue_id = v_queue.id and status = 'waiting' order by number limit 1 for update;
  if v_next.id is not null then
    update public.ticket_entries set status = 'called', called_at = now(), served_at = null where id = v_next.id;
    update public.ticket_queues set current_number = v_next.number, updated_at = now() where id = v_queue.id;
  else update public.ticket_queues set updated_at = now() where id = v_queue.id;
  end if;
end; $$;

create or replace function public.ticket_server_call_previous(p_business_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_queue public.ticket_queues%rowtype; v_previous public.ticket_entries%rowtype;
begin
  select * into v_queue from public.ticket_queues where business_id = p_business_id for update;
  if not found then raise exception 'File introuvable.' using errcode = 'P0002'; end if;
  select * into v_previous from public.ticket_entries where queue_id = v_queue.id and status = 'served' and number < v_queue.current_number order by number desc limit 1 for update;
  if v_previous.id is not null then
    update public.ticket_entries set status = 'waiting', called_at = null where queue_id = v_queue.id and status = 'called';
    update public.ticket_entries set status = 'called', called_at = now(), served_at = null where id = v_previous.id;
    update public.ticket_queues set current_number = v_previous.number, updated_at = now() where id = v_queue.id;
  end if;
end; $$;

create or replace function public.ticket_server_set_queue_open(p_business_id uuid, p_is_open boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.ticket_queues set is_open = p_is_open, updated_at = now() where business_id = p_business_id;
  if not found then raise exception 'File introuvable.' using errcode = 'P0002'; end if;
end; $$;

revoke all on function public.ticket_server_call_next(uuid) from public, anon, authenticated;
revoke all on function public.ticket_server_call_previous(uuid) from public, anon, authenticated;
revoke all on function public.ticket_server_set_queue_open(uuid, boolean) from public, anon, authenticated;
grant execute on function public.ticket_server_call_next(uuid) to service_role;
grant execute on function public.ticket_server_call_previous(uuid) to service_role;
grant execute on function public.ticket_server_set_queue_open(uuid, boolean) to service_role;
