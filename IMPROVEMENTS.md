# Improvements
_Last assessment: 2026-06-15_
_Last knowledge sync: 2026-06-15_
_Assessment based on: `git fetch origin main` + `git log` review of all 17 commits since the June 11 reassessment (PR #54 alert migration merge through PR #55's E2E suite merge, plus several direct-push fixes on June 13). Reviewed all PRs via `list_pull_requests` (state=all, sorted by updated desc) — PR #54 and PR #55 both merged since last cycle, no other open PRs. Confirmed zero open GitHub issues. Read `PRD.md` in full for roadmap/status context. Re-verified via fresh grep/read: the favorites N+1 in `recipeService.ts` (`getDashboardData`, lines ~318-328) is unchanged; `getCommunityRecipes` is still hardcoded to `limit = 24` with a plain `useQuery` in `useRecipes.ts` (personal recipes already use `useInfiniteQuery`); zero native `alert()` calls remain anywhere in `src/` (PR #54 fully closed out the migration). Also reviewed the new `e2e/` suite (5 spec files + `.github/workflows/e2e.yml`), the new two-pass cuisine classifier (`supabase/functions/ai-chat/classifier.ts`, 172 lines, now imported by a refactored 1039-line `ai-chat/index.ts`), the `getCorsHeaders`/Vercel-preview CORS fix in `_shared/cors.ts`, and the one-line `AIChat.tsx` title-preservation bugfix (commit `489d57e`)._

---

## Current Sprint
Fix Favorites N+1 in getDashboardData (Tier 1) — `[IN PROGRESS — PR: #57]`

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Finish the alert() → Toast Migration (10 calls missed by PR #44) | ✅ Done | PR #54, merged June 11, 2026 (commit `086ca11`) — all 10 remaining native `alert()` calls in `AdminDashboard.tsx` (×7), `ShoppingListContext.tsx` (×2), and `OnboardingWizard.tsx` (×1) replaced with `showError`/`showInfo` from `src/utils/toast.ts`. Repo-wide grep for `alert(` across `src/` now returns zero results — this multi-cycle item (6+ consecutive appearances before being picked up) is fully closed. |
| Add Playwright E2E suite for auth, recipes, chat, and planner | ✅ Done | PR #55, merged June 13, 2026 (commit `c317fdd`, plus 10 fixup commits) — new `e2e/` directory with `auth.spec.ts`, `recipe.spec.ts`, `chat.spec.ts`, `planner.spec.ts`, shared `fixtures.ts`/`auth.setup.ts`, `playwright.config.ts`, and a new `.github/workflows/e2e.yml` that runs against Vercel preview deployments. This directly addresses the CLAUDE.md note that "Playwright e2e tests exist" and gives the project its first automated coverage of critical user flows. Several same-day fixup commits resolved CORS-for-previews, onboarding-modal interference, and locator strict-mode issues. |
| Fix recipe title loss when saving AI chat suggestions | ✅ Done | commit `489d57e`, June 13, 2026 — `AIChat.tsx`'s `handleSaveCard` built a markdown blob with the title as a plain first line, but `parseAIRecipe` only extracts a title from a markdown `# Heading`, so every AI-suggested recipe saved with the literal placeholder title "AI Suggested Recipe" instead of its real name. One-line fix (`# ${suggestion.title}`). This was a silent, high-frequency data-quality bug affecting the core AI chat → save-recipe flow and was not previously tracked in this backlog. |
| Two-pass cuisine classifier + wouter routing/lifecycle fixes | ✅ Done | commit `4a6f7e2`, June 13, 2026 — new `supabase/functions/ai-chat/classifier.ts` (172 lines) gates cuisine-specific prompt injection on a `hasFoodOrCookingContent` heuristic + LLM classification pass, refactoring `ai-chat/index.ts`. Also fixed `RecipesPage.tsx` so `/recipes/new`, `/recipes/import`, `/recipes/scan` routes no longer incorrectly match the recipe-detail route, and moved `temp_import_recipe` sessionStorage handling into `useState`/`useEffect` to avoid a double-read race. Note: confirms the app **does** use real client-side routing via `wouter` (see Code Health note below — CLAUDE.md's "No router" description is now outdated). |
| Vercel preview CORS fix for ai-chat | ✅ Done | commit `dab7327`, June 13, 2026 — `getCorsHeaders()` in `_shared/cors.ts` now allows `*.vercel.app` origins in addition to `ALLOWED_ORIGIN`/localhost, fixing `net::ERR_FAILED` on AI chat calls from PR preview deployments. Correctly reasoned: CORS isn't the auth boundary here (the bearer token is), so this doesn't widen what a caller can do. |
| Shopping List: Store Categorization + "Clear Checked" Button (Tier 1) | ✅ Done | PR #52, merged June 10, 2026 |
| Print-Friendly Recipe PDF Export (Tier 1) | ✅ Done | PR #50, merged June 8, 2026 |
| Fix Non-Functional Community Recipe Search (Tier 1) | ✅ Done | PR #47, June 5, 2026 |
| Replace browser alert() with toast notifications (Tier 1, initial scope) | ✅ Done | PR #44, June 5, 2026 |
| DB-side ingredient search (Tier 1.1) | ✅ Done | commit `f333c88`, June 2, 2026 |
| Vercel SPA routing (404 on refresh) | ✅ Done | PRs #31–41, stable `vercel.json` with SPA rewrite |

---

## Tier 1 — Quick Wins

### Fix Favorites N+1 in getDashboardData — IN PROGRESS

- **What:** `recipeService.getDashboardData()` fetches favorite IDs from `recipe_ratings`, then issues a second serial query via `.in('id', uniqueFavIds)`. Two round-trips where a single Supabase join suffices. Re-confirmed June 15: the `uniqueFavIds` dedup + second `.in()` query pattern is still present at lines ~318-328 of `recipeService.ts`, byte-for-byte unchanged from the last 4 assessments.
- **Why now:** This is the most over-tracked item in the backlog — a genuine half-day fix, fully self-contained, with the exact replacement query already specified, that has now sat open across 5+ consecutive assessments while smaller and larger items both got picked up around it. With the alert migration and E2E suite both now shipped, this is the lowest-risk, smallest-diff item available and should be the very next pickup.
- **Effort estimate:** S
- **Actual effort:** S
- **Status:** `[IN PROGRESS — PR: #57]`
- **Agent prompt:** "In `src/services/recipeService.ts`, in `getDashboardData`, replace the two-step favorites fetch (fetch IDs from `recipe_ratings`, then `.in('id', uniqueFavIds)` from `recipes`) with a single join query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)').eq('user_id', userId).eq('rating', 'thumbs_up')`. Map the nested `recipes` object directly to the favorites array. Remove the `uniqueFavIds` dedup step. Verify the dashboard still renders the favorites shelf correctly. Run `npm run lint && npm run typecheck && npm run build`."

---

### Community Recipe Pagination / Infinite Scroll — OPEN

- **What:** `getCommunityRecipes` is hardcoded to `limit(24)` in `recipeService.ts`; `useRecipes.ts` fetches it via a single `useQuery` (not `useInfiniteQuery`, unlike the personal recipe feed which already uses `useInfiniteQuery`). Any shared recipe beyond the first 24 is permanently invisible to all users. Re-confirmed June 15: still hardcoded, unchanged since at least June 6 — this is now its 4th consecutive appearance as an open Tier 1 item.
- **Why now:** Once the community surpasses 24 shared recipes, discovery silently breaks with no error or signal to users — a silent product cliff that gets more likely every day the community feature is used. The `useInfiniteQuery` pattern is proven in this exact hook for the personal recipe feed (`useRecipes.ts` lines ~30-58), so this remains a copy-adapt of an existing, working pattern. This item and the favorites N+1 fix above are now the two most "shovel-ready" items in the entire backlog and should be picked up together.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, add `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` using `.range(page * limit, (page + 1) * limit - 1)`, mirroring the pagination shape already returned by `getRecipes`. In `src/hooks/useRecipes.ts`, replace the static `useQuery(['community-recipes'], () => getCommunityRecipes(24))` with a second `useInfiniteQuery` (the personal recipes query above it in the same file is the template), keyed by `['community-recipes-paged']` and `getNextPageParam` returning the next page when `hasMore` is true. Flatten the pages array for `communityRecipes`, and expose `fetchNextPageCommunity`/`hasNextPageCommunity`/`isFetchingNextPageCommunity` (or similarly named) from the hook. In `src/components/CommunityPage.tsx` (or `src/pages/CommunityPage.tsx`, wherever the community grid renders), add a 'Load More' button at the grid bottom calling the new fetch-next function, hidden when there's no next page, with a spinner while fetching. Keep `getCommunityRecipes(limit)` but mark `@deprecated`. Run `npm run lint && npm run typecheck && npm run build`."

---

### Update CLAUDE.md routing description (stale "No router" claim) — NEW

- **What:** CLAUDE.md states "**No router.** `src/App.tsx` is the single hub: a `view` state variable... switches the main panel... there are no real URLs per view." This is no longer accurate: the app uses `wouter` (added around PR #35/the TanStack Query refactor, well before this cycle) with real routes — `/`, `/recipes` (nest), `/community` (nest), `/planner` (nest), `/chat`, `/settings`, `/admin` — confirmed in `src/App.tsx` lines ~142-159, and June 13's commit `4a6f7e2` specifically fixed wouter route-matching bugs in `RecipesPage.tsx` (`/recipes/new`, `/recipes/import`, `/recipes/scan` vs. `/recipes/:id`). Every future assessment and implementation agent that trusts CLAUDE.md's routing description risks reasoning about a non-existent `view`-state architecture.
- **Why now:** This is a trivial documentation fix, but a high-leverage one — CLAUDE.md is read first by every agent (including this one) and "overrides any default behavior." Stale architecture docs compound: agents may avoid using real routes, or fail to consider route-based navigation when building new pages (e.g. the planned Recipe Folders / Events features could use `/folders` or `/events` routes, but an agent trusting the current doc might instead bolt on more App-level boolean modal state).
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "Update the 'Frontend state & routing' section of `/home/user/meal-planner/CLAUDE.md`. Replace the 'No router...' paragraph with an accurate description: the app uses `wouter` for client-side routing (see `src/App.tsx`), with routes for `/`, `/recipes` (nest), `/community` (nest), `/planner` (nest), `/chat`, `/settings`, and `/admin` (admin-gated). Note that modals (recipe form, meal form, detail views, import/photo/onboarding) are still driven by App-level/page-level boolean state layered on top of these routes — only the top-level panel switching is route-based. Update the PostHog 'virtual paths' sentence if it's now redundant given real URLs exist. Do not change any other section. No code changes, no lint/build needed — this is a docs-only edit."

---

## Tier 2 — Next Sprint

### Recipe Collections / Folders ("Recipe Folders") — escalated, still queued

- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." As a user's library grows, browsing by tags alone makes it hard to maintain ad-hoc groupings like "Sunday dinners" or "recipes to try this month." Distinct from the existing `is_event` meal Collections — in-app copy should call this **"Recipe Folders"** to avoid collision.
- **Why now:** This was escalated from Tier 3 to Tier 2 on 2026-06-11 and given a full 6-phase implementation plan (schema/RLS, service layer, hook, folder filter UI, add-to-folder UI, analytics) — still shovel-ready. No code toward it has landed since (confirmed June 15: no `recipe_collections`/`collection_recipes`/`collectionService`/`useCollections` references anywhere in `src` or `supabase/migrations`). With the favorites N+1 fix and community pagination both now the clear Tier 1 priorities, this remains the next logical Tier 2 pickup once those clear — Phases 1-3 (schema, service, hook) are still callable as a self-contained first PR.
- **Effort estimate:** L (decomposable into ~4 independently-shippable phases — Phase 1+2 alone could ship as a smaller M-effort first PR if Tier 2 capacity is tight)
- **Actual effort:** —

- **Implementation plan (unchanged from June 11):**
  1. **Phase 1 — Schema & RLS (S):** New migration `supabase/migrations/<timestamp>_create_recipe_collections.sql` adding `recipe_collections(id uuid pk default gen_random_uuid(), user_id uuid references auth.users on delete cascade, name text not null, description text default '', sort_order int default 0, created_at timestamptz default now(), updated_at timestamptz default now())` and `collection_recipes(id uuid pk default gen_random_uuid(), collection_id uuid references recipe_collections(id) on delete cascade, recipe_id uuid references recipes(id) on delete cascade, user_id uuid references auth.users on delete cascade, sort_order int default 0, created_at timestamptz default now(), unique(collection_id, recipe_id))`. RLS and indexes mirror the existing `meals`/`meal_recipes` pattern (`supabase/migrations/20251201024507_create_meals_table.sql` and `20251201024509_create_meal_recipes_table.sql`) exactly: per-user SELECT/INSERT/UPDATE/DELETE policies keyed on `auth.uid() = user_id`, plus indexes on `user_id`, `collection_id`, and `recipe_id`.
  2. **Phase 2 — Service layer (S):** New `src/services/collectionService.ts` with `getCollections(userId)` (returns folders with a recipe count), `createCollection(userId, name, description?)`, `renameCollection(id, name)`, `deleteCollection(id)`, `addRecipeToCollection(collectionId, recipeId, userId)`, `removeRecipeFromCollection(collectionId, recipeId)`, and `getRecipesInCollection(collectionId)`.
  3. **Phase 3 — Hook (S):** New `src/hooks/useCollections.ts` mirroring the `useRecipes`/`useMeals` shape: a `useQuery(['collections', user.id])` for the folder list (with counts), and mutations for create/rename/delete/add-recipe/remove-recipe that invalidate `['collections', user.id]` and, where membership changes affect a filtered recipe view, `['recipes', user.id]`.
  4. **Phase 4 — UI: folder management + filter (M):** Add a "Folders" section to the recipes view (`CollectionsSidebar.tsx` or a new filter category in `FilterDrawer.tsx`) with "+ New Folder", inline rename, and delete (with a confirm dialog, not `alert()`). Selecting a folder filters the recipe grid to `getRecipesInCollection(collectionId)`.
  5. **Phase 5 — UI: "Add to Folder" action (M):** Add a `FolderPlus` (lucide-react) action to recipe cards (`RecipeLane.tsx`) and to `RecipeDetail.tsx`'s action row. Add `CollectionPickerModal.tsx` — a checklist of the user's folders plus inline "create new folder."
  6. **Phase 6 — Analytics (XS):** Track `folder_created`, `folder_deleted`, `recipe_added_to_folder`, `recipe_removed_from_folder` via `useAnalytics().track`.

- **Agent prompt:** "Implement Recipe Folders (Phases 1-3 as a first PR; Phases 4-6 can follow as a second PR if scope needs splitting). Phase 1: create a migration adding `recipe_collections` and `collection_recipes` tables with RLS and indexes mirroring `meals`/`meal_recipes` exactly (see `supabase/migrations/20251201024507_create_meals_table.sql` and `20251201024509_create_meal_recipes_table.sql`). Phase 2: create `src/services/collectionService.ts` with `getCollections`, `createCollection`, `renameCollection`, `deleteCollection`, `addRecipeToCollection`, `removeRecipeFromCollection`, and `getRecipesInCollection`. Phase 3: create `src/hooks/useCollections.ts` with a `useQuery` for the folder list (including per-folder recipe counts) and mutations for all CRUD/membership operations, invalidating `['collections', user.id]` (and `['recipes', user.id]` where relevant) on success. Use 'Folder(s)' as the user-facing term throughout to avoid confusion with the existing `is_event` meal 'Collections'. Run `npm run lint && npm run typecheck && npm run build`."

---

### Service Layer Test Coverage — OPEN

- **What:** `recipeService.ts` (427 lines), `mealService.ts` (370 lines), and `shoppingListService.ts` (137 lines) have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` and `src/lib/__tests__/mappers.test.ts` are tested.
- **Why now:** The new Playwright E2E suite (PR #55) is a major step forward for coverage of *user-facing flows*, but it exercises the app end-to-end against a live Supabase backend and won't catch logic bugs inside the service layer in isolation (e.g. the exact kind of bug fixed in `489d57e` — a markdown-formatting mismatch between `AIChat.tsx` and `parseAIRecipe` — is closer to a unit-test gap than an E2E gap, though E2E's `chat.spec.ts` may now catch regressions of that specific case). With two more service-layer changes about to land (favorites N+1 fix, community pagination), locking down `recipeService.ts` now makes both safer to review.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/services/__tests__/recipeService.test.ts`, `src/services/__tests__/mealService.test.ts`, and `src/services/__tests__/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.saveRecipe` — verify `.update()` for an existing `editingId` and `.insert()` for a new recipe; (3) `mealService` — at least one read and one write path; (4) `shoppingListService.addItem` — verify it inserts the correct shape, and `shoppingListService.clearCheckedItems` — verify it issues a delete scoped to `is_checked = true` and the given `listId`. Aim for 5+ tests per file (15+ total). Run `npx vitest run` to confirm green."

---

### Shareable Public Recipe Links — OPEN

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL — on social media, in messages, or in food blogs.
- **Why now:** Now that the app's routing is confirmed to be `wouter`-based with real URLs (see Tier 1 doc item above), adding a public `/r/:id` route outside the auth guard is more concretely scoped than previously described — it slots directly into the existing `<Switch>` in `App.tsx` alongside the other top-level routes, no new routing infrastructure needed. M effort, no blocking dependencies. PRD lists "Share meal plans" and broader sharing as a Phase 4.2 priority; this remains the most contained slice of that.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` wouter `<Route>` in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

### Special Occasion Event Planning (Phase 3 MVP) — OPEN

- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place. PRD explicitly lists this as the sole "🚧 In Progress" product phase.
- **Why now:** This unlocks the "host" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped — this is the largest remaining gap between the current app and the PRD's stated roadmap. With the E2E suite now in place, a new `/events` route and page would also get baseline regression coverage more easily than before.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` (wouter `<Route>`) with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

## Tier 3 — Strategic

### Community Recipe Ratings & Comments — OPEN

- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** The community search fix (PR #47) makes the community tab actually functional — ratings are the natural next social layer once discovery is working and paginated. Do not start until the Tier 1 community pagination work above is complete (this item was previously dropped as stale while blocked on that work, then re-added once the blocker resolved — it has not yet reappeared 3 times since being re-added, so it is not subject to the staleness rule this cycle).
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

### ai-chat Edge Function Size / Modularity — NEW

- **What:** `supabase/functions/ai-chat/index.ts` is now 1039 lines after this cycle's cuisine-classifier refactor (which did extract 172 lines into `classifier.ts` — a good precedent). The function still mixes model resolution, preference/allergy/cuisine-profile prompt injection, recently-suggested-recipe dedup, the chat call itself, and structured-recipe-response parsing in one file.
- **Why now:** This is a strategic, not urgent, item — the classifier extraction shows the team already has appetite and a working pattern for splitting this file, and each future `ai-chat` change (model system updates, new personalization signals) gets harder to review as the file grows. Worth planning a follow-on extraction (e.g. `promptBuilder.ts`, `modelResolver.ts`, `recipeResponseParser.ts`) once Tier 1/2 product items are clear — not worth interrupting current priorities for.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** (not yet — flagged for future scoping once Tier 1/2 clears) "Audit `supabase/functions/ai-chat/index.ts` and propose a module split (e.g. `promptBuilder.ts` for system-prompt construction from preferences/allergies/cuisine profiles, `modelResolver.ts` for `llm_models`/`assigned_model_id` resolution, `recipeResponseParser.ts` for structured recipe JSON parsing), following the precedent of `classifier.ts`. Each new module should be independently testable. No behavior change."

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement (dropped June 3). Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments (dropped June 3). Revisit if health tracking becomes a product direction. |
| **"UX/UI Improvement Areas" section (O-1 through O-7)** | Removed June 10 — was a documentation error unrelated to this product (see prior assessment history). |

---

## Process Notes

- **Most active cycle yet for raw commit volume:** 17 commits landed since June 11 across 2 merged PRs (#54, #55) plus direct pushes — including a real data-quality bugfix (`489d57e`, recipe titles), a meaningful backend refactor (cuisine classifier), and the project's first E2E test suite. Despite this volume, **neither of the two longest-standing Tier 1 items (favorites N+1, community pagination) was touched** — both are now at 5th/4th consecutive appearances respectively. Recommend these two are the explicit target of the next implementation cycle, in that order (N+1 fix is the smaller, purely-additive diff; pagination is the larger, more product-visible one).
- **New finding this cycle, not from the prior backlog:** the CLAUDE.md "No router" / `view`-state description is stale and has been for some time (wouter was introduced around PR #35, well before this assessment series began). Added as a new Tier 1 item — it's a docs-only fix but high-leverage given CLAUDE.md is the first thing every assessment and implementation agent reads and is instructed to treat as overriding.
- **E2E suite (PR #55) changes the calculus on "Service Layer Test Coverage" (Tier 2):** it's no longer the *only* form of test coverage being discussed, but it doesn't substitute for it either — E2E covers user flows against a live backend, unit tests would cover service-layer logic in isolation. Both remain valuable; Service Layer Test Coverage stays in Tier 2 unchanged.
- **No open GitHub issues** — still no direct user-feedback signal. The instrumentation suggestion from prior cycles (lightweight PostHog event counts for Community tab and Shopping List drawer usage) stands and would help validate whether community pagination (Tier 1) and recipe folders (Tier 2) are worth their effort once shipped.
- **Recipe Folders (Tier 2)** implementation plan from June 11 remains unchanged and shovel-ready; no code toward it has landed. It remains queued behind the two Tier 1 items above.
