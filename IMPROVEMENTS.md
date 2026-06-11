# Improvements
_Last assessment: 2026-06-11_
_Last knowledge sync: 2026-06-11_
_Assessment based on: `git fetch origin main` + `git log origin/main` (PR #52, Shopping List Store Categorization + "Clear Checked" Button, merged June 10 — the only change since the June 10 reassessment, PR #51), all PRs (state=all, sorted by created desc — PR #52 is the most recent and is merged; no other open or recently-closed PRs), open issues (none — `mcp__github__list_issues` returned 0 open issues for jdormont/meal-planner), PRD.md re-read for roadmap/phase context, and fresh code inspection: `ShoppingListDrawer.tsx` now groups items via `categorizeIngredient()` (`src/utils/ingredientCategories.ts`) with sticky amber-500 headers and a working "Clear Checked" button wired through `ShoppingListContext.clearCheckedItems()` → `shoppingListService.clearCheckedItems()` — confirmed implemented as described. A repo-wide grep for `alert(` confirms the same 10 native `alert()` calls remain in `AdminDashboard.tsx` (×7), `ShoppingListContext.tsx` (×2), and `OnboardingWizard.tsx` (×1), unchanged. `recipeService.ts` `getDashboardData` favorites N+1 (`uniqueFavIds` dedup + second `.in()` query) is still present at lines 318–328, unchanged. `getCommunityRecipes` is still hardcoded to `limit = 24` and is still the only path used for community recipes in `useRecipes.ts` (the personal recipe feed already uses `useInfiniteQuery`, but community recipes use a plain `useQuery` capped at 24). No service-layer test files exist (`src/services/__tests__` does not exist; only `src/utils/__tests__` and `src/lib/__tests__/mappers.test.ts`)._

---

## Current Sprint
None — ready for next implementation run. The "Finish the alert() → Toast Migration" item below is the recommended pickup: it is fully shovel-ready (toast utility exists, exact call sites identified) and has now gone unpicked across 6+ consecutive assessments despite being S effort.

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Shopping List: Store Categorization + "Clear Checked" Button (Tier 1) | ✅ Done | PR #52, merged June 10, 2026 — `src/utils/ingredientCategories.ts` (`categorizeIngredient`), grouped/sorted rendering with sticky amber-500 category headers in `ShoppingListDrawer.tsx`, and `clearCheckedItems()` flow through `shoppingListService` → `ShoppingListContext` → footer button (shown only when items are checked). Lint/typecheck/build all clean. |
| Print-Friendly Recipe PDF Export (Tier 1) | ✅ Done | PR #50, merged June 8, 2026 — `react-to-print` + new `RecipePrintView.tsx`; "Print / Export PDF" button wired into `RecipeDetail.tsx` action row, reuses `scaledIngredients`/`currentServings`. |
| Fix Non-Functional Community Recipe Search (Tier 1) | ✅ Done | PR #47, June 5, 2026 — `filteredCommunityRecipes` replaced with `useMemo` keyed on search term, tags, recipe type, and time filter |
| Replace browser alert() with toast notifications (Tier 1) | ✅ Done (scope as defined) | PR #44, June 5, 2026 — `react-hot-toast` installed; 18+ `alert()` calls replaced across the 7 files in scope. **Note:** 10 additional `alert()` calls in 3 files outside that PR's scope remain — tracked below. |
| DB-side ingredient search (Tier 1.1) | ✅ Done | commit `f333c88`, June 2, 2026 — `search_recipes_by_ingredient` Postgres RPC with GIN index |
| Remove debug console.logs from RecipeForm (Tier 1.3) | ✅ Done | commit `f333c88`, June 2, 2026 |
| Vercel SPA routing (404 on refresh) | ✅ Done | PRs #31–41, stable `vercel.json` with SPA rewrite |
| Route-level code splitting | ✅ Done | PR #35, June 1, 2026 |

---

## Tier 1 — Quick Wins

### Finish the alert() → Toast Migration (10 calls missed by PR #44) — OPEN

- **What:** PR #44 (merged June 5) replaced 18+ native `alert()` calls with `react-hot-toast` across 7 files and was logged as fully complete. A repo-wide grep confirms **10 native `alert()` calls are still active** in 3 files that PR #44 never touched: `AdminDashboard.tsx` (7 — every admin action: approve user [line 99], reject user [131], update user status [163], delete user [200], update user model [244], toggle model active status [274], set default model [306]), `ShoppingListContext.tsx` (2 — "All items are checked off!" info message [line 169] and a generic Instacart error [line 199]), and `OnboardingWizard.tsx` (1 — recipe-generation failure during FTUE [line 239]).
- **Why now:** The toast utility (`showSuccess`/`showError`/`showInfo` in `src/utils/toast.ts`) already exists and is proven across 7 files — this is a pure mechanical follow-on with zero new infrastructure. `AdminDashboard.tsx` is the highest-stakes surface still affected: every single admin action (the gatekeeping workflow this app depends on — see `ADMIN_APPROVAL_SYSTEM.md`) currently blocks on a jarring native dialog on failure. This item has now appeared in 6 consecutive assessments unpicked despite being S effort — it is the most "shovel-ready" item in the entire backlog and should be the next pickup.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/components/AdminDashboard.tsx`, `src/contexts/ShoppingListContext.tsx`, and `src/components/onboarding/OnboardingWizard.tsx`, replace the remaining 10 native `alert()` calls with the existing `showError`/`showSuccess`/`showInfo` helpers from `src/utils/toast.ts`, following the exact pattern PR #44 used elsewhere. In `AdminDashboard.tsx`, replace all 7 failure alerts (approve/reject/update-status/delete user, update user model, toggle model active status, set default model — lines 99, 131, 163, 200, 244, 274, 306) with `showError`. In `ShoppingListContext.tsx`, replace the 'All items are checked off!' alert (line 169) with `showInfo` and the generic Instacart error alert (line 199) with `showError`. In `OnboardingWizard.tsx`, replace the recipe-generation-failure alert (line 239) with `showError`. Leave any `confirm()` dialogs untouched (PR #44 preserved these intentionally). Run `npm run lint && npm run typecheck` to confirm no new errors."

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

_Note: with community pagination promoted to Tier 1, this cycle has 3 strong Tier 1 items (alert migration and N+1 fix are S/trivial; pagination is M but follows an existing in-repo pattern). All three are unblocked and shippable independently — recommended order: alert migration → N+1 fix → community pagination._

---

## Tier 2 — Next Sprint

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

### Recipe Collections / Folders — OPEN

- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." As a user's library grows, browsing by tags alone makes it hard to maintain ad-hoc groupings like "Sunday dinners" or "recipes to try this month." This is distinct from the existing `is_event` meal Collections (which group planned meals on the calendar, not raw recipes).
- **Why now:** Strategic, not urgent — it's a multi-surface feature (new schema + RLS, list/sidebar UI, drag-and-drop assignment, filter integration) that's worth scoping now so it's ready to pick up once the Tier 2 community-ratings and event-planning work clears. Naming needs care to avoid colliding with the existing meal "Collections" concept in the UI. This is its 3rd consecutive appearance without movement; per the stale rule it would normally be escalated or dropped, but it remains a direct PRD roadmap item with no viable smaller slice to extract — keeping it in Tier 3 with this note rather than dropping, since dropping a documented PRD roadmap item would lose institutional context. Will drop as stale next cycle if still untouched and no smaller slice can be identified.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Scope and implement recipe collections/folders. Create a migration for `recipe_collections(id uuid, user_id uuid, name text, created_at, updated_at)` and `collection_recipes(id uuid, collection_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring `meals`/`meal_recipes`. Create `src/services/collectionService.ts` with CRUD plus add/remove-recipe operations. Add a collections sidebar/filter to `RecipesPage.tsx` and an 'Add to Collection' action on recipe cards and `RecipeDetail.tsx`. Choose UI copy that clearly distinguishes these from the existing `is_event` meal Collections (e.g., call them 'Recipe Folders' in-app) to avoid user confusion."

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
- **The alert() migration item is now the longest-standing unpicked item in the backlog (6 consecutive assessments)** despite being the smallest, lowest-risk item available. If it continues to go unpicked, the next assessment should consider whether there's a structural reason (e.g., reviewer hesitation about touching `AdminDashboard.tsx`) and address that directly rather than re-surfacing the same item a 7th time.
- **Instrumentation suggestion stands**: lightweight PostHog event counts for the Community tab and Shopping List drawer would help validate whether "Community Pagination" (now Tier 1) and the shipped categorization feature are landing with users — useful context for prioritizing the Tier 2/3 community-ratings work next.
