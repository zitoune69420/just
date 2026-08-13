-- Titres marqués indisponibles par l'administration.
--
-- Les signalements disent qu'un compte a rencontré un problème ; ils ne disent
-- pas si le problème est confirmé. Une fois l'administration passée derrière,
-- il faut pouvoir prévenir les autres comptes avant qu'ils n'essaient — sinon
-- le même titre est signalé dix fois.
--
-- Une ligne par titre, pas par signalement : c'est un état du catalogue, pas un
-- événement. La clé primaire porte donc sur la cible.

create table if not exists public.title_flags (
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  unavailable boolean not null default false,
  updated_at timestamptz not null default now(),
  -- `set null` et non `cascade` : l'état du titre survit à la suppression du
  -- compte administrateur qui l'a posé.
  updated_by uuid references public.users (id) on delete set null,
  primary key (tmdb_id, media_type)
);

-- La fiche d'un titre interroge ce drapeau à chaque affichage : l'index de clé
-- primaire suffit, la recherche portant toujours sur le couple complet.

alter table public.title_flags enable row level security;

revoke all on public.title_flags from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260813-110000')
on conflict (name) do nothing;
