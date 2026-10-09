-- Apply this migration to the project's Supabase database before using the wheel.
create extension if not exists pgcrypto;
create table if not exists marketing_wheels (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 100),
 slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 min_purchase numeric(10,2) not null default 40 check (min_purchase >= 0),
 win_denominator integer not null default 10 check (win_denominator between 2 and 1000),
 prize text not null default 'Cadeau surprise' check (char_length(prize) between 1 and 120),
 max_winners integer not null default 10 check (max_winners between 0 and 100000),
 winners_count integer not null default 0 check (winners_count >= 0),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 constraint wheel_cap check (winners_count <= max_winners)
);
create table if not exists marketing_wheel_tickets (
 token uuid primary key default gen_random_uuid(),
 wheel_id uuid not null references marketing_wheels(id) on delete cascade,
 created_at timestamptz not null default now(),
 used_at timestamptz,
 won boolean,
 prize text,
 constraint wheel_ticket_consistent check ((used_at is null and won is null) or (used_at is not null and won is not null))
);
create index if not exists marketing_wheel_tickets_wheel_id_idx on marketing_wheel_tickets(wheel_id);
alter table marketing_wheels enable row level security;
alter table marketing_wheel_tickets enable row level security;
-- No anon/authenticated policies: only server-side service role can read/write.
create or replace function marketing_wheel_play(p_slug text, p_token uuid)
returns table(won boolean, prize text)
language plpgsql security invoker set search_path = public as $$
declare t marketing_wheel_tickets%rowtype;
declare w marketing_wheels%rowtype;
declare result boolean;
begin
 -- Serialize all plays for this wheel to make the prize cap atomic.
 select mw.* into w from marketing_wheels mw where mw.slug = p_slug for update;
 if not found or not w.active then raise exception 'Roue introuvable ou inactive'; end if;
 select mt.* into t from marketing_wheel_tickets mt
 where mt.token = p_token and mt.wheel_id = w.id for update;
 if not found or t.used_at is not null then raise exception 'Participation invalide ou déjà utilisée'; end if;
 result := (w.winners_count < w.max_winners and floor(random() * w.win_denominator)::integer = 0);
 update marketing_wheel_tickets mt
 set used_at = now(), won = result, prize = case when result then w.prize else null end
 where mt.token = t.token;
 if result then update marketing_wheels mw set winners_count = winners_count + 1 where mw.id = w.id; end if;
 return query select result, case when result then w.prize else null::text end;
end; $$;
revoke all on function marketing_wheel_play(text, uuid) from public, anon, authenticated;
grant execute on function marketing_wheel_play(text, uuid) to service_role;
