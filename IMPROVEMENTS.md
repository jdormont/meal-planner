# Improvements
_Last assessment: 2026-06-18_
_Last knowledge sync: 2026-06-15_
_Assessment based on: `git log` review of all commits since the June 15 reassessment (PR #56) — confirms PR #57 (Favorites N+1 fix) merged June 16 and nothing else has landed since. Reviewed all PRs via `list_pull_requests` (state=all, sorted by updated desc) — PR #57 merged, no other open PRs. Confirmed zero open GitHub issues. Read `PRD.md` in full for roadmap/status context. Re-verified via fresh code inspection: `getCommunityRecipes` in `recipeService.ts:116` is still hardcoded to `limit = 24`; `useRecipes.ts:63` still uses a plain `useQuery` for community recipes while personal recipes (`useRecipes.ts:37`) use `useInfiniteQuery`; the favorites N+1 fix (`recipeService.ts:309-319`) is confirmed live as a single joined query; `src/App.tsx` still uses `wouter` with real routes, so the CLAUDE.md "No router" claim remains stale; `supabase/functions/ai-chat/index.ts` remains 1039 lines with no further modularization beyond `classifier.ts`. Confirmed no work has started on Recipe Folders, Shareable Public Recipe Links, Special Occasion Event Planning, or Service Layer Test Coverage. Zero `alert()` calls remain in `src/`. No new code-health issues found in `recipeService.ts`, `mealService.ts`, `shoppingListService.ts`, `useRecipes.ts`, `useMeals.ts`, `ShoppingListContext.tsx`, `RecipeDetail.tsx`._

---

## Current Sprint
Community Recipe Pagination / Infinite Scroll (Tier 1) — `[IN PROGRESS — PR: #59]`

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| Fix Favorites N+1 in getDashboardData | ✅ Done | PR #57, merged June 16, 2026 (commit `9dd0b42`) — `recipeService.getDashboardData()`'s two-step favorites fetch (ID lookup + second `.in()` query) replaced with a single joined query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)').eq('user_id', userId).eq('rating', 'thumbs_up').limit(20)`. Closes out the most over-tracked item in the backlog (6+ consecutive appearances before pickup). |
| Finish the alert() → Toast Migration (10 calls missed by PR #44) | ✅ Done | PR #54, merged June 11, 2026 (commit `086ca11`) |
| Add Playwright E2E suite for auth, recipes, chat, and planner | ✅ Done | PR #55, merged June 13, 2026 (commit `c317fdd`) |
| Fix recipe title loss when saving AI chat suggestions | ✅ Done | commit `489d57e`, June 13, 2026 |
| Two-pass cuisine classifier + wouter routing/lifecycle fixes | ✅ Done | commit `4a6f7e2`, June 13, 2026 |
| Vercel preview CORS fix for ai-chat | ✅ Done | commit `dab7327`, June 13, 2026 |
| Shopping List: Store Categorization + "Clear Checked" Button (Tier 1) | ✅ Done | PR #52, merged June 10, 2026 |
| Print-Friendly Recipe PDF Export (Tier 1) | ✅ Done | PR #50, merged June 8, 2026 |

---

## Tier 1 — Quick Wins

### Community Recipe Pagination / Infinite Scroll — IN PROGRESS

- **What:** `getCommunityRecipes` is hardcoded to `limit(24)` at `src/services/recipeService.ts:116`; `src/hooks/useRecipes.ts:63` fetches it via a plain `useQuery` (not `useInfiniteQuery`, unlike the personal recipe feed at line 37, which already uses `useInfiniteQuery`). Any shared recipe beyond the first 24 is permanently invisible to all users.
- **Why now:** This is now the single longest-standing open item in the backlog — its 5th consecutive appearance, unchanged since at least June 6. With the favorites N+1 fix shipped, this is unambiguously the next most "shovel-ready" item and the highest-priority pickup this cycle. The `useInfiniteQuery` pattern is proven in this exact hook for the personal recipe feed, so this remains a copy-adapt of an existing, working pattern. Every day the community feature gets used without this fix increases the chance of a silent discovery cliff.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "In `src/services/recipeService.ts`, add `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` using `.range(page * limit, (page + 1) * limit - 1)`, mirroring the pagination shape already returned by `getRecipes`. In `src/hooks/useRecipes.ts`, replace the static `useQuery` for community recipes (currently around line 63) with a second `useInfiniteQuery` (the personal recipes query at line 37 in the same file is the template), keyed by `['community-recipes-paged']` and `getNextPageParam` returning the next page when `hasMore` is true. Flatten the pages array for `communityRecipes`, and expose `fetchNextPageCommunity`/`hasNextPageCommunity`/`isFetchingNextPageCommunity` (or similarly named) from the hook. In the community grid component, add a 'Load More' button at the grid bottom calling the new fetch-next function, hidden when there's no next page, with a spinner while fetching. Keep `getCommunityRecipes(limit)` but mark `@deprecated`. Run `npm run lint && npm run typecheck && npm run build`."

---

### Update CLAUDE.md routing description (stale "No router" claim) — OPEN

- **What:** CLAUDE.md states "**No router.** `src/App.tsx` is the single hub: a `view` state variable... switches the main panel... there are no real URLs per view." This is no longer accurate: `src/App.tsx:2` imports `Route, Switch, Redirect, useLocation` from `wouter`, with real routes at lines 141-160 — `/`, `/recipes` (nest), `/community` (nest), `/planner` (nest), `/chat`, `/settings`, `/admin`.
- **Why now:** This is a trivial documentation fix, but a high-leverage one — CLAUDE.md is read first by every agent (including this one) and "overrides any default behavior." This is now its 2nd consecutive appearance without being picked up, despite being the lowest-effort item in the entire backlog (a docs-only edit, no lint/build/test risk). It should be the easiest possible win this cycle.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "Update the 'Frontend state & routing' section of `/home/user/meal-planner/CLAUDE.md`. Replace the 'No router...' paragraph with an accurate description: the app uses `wouter` for client-side routing (see `src/App.tsx`, which imports `Route, Switch, Redirect, useLocation` from `wouter`), with routes for `/`, `/recipes` (nest), `/community` (nest), `/planner` (nest), `/chat`, `/settings`, and `/admin` (admin-gated), defined around lines 141-160. Note that modals (recipe form, meal form, detail views, import/photo/onboarding) are still driven by App-level/page-level boolean state layered on top of these routes — only the top-level panel switching is route-based. Update the PostHog 'virtual paths' sentence if it's now redundant given real URLs exist. Do not change any other section. No code changes, no lint/build needed — this is a docs-only edit."

---

### ai-chat Edge Function Size / Modularity — escalated from Tier 3

- **What:** `supabase/functions/ai-chat/index.ts` remains 1039 lines, unchanged since the June 15 cuisine-classifier extraction. The directory still only contains `classifier.ts` and `index.ts` — no further extraction (`promptBuilder.ts`, `modelResolver.ts`, `recipeResponseParser.ts`) has happened. The function still mixes model resolution, preference/allergy/cuisine-profile prompt injection, recently-suggested-recipe dedup, the chat call itself, and structured-recipe-response parsing in one file.
- **Why now:** Escalated from Tier 3 to Tier 1 this cycle as a deliberately small, contained slice: with both other Tier 1 items above being either M-effort (pagination) or pure docs (CLAUDE.md), this item is offered as a genuinely shippable, low-risk "quick win" if a third pickup is wanted this week — start with just `recipeResponseParser.ts` (the most self-contained piece: pure parsing logic, easiest to extract without touching request/response wiring) rather than the full 3-module split, to keep this scoped as S/M rather than the L-effort full refactor.
- **Effort estimate:** S (for the single `recipeResponseParser.ts` extraction only; the full 3-module split remains M-L and can follow as a separate item if desired)
- **Actual effort:** —
- **Agent prompt:** "In `supabase/functions/ai-chat/index.ts` (1039 lines), extract the structured-recipe-response parsing logic into a new `supabase/functions/ai-chat/recipeResponseParser.ts` module, following the precedent of `classifier.ts`. Identify the function(s) responsible for parsing the AI's structured recipe JSON out of the chat response, move them with their types to the new file, and import them back into `index.ts`. No behavior change — this is a pure extraction. Verify the edge function still type-checks under Deno conventions (no `npm run typecheck`, since edge functions are Deno-only and not covered by the root tsconfig) and manually review the diff for correctness."

---

## Tier 2 — Next Sprint

### Recipe Collections / Folders ("Recipe Folders") — escalated, still queued

- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." As a user's library grows, browsing by tags alone makes it hard to maintain ad-hoc groupings like "Sunday dinners" or "recipes to try this month." Distinct from the existing `is_event` meal Collections — in-app copy should call this **"Recipe Folders"** to avoid collision.
- **Why now:** Still shovel-ready with a full 6-phase implementation plan (schema/RLS, service layer, hook, folder filter UI, add-to-folder UI, analytics). No code toward it has landed since (confirmed June 18: no `recipe_collections`/`collection_recipes`/`collectionService`/`useCollections` references anywhere in `src` or `supabase/migrations`). Remains the next logical Tier 2 pickup once Tier 1 clears — Phases 1-3 (schema, service, hook) are still callable as a self-contained first PR.
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

- **What:** `recipeService.ts`, `mealService.ts`, and `shoppingListService.ts` have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` and `src/lib/__tests__/mappers.test.ts` are tested. Confirmed June 18: no `src/services/__tests__/` directory exists.
- **Why now:** The Playwright E2E suite (PR #55) covers user-facing flows against a live backend but won't catch logic bugs inside the service layer in isolation (e.g. the exact kind of bug fixed in `489d57e` — a markdown-formatting mismatch between `AIChat.tsx` and `parseAIRecipe` — is closer to a unit-test gap than an E2E gap). With the community pagination work (Tier 1) about to touch `recipeService.ts` again, locking down this file now makes that change safer to review.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/services/__tests__/recipeService.test.ts`, `src/services/__tests__/mealService.test.ts`, and `src/services/__tests__/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.saveRecipe` — verify `.update()` for an existing `editingId` and `.insert()` for a new recipe; (3) `mealService` — at least one read and one write path; (4) `shoppingListService.addItem` — verify it inserts the correct shape, and `shoppingListService.clearCheckedItems` — verify it issues a delete scoped to `is_checked = true` and the given `listId`. Aim for 5+ tests per file (15+ total). Run `npx vitest run` to confirm green."

---

### Shareable Public Recipe Links — OPEN

- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL — on social media, in messages, or in food blogs.
- **Why now:** The app's routing is confirmed `wouter`-based with real URLs, so adding a public `/r/:id` route outside the auth guard slots directly into the existing `<Switch>` in `App.tsx` alongside the other top-level routes, no new routing infrastructure needed. M effort, no blocking dependencies. PRD lists "Share meal plans" and broader sharing as a Phase 4.2 priority; this remains the most contained slice of that.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` wouter `<Route>` in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

### Special Occasion Event Planning (Phase 3 MVP) — OPEN

- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place. PRD explicitly lists this as the sole "🚧 In Progress" product phase.
- **Why now:** This unlocks the "host" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped — this is the largest remaining gap between the current app and the PRD's stated roadmap. With the E2E suite in place, a new `/events` route and page would also get baseline regression coverage more easily than before.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` (wouter `<Route>`) with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

## Tier 3 — Strategic

### Community Recipe Ratings & Comments — OPEN

- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** The community search fix (PR #47) makes the community tab actually functional — ratings are the natural next social layer once discovery is working and paginated. Do not start until the Tier 1 community pagination work above is complete. This item was previously re-added after being dropped as stale once its blocker resolved; it has appeared in 2 consecutive cycles since being re-added, so it is not yet subject to the staleness rule (would need a 3rd consecutive appearance with no movement).
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

- **Quiet cycle:** only 3 commits landed since June 15 — the favorites N+1 fix (PR #57, merged June 16) and its supporting IMPROVEMENTS.md status updates. No other PRs opened, merged, or closed; no GitHub issues opened.
- **Community pagination is now the clear #1 priority**: with the favorites N+1 fix shipped, this item is now the single longest-standing open Tier 1 item (5th consecutive appearance) and the most product-visible risk in the backlog — it silently breaks recipe discovery once any user's community has more than 24 shared recipes.
- **CLAUDE.md "No router" doc fix has now gone two cycles without being picked up** despite being the lowest-risk, lowest-effort item available (pure documentation, zero code/build risk). Recommend it be bundled into whatever PR addresses community pagination, or picked up trivially on its own, since it costs almost nothing to ship.
- **New this cycle — `ai-chat` modularity escalated to Tier 1, but scoped down**: rather than re-proposing the full 3-module split (which is realistically M-L effort and better suited to Tier 2/3), this cycle narrows the ask to a single S-effort extraction (`recipeResponseParser.ts`) so it's genuinely "ship this week" sized. The full split can be re-proposed as a Tier 2/3 item once this first slice lands.
- **No open GitHub issues** — still no direct user-feedback signal. The instrumentation suggestion from prior cycles (lightweight PostHog event counts for Community tab and Shopping List drawer usage) stands and would help validate whether community pagination (Tier 1) and recipe folders (Tier 2) are worth their effort once shipped.
- **Recipe Folders (Tier 2)** implementation plan from June 11 remains unchanged and shovel-ready; no code toward it has landed. It remains queued behind the Tier 1 items above.
