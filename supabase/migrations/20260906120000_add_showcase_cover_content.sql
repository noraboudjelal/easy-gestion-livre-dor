alter table public.showcases
  add column if not exists cover_title text,
  add column if not exists cover_tagline text,
  add column if not exists cover_mentions text[];

alter table public.showcases
  add constraint showcases_cover_title_length
    check (cover_title is null or char_length(cover_title) <= 120),
  add constraint showcases_cover_tagline_length
    check (cover_tagline is null or char_length(cover_tagline) <= 180),
  add constraint showcases_cover_mentions_count
    check (cover_mentions is null or cardinality(cover_mentions) <= 4);

