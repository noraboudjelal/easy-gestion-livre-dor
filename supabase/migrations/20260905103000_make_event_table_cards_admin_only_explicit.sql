create policy "Table cards are admin only"
  on public.event_table_cards
  for all
  to anon, authenticated
  using (false)
  with check (false);
