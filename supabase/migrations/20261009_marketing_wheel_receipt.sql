-- One ticket number per commerce and Paris-local day. Receipt authenticity cannot be checked.
create extension if not exists pgcrypto;
create table if not exists marketing_wheel_receipt_plays (
 id uuid primary key default gen_random_uuid(),
 wheel_id uuid not null references marketing_wheels(id) on delete cascade,
 play_day date not null,
 receipt_hash text not null,
 won boolean not null,
 prize text,
 created_at timestamptz not null default now(),
 unique (wheel_id, play_day, receipt_hash)
);
alter table marketing_wheel_receipt_plays enable row level security;
-- No RLS policies: service-role calls only.
create or replace function marketing_wheel_play_receipt(p_slug text, p_receipt text)
returns table(won boolean, prize text, play_day date)
language plpgsql security invoker set search_path = public as $$
declare w marketing_wheels%rowtype;
declare day_paris date := (now() at time zone 'Europe/Paris')::date;
declare cleaned text := upper(btrim(p_receipt));
declare hashed text;
declare result boolean;
begin
 if char_length(cleaned) < 3 or char_length(cleaned) > 64 or cleaned !~ '^[A-Z0-9/_-]+$' then
   raise exception 'Numéro de ticket invalide';
 end if;
 select mw.* into w from marketing_wheels mw where mw.slug = p_slug for update;
 if not found or not w.active then raise exception 'Roue indisponible'; end if;
 hashed := encode(digest(w.id::text || ':' || cleaned, 'sha256'), 'hex');
 if exists (select 1 from marketing_wheel_receipt_plays p where p.wheel_id = w.id and p.play_day = day_paris and p.receipt_hash = hashed) then
   raise exception 'Ce ticket a déjà été utilisé aujourd''hui';
 end if;
 if w.winners_count >= w.max_winners then raise exception 'Les cadeaux sont épuisés'; end if;
 result := floor(random() * w.win_denominator)::integer = 0;
 insert into marketing_wheel_receipt_plays(wheel_id,play_day,receipt_hash,won,prize)
 values(w.id,day_paris,hashed,result,case when result then w.prize else null end);
 if result then
   update marketing_wheels mw set winners_count = winners_count + 1 where mw.id = w.id;
 end if;
 return query select result, case when result then w.prize else null::text end, day_paris;
end; $$;
revoke all on function marketing_wheel_play_receipt(text,text) from public, anon, authenticated;
grant execute on function marketing_wheel_play_receipt(text,text) to service_role;
