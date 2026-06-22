# Improvements
_Last assessment: 2026-06-22_
_Last knowledge sync: 2026-06-22_
_Assessment based on: `git log` review of all commits since the June 18 reassessment (PR #58) on `origin/main` — confirms PR #59 (Community Recipe Pagination / Infinite Scroll) merged June 19 and nothing else has landed since. Reviewed all PRs via `list_pull_requests`/`pull_request_read` (state=all) — PR #59 merged, zero open PRs. Confirmed zero open GitHub issues via `list_issues`. Read `PRD.md` in full for roadmap/status context. Fresh code inspection: `src/hooks/useRecipes.ts` confirms `getCommunityRecipesPaginated` + `useInfiniteQuery` are live for community recipes (lines 62-76); `src/services/recipeService.ts:117` confirms `getCommunityRecipes` is now `@deprecated`. New finding from this inspection: `filteredCommunityRecipes` (lines 214-249 of `useRecipes.ts`) filters client-side over only the pages already fetched via infinite scroll — search/tag/time filters do not query the full community set, and `CommunityPage.tsx`'s "Load More" button is wired to `hasNextPageCommunity` (total remaining pages) rather than anything filter-aware, so a user searching while community recipes exceed one page gets incomplete, order-dependent results. CLAUDE.md's "No router" claim is still stale (confirmed unchanged at line 24) — this is now its 3rd consecutive appearance. `supabase/functions/ai-chat/index.ts` confirmed unchanged at 1039 lines, still only `classifier.ts` + `index.ts`. Confirmed no work has started on Recipe Folders, Shareable Public Recipe Links, Special Occasion Event Planning, Service Layer Test Coverage, or Community Ratings/Comments (grepped for `recipe_collections`/`collectionService`/`useCollections`, `src/services/__tests__`, `PublicRecipePage`/`/r/:`, `special_events`/`eventService`, `community_reactions`/`communityService` — all zero hits). Zero `alert()` calls remain in `src/`. No new TODO/FIXME markers found in `src`._

---

## Current Sprint
None — ready for next implementation run.

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Community Recipe Pagination / Infinite Scroll | ✅ Done | PR #59, merged June 19, 2026 — `recipeService.getCommunityRecipesPaginated(page, limit=12)` added; `useRecipes.ts` community query converted to `useInfiniteQuery` (mirroring the personal-recipes pattern); "Load More" button added to `CommunityPage.tsx`. Closes out the longest-standing Tier 1 item (6+ consecutive appearances). Old `getCommunityRecipes(limit)` kept but marked `@deprecated`. |
| Fix Favorites N+1 in getDashboardData | ✅ Done | PR #57, merged June 16, 2026 (commit `9dd0b42`) |
| Finish the alert() → Toast Migration (10 calls missed by PR #44) | ✅ Done | PR #54, merged June 11, 2026 (commit `086ca11`) |
| Add Playwright E2E suite for auth, recipes, chat, and planner | ✅ Done | PR #55, merged June 13, 2026 (commit `c317fdd`) |
| Shopping List: Store Categorization + "Clear Checked" Button | ✅ Done | PR #52, merged June 10, 2026 |
| Print-Friendly Recipe PDF Export | ✅ Done | PR #50, merged June 8, 2026 |

---

## Tier 1 — Quick Wins

### Community Filters Don't Search the Full Community Set — NEW

- **What:** Since PR #59 switched community recipes to `useInfiniteQuery` (12/page), `filteredCommunityRecipes` (`src/hooks/useRecipes.ts:214-249`) filters client-side over only the pages already fetched into the React Query cache. `getCommunityRecipesPaginated` takes no search/tag/time-filter args, unlike `getRecipes` (which filters server-side). The "Load More" button in `CommunityPage.tsx` is wired to `hasNextPageCommunity`/`loadMoreCommunity`, which is filter-unaware — it fetches the next unfiltered page of all community recipes, not the next page of matches. Net effect: once the community has more than 12 shared recipes, searching or tag-filtering in the Community tab silently misses matches that haven't been paged in yet, and clicking "Load More" while a filter is active does nothing useful toward finding more matches.
- **Why now:** This is a direct, foreseeable regression introduced by last cycle's own fix (PR #59) — pagination solved the "recipes beyond 24 are invisible" bug but reintroduced a milder version of the same discoverability problem for anyone who searches/filters. It's a small, contained fix in the same file already touched by PR #59, and is higher priority than any backlog item that hasn't moved in 3+ cycles.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, extend `getCommunityRecipesPaginated(page, limit, filters?)` to accept the same filter shape as `getRecipes` (`recipeType`, `searchTerm`, `selectedTags`, `selectedTimeFilter`) and apply them server-side via Supabase query builders (`.ilike`/`.contains`), matching the filter semantics already implemented client-side in `filteredCommunityRecipes` (`src/hooks/useRecipes.ts:214-249`). In `useRecipes.ts`, pass `{ recipeType, searchTerm: debouncedSearchTerm, selectedTags, selectedTimeFilter }` into the community `useInfiniteQuery`'s `queryFn` and include them in its `queryKey` (so changing a filter restarts pagination from page 0, mirroring the personal-recipes query at line 37). Remove the now-redundant client-side `filteredCommunityRecipes` `useMemo` (or reduce it to a passthrough) once server-side filtering covers the same cases. Run `npm run lint && npm run typecheck && npm run build`."

---

### Update CLAUDE.md routing description (stale "No router" claim) — OPEN, 3rd consecutive appearance

- **What:** CLAUDE.md states "**No router.** `src/App.tsx` is the single hub: a `view` state variable... switches the main panel... there are no real URLs per view." This is no longer accurate: `src/App.tsx:2` imports `Route, Switch, Redirect, useLocation` from `wouter`, with real routes at lines 141-160 — `/`, `/recipes` (nest), `/community` (nest), `/planner` (nest), `/chat`, `/settings`, `/admin`.
- **Why now:** Per the staleness rule, this item has now appeared in 3 consecutive assessments (June 15, June 18, June 22) without being picked up. Per the rule, items at this threshold should be escalated or dropped — this is escalated in place (kept Tier 1, not demoted) because it remains the single lowest-effort, lowest-risk item in the entire backlog: a pure documentation edit, zero lint/build/test surface. There is no good reason for this to keep recurring; it should be the very first thing picked up next cycle, bundled into any other PR if needed.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "Update the 'Frontend state & routing' section of `/home/user/meal-planner/CLAUDE.md`. Replace the 'No router...' paragraph with an accurate description: the app uses `wouter` for client-side routing (see `src/App.tsx`, which imports `Route, Switch, Redirect, useLocation` from `wouter`), with routes for `/`, `/recipes` (nest), `/community` (nest), `/planner` (nest), `/chat`, `/settings`, and `/admin` (admin-gated), defined around lines 141-160. Note that modals (recipe form, meal form, detail views, import/photo/onboarding) are still driven by App-level/page-level boolean state layered on top of these routes — only the top-level panel switching is route-based. Update the PostHog 'virtual paths' sentence if it's now redundant given real URLs exist. Do not change any other section. No code changes, no lint/build needed — this is a docs-only edit."

---

### ai-chat Edge Function Size / Modularity — escalated from Tier 3 (unchanged this cycle)

- **What:** `supabase/functions/ai-chat/index.ts` remains 1039 lines, unchanged since the June 15 cuisine-classifier extraction. The directory still only contains `classifier.ts` and `index.ts` — no further extraction (`promptBuilder.ts`, `modelResolver.ts`, `recipeResponseParser.ts`) has happened.
- **Why now:** Still a genuinely contained, low-risk slice now that both other Tier 1 items above are either M-effort (community filter fix) or pure docs (CLAUDE.md) — offered as a third pickup if capacity allows. Scope intentionally kept to the single most self-contained piece (pure parsing logic) rather than the full 3-module split.
- **Effort estimate:** S (for the single `recipeResponseParser.ts` extraction only; the full 3-module split remains M-L and can follow as a separate item if desired)
- **Actual effort:** —
- **Agent prompt:** "In `supabase/functions/ai-chat/index.ts` (1039 lines), extract the structured-recipe-response parsing logic into a new `supabase/functions/ai-chat/recipeResponseParser.ts` module, following the precedent of `classifier.ts`. Identify the function(s) responsible for parsing the AI's structured recipe JSON out of the chat response, move them with their types to the new file, and import them back into `index.ts`. No behavior change — this is a pure extraction. Manually review the diff for correctness (edge functions are Deno-only and not covered by the root `tsconfig`/`npm run typecheck`)."

---

## Tier 2 — Next Sprint

### Recipe Collections / Folders ("Recipe Folders") — escalated, still queued

- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." Distinct from the existing `is_event` meal Collections — in-app copy should call this **"Recipe Folders"** to avoid collision.
- **Why now:** Still shovel-ready with a full 6-phase implementation plan (schema/RLS, service layer, hook, folder filter UI, add-to-folder UI, analytics). No code toward it has landed since (confirmed June 22: zero `recipe_collections`/`collection_recipes`/`collectionService`/`useCollections` references anywhere in `src` or `supabase/migrations`). Remains the next logical Tier 2 pickup once Tier 1 clears.
- **Effort estimate:** L (decomposable into ~4 independently-shippable phases — Phase 1+2 alone could ship as a smaller M-effort first PR if Tier 2 capacity is tight)
- **Actual effort:** —

- **Implementation plan (unchanged from June 11):**
  1. **Phase 1 — Schema & RLS (S):** New migration `supabase/migrations/<timestamp>_create_recipe_collections.sql` adding `recipe_collections(id uuid pk default gen_random_uuid(), user_id uuid references auth.users on delete cascade, name text not null, description text default '', sort_order int default 0, created_at timestamptz default now(), updated_at timestamptz default now())` and `collection_recipes(id uuid pk default gen_random_uuid(), collection_id uuid references recipe_collections(id) on delete cascade, recipe_id uuid references recipes(id) on delete cascade, user_id uuid references auth.users on delete cascade, sort_order int default 0, created_at timestamptz default now(), unique(collection_id, recipe_id))`. RLS and indexes mirror the existing `meals`/`meal_recipes` pattern exactly.
  2. **Phase 2 — Service layer (S):** New `src/services/collectionService.ts` with `getCollections(userId)`, `createCollection(userId, name, description?)`, `renameCollection(id, name)`, `deleteCollection(id)`, `addRecipeToCollection(collectionId, recipeId, userId)`, `removeRecipeFromCollection(collectionId, recipeId)`, and `getRecipesInCollection(collectionId)`.
  3. **Phase 3 — Hook (S):** New `src/hooks/useCollections.ts` mirroring `useRecipes`/`useMeals`: a `useQuery(['collections', user.id])` for the folder list (with counts), and mutations invalidating `['collections', user.id]` and, where membership changes affect a filtered recipe view, `['recipes', user.id]`.
  4. **Phase 4 — UI: folder management + filter (M):** "Folders" section in the recipes view with create/rename/delete (confirm dialog, not `alert()`). Selecting a folder filters the grid to `getRecipesInCollection(collectionId)`.
  5. **Phase 5 — UI: "Add to Folder" action (M):** `FolderPlus` (lucide-react) action on recipe cards and `RecipeDetail.tsx`'s action row, plus a `CollectionPickerModal.tsx`.
  6. **Phase 6 — Analytics (XS):** Track `folder_created`, `folder_deleted`, `recipe_added_to_folder`, `recipe_removed_from_folder` via `useAnalytics().track`.

- **Agent prompt:** "Implement Recipe Folders (Phases 1-3 as a first PR; Phases 4-6 can follow as a second PR if scope needs splitting). Phase 1: create a migration adding `recipe_collections` and `collection_recipes` tables with RLS and indexes mirroring `meals`/`meal_recipes` exactly. Phase 2: create `src/services/collectionService.ts` with the listed CRUD functions. Phase 3: create `src/hooks/useCollections.ts` with a `useQuery` for the folder list (including per-folder recipe counts) and mutations for all CRUD/membership operations, invalidating `['collections', user.id]` (and `['recipes', user.id]` where relevant) on success. Use 'Folder(s)' as the user-facing term throughout to avoid confusion with the existing `is_event` meal 'Collections'. Run `npm run lint && npm run typecheck && npm run build`."

---

### Service Layer Test Coverage — OPEN

- **What:** `recipeService.ts`, `mealService.ts`, and `shoppingListService.ts` have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` and `src/lib/__tests__/mappers.test.ts` are tested. Confirmed June 22: no `src/services/__tests__/` directory exists.
- **Why now:** The Playwright E2E suite (PR #55) covers user-facing flows against a live backend but won't catch logic bugs inside the service layer in isolation. With both `recipeService.ts` (community filter fix, Tier 1 above) and `getCommunityRecipesPaginated` already touched twice in two cycles, locking down this file now makes the next change safer to review.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/services/__tests__/recipeService.test.ts`, `src/services/__tests__/mealService.test.ts`, and `src/services/__tests__/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.getCommunityRecipesPaginated` — verify `.range()` math and `hasMore` derivation; (3) `recipeService.saveRecipe` — verify `.update()` for an existing `editingId` and `.insert()` for a new recipe; (4) `mealService` — at least one read and one write path; (5) `shoppingListService.addItem`/`clearCheckedItems` — verify correct insert shape and a delete scoped to `is_checked = true` + the given `listId`. Aim for 5+ tests per file (15+ total). Run `npx vitest run` to confirm green."

---

### Shareable Public Recipe Links — OPEN

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL.
- **Why now:** The app's routing is confirmed `wouter`-based with real URLs, so adding a public `/r/:id` route outside the auth guard slots directly into the existing `<Switch>` in `App.tsx`. M effort, no blocking dependencies. PRD lists "Share meal plans" and broader sharing as a Phase 4.2 priority; this remains the most contained slice of that.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` wouter `<Route>` in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

### Special Occasion Event Planning (Phase 3 MVP) — OPEN

- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place. PRD explicitly lists this as the sole "🚧 In Progress" product phase.
- **Why now:** Unlocks the "host" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped — this is the largest remaining gap between the current app and the PRD's stated roadmap.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` (wouter `<Route>`) with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

## Tier 3 — Strategic

### Community Recipe Ratings & Comments — OPEN

- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** Community pagination (PR #59) and the filter fix above (Tier 1) make the community tab fully functional once both land — ratings are the natural next social layer once discovery is solid. Do not start until the Tier 1 community filter fix above is complete. This item has appeared in 3 consecutive cycles (June 18, June 22, and the one before) since being re-added; it is being kept rather than dropped because its blocker (community discovery correctness) only just became fully clear this cycle with the filter-gap finding — re-evaluate for staleness next cycle if still untouched.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement (dropped June 3). Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments (dropped June 3). Revisit if health tracking becomes a product direction. |
| **"UX/UI Improvement Areas" section (O-1 through O-7)** | Removed June 10 — was a documentation error unrelated to this product (see prior assessment history). |

---

## Process Notes

- **Quiet cycle:** only PR #59 (Community Recipe Pagination, merged June 19) landed since the June 18 reassessment. No other PRs opened, merged, or closed; no GitHub issues opened.
- **New finding this cycle — community pagination introduced a filter gap:** PR #59 fixed the "recipes beyond 24 are invisible" bug but, because `getCommunityRecipesPaginated` has no filter args, searching/tag-filtering in the Community tab now only operates over whatever pages have been scrolled into the cache. This is now the top Tier 1 item — it's a foreseeable side effect of last cycle's own fix and should be closed out before any other community-adjacent feature (e.g., Community Ratings & Comments) is started.
- **CLAUDE.md "No router" doc fix has now gone three consecutive cycles without being picked up** (June 15, June 18, June 22) despite being the lowest-risk, lowest-effort item available. Per the staleness rule, this is escalated in place: it stays in Tier 1 with a stronger flag rather than being dropped, since dropping a near-zero-cost documentation accuracy fix would be the wrong call. Strongly recommend it be bundled into whatever PR addresses the community filter gap above.
- **No open GitHub issues** — still no direct user-feedback signal. The instrumentation suggestion from prior cycles (lightweight PostHog event counts for Community tab search/filter usage and Shopping List drawer usage) stands, and would now also help validate whether the community filter gap finding above is actually being hit by real users before investing M effort in the fix.
- **Recipe Folders (Tier 2)** implementation plan remains unchanged and shovel-ready; no code toward it has landed. It remains queued behind the Tier 1 items above.
- **Community Recipe Ratings & Comments (Tier 3)** is being held rather than auto-dropped at its 3rd appearance, because its blocker (community discovery correctness) only became fully understood this cycle via the filter-gap finding — recommend re-evaluating for staleness next cycle if the Tier 1 filter fix has landed and this item still hasn't moved.
