-- Deux garde-fous qui ne peuvent pas être tenus depuis l'application :
--
-- 1. `claim_grant` : compter puis insérer depuis Node laisse une fenêtre où
--    deux lectures simultanées voient le même compteur et passent toutes les
--    deux sous la limite. Le comptage et l'insertion vivent donc dans la même
--    transaction, sérialisée par compte et par type de média.
-- 2. `consume_rate_limit` : le compteur en mémoire du processus ne vaut que
--    pour une instance. Les quotas sensibles (connexion, inscription,
--    réinitialisation) passent par cette table, partagée par tout le déploiement.

create or replace function public.claim_grant(
  p_user_id uuid,
  p_media_type text,
  p_tmdb_id integer,
  p_period text,
  p_limit integer,
  p_count_period text
) returns table (allowed boolean, consumed boolean, used integer)
language plpgsql
as $$
declare
  v_used integer;
begin
  /**
   * Verrou de transaction propre au couple (compte, type de média) : deux
   * lectures du même compte s'attendent, deux comptes différents non.
   */
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_media_type, 0)
  );

  -- Titre déjà débloqué : on ne consomme rien.
  if exists (
    select 1
    from public.grants g
    where g.user_id = p_user_id
      and g.media_type = p_media_type
      and g.tmdb_id = p_tmdb_id
      and g.period = p_period
  ) then
    return query select true, false, null::integer;
    return;
  end if;

  select count(*)
  into v_used
  from public.grants g
  where g.user_id = p_user_id
    and g.media_type = p_media_type
    and (p_count_period is null or g.period = p_count_period);

  if v_used >= p_limit then
    return query select false, false, v_used;
    return;
  end if;

  insert into public.grants (user_id, media_type, tmdb_id, period)
  values (p_user_id, p_media_type, p_tmdb_id, p_period)
  on conflict (user_id, media_type, tmdb_id, period) do nothing;

  return query select true, true, v_used + 1;
end;
$$;

revoke all on function public.claim_grant(uuid, text, integer, text, integer, text)
  from anon, authenticated;

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

create index if not exists rate_limits_reset_idx on public.rate_limits (reset_at);

alter table public.rate_limits enable row level security;

revoke all on public.rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
) returns boolean
language plpgsql
as $$
declare
  v_count integer;
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
begin
  -- Ménage opportuniste : une fenêtre passée depuis une heure ne sert plus.
  if random() < 0.01 then
    delete from public.rate_limits where reset_at < now() - interval '1 hour';
  end if;

  insert into public.rate_limits as r (key, count, reset_at)
  values (p_key, 1, now() + v_window)
  on conflict (key) do update
  set count = case when r.reset_at <= now() then 1 else r.count + 1 end,
      reset_at = case when r.reset_at <= now() then now() + v_window else r.reset_at end
  returning r.count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260811-140000')
on conflict (name) do nothing;
