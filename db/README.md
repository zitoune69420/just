# Migrations

Chaque changement de schéma est un fichier `migration-AAAAMMJJ-HHMMSS.sql` dans
`db/migrations/`. Les fichiers s'appliquent dans l'ordre alphabétique, qui est
aussi l'ordre chronologique.

## Appliquer

Colle le contenu du fichier dans le SQL Editor Supabase, du plus ancien au plus
récent. Les migrations déjà appliquées sont listées dans la table
`public.schema_migrations` :

```sql
select name, applied_at from public.schema_migrations order by name;
```

Chaque migration est idempotente (`if not exists`, `create or replace`,
`on conflict do nothing`) : la rejouer ne casse rien.

## Ajouter une migration

Nomme le fichier avec l'horodatage UTC de sa création et termine-le par son
propre enregistrement :

```sql
insert into public.schema_migrations (name)
values ('migration-AAAAMMJJ-HHMMSS')
on conflict (name) do nothing;
```

Ne modifie jamais une migration déjà appliquée en production : ajoutes-en une
nouvelle.
