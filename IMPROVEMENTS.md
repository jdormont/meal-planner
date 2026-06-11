# Improvements
_Last assessment: 2026-06-11_
_Last knowledge sync: 2026-06-11_
_Assessment based on: git log (PR #52, Shopping List Store Categorization + "Clear Checked" Button, merged June 11 — the only change since the June 10 reassessment, PR #51), all PRs (state=all, sorted by created desc — PR #52 is the most recent merged implementation PR; PR #53 is an open docs-only reassessment PR not yet merged), open issues (none), and confirmation that `ShoppingListDrawer.tsx` now groups items via `categorizeIngredient()` with sticky amber-500 headers and a working "Clear Checked" button._

---

## Current Sprint
None — ready for next implementation run.

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Shopping List: Store Categorization + "Clear Checked" Button (Tier 1) | ✅ Done | PR #52, merged June 11, 2026 — `src/utils/ingredientCategories.ts` (`categorizeIngredient`), grouped/sorted rendering with sticky amber-500 category headers in `ShoppingListDrawer.tsx`, and `clearCheckedItems()` flow through `shoppingListService` → `ShoppingListContext` → footer button. Lint/typecheck/build all clean. |
| Print-Friendly Recipe PDF Export (Tier 1) | ✅ Done | PR #50, merged June 8, 2026 — `react-to-print` + new `RecipePrintView.tsx`; "Print / Export PDF" button wired into `RecipeDetail.tsx` action row, reuses `scaledIngredients`/`currentServings`. Lint/typecheck/build all clean; interactive print-preview testing in Chrome/Firefox could not be completed in this environment (no browser automation/Chromium available) — flagged for manual verification if not already done. |
| Fix Non-Functional Community Recipe Search (Tier 1) | ✅ Done | PR #47, June 5, 2026 — `filteredCommunityRecipes` replaced with `useMemo` keyed on search term, tags, recipe type, and time filter |
| Replace browser alert() with toast notifications (Tier 1) | ✅ Done (scope as defined) | PR #44, June 5, 2026 — `react-hot-toast` installed; 18+ `alert()` calls replaced across the 7 files in scope. **Note:** a fresh repo-wide grep found 10 additional `alert()` calls in 3 files that were outside that PR's scope — tracked as a Tier 1 follow-on below (still open). |
| DB-side ingredient search (Tier 1.1) | ✅ Done | commit `f333c88`, June 2, 2026 — `search_recipes_by_ingredient` Postgres RPC with GIN index |
| Remove debug console.logs from RecipeForm (Tier 1.3) | ✅ Done | commit `f333c88`, June 2, 2026 |
| Vercel SPA routing (404 on refresh) | ✅ Done | PRs #31–41, stable `vercel.json` with SPA rewrite |
| Route-level code splitting | ✅ Done | PR #35, June 1, 2026 |
| SettingsPage & AdminPage stubs | ✅ Done | Pre-June 2 — now delegate to `Settings.tsx` and `AdminDashboard.tsx` |
| Shopping list item check-off | ✅ Done | Pre-June 2 — `is_checked` toggle with strikethrough in `ShoppingListDrawer.tsx` |

---

## Tier 1 — Quick Wins

### Finish the alert() → Toast Migration (10 calls missed by PR #44) — OPEN

- **What:** PR #44 (merged June 5) replaced 18+ native `alert()` calls with `react-hot-toast` across 7 files and was logged as fully complete. A repo-wide grep confirms **10 native `alert()` calls are still active** in 3 files that PR #44 never touched: `AdminDashboard.tsx` (7 — every admin action: approve user, reject user, update user status, delete user, update user model, toggle model active status, set default model), `ShoppingListContext.tsx` (2 — "All items are checked off!" info message and a generic error), and `OnboardingWizard.tsx` (1 — recipe-generation failure during FTUE).
- **Why now:** The toast utility (`showSuccess`/`showError`/`showInfo` in `src/utils/toast.ts`) already exists and is proven across 7 files — this is a pure mechanical follow-on with zero new infrastructure. `AdminDashboard.tsx` is the highest-stakes surface still affected: every single admin action (the gatekeeping workflow this app depends on — see `ADMIN_APPROVAL_SYSTEM.md`) currently blocks on a jarring native dialog on failure, which is exactly the inconsistency the original migration was meant to eliminate. This item has now appeared in 4 consecutive assessments unpicked despite being S effort — it's the most "shovel-ready" item in the backlog.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/components/AdminDashboard.tsx`, `src/contexts/ShoppingListContext.tsx`, and `src/components/onboarding/OnboardingWizard.tsx`, replace the remaining 10 native `alert()` calls with the existing `showError`/`showSuccess`/`showInfo` helpers from `src/utils/toast.ts`, following the exact pattern PR #44 used elsewhere. In `AdminDashboard.tsx`, replace all 7 failure alerts (approve/reject/update-status/delete user, update user model, toggle model active status, set default model) with `showError`. In `ShoppingListContext.tsx`, replace the 'All items are checked off!' alert with `showInfo` and the generic error alert with `showError`. In `OnboardingWizard.tsx`, replace the recipe-generation-failure alert with `showError`. Leave any `confirm()` dialogs untouched (PR #44 preserved these intentionally). Run `npm run lint && npm run typecheck` to confirm no new errors."

---

### Fix Favorites N+1 in getDashboardData — OPEN

- **What:** `recipeService.getDashboardData()` fetches favorite IDs from `recipe_ratings`, then issues a second serial query via `.in('id', uniqueFavIds)`. Two round-trips where a single Supabase join suffices. Confirmed June 10: the `uniqueFavIds` dedup + second `.in()` query pattern is still present at lines 320–325 of `recipeService.ts`, unchanged since at least June 6.
- **Why now:** A genuine half-day fix, fully self-contained in one function, with a precise one-query replacement already specified. It has now sat open for over a week despite being smaller than everything else in Tier 1 — pairing it with the alert migration above makes for an easy, low-risk "ship this week" combination.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, in `getDashboardData`, replace the two-step favorites fetch (fetch IDs from `recipe_ratings`, then `.in('id', uniqueFavIds)` from `recipes`) with a single join query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)').eq('user_id', userId).eq('rating', 'thumbs_up')`. Map the nested `recipes` object directly to the favorites array. Remove the `uniqueFavIds` dedup step. Verify the dashboard still renders the favorites shelf correctly."

---

_Note: 2 items remain at the Tier 1 bar (S effort, fully self-contained, no architectural dependencies) following the June 11 merge of the shopping-list categorization item (PR #52). The alert() → toast migration is the longest-standing unpicked item and the recommended next pickup._

---

## Tier 2 — Next Sprint

### Service Layer Test Coverage — OPEN

- **What:** `recipeService.ts` (427 lines), `mealService.ts` (370 lines), and `shoppingListService.ts` (124 lines) have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` are tested. These are the most critical data-access paths in the app.
- **Why now:** A silent bug in `saveRecipe` or `getMeals` corrupts user data with no signal. The service layer has been stable since PR #27; now is the right time to lock it down with tests before new features (Event Planning, Public Links) are built on top of it.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/test/recipeService.test.ts`, `src/test/mealService.test.ts`, and `src/test/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.saveRecipe` — verify `.update()` for an existing `editingId` and `.insert()` for a new recipe; (3) `mealService` — at least one read and one write path; (4) `shoppingListService` — verify `addItem` inserts the correct shape. Aim for 5+ tests per file (15+ total). Run `npm test` to confirm green."

---

### Community Recipe Pagination / Infinite Scroll — OPEN

- **What:** `getCommunityRecipes` is hardcoded to `limit(24)` in `recipeService.ts`; `useRecipes.ts` passes 24 as a constant. Any shared recipe beyond the first 24 is permanently invisible to all users. Confirmed June 10: still hardcoded, unchanged since at least June 6.
- **Why now:** Once the community surpasses 24 shared recipes, discovery silently breaks. The TanStack Query `useInfiniteQuery` API is already available (and already imported in `useRecipes.ts`). This is the direct, high-priority follow-on to the now-merged community search fix (PR #47) — search only operates on the 24 recipes that are fetched.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, add `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` using `.range(page * limit, (page + 1) * limit - 1)`. In `src/hooks/useRecipes.ts`, replace the static `getCommunityRecipes(24)` query with `useInfiniteQuery` keyed by `['community-recipes-paged']` and `getNextPageParam` returning the next page when `hasMore` is true. Flatten the pages array for `communityRecipes`. In `src/components/CommunityRecipes.tsx`, add a 'Load More' button at the grid bottom calling `fetchNextPage()`, hidden when `!hasNextPage`, with a spinner while `isFetchingNextPage`. Keep `getCommunityRecipes(limit)` but mark `@deprecated`."

---

### Shareable Public Recipe Links — OPEN

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL — on social media, in messages, or in food blogs. The wouter routing and RLS infrastructure are already in place.
- **Why now:** The routing refactor (PR #29) created the foundation — this requires only a new anon RLS policy, one service function, a simplified page component, and a copy-link button. M effort but no blocking dependencies. PRD lists "Share meal plans" and broader sharing as a Phase 4.2 priority; this is the most contained slice of that.
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
- **Why now:** The community search fix (PR #47) makes the community tab actually functional — ratings are the natural next social layer once discovery is working and paginated. Do not start until the Tier 2 community pagination work is complete (this item was previously dropped as stale while blocked on that work, and was re-added once the blocker resolved).
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

### Recipe Collections / Folders — OPEN

- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." As a user's library grows, browsing by tags alone makes it hard to maintain ad-hoc groupings like "Sunday dinners" or "recipes to try this month." This is distinct from the existing `is_event` meal Collections (which group planned meals on the calendar, not raw recipes).
- **Why now:** Strategic, not urgent — it's a multi-surface feature (new schema + RLS, list/sidebar UI, drag-and-drop assignment, filter integration) that's worth scoping now so it's ready to pick up once the Tier 2 community and event-planning work clears. Naming needs care to avoid colliding with the existing meal "Collections" concept in the UI.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Scope and implement recipe collections/folders. Create a migration for `recipe_collections(id uuid, user_id uuid, name text, created_at, updated_at)` and `collection_recipes(id uuid, collection_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring `meals`/`meal_recipes`. Create `src/services/collectionService.ts` with CRUD plus add/remove-recipe operations. Add a collections sidebar/filter to `RecipesPage.tsx` and an 'Add to Collection' action on recipe cards and `RecipeDetail.tsx`. Choose UI copy that clearly distinguishes these from the existing `is_event` meal Collections (e.g., call them 'Recipe Folders' in-app) to avoid user confusion."

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement (dropped June 3). Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments (dropped June 3). Revisit if health tracking becomes a product direction. |
| **"UX/UI Improvement Areas" section (O-1 through O-7)** | Removed June 10. This section was mistakenly appended to this file on June 6 (commit `5b11c99`) and documented an onboarding walkthrough of an unrelated product — "Somm", an AI sommelier wine app — not meal-planner. The previous assessment (June 7) noted it had "removed" this section, but it was still present in the file at the start of this cycle; it has now actually been deleted. If similar onboarding-flow feedback is wanted for meal-planner specifically, it should be re-collected via a walkthrough of meal-planner's own `OnboardingWizard.tsx` flow. |

---

## Process Notes

- **Five consecutive assessments (June 6–10) have found zero code changes to re-verify against** beyond the single PR #50 merge on June 8. The backlog is converging on a small, stable set of S/M items. To sharpen the next assessment, consider: (a) actually picking up one of the three Tier 1 items (alert migration and N+1 fix are both trivial and unblocked), and (b) adding lightweight usage instrumentation (PostHog event counts) for the Community tab and Shopping List drawer — this would help validate whether "Community Pagination" and "Shopping List Categorization" are worth their effort before further investment.
