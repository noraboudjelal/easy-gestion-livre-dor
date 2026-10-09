create or replace function public.marketing_wheel_play_receipt(p_slug text, p_receipt text)
returns table(won boolean, prize text, play_day date)
language plpgsql security invoker set search_path = public as $$
declare w public.marketing_wheels%rowtype;
declare day_paris date := (now() at time zone 'Europe/Paris')::date;
declare cleaned text := upper(btrim(p_receipt));
declare hashed text;
declare result boolean;
declare selected_prize text;
begin
 if char_length(cleaned) < 3 or char_length(cleaned) > 64 or cleaned !~ '^[A-Z0-9/_-]+$' then raise exception 'Numéro de ticket invalide'; end if;
 select mw.* into w from public.marketing_wheels mw where mw.slug = p_slug for update;
 if not found or not w.active then raise exception 'Roue indisponible'; end if;
 hashed := encode(extensions.digest(w.id::text || ':' || cleaned, 'sha256'), 'hex');
 if exists (select 1 from public.marketing_wheel_receipt_plays p where p.wheel_id = w.id and p.receipt_hash = hashed) then
 raise exception 'Ce ticket a déjà été utilisé'; end if;
 if w.winners_count >= w.max_winners then raise exception 'Les cadeaux sont épuisés'; end if;
 result := floor(random() * w.win_denominator)::integer = 0;
 if result then
  select value into selected_prize
    from jsonb_array_elements_text(w.lots) as candidate(value)
    where btrim(value) !~* '^(perdu|pas gagn[eé]|retentez|aucun gain|dommage)'
    order by random() limit 1;
  if selected_prize is null then raise exception 'Aucun cadeau gagnant configuré'; end if;
 end if;
 insert into public.marketing_wheel_receipt_plays(wheel_id,play_day,receipt_hash,won,prize)
 values(w.id,day_paris,hashed,result,selected_prize);
 if result then update public.marketing_wheels mw set winners_count = winners_count + 1 where mw.id = w.id; end if;
 return query select result,selected_prize,day_paris;
end; $$;
revoke all on function public.marketing_wheel_play_receipt(text,text) from public, anon, authenticated;
grant execute on function public.marketing_wheel_play_receipt(text,text) to service_role;