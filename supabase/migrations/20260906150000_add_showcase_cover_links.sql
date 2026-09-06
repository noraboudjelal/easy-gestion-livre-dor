alter table public.showcases
  add column if not exists cover_links jsonb not null default '[]'::jsonb;

alter table public.showcases
  add constraint showcases_cover_links_is_array
    check (jsonb_typeof(cover_links) = 'array'),
  add constraint showcases_cover_links_count
    check (jsonb_array_length(cover_links) <= 8);

