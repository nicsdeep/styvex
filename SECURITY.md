# STYVEX — Security Conventions

## Secrets

- **Never** commit `.env` files, service role keys, database passwords, or API
  secrets. `.gitignore` blocks `.env` and `.env.*` (except `.env.example`).
- Client-side config uses `VITE_*` public variables only (read with
  `import.meta.env`). These are shipped to the browser — assume they are public.
- Server-side secrets are read with `process.env.*` **inside** server function
  handlers, and are stored in the platform secret manager, never in the repo.
- The Supabase service role key bypasses RLS. It may only be used in trusted
  server-only code paths, never imported into a component or route module.

## Database

- Row Level Security is enabled on every table in `public`, with explicit
  policies. See `supabase/README.md`.
- Authorization is decided server-side; never trust `localStorage` or client
  state for roles or entitlements.

## Reporting

Report vulnerabilities privately to the repository owner before disclosure.
