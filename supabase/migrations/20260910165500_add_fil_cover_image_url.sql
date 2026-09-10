alter table public.event_fil_settings
  add column if not exists cover_image_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'event_fil_settings_cover_image_url_length'
  ) then
    alter table public.event_fil_settings
      add constraint event_fil_settings_cover_image_url_length
      check (cover_image_url is null or char_length(cover_image_url) <= 2000);
  end if;
end $$;
