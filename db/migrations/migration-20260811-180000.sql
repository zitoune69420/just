-- Recommandations collaboratives : « les comptes qui ont regardé comme vous
-- ont aussi regardé ceci ».
--
-- Le calcul vit en SQL et pas dans Node parce qu'il croise l'historique de
-- tous les comptes : le remonter dans l'application reviendrait à charger les
-- tables entières à chaque affichage de la page d'accueil.

create or replace function public.collaborative_recommendations(
  p_user_id uuid,
  p_limit integer default 20
) returns table (media_type text, tmdb_id integer, score double precision)
language sql
stable
as $$
  with mine as (
    select media_type, tmdb_id from public.progress where user_id = p_user_id
    union
    select media_type, tmdb_id from public.watchlist where user_id = p_user_id
  ),
  others as (
    select user_id, media_type, tmdb_id
    from public.progress
    where user_id <> p_user_id
    union
    select user_id, media_type, tmdb_id
    from public.watchlist
    where user_id <> p_user_id
  ),
  -- Nombre de titres qu'un autre compte a en commun avec le nôtre : c'est ce
  -- qui mesure à quel point son avis nous concerne.
  neighbours as (
    select o.user_id, count(*)::double precision as shared
    from others o
    join mine m
      on m.media_type = o.media_type
     and m.tmdb_id = o.tmdb_id
    group by o.user_id
  ),
  -- Taille de la bibliothèque de chaque voisin. Sans ce correctif, un compte
  -- qui a tout ajouté ressemblerait à tout le monde et noierait le classement.
  sizes as (
    select user_id, count(*)::double precision as total
    from others
    group by user_id
  )
  select o.media_type,
         o.tmdb_id,
         sum(n.shared / sqrt(s.total)) as score
  from others o
  join neighbours n on n.user_id = o.user_id
  join sizes s on s.user_id = o.user_id
  where not exists (
    select 1
    from mine m
    where m.media_type = o.media_type
      and m.tmdb_id = o.tmdb_id
  )
  group by o.media_type, o.tmdb_id
  order by score desc
  limit p_limit;
$$;

revoke all on function public.collaborative_recommendations(uuid, integer)
  from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260811-180000')
on conflict (name) do nothing;
