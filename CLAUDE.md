# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build (multi-page: main + privacy)
npm run preview    # Serve the production build
npm run lint       # ESLint (flat config, eslint.config.js)
npm run typecheck  # tsc --noEmit against tsconfig.app.json
npm test           # Vitest (watch); `npm run test:run` for a single run, `test:coverage` for coverage
npm run e2e        # Playwright E2E suite (e2e/), run in CI against Vercel previews
npm run gen:types  # Regenerate Supabase DB types into src/types/database.types.ts
```

Vitest unit tests live in `__tests__` folders (currently `src/utils/` and `src/lib/mappers`; the service layer is not yet covered). Playwright specs are in `e2e/` (auth, recipes, chat, planner). The `test_*.{ts,js,cjs,py}` files at the repo root, if present, are untracked one-off scratch scripts, not a test suite — ignore them.

Edge functions are Deno (not bundled by Vite) and deployed separately via the Supabase CLI (`supabase functions deploy <name>`). They are not exercised by `npm run dev`.

## Architecture

A Vite + React 18 + TypeScript SPA (Tailwind, framer-motion, lucide-react icons) backed entirely by **Supabase** (Postgres + RLS + Auth + Storage + Deno Edge Functions). There is no custom server — the frontend talks to Postgres directly through the Supabase JS client, and to Edge Functions for anything requiring secret API keys.

### Frontend state & "routing"
- **Client-side routing with `wouter`.** [src/App.tsx](src/App.tsx) defines the routes (`/`, `/recipes`, `/community`, `/planner`, `/chat`, `/settings`, and `/admin` for admins only) inside a `<Switch>`; pages live in [src/pages/](src/pages/) and are code-split with `React.lazy()`. Unauthenticated visitors see `LandingPage`. Vercel SPA rewrites in `vercel.json` must be kept in sync when adding top-level routes. The `View` type in [src/components/Layout.tsx](src/components/Layout.tsx) still drives nav highlighting, and modals (recipe form, meal form, detail views, import/photo/onboarding, `AddToPlanModal`) are driven by component-level state. PostHog pageviews use the real paths.
- **Data flows through hooks/contexts and a service layer** ([src/services/](src/services/): `recipeService`, `mealService`, `shoppingListService`, `planService`, `profileService`). TanStack Query provides caching. Put new Supabase access in a service, not in components:
  - [AuthContext](src/contexts/AuthContext.tsx) — session, `userProfile`, and a realtime `postgres_changes` subscription that keeps `user_profiles` in sync. **Gates the whole app**: `userProfile.status` of `PENDING`/`REJECTED` renders `<AccountStatus>` instead of the app (see Admin approval below).
  - [useRecipes](src/hooks/useRecipes.ts) / [useMeals](src/hooks/useMeals.ts) — paginated recipe loading (12/page), filters, and meal CRUD. App.tsx wires these together; note recipes are server-filtered so `filteredRecipes === recipes`.
  - [ShoppingListContext](src/contexts/ShoppingListContext.tsx) — current shopping list + Instacart link creation.
- The `Recipe`, `Meal`, `MealWithRecipes`, `ShoppingList`, `UserProfile`, `LLMModel`, etc. **types are the source of truth for the DB schema** and live in [src/lib/supabase.ts](src/lib/supabase.ts) alongside the singleton `supabase` client.

### Data model (Postgres, see supabase/migrations/)
Migrations are timestamped SQL files and define both schema **and RLS policies** — when changing data access, the RLS policy is usually the thing to edit, not app code. Key relationships:
- `recipes` — owned by a user; `is_shared` exposes them in the **Community** view. `recipe_type` is `'food' | 'cocktail'` (cocktails carry `cocktail_metadata`).
- `meals` + `meal_recipes` (join table with `sort_order`, `is_completed`) — a meal links multiple recipes to a date/meal_type. `is_event = true` meals are "Collections" (event menus) vs. calendar meals.
- `shopping_lists` + `shopping_list_items`, `cuisine_profiles`, `suggested_recipes`, weekly-planning tables, `chats` + `chat_messages`, `recipe_ratings`, `user_preferences`.
- `user_profiles` — status/approval, `is_admin`, `assigned_model_id`, onboarding flags, and denormalized activity counts.
- `llm_models` — see LLM model system below.

### Edge Functions (supabase/functions/, Deno)
These exist because they hold secret API keys that must never reach the browser. Shared code is in `_shared/` (`cors.ts`, `types.ts` with Zod schemas, `emails/`).
- `ai-chat` — the AI chef assistant. Resolves the user's LLM model, injects preferences/allergies/cuisine profiles/rating history into the system prompt, calls the provider, returns structured recipe JSON. Also pulls recently-suggested recipes to avoid repeats. Helpers: `classifier.ts` (two-pass cuisine classifier) and `recipeResponseParser.ts` (structured-response parsing). The prompt states the assistant cannot edit the planner — users add suggestions via the "Add to plan" UI.
- `import-recipe` — scrape a recipe from a web URL.
- `extract-recipe-from-image` — OCR/parse a recipe from a photo (uses Gemini).
- `get-recipe-image` — generate a dish photo (Gemini image model) and store it in Supabase Storage.
- `import-social-recipe` — import from Instagram/TikTok captions via Apify; also used anonymously from the landing page (IP rate-limited via `anonymous_imports`).
- `weekly-planner` — scheduled (pg_cron) AI curation of weekly meal sets.
- `instacart-integration` — create Instacart shopping links.
- `auto-tag-recipe` — AI categorization of recipes.
- `admin-manage-models` / `admin-update-user-model` — admin LLM model administration.

### LLM model system
Models are **data, not config**: the `llm_models` table holds available models per `provider` (`openai`/`anthropic`/`google`) with `is_active`/`is_default`. Each user can be pinned to a specific model via `user_profiles.assigned_model_id`; otherwise the `is_default` active model is used. `ai-chat` resolves this per request. Admins manage models through the Admin Dashboard + the two `admin-*` edge functions.

### Admin approval system
New users land in `PENDING` and cannot use the app until an admin approves them (see [ADMIN_APPROVAL_SYSTEM.md](ADMIN_APPROVAL_SYSTEM.md)). This is enforced both in the UI (App.tsx status check) and in RLS policies (`20251203134544_update_rls_policies_for_approval.sql`). Beware RLS recursion when editing profile policies — there is a dedicated migration fixing infinite recursion (`20251203135534_fix_infinite_recursion_in_rls.sql`).

## Conventions & gotchas
- **Secrets split**: only `VITE_SUPABASE_*` and `VITE_POSTHOG_*` are exposed to the frontend (`import.meta.env`). OpenAI/Anthropic/Gemini/Resend/Instacart/Apify/Tavily keys live in the Supabase Edge Function environment only — keep it that way.
- **Multi-page build**: `vite.config.ts` defines two entry points — `main` (the app) and `privacy` (the standalone privacy page under `privacy/`). `lucide-react` is excluded from dep optimization.
- **Tailwind theme**: custom palette (`terracotta`, `cream`, `sage`, `warmtan`) plus texture utilities (`texture-linen`) in `tailwind.config.js` / `index.css`. Match the existing warm/earthy design language; per `.bolt/prompt`, build production-quality, non-generic UI and use lucide-react for icons.
- **Sanitize rendered HTML/markdown** with `dompurify` (already a dependency) — AI and imported content is rendered as markdown via `marked`.
- **Toasts, not alerts**: use `react-hot-toast` via [src/utils/toast.ts](src/utils/toast.ts) (`showError`, `showInfo`, ...); no browser `alert()`.
- **Analytics** via PostHog ([useAnalytics](src/hooks/useAnalytics.ts)); `track`/`pageView`/`identify` are called throughout — preserve event names when refactoring.
- Project background docs live at the repo root: `PRD.md`, `TECHNICAL_DOCS.md`, `RECOMMENDATION_LOGIC.md`, `CUISINE_PROFILES_LOGIC.md`, `ADMIN_APPROVAL_SYSTEM.md`, `weekly_planner.md`, `onboarding_wizard.md`, `IMPROVEMENTS.md` (prioritized backlog), `architecture_evaluation.md`.
