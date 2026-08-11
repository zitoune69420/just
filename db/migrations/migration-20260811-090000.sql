-- Révocation des sessions : le jeton porte le numéro de session du compte au
-- moment de la connexion. Incrémenter la colonne invalide tous les cookies
-- émis avant (mot de passe changé, réinitialisé, déconnexion globale).
alter table public.users
  add column if not exists session_version integer not null default 0;

create or replace function public.bump_session_version(p_user_id uuid)
returns integer
language plpgsql
as $$
declare
  v_version integer;
begin
  update public.users
  set session_version = session_version + 1,
      updated_at = now()
  where id = p_user_id
  returning session_version into v_version;

  return v_version;
end;
$$;

revoke all on function public.bump_session_version(uuid) from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260811-090000')
on conflict (name) do nothing;
