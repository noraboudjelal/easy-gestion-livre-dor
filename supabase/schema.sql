-- À coller dans Supabase > SQL Editor > New query, puis cliquer "Run"

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  event_title text not null,
  event_type text not null default 'Autre',
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  message text not null,
  ink text not null default '#1E2A3A',
  rotation numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table events enable row level security;
alter table messages enable row level security;

-- Tout le monde peut lire les livres d'or (nécessaire pour que les invités voient la page)
create policy "events are readable by anyone"
  on events for select
  using (true);

-- Tout le monde peut créer un livre d'or pour l'instant (la page /admin est protégée par mot de passe côté site)
create policy "anyone can create events"
  on events for insert
  with check (true);

-- Tout le monde peut lire les messages d'un livre d'or
create policy "messages are readable by anyone"
  on messages for select
  using (true);

-- Tout le monde peut ajouter un message (ce sont les invités qui écrivent)
create policy "anyone can add a message"
  on messages for insert
  with check (true);
