begin;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'lehnova-statistics-retention',
  '17 2 * * *',
  'select public.purge_catalog_statistics()'
);
commit;
