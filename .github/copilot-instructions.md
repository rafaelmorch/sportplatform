<!-- .github/copilot-instructions.md -->
# AI Coding Assistant Notes — sportplatform

Purpose
- Provide focused, actionable guidance so an AI agent becomes productive quickly in this repo.

Big picture
- This repository contains two distinct apps: a Next.js web app (root `app/`) and a Flutter mobile app (`sports_platform/`). Work on the web UI unless the user explicitly asks to modify Flutter.
- The web app uses the Next.js App Router (app/ directory) with TypeScript and React Server Components by default. Client components must include `"use client"`.

Key directories & examples
- `app/` — Next.js routes and server components (e.g., `app/page.tsx` redirects to `/login`).
- `components/` — reusable UI components; import into pages or client components.
- `lib/supabase.ts` — server/service Supabase client using `SUPABASE_SERVICE_ROLE` (never expose this key).
- `lib/supabase-browser.ts` — browser/edge Supabase client using `NEXT_PUBLIC_SUPABASE_*` keys.
- `app/api/` — integration endpoints and server handlers (see `app/api/strava/`, `app/api/fitbit/`, `app/api/stripe/`).
- `public/` — static assets used by the web app.

Important patterns & conventions
- Environment separation: follow the existing pattern — use `lib/supabase.ts` on the server (service role key) and `lib/supabase-browser.ts` in client/browser code (anon key).
- Authentication & session checks: pages may perform server-side checks and redirect (see `app/profile/page.tsx`). Use Next's redirect/helpers consistently.
- App Router behavior: files under `app/` default to server components; add `"use client"` at the top of a file for client-side interactivity (hooks, event handlers).
- Integrations: Strava and Fitbit flows are implemented under `app/api/strava/*` and `app/api/fitbit/*` — follow their route shapes when adding new provider integrations.

Environment variables (explicitly referenced in code)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` — used by `lib/supabase.ts` (server-only).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used by `lib/supabase-browser.ts` (client).

Developer workflows
- Run dev server: `npm run dev` (runs `next dev`).
- Build for production: `npm run build` then `npm run start`.
- Lint: `npm run lint` (uses `eslint`).
- There are no repository tests configured — add tests only if requested.

Safety & secrets
- Never add service role keys or other secrets to the repo. If you need to run a server-side script locally, instruct the user to set the environment variables locally (e.g., `.env.local`) and never commit them.

Integration notes for maintainers
- When changing API routes under `app/api/*`, verify whether handlers should run as server components/edge functions and ensure you use the server `supabaseAdmin` client when performing privileged operations.
- For UI changes, prefer updating `components/` and reusing them across `app/` pages.

What an AI should do first
1. Run `npm run dev` locally (ask for environment secrets if needed).
2. Inspect `lib/supabase.ts` and `lib/supabase-browser.ts` to determine server vs client usage.
3. Search `app/api/` for similar route implementations before adding new integrations.

When to ask the user
- If a change touches `sports_platform/` (Flutter) or native mobile folders, confirm scope before editing.
- If missing env vars or external API credentials are required to test integrations, request them (do not guess values).

Where to look for examples
- Server supabase usage: `lib/supabase.ts`.
- Browser supabase usage: `lib/supabase-browser.ts`.
- Integration endpoints: `app/api/strava/`, `app/api/fitbit/`, `app/api/stripe/`.

Feedback
- If anything here is unclear or you want more depth (examples, PR conventions, or testing guidance), tell me which area to expand.
