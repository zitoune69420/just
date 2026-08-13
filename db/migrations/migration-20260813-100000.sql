-- Signalements : rendre l'unicité ciblable par `ON CONFLICT`.
--
-- `reports_unique_target_idx` portait sur `coalesce(season, -1)` et
-- `coalesce(episode, -1)` pour que deux films signalés par le même compte se
-- heurtent bien à l'index malgré leurs colonnes nulles. Un index d'expressions
-- n'est cependant jamais retenu par `ON CONFLICT (colonnes)` : l'upsert de
-- l'application échouait en `42P10`, donc *tout* signalement échouait.
--
-- `nulls not distinct` obtient le même résultat sur les colonnes brutes, que
-- `ON CONFLICT` sait viser. Demande PostgreSQL 15 ou plus.

-- L'ancien index garantissait déjà l'unicité : aucun doublon à purger avant de
-- créer le nouveau. Le filet reste au cas où l'index aurait été absent.
delete from public.reports a
using public.reports b
where a.id > b.id
  and a.user_id = b.user_id
  and a.tmdb_id = b.tmdb_id
  and a.media_type = b.media_type
  and a.season is not distinct from b.season
  and a.episode is not distinct from b.episode;

drop index if exists public.reports_unique_target_idx;

create unique index if not exists reports_unique_target_idx
  on public.reports (user_id, tmdb_id, media_type, season, episode)
  nulls not distinct;

insert into public.schema_migrations (name)
values ('migration-20260813-100000')
on conflict (name) do nothing;
