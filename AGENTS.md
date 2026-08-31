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

## Automatic Sync Rules
> [!IMPORTANT]
> **Always push to GitHub and Supabase automatically.**
> 
> Whenever an agent successfully completes a task that involves code changes or database migrations:
> 1. **Automatically stage and commit** the code changes locally (`git add .` and `git commit -m "..."`).
> 2. **Automatically push** the commits to the remote repository (`git push origin main`).
> 3. **Automatically apply migrations** to the remote Supabase project using the connection string from `.env` (e.g., `cmd.exe /c "npx -y supabase db push --db-url <DATABASE_URL>"` on Windows). Do not wait for user permission to perform these syncing operations.
