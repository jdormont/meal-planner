# Improvements
_Last assessment: 2026-06-25_
_Last knowledge sync: 2026-06-25_
_Assessment based on: `git log` review of all commits since the June 22 reassessment (PR #60) — confirms PR #61 (Community Filter Search-Gap Fix) merged June 23 and nothing else has landed since (only the assessment-bot commits `491a4fd`/`21b8797`/`53a5fac` precede it). Reviewed all PRs via `list_pull_requests` (state=all, sorted by created desc) — PR #61 merged 2026-06-23T12:45:57Z, zero open PRs. Confirmed zero open GitHub issues via `list_issues`. Read `PRD.md` in full for roadmap/status context. Read `IMPROVEMENTS.md` in full before editing. Fresh code inspection confirms: `supabase/migrations/` contains `20260622000001_add_shared_recipe_search_rpc.sql` (the `search_shared_recipes_by_ingredient` RPC from PR #61); `src/hooks/useRecipes.ts`'s community `useInfiniteQuery` now threads filters through its `queryFn`/`queryKey`. `CLAUDE.md`'s "No router" claim — flagged stale for 4 consecutive cycles (June 15, 18, 22, 25) — was corrected directly in this assessment (zero-risk, zero-build-impact one-line doc edit) rather than re-queued a 5th time; `src/App.tsx:2` confirmed importing `Route, Switch, Redirect, useLocation` from `wouter` with real routes. `supabase/functions/ai-chat/index.ts` confirmed unchanged at 1039 lines, still only `classifier.ts` + `index.ts`. Confirmed no work has started on Recipe Folders, Shareable Public Recipe Links, Special Occasion Event Planning, Service Layer Test Coverage, or Community Ratings/Comments (grepped for `recipe_collections`/`collectionService`/`useCollections`, `src/services/__tests__`, `PublicRecipePage`/`/r/:`, `special_events`/`eventService`, `community_reactions`/`communityService` — all zero hits). Zero `alert()` calls remain in `src/`. No new TODO/FIXME markers found in `src`._

---

## Current Sprint

None — ready for next implementation run.

---

## Recently Completed ✓

| Item | Status | Reference |
|------|--------|------------|
| ai-chat Edge Function Size / Modularity (recipeResponseParser.ts extraction) | ✅ Done | Extracted structured-recipe-response parsing (JSON fence stripping, `RecipeResponseSchema` validation, fallback handling, `saveSuggestedRecipes`) from `ai-chat/index.ts` into `ai-chat/recipeResponseParser.ts`, following the `classifier.ts` precedent. Pure extraction, no behavior change. `npm run lint`/`typecheck`/`build` all clean (edge function itself manually reviewed — Deno-only, not covered by those commands). Actual effort: S. See PR (branch `feature/ai-chat-recipe-parser-extraction`). |
| Community Filters Don't Search the Full Community Set | ✅ Done | PR #61, merged June 23, 2026 — added `search_shared_recipes_by_ingredient` RPC (migration `20260622000001_add_shared_recipe_search_rpc.sql`), extended `getCommunityRecipesPaginated` with the same filter shape as `getRecipes`, wired filters into the community `useInfiniteQuery`'s `queryFn`/`queryKey`, reduced `filteredCommunityRecipes` to a passthrough. |
| CLAUDE.md stale "No router" claim | ✅ Done | Fixed directly in this assessment (2026-06-25, no PR needed for code — included in this cycle's docs PR). Replaced with an accurate description of `wouter`-based routing in `src/App.tsx`. Closes out a doc-accuracy item that had recurred 4 consecutive cycles. |
| Community Recipe Pagination / Infinite Scroll | ✅ Done | PR #59, merged June 19, 2026 |
| Fix Favorites N+1 in getDashboardData | ✅ Done | PR #57, merged June 16, 2026 (commit `9dd0b42`) |

---

## Tier 1 — Quick Wins

### Lightweight Usage Instrumentation for Community Tab & Shopping List — OPEN (now the oldest open Tier 1 item)
- **What:** PostHog (`useAnalytics`) is wired throughout the app, but there is no event tracking specifically for Community tab search/filter usage or Shopping List drawer interactions (check-off, "Clear Checked", store-section grouping). Confirmed via grep: no community-search or shopping-list-specific custom events exist in `useAnalytics.ts` beyond generic pageviews.
- **Why now:** This assessment has gone three consecutive cycles with zero open GitHub issues — there is no direct user-feedback signal informing prioritization. The two areas with the most recent bug activity (community search/filter, PR #47 and #61; shopping list, PR #52) are exactly the ones with no usage instrumentation, so it's impossible to tell whether real users are hitting edge cases there or whether further investment is warranted. This is a small, additive change with no risk to existing flows.
- **Effort estimate:** S
- **Actual effort:** —
- **Agent prompt:** "Add PostHog tracking via `useAnalytics().track()` for: `community_search_performed` (term length bucket + result count) and `community_tag_filter_applied` in the Community view; `shopping_list_item_checked`, `shopping_list_cleared_checked`, and `shopping_list_store_section_viewed` in the Shopping List drawer/`ShoppingListContext`. Follow existing event-naming conventions already used elsewhere in the codebase (snake_case, verb-last). Do not change any existing event names per CLAUDE.md's analytics convention."

---

## Tier 2 — Next Sprint

### Special Occasion Event Planning (Phase 3 MVP) — OPEN, unchanged
- **What:** The most valuable unbuilt product feature: named events (dinner party, holiday meal) with attached recipes and guest-count-scaled servings. The `scaleIngredient` utility already handles the math; all prerequisite infrastructure (service layer, routing, TanStack Query) is in place. PRD explicitly lists this as the sole "🚧 In Progress" product phase.
- **Why now:** Unlocks the "host" user persona identified in the PRD and differentiates the app from simple recipe managers. All blocking infrastructure work has shipped — this remains the largest gap between the current app and the PRD's stated roadmap, and has now had multiple quiet cycles where Tier 1 bug-fix work took priority. With the community-tab work fully closed out, this should be next.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Implement Phase 3 Event Planning MVP. Create a migration with `special_events(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at, updated_at)` and `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)` with RLS mirroring the `meals` table. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and create/edit modal. Create `src/components/EventDetail.tsx` showing attached recipes with servings auto-scaled to `guest_count` using `scaleIngredient` from `src/utils/recipeScaler.ts`. Add an 'Events' nav tab to `src/components/Layout.tsx`. Register the `/events` route in `src/App.tsx` (wouter `<Route>`) with `React.lazy()`. Timeline optimization is out of scope for this MVP."

---

### Recipe Collections / Folders ("Recipe Folders") — OPEN, shovel-ready
- **What:** PRD's Q2 2026 mid-term roadmap calls for "Recipe collections/folders for better organization." Distinct from the existing `is_event` meal Collections — in-app copy should call this **"Recipe Folders"** to avoid collision.
- **Why now:** Still shovel-ready with a full implementation plan (schema/RLS, service layer, hook, folder filter UI, add-to-folder UI, analytics). No code toward it has landed since being first queued. Remains the next logical Tier 2 pickup once Special Occasion Event Planning or capacity allows parallel work.
- **Effort estimate:** L (decomposable into ~4 independently-shippable phases — Phase 1+2 alone could ship as a smaller M-effort first PR if Tier 2 capacity is tight)
- **Actual effort:** —
- **Agent prompt:** "Implement Recipe Folders (Phases 1-3 as a first PR; Phases 4-6 can follow as a second PR if scope needs splitting). Phase 1: create a migration adding `recipe_collections(id uuid pk default gen_random_uuid(), user_id uuid references auth.users on delete cascade, name text not null, description text default '', sort_order int default 0, created_at timestamptz default now(), updated_at timestamptz default now())` and `collection_recipes(id uuid pk default gen_random_uuid(), collection_id uuid references recipe_collections(id) on delete cascade, recipe_id uuid references recipes(id) on delete cascade, user_id uuid references auth.users on delete cascade, sort_order int default 0, created_at timestamptz default now(), unique(collection_id, recipe_id))` with RLS and indexes mirroring `meals`/`meal_recipes`. Phase 2: `src/services/collectionService.ts` with `getCollections(userId)`, `createCollection`, `renameCollection`, `deleteCollection`, `addRecipeToCollection`, `removeRecipeFromCollection`, `getRecipesInCollection`. Phase 3: `src/hooks/useCollections.ts` mirroring `useRecipes`/`useMeals`. Use 'Folder(s)' as the user-facing term throughout to avoid confusion with the existing `is_event` meal 'Collections'. Run `npm run lint && npm run typecheck && npm run build`."

---

### Community Recipe Ratings & Comments — escalated from Tier 3
- **What:** Community users can browse shared recipes but cannot express any feedback on them. Adding star ratings and short comments to shared recipes would increase engagement, surface recipe quality signals, and feed future AI recommendation improvements.
- **Why now:** This item has appeared in 3+ consecutive cycles (June 18, June 22, June 25) without movement, but its stated blocker — community discovery correctness — is now genuinely resolved by PR #61 (the filter-gap fix). Per the staleness rule, an item at this threshold must be escalated or dropped; since the blocker is cleared and the feature remains a clear, well-scoped social-layer addition with product value (PRD Phase 4.2), it is escalated to Tier 2 rather than dropped.
- **Effort estimate:** L
- **Actual effort:** —
- **Agent prompt:** "Add a community reaction layer. Create a migration for `community_reactions(id uuid, recipe_id uuid, user_id uuid, rating int CHECK (rating BETWEEN 1 AND 5), comment text, created_at)` with RLS (authenticated users can insert their own row; everyone can read). Create `src/services/communityService.ts` with `addReaction(recipeId, rating, comment)` and `getReactions(recipeId)`. In `RecipeDetail.tsx` (community view), add a 1–5 star rating widget and optional short comment input that call `addReaction`. Display the aggregate rating (average + count) on recipe cards in `CommunityRecipes.tsx`."

---

### Service Layer Test Coverage — OPEN
- **What:** `recipeService.ts`, `mealService.ts`, and `shoppingListService.ts` have zero Vitest coverage. Only pure utility functions under `src/utils/__tests__/` and `src/lib/__tests__/mappers.test.ts` are tested.
- **Why now:** The Playwright E2E suite (PR #55) covers user-facing flows against a live backend but won't catch logic bugs inside the service layer in isolation. `recipeService.ts` has now been touched in three consecutive feature PRs (#47, #59, #61) without any unit-test safety net — the risk of an unnoticed regression compounds with each additional change to this file.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Add Vitest unit tests for the three service files. Create `src/services/__tests__/recipeService.test.ts`, `src/services/__tests__/mealService.test.ts`, and `src/services/__tests__/shoppingListService.test.ts`. At the top of each, mock the Supabase client with `vi.mock('../../lib/supabase', ...)`. Cover: (1) `recipeService.getRecipes` — verify `.or()` filter includes title and description when `searchTerm` is set; verify `.range()` pagination math; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.getCommunityRecipesPaginated` — verify filter pass-through (added in PR #61) and `.range()`/`hasMore` derivation; (3) `recipeService.saveRecipe` — verify `.update()` vs `.insert()` branching; (4) `mealService` — at least one read and one write path; (5) `shoppingListService.addItem`/`clearCheckedItems`. Aim for 5+ tests per file. Run `npx vitest run` to confirm green."

---

### Shareable Public Recipe Links — OPEN
- **What:** Shared recipes (`is_shared = true`) are only visible in the Community tab to logged-in users. A public route (e.g., `/r/:id`) viewable without authentication would let users share recipes via URL.
- **Why now:** The app's routing is confirmed `wouter`-based with real URLs (also just corrected in CLAUDE.md this cycle), so adding a public `/r/:id` route outside the auth guard slots directly into the existing `<Switch>` in `App.tsx`. M effort, no blocking dependencies. PRD lists broader sharing as a Phase 4.2 priority.
- **Effort estimate:** M
- **Actual effort:** —
- **Agent prompt:** "Create a public recipe view. Add an RLS policy on the `recipes` table allowing `SELECT` for `anon` when `is_shared = true`. Create `recipeService.getPublicRecipe(id)` that does not require a session. Add a `/r/:id` wouter `<Route>` in `src/App.tsx` outside the auth guard, rendering a new `src/pages/PublicRecipePage.tsx` — simplified layout (title, image, description, ingredients, instructions; no edit/copy actions for unauthenticated visitors). Add a 'Share' button on `RecipeDetail.tsx` that copies the public URL to clipboard, only visible when `recipe.is_shared === true`. Test that unauthenticated access to `/r/:id` works."

---

## Tier 3 — Strategic

Fewer than 3 clear strategic-tier items currently have enough shape to act on without further input. The remaining strategic-horizon ideas from the PRD's "Future Considerations" (kitchen inventory, nutrition tracking, native mobile, batch cooking/meal prep) are still too undifferentiated to scope into a concrete agent prompt, and have not been raised by any user signal (zero open GitHub issues for three consecutive cycles). What would help: (1) shipping the Tier 1/2 instrumentation item above to get real usage data, (2) a lightweight in-app feedback/feature-request mechanism so strategic bets are informed by actual user requests rather than the original PRD's speculative roadmap, (3) revisiting this list once Special Occasion Event Planning (Tier 2) ships, since it may surface natural follow-on strategic work (e.g., timeline optimization, which was explicitly descoped from the Phase 3 MVP above).

---

## Dropped / Stale

| Item | Reason |
|------|--------|
| **Progressive Web App (PWA)** | Appeared 3+ consecutive assessments without movement (dropped June 3). Revisit if offline-first becomes an explicit product priority. |
| **Nutrition Information Tracking** | XL effort, no traction across 3 assessments (dropped June 3). Revisit if health tracking becomes a product direction. |
| **"UX/UI Improvement Areas" section (O-1 through O-7)** | Removed June 10 — was a documentation error unrelated to this product. |

---

## Process Notes

- **Quiet cycle:** only PR #61 (Community Filter Search-Gap Fix, merged June 23) landed since the June 22 reassessment. No other PRs opened, merged, or closed; no GitHub issues opened.
- **CLAUDE.md "No router" doc fix resolved this cycle**, after recurring unaddressed for 4 consecutive assessments (June 15, 18, 22, 25). Rather than queue it a 5th time, it was corrected directly as part of this assessment since it was a zero-risk, zero-build-impact one-line documentation edit with no code surface to review.
- **Community Recipe Ratings & Comments escalated from Tier 3 to Tier 2** this cycle per the staleness rule — its blocker (community discovery correctness) is now resolved by PR #61, and it had reached 3+ consecutive cycles without movement.
- **No open GitHub issues for three consecutive cycles** — still no direct user-feedback signal. This is itself now flagged as a Tier 1 item (lightweight PostHog instrumentation for Community/Shopping List usage) to give the next few cycles real data to prioritize against, given the original PRD-derived backlog is largely worked through.
- **Tier 3 is intentionally thin this cycle** (see note above) — the remaining PRD "Future Considerations" items are too broad/speculative to scope responsibly without more signal.
- **ai-chat Edge Function Modularity implemented 2026-06-26** — picked as the highest-priority incomplete Tier 1 item (oldest open, lowest risk) by the autonomous implementation routine, branched as `feature/ai-chat-recipe-parser-extraction` directly off `origin/main` rather than waiting for this reassessment PR (#62) to merge (the two changes don't overlap). Implementation, verification, and this status update all landed in that same PR. If PR #62 merges separately, its next reassessment cycle should reconcile/dedupe this entry against the one being added here.
