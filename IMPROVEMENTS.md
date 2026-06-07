# Improvements
_Last assessment: 2026-06-06_
_Last knowledge sync: 2026-06-06_
_Assessment based on: git log (last 30 commits), all PRs (PR #47 merged June 5 — no others open), open issues (none), code inspection of ShoppingListDrawer.tsx (95 lines, flat list confirmed), recipeService.ts (getDashboardData N+1 confirmed), useRecipes.ts (useMemo fix confirmed live)._

---

## Current Sprint
None — ready for next implementation run

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Fix Non-Functional Community Recipe Search (Tier 1) | ✅ Done | PR #47, June 5, 2026 — `filteredCommunityRecipes` replaced with `useMemo` keyed on search term, tags, recipe type, and time filter |
| Replace browser alert() with toast notifications (Tier 1) | ✅ Done | PR #44, June 5, 2026 — `react-hot-toast` installed; 18+ `alert()` calls replaced across 7 files |
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

### Shopping List: Store Categorization + "Clear Checked" Button — OPEN

- **What:** Check-off is working (`is_checked` toggle with strikethrough persisted to the DB). What remains: grouping items by grocery store section so the in-store scanning experience is faster, and a "Clear Checked" action so the list resets cleanly after a shopping trip. Confirmed June 6: `ShoppingListDrawer.tsx` is 95 lines, flat unsorted list with no section headers and no bulk-clear action.
- **Why now:** The check-off feature alone is half-useful — a user in-store still scans a flat unsorted list. The remaining work is contained entirely in `ShoppingListDrawer.tsx` and a new utility file; no DB schema changes are needed. With community search fixed (PR #47), this is the only remaining Tier 1 item.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/components/ShoppingListDrawer.tsx`, add two improvements to the existing check-off UI. (1) Create `src/utils/ingredientCategories.ts` exporting `categorizeIngredient(name: string): string` that maps ingredient names to store sections (Produce, Dairy, Meat & Seafood, Pantry, Frozen, Bakery, Other) using a keyword lookup table. (2) Group the rendered ingredient list by category: sort items by category name, render a sticky amber-500 `<h3>` section header above each group. (3) Add a 'Clear Checked' button in the drawer footer (left of the Instacart button) that calls a new `clearCheckedItems()` function in `src/contexts/ShoppingListContext.tsx` — remove all items where `is_checked === true` from both local state and the DB via `shoppingListService`. Only render 'Clear Checked' when at least one item is checked."

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

- **What:** `getCommunityRecipes` is hardcoded to `limit(24)` in `recipeService.ts`; `useRecipes.ts` passes 24 as a constant. Any shared recipe beyond the first 24 is permanently invisible to all users. The community search fix (PR #47) now correctly filters over those 24, making pagination the highest-priority remaining community issue.
- **Why now:** Once the community surpasses 24 shared recipes, discovery silently breaks. The TanStack Query `useInfiniteQuery` API is already available. This is the direct follow-on to the now-merged community search fix.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, add `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` using `.range(page * limit, (page + 1) * limit - 1)`. In `src/hooks/useRecipes.ts`, replace the static `getCommunityRecipes(24)` query with `useInfiniteQuery` keyed by `['community-recipes-paged']` and `getNextPageParam` returning the next page when `hasMore` is true. Flatten the pages array for `communityRecipes`. In `src/components/CommunityRecipes.tsx`, add a 'Load More' button at the grid bottom calling `fetchNextPage()`, hidden when `!hasNextPage`, with a spinner while `isFetchingNextPage`. Keep `getCommunityRecipes(limit)` but mark `@deprecated`."

---

### Fix Favorites N+1 in getDashboardData — OPEN

- **What:** `recipeService.getDashboardData()` fetches favorite IDs from `recipe_ratings`, then issues a second serial query via `.in('id', uniqueFavIds)`. Two round-trips where a single Supabase join suffices. Confirmed June 6: `uniqueFavIds` dedup + second `.in()` query pattern still present at lines 320–325 of `recipeService.ts`.
- **Why now:** A 0.5-day fix that eliminates a serial round-trip pattern before the dashboard grows. Clean it up while the code is being touched for other service work.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, in `getDashboardData`, replace the two-step favorites fetch (fetch IDs from `recipe_ratings`, then `.in('id', uniqueFavIds)` from `recipes`) with a single join query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)').eq('user_id', userId).eq('rating', 'thumbs_up')`. Map the nested `recipes` object directly to the favorites array. Remove the `uniqueFavIds` dedup step. Verify the dashboard still renders the favorites shelf correctly."

---

### Special Occasion Event Planning (Phase 3 MVP) — OPEN

- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place.
- **Why now:** This unlocks the "host" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

### Print-Friendly Recipe PDF Export — OPEN _(escalated from Tier 3 at June 3 assessment)_

- **What:** A print/export-to-PDF button on `RecipeDetail.tsx` that renders a clean A4/letter layout: recipe title, image, metadata, ingredient list, and numbered instructions. No DB changes needed.
- **Why now:** Escalated from Tier 3 after 3 consecutive appearances. S effort, self-contained, no architecture dependencies. A worthwhile add alongside any `RecipeDetail` work.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "Add a 'Print / Export PDF' button to `src/components/RecipeDetail.tsx`. Install `react-to-print`. Create `src/components/RecipePrintView.tsx` as a printable-optimized layout — recipe title, image, metadata (servings, prep/cook times), ingredient list, numbered instructions — styled for A4/letter with `@media print` CSS. Use black-and-white-friendly styles (no colored backgrounds, no icons). Wire the print button to `useReactToPrint()` referencing the `RecipePrintView` ref. Ensure the print view excludes navigation, modals, and action buttons. Test in Chrome and Firefox print preview."

---

### Shareable Public Recipe Links — OPEN _(escalated from Tier 3 at June 5 assessment)_

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL — on social media, in messages, or in food blogs. The wouter routing and RLS infrastructure are already in place.
- **Why now:** Escalated from Tier 3 after 3 consecutive appearances. The routing refactor (PR #29) created the foundation — this requires only a new anon RLS policy, one service function, a simplified page component, and a copy-link button. M effort but no blocking dependencies.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` route in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

## Tier 3 — Strategic

### Community Recipe Ratings & Comments — OPEN

- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** The community search fix (PR #47) makes the community tab actually functional — ratings are the natural next social layer once discovery is working and paginated. Do not start until the Tier 2 community pagination work is complete.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement. Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments. Revisit if health tracking becomes a product direction. |

---

## UX/UI Improvement Areas

_Assessment Date: June 6, 2026_
_Source: Manual end-to-end walkthrough of the onboarding flow on [somm.joshdormont.com](https://somm.joshdormont.com) using a test account._

### O-1 No Required Selection on "Favorite Styles" (Step 1)

The first onboarding step asks users to choose wine types they enjoy (Red, White, Rosé, etc.), but allows advancing without selecting any. For a taste-profile product, this is the most important question in the flow. A user who skips it will receive generic recommendations with no personalization signal.

- **Recommendation:** Require at least one selection before "Next" is enabled, or add an explicit "Skip / I'm not sure yet" affordance that makes the intentional skip clear — and surfaces a prompt to complete it later.
- **Estimated Effort:** S | **Impact:** Medium

### O-2 Progress Bar Step Count Mismatch

The progress indicator at the top of the onboarding modal renders **7 dots**, but only **6 steps** were presented during the walkthrough (Favorite Styles → Regions → Flavor Profile → Avoidances → Adventurousness → Budget). Either a step is conditionally hidden without updating the indicator, or the dot count is hardcoded incorrectly.

- **Recommendation:** Audit the step array used to render the progress bar and ensure it matches the actual rendered step count. If steps are conditionally skipped, derive the dot count dynamically.
- **Estimated Effort:** S | **Impact:** Low (polish)

### O-3 Restaurant Budget Min Shows Wrong Value After Save

During onboarding, the Restaurant budget min field defaulted to **$38**. After completing onboarding and navigating to the Preferences page, the stored Restaurant min was **$50** — not the displayed default. This is either a state mutation bug (editing the store min field triggering an incorrect update on the restaurant min), or the restaurant min being silently snapped to a floor relative to another field.

- **Recommendation:** Investigate the budget state management in the onboarding step. Add a validation guard so that if `restaurantMin < storeMin`, a warning is shown rather than silently overwriting the value. Add a regression test covering the budget save path.
- **Estimated Effort:** S | **Impact:** Medium (data correctness)

### O-4 Silent Dismiss — No Re-Entry Path for Skipped Onboarding

The welcome modal ("Welcome to Somm") has an ✕ close button. Clicking it silently skips the entire profile-building flow with no messaging. Users who dismiss it have no indication that they skipped something, and there is no prompt or nudge to revisit it later. This is a meaningful retention risk — new users who close the modal without building a profile will receive worse recommendations and may churn.

- **Recommendation:** On dismiss, show a brief inline banner or persistent widget in the dashboard (e.g., "Your taste profile is incomplete — finish setup for better recommendations") that links back to the onboarding wizard. Alternatively, surface the wizard from the Tastes/Preferences page so re-entry is clearly discoverable.
- **Estimated Effort:** M | **Impact:** Medium-High

### O-5 No Success Feedback After Completing Onboarding

After clicking "Finish" on the final onboarding step, the modal closes and the user lands on the dashboard with no confirmation. There is no toast, animation, or banner indicating that the profile was saved. For a multi-step setup flow, the absence of a completion moment feels abrupt and leaves users uncertain whether their choices were recorded.

- **Recommendation:** Show a brief success toast ("Taste profile saved! Recommendations are now personalized for you.") immediately after "Finish" is clicked, before the modal closes.
- **Estimated Effort:** S | **Impact:** Low-Medium (polish, confidence)

### O-6 No Contextual Explanation of How Preferences Affect Results

Questions like "Flavor Profile" and "Adventurousness" appear without any hint of what they influence. A wine-curious new user may not know what "Mineral" or "Tannic" means in the context of recommendations, and there is no tooltip, info icon, or sub-copy explaining how these inputs are used.

- **Recommendation:** Add a one-line subheading or info icon on each step explaining the impact (e.g., _"Used to rank match scores in your scan results"_). For flavor terminology, consider adding a brief tooltip or example wine on hover.
- **Estimated Effort:** S | **Impact:** Medium (comprehension, completion rate)

### O-7 Budget Input is Free-Text with No Range Validation

The budget step uses plain `<input type="text">` fields for min/max price. No validation was observed preventing nonsensical entries (e.g., min > max, negative values, non-numeric input). The rest of the Preferences page uses range sliders for continuous values, making the text inputs visually inconsistent and behaviorally fragile.

- **Recommendation:** Either replace the text inputs with a dual-handle range slider (consistent with the Preferences page), or add inline validation: enforce numeric-only input, clamp to reasonable bounds (e.g., $1–$999), and show an error if min ≥ max. Display a currency symbol prefix inside the field for clarity.
- **Estimated Effort:** M | **Impact:** Medium (correctness + consistency)
