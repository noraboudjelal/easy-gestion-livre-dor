alter table public.ticket_queues
  add column if not exists estimated_minutes_per_client integer;

alter table public.ticket_queues
  add constraint ticket_queues_estimated_minutes_per_client_range
    check (estimated_minutes_per_client is null or estimated_minutes_per_client between 1 and 180);

