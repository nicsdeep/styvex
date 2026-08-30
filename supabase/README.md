# STYVEX — Database & Migrations

All schema changes for the STYVEX project must be version controlled here.
No schema has been created yet — this is foundation only.

## Project

- Supabase project ref: `xfbdzfpsgclqgilzioqy`
- Credentials are never stored in this repository. Only the public project URL,
  publishable/anon key, and project ref may appear in client env vars
  (`VITE_*`, see `.env.example`). Service role keys and DB passwords live in the
  secret manager only.

## Workflow

```sh
supabase login                      # uses a local access token, never committed
supabase link --project-ref xfbdzfpsgclqgilzioqy
supabase migration new <name>       # creates supabase/migrations/<ts>_<name>.sql
supabase db push                    # applies pending migrations to the linked project
```

## Conventions for future migrations

- One migration file per change, committed to git.
- Every `CREATE TABLE` in `public` must be followed, in the same migration, by:
  1. `GRANT` statements for the roles the policies allow
  2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  3. Explicit `CREATE POLICY` statements
- Roles are never stored on a profile/users table; use a separate `user_roles`
  table with a `SECURITY DEFINER` `has_role()` helper.
- Never write secrets into migration files.
