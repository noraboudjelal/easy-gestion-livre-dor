alter table public.showcases
  add column if not exists quiz_enabled boolean not null default false;

alter table public.quiz_questions
  add column if not exists showcase_id uuid references public.showcases(id) on delete cascade;

alter table public.quiz_questions
  alter column catalog_id drop not null;

create index if not exists quiz_questions_showcase_id_idx
  on public.quiz_questions(showcase_id);

alter table public.quiz_questions
  drop constraint if exists quiz_questions_single_owner;

alter table public.quiz_questions
  add constraint quiz_questions_single_owner
  check (num_nonnulls(catalog_id, showcase_id) = 1);

