begin;

do $$
declare
  test_slug text := 'wheel-sql-test-' || gen_random_uuid()::text;
  test_id uuid;
  valid_lots text[] := array['Café', 'Burger', 'Dessert', '-10 %', 'Soin', 'Cadeau', 'Retentez', 'Surprise'];
begin
  if not (select relrowsecurity from pg_class where oid = 'public.wheel_businesses'::regclass) then
    raise exception 'RLS must be enabled';
  end if;
  if has_table_privilege('anon', 'public.wheel_businesses', 'SELECT')
     or has_table_privilege('anon', 'public.wheel_businesses', 'INSERT')
     or has_table_privilege('authenticated', 'public.wheel_businesses', 'UPDATE')
     or has_table_privilege('authenticated', 'public.wheel_businesses', 'SELECT') then
    raise exception 'Browser roles must not access saved wheels directly';
  end if;
  insert into public.wheel_businesses (name, slug, lots) values ('SQL test', test_slug, valid_lots) returning id into test_id;
  update public.wheel_businesses set lots[1] = 'Nouveau café' where id = test_id;
  if (select lots[1] from public.wheel_businesses where id = test_id) <> 'Nouveau café' then raise exception 'Update failed'; end if;
  begin
    insert into public.wheel_businesses (name, slug, lots) values ('Duplicate', test_slug, valid_lots);
    raise exception 'Duplicate slug accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.wheel_businesses (name, slug, lots) values ('Seven lots', test_slug || '-7', valid_lots[1:7]);
    raise exception 'Seven lots accepted';
  exception when check_violation then null; end;
  begin
    valid_lots[1] := '   ';
    insert into public.wheel_businesses (name, slug, lots) values ('Blank lot', test_slug || '-blank', valid_lots);
    raise exception 'Blank lot accepted';
  exception when check_violation then null; end;
end;
$$;

set local role anon;
do $$ begin
  begin
    perform id from public.wheel_businesses;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wheel_businesses(name,slug,lots) values('Forbidden','forbidden',array['1','2','3','4','5','6','7','8']);
    raise exception 'Anonymous insert allowed';
  exception when insufficient_privilege then null; end;
end; $$;

set local role authenticated;
do $$ begin
  begin
    update public.wheel_businesses set name='Forbidden';
    raise exception 'Authenticated direct update allowed';
  exception when insufficient_privilege then null; end;
end; $$;

reset role;
select 'wheel SQL constraints and permissions passed' as result;
rollback;
