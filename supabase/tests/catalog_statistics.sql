-- Run in an isolated database after the migration; all fixtures are rolled back.
begin;
insert into public.catalogs(id,client,catalog_title,slug) values
 ('10000000-0000-4000-8000-000000000001','Test A','Test A','stats-test-a'),
 ('10000000-0000-4000-8000-000000000002','Test B','Test B','stats-test-b');
insert into public.catalog_products(id,catalog_id,name) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Produit A'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Produit B');
do $$ declare report jsonb; inserted boolean; begin
  select public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',null,'visit',repeat('a',64),'30000000-0000-4000-8000-000000000001') into inserted;
  assert inserted, 'first visit recorded';
  select public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',null,'visit',repeat('a',64),'30000000-0000-4000-8000-000000000001') into inserted;
  assert not inserted, 'same session must not double count';
  select public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','product_click',repeat('a',64),gen_random_uuid()) into inserted;
  assert not inserted, 'cross-catalog product rejected';
  perform public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','product_click',repeat('a',64),gen_random_uuid());
  perform public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',null,'visit',repeat('a',64),gen_random_uuid());
  perform public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000002',null,'visit',repeat('b',64),gen_random_uuid());
  report := public.catalog_statistics_report('10000000-0000-4000-8000-000000000001',(now() at time zone 'Europe/Paris')::date,(now() at time zone 'Europe/Paris')::date,'day');
  assert (report->>'visits')::int=2, 'catalogue A isolation';
  assert (report->>'uniqueVisitors')::int=1, 'unique visitors deduplicated over range';
  assert (report->>'productClicks')::int=1, 'product clicks';
  assert jsonb_array_length(report->'products')=1, 'no products from B';
  assert (report->'products'->0->>'name')='Produit A', 'correct ranking';
end $$;
-- Reports must aggregate in SQL rather than relying on the REST 1000 row limit.
insert into public.catalog_statistics_events(event_id,catalog_id,kind,visitor_hash,session_id,consent_version)
select gen_random_uuid(),'10000000-0000-4000-8000-000000000001','phone',repeat('a',64),gen_random_uuid(),1 from generate_series(1,1100);
do $$ declare r jsonb; begin
  r:=public.catalog_statistics_report('10000000-0000-4000-8000-000000000001',(now() at time zone 'Europe/Paris')::date,(now() at time zone 'Europe/Paris')::date,'month');
  assert (r->>'contactClicks')::int=1100,'no REST truncation';
  assert (r->'contacts'->>'phone')::int=1100,'contact aggregation';
  assert not public.record_catalog_statistic(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',null,'phone',repeat('a',64),gen_random_uuid()),'rate limit';
end $$;
insert into public.catalog_statistics_events(event_id,catalog_id,kind,visitor_hash,session_id,consent_version,received_at)
values(gen_random_uuid(),'10000000-0000-4000-8000-000000000001','phone',repeat('a',64),gen_random_uuid(),1,now()-interval '14 months');
do $$ begin assert public.purge_catalog_statistics()=1,'retention purge'; end $$;
-- Public and signed-in users cannot read/write raw events or invoke privileged RPCs.
do $$ declare role_name text; operation text; begin
  foreach role_name in array array['anon','authenticated'] loop
    assert not has_function_privilege(role_name,'public.catalog_statistics_report(uuid,date,date,text)','execute'),'reports inaccessible directly';
    assert not has_function_privilege(role_name,'public.record_catalog_statistic(uuid,uuid,uuid,text,text,uuid)','execute'),'collector is server only';
    assert not has_function_privilege(role_name,'public.purge_catalog_statistics()','execute'),'purge is server only';
    foreach operation in array array['select','insert','update','delete'] loop
      assert not has_table_privilege(role_name,'public.catalog_statistics_events',operation),'raw histories forbidden';
    end loop;
    assert not has_table_privilege(role_name,'public.catalog_statistics_members','insert'),'no self assignment';
  end loop;
  assert (select relrowsecurity from pg_class where oid='public.catalog_statistics_events'::regclass),'RLS enabled';
  assert has_function_privilege('service_role','public.catalog_statistics_report(uuid,date,date,text)','execute'),'backend report permission';
end $$;
insert into auth.users(id) values ('40000000-0000-4000-8000-000000000001'),('40000000-0000-4000-8000-000000000002');
insert into public.catalog_statistics_members(catalog_id,user_id) values
 ('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.catalog_statistics_members)=1,'membership isolation';
  assert (select catalog_id from public.catalog_statistics_members)='10000000-0000-4000-8000-000000000001'::uuid,'only own catalogue membership';
end $$;
reset role;
rollback;
