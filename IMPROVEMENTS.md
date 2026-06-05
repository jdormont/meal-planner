# Improvements
_Last assessment: 2026-06-04_
_Last knowledge sync: 2026-06-04_
_Assessment based on: fresh code read of `src/hooks/useRecipes.ts` (filteredCommunityRecipes alias confirmed, community time filter also not wired to the community query), `src/components/ShoppingListDrawer.tsx` (no categorization or Clear Checked confirmed), `src/pages/CommunityPage.tsx` (alert() call confirmed), git log (last 30 commits), all PRs (none open), open issues (none). No commits since June 3 assessment._

---

## Current Sprint
None — ready for next implementation run

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Replace browser alert() with toast notifications (Tier 1) | ✅ Done | PR #44, June 5, 2026 — react-hot-toast, 18+ alert() calls replaced across 7 files |
| DB-side ingredient search (Tier 1.1) | ✅ Done | commit `f333c88`, June 2, 2026 — `search_recipes_by_ingredient` Postgres RPC with GIN index |
| Remove debug console.logs from RecipeForm (Tier 1.3) | ✅ Done | commit `f333c88`, June 2, 2026 |
| Vercel SPA routing (404 on refresh) | ✅ Done | PRs #31–41, stable `vercel.json` with SPA rewrite |
| Route-level code splitting | ✅ Done | PR #35, June 1, 2026 |
| SettingsPage & AdminPage stubs | ✅ Done | Pre-June 2 — now delegate to `Settings.tsx` and `AdminDashboard.tsx` |
| Shopping list item check-off | ✅ Done | Pre-June 2 — `is_checked` toggle with strikethrough in `ShoppingListDrawer.tsx` |
| Service layer extraction | ✅ Done | PR #27 |
| Client-side routing (wouter) + TanStack Query | ✅ Done | PR #29 |
| RecipeForm modularization + Error Boundary | ✅ Done | PR #30 |

---

## Tier 1 — Quick Wins

### Shopping List: Store Categorization + \"Clear Checked\" Button — OPEN

- **What:** Check-off is working (`is_checked` toggle with strikethrough persisted to the DB). What remains: grouping items by grocery store section so the in-store scanning experience is faster, and a \"Clear Checked\" action so the list resets cleanly after a shopping trip. Confirmed June 4: `ShoppingListDrawer.tsx` renders a flat unsorted list with no section headers and no bulk-clear action.
- **Why now:** The check-off feature alone is half-useful — a user in-store still scans a flat unsorted list. The remaining work is contained entirely in `ShoppingListDrawer.tsx` and a new utility file; no DB schema changes are needed.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/components/ShoppingListDrawer.tsx`, add two improvements to the existing check-off UI. (1) Create `src/utils/ingredientCategories.ts` exporting `categorizeIngredient(name: string): string` that maps ingredient names to store sections (Produce, Dairy, Meat & Seafood, Pantry, Frozen, Bakery, Other) using a keyword lookup table. (2) Group the rendered ingredient list by category: sort items by category name, render a sticky amber-500 `<h3>` section header above each group. (3) Add a 'Clear Checked' button in the drawer footer (left of the Instacart button) that calls a new `clearCheckedItems()` function in `src/contexts/ShoppingListContext.tsx` — remove all items where `is_checked === true` from both local state and the DB via `shoppingListService`. Only render 'Clear Checked' when at least one item is checked."

---

### Fix Non-Functional Community Recipe Search — OPEN

- **What:** `CommunityPage.tsx` renders a `RecipeSearch` bar, but `filteredCommunityRecipes` is a verbatim alias for `communityRecipes` in `useRecipes.ts` (confirmed June 4: `filteredCommunityRecipes: communityRecipes` with no derivation). Typing in the search box, toggling tags, or switching recipe type has zero effect on community results. The community time filter has the same root cause — the underlying `getCommunityRecipes(24)` query runs once on mount with no filter arguments, so search, tags, and time filter are all entirely non-functional in the community view.
- **Why now:** This is a correctness bug, not a missing feature. The fix is a `useMemo` derivation in the hook — no service or DB changes needed — and unlocks meaningful community browsing for users with growing shared recipe libraries.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/hooks/useRecipes.ts`, replace the `filteredCommunityRecipes: communityRecipes` line with a `useMemo` that filters `communityRecipes` by `debouncedSearchTerm` (matching `recipe.title`, `recipe.description`, and ingredient name strings), `selectedTags`, `recipeType`, and `selectedTimeFilter` (match against `recipe.total_time` if set). Key the memo on `[communityRecipes, debouncedSearchTerm, selectedTags, recipeType, selectedTimeFilter]`. No service or DB changes are needed — this is a pure derived-state fix inside the hook. Verify that typing in the community search bar, toggling a tag, and changing the time filter now all visibly update the community recipe grid."

---

## Tier 2 — Next Sprint

### Service Layer Test Coverage — OPEN

- **What:** `recipeService.ts` (427 lines), `mealService.ts` (370 lines), and `shoppingListService.ts` (124 lines) have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` are tested. These are the most critical data-access paths in the app.
- **Why now:** A silent bug in `saveRecipe` or `getMeals` corrupts user data with no signal. The service layer has been stable since PR #27; now is the right time to lock it down with tests before new features are built on top of it.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/test/recipeService.test.ts`, `src/test/mealService.test.ts`, and `src/test/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.saveRecipe` — verify `.update()` for an existing `editingId` and `.insert()` for a new recipe; (3) `mealService` — at least one read and one write path; (4) `shoppingListService` — verify `addItem` inserts the correct shape. Aim for 5+ tests per file (15+ total). Run `npm test` to confirm green."

---

### Community Recipe Pagination / Infinite Scroll — OPEN

- **What:** `getCommunityRecipes` is hardcoded to `limit(24)` in `recipeService.ts`; `useRecipes.ts` passes 24 as a constant. Any shared recipe beyond the first 24 is permanently invisible to all users. Naturally follows the community search fix (Tier 1 above).
- **Why now:** Once the community surpasses 24 shared recipes, discovery silently breaks. The TanStack Query `useInfiniteQuery` API is already available.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, add `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` using `.range(page * limit, (page + 1) * limit - 1)`. In `src/hooks/useRecipes.ts`, replace the static `getCommunityRecipes(24)` query with `useInfiniteQuery` keyed by `['community-recipes-paged']` and `getNextPageParam` returning the next page when `hasMore` is true. Flatten the pages array for `communityRecipes`. In `src/components/CommunityRecipes.tsx`, add a 'Load More' button at the grid bottom calling `fetchNextPage()`, hidden when `!hasNextPage`, with a spinner while `isFetchingNextPage`. Keep `getCommunityRecipes(limit)` but mark `@deprecated`."

---

### Fix Favorites N+1 in getDashboardData — OPEN

- **What:** `recipeService.getDashboardData()` fetches favorite IDs from `recipe_ratings`, then issues a second serial query via `.in('id', uniqueFavIds)`. Two round-trips where a single Supabase join suffices.
- **Why now:** A 0.5-day fix that eliminates a serial round-trip pattern before the dashboard grows. Clean it up while the code is being touched for other service work.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, in `getDashboardData`, replace the two-step favorites fetch (fetch IDs from `recipe_ratings`, then `.in('id', uniqueFavIds)` from `recipes`) with a single join query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)').eq('user_id', userId).eq('rating', 'thumbs_up')`. Map the nested `recipes` object directly to the favorites array. Remove the `uniqueFavIds` dedup step. Verify the dashboard still renders the favorites shelf correctly."

---

### Special Occasion Event Planning (Phase 3 MVP) — OPEN

- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place.
- **Why now:** This unlocks the \"host\" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

### Print-Friendly Recipe PDF Export — OPEN _(escalated from Tier 3)_

- **What:** A print/export-to-PDF button on `RecipeDetail.tsx` that renders a clean A4/letter layout: recipe title, image, metadata, ingredient list, and numbered instructions. No DB changes needed.
- **Why now:** Escalated from Tier 3 after appearing in 3 consecutive assessments without movement. S effort, self-contained, no architecture dependencies. A worthwhile add alongside any `RecipeDetail` work.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "Add a 'Print / Export PDF' button to `src/components/RecipeDetail.tsx`. Install `react-to-print`. Create `src/components/RecipePrintView.tsx` as a printable-optimized layout — recipe title, image, metadata (servings, prep/cook times), ingredient list, numbered instructions — styled for A4/letter with `@media print` CSS. Use black-and-white-friendly styles (no colored backgrounds, no icons). Wire the print button to `useReactToPrint()` referencing the `RecipePrintView` ref. Ensure the print view excludes navigation, modals, and action buttons. Test in Chrome and Firefox print preview."

---

## Tier 3 — Strategic

### Shareable Public Recipe Links — NEW

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL — on social media, in messages, or in food blogs. The wouter routing and RLS infrastructure are already in place.
- **Why now:** The routing refactor (PR #29) created the foundation. A public recipe view requires only a new Supabase RLS policy for the `anon` role, a service function that bypasses user-auth, a simplified recipe detail layout, and a 'Share' copy-link button on `RecipeDetail`.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` route in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

### Community Recipe Ratings & Comments — NEW

- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** The community tab is currently passive. Social signals are the natural next layer once the discovery features (search, pagination) are stable.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement. Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments. Revisit if health tracking becomes a product direction. |
