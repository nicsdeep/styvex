<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## 🤖 STYVEX Agent Doctrines & Handover Protocol

> [!IMPORTANT]
> **READ THIS BEFORE MAKING CHANGES**
> Future AI Agents: You are stepping into a live, partially completed project. Follow these doctrines strictly to maintain project integrity.

### 1. Automatic Sync Rules (MANDATORY)
Whenever an agent successfully completes a task that involves code changes or database migrations:
1. **Automatically stage and commit** the code changes locally (`git add .` and `git commit -m "..."`).
2. **Automatically push** the commits to the remote repository (`git push origin main`).
3. **Automatically apply migrations** to the remote Supabase project using the connection string from `.env` (e.g., `cmd.exe /c "npx supabase db push"` on Windows). Do not wait for user permission to perform these syncing operations.

### 2. Development Commands
- **Local Dev Server**: Run `npm run dev` to start Vite.
- **Type Checking**: Run `npx tsc --noEmit` before committing to ensure there are no breaking TS errors. Note: You may see build errors from `@lovable.dev` modules which you can ignore during `vite build`, but keep your own code clean.
- **Supabase Migrations**: Use `npx supabase migration new <name>` to create new migrations and `npx supabase db push` to apply them.
- **Supabase Edge Functions**: Use `npx supabase functions serve` for local testing and `npx supabase functions deploy <function_name>` for deployment.
- **Install Packages**: Run `npm install <package_name>`. The project uses `npm`. Do not use `yarn` or `pnpm`.

### 3. GitHub Authentication Rule (MANDATORY)
- For Styvex repository operations, use the owner-authorized GitHub credential already provisioned for this project.
- Do not ask the owner to select, add, or sign in to a GitHub account as part of routine commits and pushes.
- Never write the credential value into source code, Git configuration, commits, logs, or documentation.

### 4. Current Project State (As of Phase 5)
- **Database**: Supabase is linked. Core schema exists (`products`, `categories`, `product_variants`, `product_images`, `wishlists`).
- **Data**: Seeded with ~10 products using the `FakeStoreAPI` via `scripts/seed-products.cjs`.
- **UI/UX**: 
  - Homepage (`index.tsx`) has an animated Embla Carousel hero and dynamic "New Arrivals"/"Trending" grids.
  - Shop (`shop.tsx`) and Category pages (`category.$slug.tsx`) dynamically filter and load products.
  - Product Details (`product.$slug.tsx`) supports multiple images, variant selection (size/color), and wishlist toggling.
  - Header & Footer are mobile-responsive and correctly route to live pages.
- **Auth**: Supabase Auth (Email/Password) is integrated (`auth-context.tsx`).
- **Checkout**: `checkout.tsx` captures cart items and calls the Supabase Edge Function `create-checkout-session` for Stripe processing.

### 5. What is Remaining (Future Roadmap)
- **Stripe Production Readiness**: The user needs to add their `STRIPE_SECRET_KEY` via `npx supabase secrets set STRIPE_SECRET_KEY=...`.
- **Order Management (Post-Checkout)**: 
  - Create Stripe Webhooks to capture successful payments and write them to an `orders` and `order_items` table in Supabase.
  - Build a user "Order History" page (`/account/orders`).
- **Search Robustness**: `/search` currently performs basic debounced queries; can be expanded with full-text Postgres search.
- **Admin Dashboard**: Build a `/admin` route or separate portal for the user to manage inventory, update product images, and fulfill orders.
- **SEO & Performance**: Add standard SEO tags dynamically per product and configure proper OpenGraph tags for social sharing.
