alter table public.users
  add column if not exists discord_username text;

insert into public.schema_migrations (name)
values ('migration-20260806-120000')
on conflict (name) do nothing;
