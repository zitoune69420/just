-- Listes composées par les comptes, éventuellement partageables.
--
-- Le `slug` est la seule adresse publique d'une liste. Il porte donc un suffixe
-- aléatoire : une liste privée dont on devinerait l'adresse cesserait d'être
-- privée le jour où elle est publiée, et une liste publique ne doit pas laisser
-- énumérer les autres par incrément.

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lists_user_updated_idx
  on public.lists (user_id, updated_at desc);

create table if not exists public.list_items (
  id bigint primary key generated always as identity,
  list_id uuid not null references public.lists (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (list_id, tmdb_id, media_type)
);

create index if not exists list_items_list_position_idx
  on public.list_items (list_id, position, added_at);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

revoke all on public.lists from anon, authenticated;
revoke all on public.list_items from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260811-190000')
on conflict (name) do nothing;
