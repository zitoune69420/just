-- La table `watchlist` servait aux deux usages à la fois : le cœur cliqué sur
-- une fiche et la liste « à voir plus tard » écrivaient la même ligne. Une
-- colonne `kind` les sépare.
--
-- Les lignes déjà en base viennent toutes de `toggleFavorite`, le seul écrivain
-- jusqu'ici : le défaut `favorite` est donc le bon report pour l'existant.

alter table public.watchlist
  add column if not exists kind text not null default 'favorite';

alter table public.watchlist
  drop constraint if exists watchlist_kind_check;

alter table public.watchlist
  add constraint watchlist_kind_check
  check (kind in ('favorite', 'watchlist'));

-- L'unicité portait sur le titre seul : un même titre doit pouvoir être à la
-- fois aimé et rangé dans « à voir plus tard ».
alter table public.watchlist
  drop constraint if exists watchlist_user_id_tmdb_id_media_type_key;

create unique index if not exists watchlist_user_item_kind_key
  on public.watchlist (user_id, tmdb_id, media_type, kind);

-- Les deux listes se lisent séparément, l'index de tri doit donc porter `kind`.
create index if not exists watchlist_user_kind_added_idx
  on public.watchlist (user_id, kind, added_at desc);

drop index if exists public.watchlist_user_added_idx;

insert into public.schema_migrations (name)
values ('migration-20260811-160000')
on conflict (name) do nothing;
