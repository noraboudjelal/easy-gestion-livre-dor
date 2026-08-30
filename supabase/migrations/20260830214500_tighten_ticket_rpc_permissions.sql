revoke all on function public.ticket_merchant_queues() from public, anon;
revoke all on function public.ticket_call_next(uuid) from public, anon;
revoke all on function public.ticket_call_previous(uuid) from public, anon;
revoke all on function public.ticket_set_queue_open(uuid, boolean) from public, anon;

grant execute on function public.ticket_merchant_queues() to authenticated;
grant execute on function public.ticket_call_next(uuid) to authenticated;
grant execute on function public.ticket_call_previous(uuid) to authenticated;
grant execute on function public.ticket_set_queue_open(uuid, boolean) to authenticated;

