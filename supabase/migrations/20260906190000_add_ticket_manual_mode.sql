alter table public.ticket_queues
  add column if not exists queue_mode text not null default 'tickets',
  add column if not exists manual_waiting_count integer not null default 0,
  add column if not exists public_wait_display_enabled boolean not null default true;

alter table public.ticket_queues
  add constraint ticket_queues_mode_values check (queue_mode in ('tickets', 'manual')),
  add constraint ticket_queues_manual_waiting_count_range check (manual_waiting_count between 0 and 999);

