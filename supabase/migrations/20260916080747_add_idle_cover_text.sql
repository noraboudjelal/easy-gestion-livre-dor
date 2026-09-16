alter table public.events add column if not exists idle_cover_text text;
alter table public.events add constraint events_idle_cover_text_length check (char_length(idle_cover_text) <= 120);
comment on column public.events.idle_cover_text is 'Optional independent text overlay for the kiosk idle image; null leaves the image unchanged.';
