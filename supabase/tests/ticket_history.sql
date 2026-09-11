-- Regression test: temporary fixtures only, always rolled back.
begin;
do $$
declare
  b uuid; q uuid; s text := 'ticket-regression-' || replace(gen_random_uuid()::text,'-','');
  t text := repeat('a',64); n int; h jsonb; first_call timestamptz;
begin
  insert into public.ticket_businesses(name,slug) values('Regression test',s) returning id into b;
  insert into public.ticket_queues(business_id) values(b) returning id into q;
  perform public.ticket_take_or_resume(s,t);
  perform public.ticket_take_or_resume(s,t);
  select count(*) into n from public.ticket_entries where business_id=b;
  if n<>1 then raise exception 'Duplicate active ticket'; end if;
  select ticket_number into n from public.ticket_public_state(s,t);
  if n<>1 then raise exception 'Resume failed'; end if;
  perform public.ticket_take_or_resume(s,repeat('b',64));
  perform public.ticket_server_call_next(b);
  select ticket_number into n from public.ticket_public_state(s,t) where ticket_status='called';
  if n is distinct from 1 then raise exception 'Called notification state failed'; end if;
  select first_called_at into first_call from public.ticket_history where business_id=b order by issued_at,ticket_id limit 1;
  perform public.ticket_server_call_next(b);
  perform public.ticket_server_call_previous(b);
  h:=public.ticket_server_affluence(b,(now() at time zone 'Europe/Paris')::date,'day');
  if (h->>'tickets')::int<>2 or (h->>'served')::int<>1 then raise exception 'Recall double counted: %',h; end if;
  perform public.ticket_server_reset_queue(b);
  if exists(select 1 from public.ticket_entries where business_id=b) then raise exception 'Reset failed'; end if;
  h:=public.ticket_server_affluence(b,(now() at time zone 'Europe/Paris')::date,'day');
  if (h->>'tickets')::int<>2 or (h->>'served')::int<>1 or (h->>'waiting')::int<>0 then raise exception 'Reset lost history: %',h; end if;
  perform public.ticket_take_or_resume(s,t);
  select ticket_number into n from public.ticket_public_state(s,t);
  if n<>1 then raise exception 'New queue must restart numbering'; end if;
  h:=public.ticket_server_affluence(b,(now() at time zone 'Europe/Paris')::date,'month');
  if (h->>'tickets')::int<>3 then raise exception 'New queue overwrote history'; end if;
  if jsonb_array_length(h->'hourly')<>24 then raise exception 'Missing hourly buckets'; end if;
  -- Paris DST days contain 23/25 clock hours, but one coherent daily total.
  insert into public.ticket_history(ticket_id,business_id,issued_at,first_called_at)
    values(gen_random_uuid(),b,'2026-03-28 23:30:00Z','2026-03-28 23:40:00Z'),
          (gen_random_uuid(),b,'2026-03-29 21:30:00Z','2026-03-29 21:50:00Z'),
          (gen_random_uuid(),b,'2026-03-29 22:30:00Z',null);
  h:=public.ticket_server_affluence(b,'2026-03-29','day');
  if (h->>'tickets')::int<>2 or (h->>'average_wait')::numeric<>15 then raise exception 'DST or average failed: %',h; end if;
  if has_table_privilege('anon','public.ticket_history','select') or has_table_privilege('authenticated','public.ticket_history','select') then raise exception 'Public history access'; end if;
  if has_function_privilege('anon','public.ticket_server_affluence(uuid,date,text)','execute') or has_function_privilege('authenticated','public.ticket_server_affluence(uuid,date,text)','execute') then raise exception 'Public stats RPC access'; end if;
end $$;
rollback;
