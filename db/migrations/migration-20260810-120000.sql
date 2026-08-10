create table if not exists public.password_resets (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_resets_user_created_idx
  on public.password_resets (user_id, created_at desc);

alter table public.password_resets enable row level security;

revoke all on public.password_resets from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260810-120000')
on conflict (name) do nothing;
