# STYVEX — Engineering Protocols

Binding rules for every contributor: humans, Lovable, Codex, or any other LLM
agent. If a change conflicts with this document, the document wins. Update this
file in the same pull request as any intentional deviation.

---

## 1. MAP — Multi-Agent Protocol

1. **Read before writing.** Inspect `README.md`, `AGENTS.md`, `SECURITY.md`,
   `docs/PROTOCOLS.md`, `supabase/README.md`, and existing code before changing
   anything.
2. **Single source of truth is the GitHub repository**, branch `main`. Never
   rewrite published history (no force push, rebase, amend, or squash of pushed
   commits).
3. **Stay in scope.** Implement only what was requested. No speculative pages,
   tables, dependencies, or refactors.
4. **Preserve the stack.** React 19 + TypeScript + Vite + Tailwind v4 +
   TanStack Start + TanStack Router. Do not add another router, another CSS
   framework, or a second state library.
5. **Leave a trail.** Each change describes what changed and why in the commit
   message; schema changes also get a migration file.
6. **Hand-off state.** The branch must always build and run. Never leave
   half-finished work on `main`.

## 2. QAP — Quality Assurance Protocol

Before declaring any task complete:

1. `bunx tsgo --noEmit` — zero type errors.
2. `bun run lint` — zero new errors.
3. App loads (HTTP 200) and the changed screen renders correctly at mobile
   (375px) and desktop (1280px) widths.
4. No console errors in the browser.
5. No hardcoded secrets, keys, or credentials anywhere in the diff.
6. Accessibility: one `<h1>` per page, alt text on meaningful images, keyboard
   focus visible, semantic landmarks (`header`, `main`, `footer`, `nav`).
7. SEO: every route defines its own `head()` with unique title (<60 chars),
   description (<160 chars), `og:title`, `og:description`.

## 3. DSP — Design System Protocol

- All colors, gradients, and shadows are semantic tokens defined in
  `src/styles.css` (`oklch` values). **Never** hardcode `text-white`,
  `bg-black`, or `bg-[#hex]` in components.
- Shared UI lives in `src/components/`; primitives in `src/components/ui/`.
- Layout chrome (`SiteHeader`, `SiteFooter`) is reused on every page: the ring
  icon plus wordmark sits top-left in the nav; page identity content is centred
  in `<main>`.
- Mobile-first. Every layout must work from 360px upward.

## 4. SEC — Security Protocol

- Secrets never enter the repo. `.env` and `.env.*` are git-ignored except
  `.env.example`.
- Browser config uses public `VITE_*` variables only, read via
  `import.meta.env`. Assume they are public.
- Server secrets are read with `process.env.*` **inside** a server function
  handler, and are stored in the platform secret manager.
- The Supabase service-role key bypasses RLS: server-only paths, never imported
  into a route or component module.
- Authorization is decided server-side. Never trust `localStorage`, client
  state, or a client-supplied role.
- Roles live in a dedicated `user_roles` table, never on a profile/user row.

## 5. DBP — Database Protocol

- Backend is the user-owned Supabase project `xfbdzfpsgclqgilzioqy`
  (`us-womens-lifestyle-store`). **Lovable Cloud is not used.**
- Every schema change is a timestamped SQL file in `supabase/migrations/`,
  committed to GitHub. No schema changes made only through the dashboard.
- Migrations are forward-only and idempotent where practical.
- Every new `public` table, in this order, in the same migration:
  1. `CREATE TABLE`
  2. `GRANT` to the roles the policies allow (`authenticated`, `service_role`,
     `anon` only when a policy permits anon reads)
  3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  4. explicit `CREATE POLICY` statements
- No table ships without RLS. No seed/demo data unless explicitly requested.

## 6. SFP — Server Function Protocol

- App-internal server logic uses `createServerFn` from `@tanstack/react-start`
  in `*.functions.ts` files; helpers go in `*.server.ts`.
- Files declaring `createServerFn` stay thin: imports, types, exported server
  functions only.
- External callers (webhooks, cron, public APIs) use routes under
  `src/routes/api/public/*`, and must verify the caller inside the handler.
- Never call an auth-protected server function from a public route loader.

## 7. Definition of Done

A task is done when: scope matches the request, QAP passes, protocols above are
honoured, docs updated if behaviour changed, and the work is committed and
pushed to `main`.
