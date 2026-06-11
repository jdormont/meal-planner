# Improvements
_Last assessment: 2026-06-11_
_Last knowledge sync: 2026-06-11_
_Assessment based on: `git fetch origin main` + `git log origin/main` (PR #52, Shopping List Store Categorization + "Clear Checked" Button, merged June 10 — the only change to `main` since the June 10 reassessment, PR #51), all PRs (state=all, sorted by created desc — PR #52 is the most recent merged implementation PR; PR #54 is an open implementation PR, not yet merged, addressing the alert() → toast migration item below), open issues (none), and confirmation that `ShoppingListDrawer.tsx` now groups items via `categorizeIngredient()` with sticky amber-500 headers and a working "Clear Checked" button. A repo-wide grep for `alert(` previously confirmed the same 10 native `alert()` calls remained in `AdminDashboard.tsx` (×7), `ShoppingListContext.tsx` (×2), and `OnboardingWizard.tsx` (×1) — PR #54 replaces all 10 with `showError`/`showInfo` from `src/utils/toast.ts`. `recipeService.ts` `getDashboardData` favorites N+1 (`uniqueFavIds` dedup + second `.in()` query) is still present at lines 318–328, unchanged. `getCommunityRecipes` is still hardcoded to `limit = 24` and is still the only path used for community recipes in `useRecipes.ts` (the personal recipe feed already uses `useInfiniteQuery`, but community recipes use a plain `useQuery` capped at 24). No service-layer test files exist (`src/services/__tests__` does not exist; only `src/utils/__tests__` and `src/lib/__tests__/mappers.test.ts`)._

---

## Current Sprint
Finish the alert() → Toast Migration (Tier 1) — `[IN PROGRESS — PR: #54]`

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Shopping List: Store Categorization + "Clear Checked" Button (Tier 1) | ✅ Done | PR #52, merged June 10, 2026 — `src/utils/ingredientCategories.ts` (`categorizeIngredient`), grouped/sorted rendering with sticky amber-500 category headers in `ShoppingListDrawer.tsx`, and `clearCheckedItems()` flow through `shoppingListService` → `ShoppingListContext` → footer button (shown only when items are checked). Lint/typecheck/build all clean. |
| Print-Friendly Recipe PDF Export (Tier 1) | ✅ Done | PR #50, merged June 8, 2026 — `react-to-print` + new `RecipePrintView.tsx`; "Print / Export PDF" button wired into `RecipeDetail.tsx` action row, reuses `scaledIngredients`/`currentServings`. Lint/typecheck/build all clean; interactive print-preview testing in Chrome/Firefox could not be completed in this environment (no browser automation/Chromium available) — flagged for manual verification if not already done. |
| Fix Non-Functional Community Recipe Search (Tier 1) | ✅ Done | PR #47, June 5, 2026 — `filteredCommunityRecipes` replaced with `useMemo` keyed on search term, tags, recipe type, and time filter |
| Replace browser alert() with toast notifications (Tier 1) | ✅ Done (scope as defined) | PR #44, June 5, 2026 — `react-hot-toast` installed; 18+ `alert()` calls replaced across the 7 files in scope. **Note:** 10 additional `alert()` calls in 3 files outside that PR's scope remain — tracked below. |
| DB-side ingredient search (Tier 1.1) | ✅ Done | commit `f333c88`, June 2, 2026 — `search_recipes_by_ingredient` Postgres RPC with GIN index |
| Remove debug console.logs from RecipeForm (Tier 1.3) | ✅ Done | commit `f333c88`, June 2, 2026 |
| Vercel SPA routing (404 on refresh) | ✅ Done | PRs #31–41, stable `vercel.json` with SPA rewrite |
| Route-level code splitting | ✅ Done | PR #35, June 1, 2026 |

---

## Tier 1 — Quick Wins

### Finish the alert() → Toast Migration (10 calls missed by PR #44) — `[IN PROGRESS — PR: #54]`

- **What:** PR #44 (merged June 5) replaced 18+ native `alert()` calls with `react-hot-toast` across 7 files and was logged as fully complete. A repo-wide grep confirmed 10 native `alert()` calls were still active in 3 files that PR #44 never touched: `AdminDashboard.tsx` (7 — every admin action: approve user [line 99], reject user [131], update user status [163], delete user [200], update user model [244], toggle model active status [274], set default model [306]), `ShoppingListContext.tsx` (2 — "All items are checked off!" info message [line 169] and a generic Instacart error [line 199]), and `OnboardingWizard.tsx` (1 — recipe-generation failure during FTUE [line 239]).
- **Status:** PR #54 replaces all 10 calls with `showError`/`showInfo` from `src/utils/toast.ts`, following the PR #44 pattern. `confirm()` dialogs left untouched. `npm run lint`/`typecheck`/`build` all clean. Awaiting review/merge. This item had previously gone unpicked across 6 consecutive assessments despite being S effort and the most "shovel-ready" item in the backlog.
- **Effort estimate:** S
- **Actual effort:** S

---

### Fix Favorites N+1 in getDashboardData — OPEN

- **What:** `recipeService.getDashboardData()` fetches favorite IDs from `recipe_ratings`, then issues a second serial query via `.in('id', uniqueFavIds)`. Two round-trips where a single Supabase join suffices. Confirmed June 11: the `uniqueFavIds` dedup + second `.in()` query pattern is still present at lines 318–328 of `recipeService.ts`, unchanged since at least June 6.
- **Why now:** A genuine half-day fix, fully self-contained in one function, with a precise one-query replacement already specified. It has now sat open for over a week despite being smaller than everything else in Tier 1 — pairing it with the alert migration above makes for an easy, low-risk "ship this week" combination.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, in `getDashboardData`, replace the two-step favorites fetch (fetch IDs from `recipe_ratings`, then `.in('id', uniqueFavIds)` from `recipes`) with a single join query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)').eq('user_id', userId).eq('rating', 'thumbs_up')`. Map the nested `recipes` object directly to the favorites array. Remove the `uniqueFavIds` dedup step. Verify the dashboard still renders the favorites shelf correctly."

---

### Community Recipe Pagination / Infinite Scroll — promoted from Tier 2

- **What:** `getCommunityRecipes` is hardcoded to `limit(24)` in `recipeService.ts`; `useRecipes.ts` fetches it via a single `useQuery` (not `useInfiniteQuery`, unlike the personal recipe feed which already uses `useInfiniteQuery`). Any shared recipe beyond the first 24 is permanently invisible to all users. Confirmed June 11: still hardcoded, unchanged since at least June 6.
- **Why now:** Once the community surpasses 24 shared recipes, discovery silently breaks with no error or signal to users — a silent product cliff. The `useInfiniteQuery` pattern is already proven in this exact hook for the personal recipe feed (`useRecipes.ts` lines ~30-58), so this is now a copy-adapt of an existing, working pattern rather than new infrastructure — promoting from Tier 2 to Tier 1 on the strength of that precedent and the now-fixed community search (PR #47), which only operates on the 24 recipes fetched.
- **Effort estimate:** M (down from prior M-but-Tier-2; the proven in-repo pattern reduces real risk even though the line count is similar)
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, add `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` using `.range(page * limit, (page + 1) * limit - 1)`, mirroring the pagination shape already returned by `getRecipes`. In `src/hooks/useRecipes.ts`, replace the static `useQuery(['community-recipes'], () => getCommunityRecipes(24))` with a second `useInfiniteQuery` (the personal recipes query above it in the same file is the template), keyed by `['community-recipes-paged']` and `getNextPageParam` returning the next page when `hasMore` is true. Flatten the pages array for `communityRecipes`, and expose `fetchNextPageCommunity`/`hasNextPageCommunity`/`isFetchingNextPageCommunity` (or similarly named) from the hook. In `src/components/CommunityPage.tsx` (or wherever the community grid renders), add a 'Load More' button at the grid bottom calling the new fetch-next function, hidden when there's no next page, with a spinner while fetching. Keep `getCommunityRecipes(limit)` but mark `@deprecated`. Run `npm run lint && npm run typecheck && npm run build`."

---

_Note: with the alert() → toast migration in progress (PR #54) and community pagination promoted to Tier 1, this cycle has 3 strong Tier 1 items (alert migration and N+1 fix are S/trivial; pagination is M but follows an existing in-repo pattern). Once PR #54 merges, "Fix Favorites N+1 in getDashboardData" and community pagination remain as the next pickups — recommended order: N+1 fix → community pagination._

---

## Tier 2 — Next Sprint

### Recipe Collections / Folders ("Recipe Folders") — promoted from Tier 3, planned for next cycle

- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." As a user's library grows, browsing by tags alone makes it hard to maintain ad-hoc groupings like "Sunday dinners," "recipes to try this month," or "go-to weeknight meals." This is distinct from the existing `is_event` meal Collections (which group planned meals on the calendar with servings/dates, not raw recipes) — in-app copy should call this feature **"Recipe Folders"** to avoid that collision.
- **Why now:** Manually escalated from Tier 3 to Tier 2 on 2026-06-11 (this was its 3rd consecutive appearance in Tier 3 without movement, and the prior assessment flagged it would be dropped as stale next cycle if no smaller slice emerged). Rather than drop it, it's been scoped into the phased plan below so it's shovel-ready for the next implementation cycle once the current Tier 1 items (alert migration, favorites N+1, community pagination) clear.
- **Effort estimate:** L (decomposable into ~4 independently-shippable phases — see plan below; Phase 1+2 alone could ship as a smaller M-effort first PR if Tier 2 capacity is tight)
- **Actual effort:** —

- **Implementation plan:**
  1. **Phase 1 — Schema & RLS (S):** New migration `supabase/migrations/<timestamp>_create_recipe_collections.sql` adding `recipe_collections(id uuid pk default gen_random_uuid(), user_id uuid references auth.users on delete cascade, name text not null, description text default '', sort_order int default 0, created_at timestamptz default now(), updated_at timestamptz default now())` and `collection_recipes(id uuid pk default gen_random_uuid(), collection_id uuid references recipe_collections(id) on delete cascade, recipe_id uuid references recipes(id) on delete cascade, user_id uuid references auth.users on delete cascade, sort_order int default 0, created_at timestamptz default now(), unique(collection_id, recipe_id))`. RLS and indexes mirror the existing `meals`/`meal_recipes` pattern (`supabase/migrations/20251201024507_create_meals_table.sql` and `20251201024509_create_meal_recipes_table.sql`) exactly: per-user SELECT/INSERT/UPDATE/DELETE policies keyed on `auth.uid() = user_id`, plus indexes on `user_id`, `collection_id`, and `recipe_id`.
  2. **Phase 2 — Service layer (S):** New `src/services/collectionService.ts` with `getCollections(userId)` (returns folders with a recipe count — either a `count` aggregate per collection or a follow-up grouped count query), `createCollection(userId, name, description?)`, `renameCollection(id, name)`, `deleteCollection(id)`, `addRecipeToCollection(collectionId, recipeId, userId)`, `removeRecipeFromCollection(collectionId, recipeId)`, and `getRecipesInCollection(collectionId)` (fetch `collection_recipes.recipe_id` for the collection, then `.in('id', recipeIds)` against `recipes` — acceptable two-step here since folder sizes are small, unlike the community-pagination N+1).
  3. **Phase 3 — Hook (S):** New `src/hooks/useCollections.ts` mirroring the `useRecipes`/`useMeals` shape: a `useQuery(['collections', user.id])` for the folder list (with counts), and mutations for create/rename/delete/add-recipe/remove-recipe that invalidate `['collections', user.id]` and, where membership changes affect a filtered recipe view, `['recipes', user.id]`.
  4. **Phase 4 — UI: folder management + filter (M):** Add a "Folders" section to the recipes view — either a new `CollectionsSidebar.tsx` or a new filter category inside `FilterDrawer.tsx` (`src/components/FilterDrawer.tsx` already has a category/tag pattern at lines ~190-230 to follow) — with "+ New Folder", inline rename, and delete (with a confirm dialog, not `alert()` — use the existing toast/confirm patterns). Selecting a folder filters the recipe grid to `getRecipesInCollection(collectionId)`.
  5. **Phase 5 — UI: "Add to Folder" action (M):** Add a `FolderPlus` (lucide-react) action to recipe cards (`RecipeLane.tsx` grid items) and to the action row in `RecipeDetail.tsx` (alongside Edit/Copy/Print, ~line 518-530). Add a new `CollectionPickerModal.tsx` — a checklist of the user's folders (toggling calls `addRecipeToCollection`/`removeRecipeFromCollection`) plus an inline "create new folder" input.
  6. **Phase 6 — Analytics (XS):** Track `folder_created`, `folder_deleted`, `recipe_added_to_folder`, and `recipe_removed_from_folder` via the existing `useAnalytics().track`, following the naming/payload conventions already used for `recipe_created` in `useRecipes.ts`.

- **Agent prompt:** "Implement Recipe Folders (Phases 1-3 as a first PR; Phases 4-6 can follow as a second PR if scope needs splitting). Phase 1: create a migration adding `recipe_collections` and `collection_recipes` tables with RLS and indexes mirroring `meals`/`meal_recipes` exactly (see `supabase/migrations/20251201024507_create_meals_table.sql` and `20251201024509_create_meal_recipes_table.sql` for the pattern). Phase 2: create `src/services/collectionService.ts` with `getCollections`, `createCollection`, `renameCollection`, `deleteCollection`, `addRecipeToCollection`, `removeRecipeFromCollection`, and `getRecipesInCollection`. Phase 3: create `src/hooks/useCollections.ts` with a `useQuery` for the folder list (including per-folder recipe counts) and mutations for all CRUD/membership operations, invalidating `['collections', user.id]` (and `['recipes', user.id]` where relevant) on success. Phase 4: add a 'Folders' filter section to `FilterDrawer.tsx` (or a new `CollectionsSidebar.tsx`) with create/rename/delete, and wire folder selection to filter the recipe grid via `getRecipesInCollection`. Phase 5: add a `FolderPlus` 'Add to Folder' action to `RecipeLane.tsx` cards and `RecipeDetail.tsx`'s action row, opening a new `CollectionPickerModal.tsx` checklist (with inline folder creation) that calls the add/remove mutations. Phase 6: add `folder_created`/`folder_deleted`/`recipe_added_to_folder`/`recipe_removed_from_folder` analytics events via `useAnalytics().track`. Use 'Folder(s)' as the user-facing term throughout to avoid confusion with the existing `is_event` meal 'Collections'. Run `npm run lint && npm run typecheck && npm run build`."

---

### Service Layer Test Coverage — OPEN

- **What:** `recipeService.ts` (427 lines), `mealService.ts` (370 lines), and `shoppingListService.ts` (137 lines) have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` and `src/lib/__tests__/mappers.test.ts` are tested. These are the most critical data-access paths in the app, and `shoppingListService.ts` just grew by 13 lines (PR #52's `clearCheckedItems`) with no accompanying test.
- **Why now:** A silent bug in `saveRecipe`, `getMeals`, or the new `clearCheckedItems` corrupts user data with no signal. The service layer has been stable since PR #27 but is now accumulating untested surface area each sprint (categorization + clear-checked, dashboard N+1 fix once shipped, community pagination once shipped). Locking down the existing service layer with tests now makes all three Tier 1 items above safer to land and review.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/services/__tests__/recipeService.test.ts`, `src/services/__tests__/mealService.test.ts`, and `src/services/__tests__/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.saveRecipe` — verify `.update()` for an existing `editingId` and `.insert()` for a new recipe; (3) `mealService` — at least one read and one write path; (4) `shoppingListService.addItem` — verify it inserts the correct shape, and `shoppingListService.clearCheckedItems` — verify it issues a delete scoped to `is_checked = true` and the given `listId`. Aim for 5+ tests per file (15+ total). Run `npx vitest run` to confirm green."

---

### Shareable Public Recipe Links — OPEN

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL — on social media, in messages, or in food blogs. The routing infrastructure and RLS patterns are already in place.
- **Why now:** This requires only a new anon RLS policy, one service function, a simplified page component, and a copy-link button. M effort but no blocking dependencies. PRD lists "Share meal plans" and broader sharing as a Phase 4.2 priority; this is the most contained slice of that, and now that PDF export (PR #50) and shopping list categorization (PR #52) are both done, it's the most product-facing M-effort item left unstarted.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` route in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

### Special Occasion Event Planning (Phase 3 MVP) — OPEN

- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place. PRD explicitly lists this as the sole "🚧 In Progress" product phase.
- **Why now:** This unlocks the "host" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped — this is the largest remaining gap between the current app and the PRD's stated roadmap.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

## Tier 3 — Strategic

### Community Recipe Ratings & Comments — OPEN

- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** The community search fix (PR #47) makes the community tab actually functional — ratings are the natural next social layer once discovery is working and paginated. Do not start until the Tier 1 community pagination work above is complete (this item was previously dropped as stale while blocked on that work, and was re-added once the blocker resolved).
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement (dropped June 3). Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments (dropped June 3). Revisit if health tracking becomes a product direction. |
| **"UX/UI Improvement Areas" section (O-1 through O-7)** | Removed June 10. This section was mistakenly appended to this file on June 6 (commit `5b11c99`) and documented an onboarding walkthrough of an unrelated product — "Somm", an AI sommelier wine app — not meal-planner. It has been deleted. If similar onboarding-flow feedback is wanted for meal-planner specifically, it should be re-collected via a walkthrough of meal-planner's own `OnboardingWizard.tsx` flow. |

---

## Process Notes

- **No code changes landed except PR #52** since the June 10 assessment — a single, well-scoped Tier 1 item shipped cleanly. The backlog continues to converge: with PR #52 done, only 2 of the prior 3 Tier 1 items remain (alert migration, N+1 fix), so this cycle promotes Community Recipe Pagination from Tier 2 to Tier 1 to keep 3 items in the top tier, on the strength of the now-proven `useInfiniteQuery` pattern already used for personal recipes in the same hook.
- **The alert() migration item is now in progress (PR #54)** after going unpicked across 6 consecutive assessments despite being the smallest, lowest-risk item available. Once PR #54 merges, "Fix Favorites N+1 in getDashboardData" becomes the next recommended pickup, followed by community pagination.
- **Instrumentation suggestion stands**: lightweight PostHog event counts for the Community tab and Shopping List drawer would help validate whether "Community Pagination" (now Tier 1) and the shipped categorization feature are landing with users — useful context for prioritizing the Tier 2/3 community-ratings work next.
- **2026-06-11 manual reprioritization**: "Recipe Collections / Folders" was manually escalated from Tier 3 to Tier 2 and broken into a 6-phase implementation plan (see Tier 2 entry above), per direct request rather than the automated assessment cycle. It is queued for the cycle after the current Tier 1 items (alert migration, favorites N+1 fix, community pagination) — Phases 1-3 (schema, service, hook) are a self-contained first slice if a smaller PR is preferred.
