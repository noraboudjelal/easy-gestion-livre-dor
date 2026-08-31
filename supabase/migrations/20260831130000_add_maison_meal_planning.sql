alter table public.maison_items
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'meal_plan')),
  add column if not exists source_key text;

create unique index if not exists maison_items_generated_key_idx
  on public.maison_items(home_id, source_key)
  where source = 'meal_plan';

create table if not exists public.maison_recipes (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.maison_homes(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.maison_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.maison_recipes(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  normalized_name text not null check (char_length(normalized_name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique(recipe_id, normalized_name)
);

create table if not exists public.maison_meal_plan (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.maison_homes(id) on delete cascade,
  day_index smallint not null check (day_index between 0 and 6),
  recipe_id uuid not null references public.maison_recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(home_id, day_index)
);

create index if not exists maison_recipes_home_idx on public.maison_recipes(home_id, created_at);
create index if not exists maison_recipe_ingredients_recipe_idx on public.maison_recipe_ingredients(recipe_id);
create index if not exists maison_meal_plan_home_idx on public.maison_meal_plan(home_id, day_index);

alter table public.maison_recipes enable row level security;
alter table public.maison_recipe_ingredients enable row level security;
alter table public.maison_meal_plan enable row level security;

revoke all on table public.maison_recipes from anon, authenticated;
revoke all on table public.maison_recipe_ingredients from anon, authenticated;
revoke all on table public.maison_meal_plan from anon, authenticated;

create or replace function public.maison_create_recipe(
  p_home_id uuid,
  p_name text,
  p_ingredients jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_recipe_id uuid;
begin
  if trim(p_name) = '' or char_length(trim(p_name)) > 100 then
    raise exception 'invalid recipe name';
  end if;

  if jsonb_typeof(p_ingredients) <> 'array' or jsonb_array_length(p_ingredients) = 0 then
    raise exception 'ingredients required';
  end if;

  insert into public.maison_recipes(home_id, name)
  values (p_home_id, trim(p_name))
  returning id into new_recipe_id;

  insert into public.maison_recipe_ingredients(recipe_id, name, normalized_name)
  select new_recipe_id, min(trim(value)), lower(regexp_replace(trim(value), '\s+', ' ', 'g'))
  from jsonb_array_elements_text(p_ingredients)
  where trim(value) <> '' and char_length(trim(value)) <= 100
  group by lower(regexp_replace(trim(value), '\s+', ' ', 'g'));

  if not exists (select 1 from public.maison_recipe_ingredients where recipe_id = new_recipe_id) then
    raise exception 'ingredients required';
  end if;

  return new_recipe_id;
end;
$$;

create or replace function public.maison_set_meal_plan(
  p_home_id uuid,
  p_day_index smallint,
  p_recipe_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_day_index < 0 or p_day_index > 6 then
    raise exception 'invalid day';
  end if;

  if p_recipe_id is null then
    delete from public.maison_meal_plan
    where home_id = p_home_id and day_index = p_day_index;
  else
    if not exists (
      select 1 from public.maison_recipes
      where id = p_recipe_id and home_id = p_home_id
    ) then
      raise exception 'invalid recipe';
    end if;

    insert into public.maison_meal_plan(home_id, day_index, recipe_id)
    values (p_home_id, p_day_index, p_recipe_id)
    on conflict (home_id, day_index)
    do update set recipe_id = excluded.recipe_id, updated_at = now();
  end if;

  delete from public.maison_items
  where home_id = p_home_id and source = 'meal_plan';

  insert into public.maison_items(home_id, kind, label, source, source_key)
  select
    p_home_id,
    'groceries',
    min(i.name) || case when count(*) > 1 then ' × ' || count(*)::text else '' end,
    'meal_plan',
    i.normalized_name
  from public.maison_meal_plan mp
  join public.maison_recipe_ingredients i on i.recipe_id = mp.recipe_id
  where mp.home_id = p_home_id
    and not exists (
      select 1 from public.maison_items manual
      where manual.home_id = p_home_id
        and manual.kind = 'groceries'
        and manual.source = 'manual'
        and lower(regexp_replace(trim(manual.label), '\s+', ' ', 'g')) = i.normalized_name
    )
  group by i.normalized_name;
end;
$$;

revoke all on function public.maison_create_recipe(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.maison_set_meal_plan(uuid, smallint, uuid) from public, anon, authenticated;
grant execute on function public.maison_create_recipe(uuid, text, jsonb) to service_role;
grant execute on function public.maison_set_meal_plan(uuid, smallint, uuid) to service_role;

create or replace function public.broadcast_maison_meal_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  maison_topic text;
begin
  select 'maison:' || share_token into maison_topic
  from public.maison_homes
  where id = coalesce(new.home_id, old.home_id);

  if maison_topic is not null then
    perform realtime.send(jsonb_build_object('changed', true), 'meals-changed', maison_topic, false);
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.broadcast_maison_meal_change() from public, anon, authenticated;

drop trigger if exists maison_recipes_broadcast_change on public.maison_recipes;
create trigger maison_recipes_broadcast_change
after insert or update or delete on public.maison_recipes
for each row execute function public.broadcast_maison_meal_change();

drop trigger if exists maison_meal_plan_broadcast_change on public.maison_meal_plan;
create trigger maison_meal_plan_broadcast_change
after insert or update or delete on public.maison_meal_plan
for each row execute function public.broadcast_maison_meal_change();
