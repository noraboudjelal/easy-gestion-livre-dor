alter table public.maison_recipe_ingredients
  add column if not exists quantity numeric check (quantity is null or quantity > 0),
  add column if not exists unit text check (unit is null or char_length(unit) <= 30);

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

  insert into public.maison_recipe_ingredients(recipe_id, name, normalized_name, quantity, unit)
  select
    new_recipe_id,
    min(trim(item->>'name')),
    lower(regexp_replace(trim(item->>'name'), '\s+', ' ', 'g')),
    max(case when nullif(trim(item->>'quantity'), '') is not null then (item->>'quantity')::numeric end),
    nullif(min(trim(item->>'unit')), '')
  from jsonb_array_elements(p_ingredients) item
  where trim(coalesce(item->>'name', '')) <> ''
    and char_length(trim(item->>'name')) <= 100
  group by lower(regexp_replace(trim(item->>'name'), '\s+', ' ', 'g'));

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
  if p_day_index < 0 or p_day_index > 6 then raise exception 'invalid day'; end if;
  if p_recipe_id is null then
    delete from public.maison_meal_plan where home_id = p_home_id and day_index = p_day_index;
  else
    if not exists (select 1 from public.maison_recipes where id = p_recipe_id and home_id = p_home_id) then
      raise exception 'invalid recipe';
    end if;
    insert into public.maison_meal_plan(home_id, day_index, recipe_id)
    values (p_home_id, p_day_index, p_recipe_id)
    on conflict (home_id, day_index)
    do update set recipe_id = excluded.recipe_id, updated_at = now();
  end if;
end;
$$;

create or replace function public.maison_generate_weekly_groceries(p_home_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_count integer;
begin
  delete from public.maison_items where home_id = p_home_id and source = 'meal_plan';

  insert into public.maison_items(home_id, kind, label, source, source_key)
  select
    p_home_id,
    'groceries',
    min(i.name) ||
      case
        when bool_and(i.quantity is not null) then
          ' — ' || trim(to_char(sum(i.quantity), 'FM999999990.##')) ||
          case when min(coalesce(i.unit, '')) <> '' then ' ' || min(i.unit) else '' end
        when count(*) > 1 then ' × ' || count(*)::text
        else ''
      end,
    'meal_plan',
    i.normalized_name || ':' || lower(coalesce(i.unit, ''))
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
  group by i.normalized_name, lower(coalesce(i.unit, ''));

  get diagnostics generated_count = row_count;
  return generated_count;
end;
$$;

revoke all on function public.maison_generate_weekly_groceries(uuid) from public, anon, authenticated;
grant execute on function public.maison_generate_weekly_groceries(uuid) to service_role;
