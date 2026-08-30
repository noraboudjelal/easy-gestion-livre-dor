-- Merchant management now exclusively uses the signed server session created from
-- a per-business access code. Legacy Supabase Auth users must no longer manage queues.
revoke execute on function public.ticket_merchant_queues() from authenticated;
revoke execute on function public.ticket_call_next(uuid) from authenticated;
revoke execute on function public.ticket_call_previous(uuid) from authenticated;
revoke execute on function public.ticket_set_queue_open(uuid, boolean) from authenticated;

revoke select on table public.ticket_businesses from authenticated;
revoke select on table public.ticket_entries from authenticated;

drop policy if exists "ticket owners read their businesses" on public.ticket_businesses;
drop policy if exists "ticket owners read their entries" on public.ticket_entries;
