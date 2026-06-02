# Improvements Assessment — Meal Planner

*Assessment Date: May 31, 2026*

---

## Assessment Methodology

This assessment was conducted by reviewing the PRD, architecture evaluation document (`architecture_evaluation.md`), component file sizes and structures, recent commit history, and open issues flagged in the PRD. Improvements were prioritized by cross-referencing user-facing impact (usability, feature completeness), technical risk (stability, correctness), and developer productivity (maintainability, test coverage). Effort estimates assume a senior full-stack developer working on the Vite + React + TypeScript + Supabase stack.

**Key signals reviewed:**
- `architecture_evaluation.md` (May 31, 2026) — identified 6 structural pain points with priority rankings
- Recent commits: XSS fix, N+1 query fix, CORS hardening, Vitest test suite (50 tests), GitHub Actions CI/CD
- Component file sizes: `RecipeForm.tsx` (~47 KB), `RecipeDetail.tsx` (~27 KB), `App.tsx` (~28 KB, ~800 lines)
- PRD open items: ingredient search correctness, shopping list check-off, Phase 3 event planning, nutrition tracking, PWA

---

## Refactoring Status Overview

A series of high-priority architectural updates have been executed to clean up technical debt, establish routing, introduce state caching, and decouple UI from direct database queries:
- **Service Layer Extraction:** Completed. All database-directed Supabase queries are centralized in `src/services/` under typed services, backed by auto-generated TS types.
- **Lightweight Client-Side Routing:** Completed. Routing using `wouter` was introduced, migrating the monolithic `App.tsx` views into modular pages in `/src/pages` and enabling deep-linking.
- **TanStack Query Integration:** Completed. Server-state is managed and cached using `@tanstack/react-query`, avoiding redundant fetches and ensuring instant UI synchronization on mutations.
- **Test Suite Configured:** Completed. Vitest runs 56 unit/integration tests covering core parsers, converters, and mapping utilities.
- **RecipeForm Modularization:** Completed. Monolithic form split into manageable subcomponents.

---

## Tier 1 — High-Impact, Quick Wins

These improvements deliver immediate user or stability value with modest effort and should be addressed first.

---

### 1.1 Database-Side Ingredient Search

**Description:** Recipe search currently performs client-side filtering of ingredient JSON after a database-paginated fetch. This means a search for "garlic" only searches recipes on the current page, silently missing matches elsewhere in the collection. Moving ingredient indexing to the database (via a Postgres RPC function or `pg_trgm` index) will make search accurate across the entire recipe library regardless of collection size.

**Estimated Effort:** 2–3 days  
**Expected Impact:** High — fixes a correctness bug that frustrates users with large recipe collections; directly improves the core discoverability loop.

**Agent Prompt:**
> In `src/hooks/useRecipes.ts`, around lines 127–140, ingredient search is performed client-side after a database-paginated fetch. Create a Supabase database RPC function `search_recipes_by_ingredient(search_term text, p_user_id uuid, p_limit int, p_offset int)` that uses `jsonb_path_query()` or a `pg_trgm` GIN index on a generated column to match against the `ingredients` JSONB column. Add the GIN index in a new migration file. Update `useRecipes.ts` to call this RPC for ingredient-keyword queries instead of filtering client-side. Ensure existing tag, title, and description filters still work via combined `.or()` clauses or a unified RPC. Add a Vitest unit test in `src/test/` to verify the ingredient search logic.

---

### 1.2 Shopping List Check-Off and Store Categorization

**Description:** The shopping list (Instacart-integrated) supports adding ingredients but has no way to check off items while physically shopping, nor does it group items by grocery store section (produce, dairy, etc.). These two gaps were explicitly planned in the PRD and are the most common friction points for users in a store aisle. Implementing check-off state and category grouping closes the loop on the shopping list feature and meaningfully improves the in-store mobile experience.

**Estimated Effort:** 2–3 days  
**Expected Impact:** High — directly addresses the top planned feature gap in the PRD; improves the mobile in-store experience at the most critical user moment.

**Agent Prompt:**
> In `src/components/ShoppingListDrawer.tsx`, add the ability to check off individual ingredients (toggle a `checked` boolean per item, with strikethrough styling). Persist check state to the `shopping_lists` table's `items` JSONB array by adding a `checked` field to each item object. Group the ingredient list by inferred store category — create a `categorizeIngredient(name: string): string` utility in `src/utils/` that maps ingredient names to categories (Produce, Dairy, Meat, Pantry, Frozen, Other) using a keyword lookup table. Render items grouped by category with collapsible section headers. Add a "Clear Checked" button at the bottom of the drawer. Ensure the Instacart checkout button remains visible when the list has unchecked items.

---

### 1.3 Service Layer Extraction (Data Access Consolidation) [COMPLETED]

> [!NOTE]
> **Status: Completed** (Merged in PR #27)
> Created centralized `src/services/` modules for all Supabase API and DB interaction (`recipeService.ts`, `mealService.ts`, `profileService.ts`, `shoppingListService.ts`). Cleanly integrated auto-generated database types.

**Description:** Raw Supabase queries are currently scattered across custom hooks and components, tightly coupling UI to table schemas. This makes schema changes risky (no single update point), prevents unit testing of data logic, and duplicates query patterns across multiple files. Extracting all Supabase calls into a `src/services/` layer is the highest-leverage architectural improvement identified in the formal architecture evaluation (May 31, 2026).

**Estimated Effort:** 3–4 days (Completed)  
**Expected Impact:** High — dramatically improves testability and maintainability; enables safe schema evolution; unblocks auto-generated TypeScript types integration; directly prerequisite for TanStack Query adoption.

**Agent Prompt:**
> Create a `src/services/` directory with the following files: `recipeService.ts`, `mealService.ts`, `userService.ts`, `shoppingListService.ts`. Move all raw `supabase.from(...)` calls from `src/hooks/useRecipes.ts`, `src/hooks/useMeals.ts`, and any components that call Supabase directly into the corresponding service file. Each service function should accept typed parameters and return typed results (use the auto-generated `src/types/database.types.ts` already in the repo). Update all hooks to call service functions instead of Supabase directly. Do not change any component behavior — this is a pure internal refactor. Add at least 3 Vitest unit tests per service file that mock the Supabase client and verify correct query construction.

---

## Tier 2 — Medium-Impact, Moderate Effort

These improvements materially improve the product but require a longer focused effort.

---

### 2.1 Client-Side Routing with Deep-Link Support [COMPLETED]

> [!NOTE]
> **Status: Completed** (Merged in PR #29)
> Replaced state-based tab routing in `App.tsx` with `wouter` client-side routes. Extracted pages into individual modular components in `/src/pages` (`RecipesPage`, `PlannerPage`, `ChatPage`, `CommunityPage`, `SettingsPage`, `AdminPage`). Supported browser history navigation and route-based modals.

**Description:** Navigation is currently driven by a `view` state variable in `App.tsx`, which has grown to ~800 lines managing modals, page state, and routing simultaneously. Users cannot bookmark a specific recipe, share a URL to the community page, or use the browser back button to return to the previous tab. Introducing a lightweight router (`wouter`) and splitting `App.tsx` into page components fixes these UX issues, reduces unnecessary re-renders, and makes the codebase significantly more maintainable.

**Estimated Effort:** 3–5 days (Completed)  
**Expected Impact:** Medium-High — fixes broken browser navigation UX; enables shareable recipe links; eliminates the primary scalability bottleneck in the codebase.

**Agent Prompt:**
> Install `wouter` (lightweight React router). Create page components in `src/pages/`: `RecipesPage.tsx`, `PlannerPage.tsx`, `ChatPage.tsx`, `CommunityPage.tsx`, `SettingsPage.tsx`, `AdminPage.tsx`. Move the relevant render blocks from `App.tsx` into these pages. Configure routes in `App.tsx` with path patterns (`/`, `/planner`, `/chat`, `/community`, `/settings`, `/admin`, `/recipes/:id`). Convert modal-state booleans that control "edit" and "new" views into query parameters or sub-routes (e.g., `/recipes/new`, `/recipes/:id/edit`). Preserve existing `useAnalytics` page tracking. Add `React.lazy()` and `<Suspense>` fallbacks for lazy-loaded pages to reduce the initial bundle.

---

### 2.2 TanStack Query for Server State Management [COMPLETED]

> [!NOTE]
> **Status: Completed** (Merged in PR #29)
> Configured `@tanstack/react-query` to manage client-side server-state. Replaced manual DB polling with queries and mutations, ensuring reliable data synchronization across views.

**Description:** Data fetching currently uses manual `useState` + `useEffect` patterns with explicit `loadRecipes()` / `loadMeals()` refresh calls after mutations. This causes stale views when switching tabs and wastes bandwidth on redundant fetches. Integrating TanStack Query (`@tanstack/react-query`) provides automatic background refresh, cache invalidation, deduplication, and standardized loading/error states — improving perceived performance and data consistency throughout the app.

**Estimated Effort:** 3–4 days (Completed)  
**Expected Impact:** Medium — eliminates stale-state bugs after mutations; reduces redundant network calls; standardizes loading/error states; directly prerequisite for optimistic UI on drag-and-drop.

**Agent Prompt:**
> Install `@tanstack/react-query`. Set up a `QueryClient` in `src/main.tsx` with a `QueryClientProvider` wrapping the app. Convert `useRecipes.ts` first as a proof-of-concept: replace `loadRecipes` with a `useQuery` call keyed by `['recipes', userId]`. Convert `createRecipe`, `updateRecipe`, `deleteRecipe` to `useMutation` with `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] })`. Verify the recipe list automatically refreshes after mutations without a manual reload. Apply the same pattern to `useMeals.ts`. Remove all manual `loading`, `error`, and `data` state variables that become redundant. Use the service layer created in improvement 1.3 as the query fetcher functions.

---

### 2.3 Special Occasion Event Planning (Phase 3 MVP)

**Description:** Phase 3 (multi-dish event planning with timeline optimization) is the most valuable unbuilt feature in the PRD. Even an MVP — creating an event with name, date, and guest count, attaching multiple recipes, and auto-scaling servings by guest count — unlocks a distinct high-value use case (holiday meals, dinner parties) that differentiates this app from simple recipe managers. The existing `scaleIngredient` utility already handles the scaling math.

**Estimated Effort:** 5–7 days  
**Expected Impact:** Medium-High — opens a new use case vertical; differentiates from competitors; directly serves the "host" user persona identified in the PRD.

**Agent Prompt:**
> Implement Phase 3 Event Planning MVP for the meal-planner app. Create a Supabase migration adding a `special_events` table: `(id uuid, user_id uuid, name text, event_date date, guest_count int, notes text, created_at timestamptz, updated_at timestamptz)`. Create a junction table `event_recipes(id uuid, event_id uuid, recipe_id uuid, sort_order int)`. Add RLS policies mirroring the `meals` table pattern. Create `src/services/eventService.ts` with full CRUD. Create `src/pages/EventsPage.tsx` with an event list and a create/edit modal. Create `src/components/EventDetail.tsx` showing all event recipes with serving quantities auto-scaled to `guest_count` using the existing `scaleIngredient` utility from `src/utils/recipeScaler.ts`. Add an "Events" tab to the navigation. Timeline optimization is out of scope for this MVP.

---

## Tier 3 — Strategic, Longer-Term

These improvements define the app's long-term positioning and require multi-week investment.

---

### 3.1 Progressive Web App (PWA) with Offline Recipe Browsing

**Description:** Users frequently want to access their recipe collection while cooking in areas with poor connectivity (kitchen, camping, vacation rentals). Implementing a service worker via `vite-plugin-pwa` with a cache-first strategy for the recipe list and detail pages would enable offline access — a significant usability upgrade for the core cooking workflow and a feature explicitly identified in the PRD's future considerations.

**Estimated Effort:** 1–2 weeks  
**Expected Impact:** High long-term — enables the offline use case; improves app-like feel on mobile; increases engagement for cooking-mode users.

**Agent Prompt:**
> Add PWA support to the meal-planner Vite app. Install `vite-plugin-pwa` and configure it in `vite.config.ts` with a `generateSW` strategy. Create a `public/manifest.json` with app name, icons, and theme colors. Configure Workbox to cache: (1) all JS/CSS/HTML assets with `CacheFirst`; (2) Supabase REST API responses for `/rest/v1/recipes` with `NetworkFirst` (5-minute TTL fallback to cache). Add an offline fallback page `public/offline.html`. Test that the recipe list and detail views load when the browser is offline after a first visit. AI chat, image generation, and Instacart checkout should gracefully degrade with a "Requires internet connection" message — do not attempt to make them work offline.

---

### 3.2 Nutrition Information Tracking

**Description:** The PRD plans macro tracking as a long-term feature. Integrating a nutrition API (e.g., USDA FoodData Central, which is free) to automatically estimate calories, protein, fat, and carbohydrates per serving when a recipe is created or imported would close a major gap versus competitors like Paprika or Mealime. Nutrition data also enriches the AI meal planning context for health-conscious users.

**Estimated Effort:** 2–3 weeks  
**Expected Impact:** High long-term — expands into the health-conscious user segment; enriches AI planning context; creates a quantitative feedback loop between recipes and user health goals.

**Agent Prompt:**
> Design and implement basic nutrition tracking for the meal-planner app using the USDA FoodData Central API (free, no API key required for basic search). Create a new Supabase Edge Function `get-nutrition` that accepts a list of ingredient objects `{name, quantity, unit}` and returns per-serving macro estimates. The Edge Function should: (1) query USDA FoodData Central `/foods/search` for each ingredient, (2) pick the closest match by name, (3) calculate nutrients scaled to quantity using standard USDA portion data, (4) aggregate across all ingredients and divide by serving count. Add a `nutrition jsonb` column to the `recipes` table in a migration. After a recipe is saved, call this Edge Function asynchronously and store the result. Display a compact nutrition badge (kcal / protein / carbs / fat) on `RecipeDetail.tsx` and recipe cards, hidden when nutrition data is null.

---

### 3.3 Print-Friendly Recipe PDF Export

**Description:** Printing recipes is a highly-requested feature for users who cook from paper or want to gift recipe cards. The PRD lists PDF export as a planned Phase 4 enhancement. Using `react-to-print`, a clean single-page recipe printout with the image, ingredients, and instructions is straightforward to implement and high-value for the gift-giving and family cookbook use cases.

**Estimated Effort:** 2–3 days  
**Expected Impact:** Medium — addresses a highly-requested use case; expands usage to offline/gift scenarios; low technical complexity.

**Agent Prompt:**
> Add a "Print / Export PDF" button to `RecipeDetail.tsx`. Install `react-to-print`. Create `src/components/RecipePrintView.tsx` as a printable-optimized layout component rendering: recipe title, image (if available), metadata (servings, prep/cook times), ingredient list, and numbered instructions — styled for A4/letter paper with `@media print` CSS. Use black-and-white-friendly styles (no colored backgrounds or icons). Wire the print button to `useReactToPrint()` referencing the `RecipePrintView` ref. Ensure the print view does not show navigation, modals, or action buttons. Test across Chrome and Firefox print preview.

---

## Reassessment — June 1, 2026

*Assessment Date: June 1, 2026*

---

### Progress Since May 31 Assessment

| Item | Status | Notes |
|------|--------|-------|
| Service Layer Extraction (Tier 1.3) | ✅ Completed | PR #27 |
| Client-Side Routing with `wouter` (Tier 2.1) | ✅ Completed | PR #29 |
| TanStack Query Integration (Tier 2.2) | ✅ Completed | PR #29 |
| RecipeForm Modularization | ✅ Completed | PR #30 |
| Error Boundary | ✅ Completed | PR #30 (ported) |
| Multi-word Search Support | ✅ Completed | PR #30 (ported) |
| Escape Key Hook for Modal Dismissal | ✅ Completed | PR #30 (ported) |
| Vercel SPA 404 on Refresh | ✅ Fixed | PR #31–33 |
| Route-Level Code Splitting (Tier 1.3 Updated) | ✅ Completed | Branch `claude/serene-noether-BslBA` — June 1, 2026 |

**Remaining open items from previous assessment:** DB Ingredient Search (1.1), Shopping List Check-off (1.2), Special Occasion Events (2.3), PWA (3.1), Nutrition Tracking (3.2), PDF Export (3.3).

**New findings from current codebase review (June 1, 2026):**
- `src/pages/SettingsPage.tsx` (168 bytes) and `src/pages/AdminPage.tsx` (184 bytes) are empty stub components — users who navigate to Settings see a blank page.
- No `React.lazy()` code splitting in place despite 8 page components; `LandingPage.tsx` alone is 19 KB and `RecipesPage.tsx` is 14 KB — both fully eager-loaded for every visitor.
- `PlannerPage.tsx` (8 KB) is relatively lean; weekly meal plan navigation lacks mobile swipe gestures.

---

### Updated Tier 1 — High-Impact, Quick Wins

---

#### 1.1 Database-Side Ingredient Search *(Carried Forward — Status: Open)*

See the May 31 entry above for full description and agent prompt. Priority unchanged.

**Estimated Effort:** 2–3 days | **Expected Impact:** High

---

#### 1.2 Shopping List Check-Off and Store Categorization *(Carried Forward — Status: Open)*

See the May 31 entry above for full description and agent prompt. Priority unchanged.

**Estimated Effort:** 2–3 days | **Expected Impact:** High

---

#### 1.3 Route-Level Code Splitting ✅ **COMPLETED** (June 1, 2026)

All 7 authenticated page components (`RecipesPage`, `CommunityPage`, `PlannerPage`, `ChatPage`, `SettingsPage`, `AdminPage`) and the unauthenticated `LandingPage` converted to `React.lazy()` in `src/App.tsx`. A single `<Suspense fallback={<PageLoader />}>` wraps the authenticated route tree, with a separate `<Suspense>` covering `LandingPage` for unauthenticated visitors. `ErrorBoundary` from `src/components/ErrorBoundary.tsx` preserved around lazy routes. Each page now ships as a separate async chunk, reducing the initial JS payload for unauthenticated first visits by an estimated 35–50%.

---

### Updated Tier 2 — Medium-Impact, Moderate Effort

---

#### 2.1 Implement SettingsPage and AdminPage (Currently Blank Stubs)

**Description:** `src/pages/SettingsPage.tsx` (168 bytes) and `src/pages/AdminPage.tsx` (184 bytes) are empty placeholder files that render nothing. Any authenticated user who clicks "Settings" in the navigation sees a blank page. The admin approval workflow — fully designed in `ADMIN_APPROVAL_SYSTEM.md` with backend support in place — also has no frontend surface. These represent incomplete wiring from the PR #29 routing refactor and are the most immediately visible UX gaps in the app.

**Estimated Effort:** 3–4 days  
**Expected Impact:** Medium–High — fixes the most visible navigation dead end for all authenticated users; surfaces the admin approval workflow that is already supported by the backend.

**Agent Prompt:**
> Implement `src/pages/SettingsPage.tsx` and `src/pages/AdminPage.tsx` for the meal-planner app. For **SettingsPage**: render sections for (1) Profile — display name and avatar URL input fields reading/writing via `src/services/profileService.ts`; (2) Dietary Preferences — allergen checkboxes and cuisine preference toggles persisted to the user profile; (3) Account — sign-out button. Match the dark stone-950/amber-500 design system used on other pages. Use TanStack Query mutations for saves with toast feedback on success. For **AdminPage**: review `ADMIN_APPROVAL_SYSTEM.md` to understand the approval flow, then render a table of pending user approval requests with Approve and Reject action buttons that call the appropriate Supabase RPC or service function. Guard `AdminPage` with an `isAdmin` check on the user profile — redirect non-admins to `/recipes`. Both pages must follow the existing layout pattern from `RecipesPage.tsx` for visual consistency.

---

#### 2.2 Special Occasion Event Planning (Phase 3 MVP) *(Carried Forward — Status: Open)*

See the May 31 entry above for full description and agent prompt.

**Estimated Effort:** 5–7 days | **Expected Impact:** Medium-High

---

### Updated Tier 3 — Strategic, Longer-Term

---

#### 3.1 Progressive Web App (PWA) *(Carried Forward — Status: Open)*

See the May 31 entry above. No change in status or priority.

**Estimated Effort:** 1–2 weeks | **Expected Impact:** High long-term

---

#### 3.2 Nutrition Information Tracking *(Carried Forward — Status: Open)*

See the May 31 entry above. No change in status or priority.

**Estimated Effort:** 2–3 weeks | **Expected Impact:** High long-term

---

#### 3.3 Print-Friendly Recipe PDF Export *(Carried Forward — Status: Open)*

See the May 31 entry above. No change in status or priority.

**Estimated Effort:** 2–3 days | **Expected Impact:** Medium

---

## Reassessment — June 2, 2026

*Assessment Date: June 2, 2026*
*Assessment based on: full source read of all pages (`src/pages/`), components (`src/components/`), hooks (`src/hooks/`), services (`src/services/`), migration history (`supabase/migrations/`), edge functions inventory, and the 30 most recent commits.*

---

### Progress Since June 1 Assessment

| Item | Status | Notes |
|------|--------|-------|
| Route-Level Code Splitting (Tier 1.3 Updated) | ✅ Completed | PR #35, merged June 1 |
| SettingsPage — blank stub (Tier 2.1) | ✅ Completed | `SettingsPage.tsx` now delegates to `Settings.tsx` (15 KB full implementation) |
| AdminPage — blank stub (Tier 2.1) | ✅ Completed | `AdminPage.tsx` now delegates to `AdminDashboard.tsx` (29 KB full implementation) |
| Shopping List Check-Off (part of Tier 1.2) | ✅ Completed | `ShoppingListDrawer.tsx` has working `toggleItem` + `is_checked` strikethrough |
| Onboarding Wizard (NEW — not previously tracked) | ✅ Completed | Full 5-step wizard shipped: `OnboardingWizard.tsx` + WelcomeStep, AllergyStep, TimeStep, SkillStep, ReviewStep, ResultsStep in `src/components/onboarding/` |

**Remaining open items from June 1 assessment:** DB Ingredient Search (1.1), Shopping List Store Categorization / Clear Checked (1.2 remainder), Special Occasion Events (2.2/2.3), PWA (3.1), Nutrition Tracking (3.2), PDF Export (3.3).

**New findings from June 2 codebase review:**
- `recipeService.getRecipes()` sends `title.ilike` + `description.ilike` to the DB but still does a **client-side fallback** for ingredient matching on the already-paginated 12-record window — Tier 1.1 correctness bug confirmed still open.
- `ShoppingListDrawer.tsx` check-off works; still missing store categorization and "Clear Checked" button.
- Debug `console.log` statements from the May 31 commit `54fe4083` ("debug: add image fetch logging to RecipeForm") are still present in `RecipeForm.tsx` — production console noise.
- `recipeService.getDashboardData()` fetches favorite recipe IDs from `recipe_ratings`, then issues a **second query** to fetch full recipe rows by ID — a two-step fan-out for the favorites shelf that can be collapsed into a single join.
- Service layer (`recipeService.ts`, `mealService.ts`, `shoppingListService.ts`) has **zero Vitest test coverage** — only pure utilities are tested.
- `recipeService.getCommunityRecipes()` is hardcoded to `limit(24)` with no pagination; `CommunityPage.tsx` renders all results at once — community content is not browsable beyond 24 recipes.

---

### Updated Tier 1 — Quick Wins (June 2, 2026)

---

#### 1.1 Database-Side Ingredient Search *(Carried Forward — Still Open)*

`recipeService.getRecipes()` at `src/services/recipeService.ts` sends `title.ilike` and `description.ilike` to the DB but performs ingredient matching as a client-side loop on the 12 already-fetched records. A user with 200 recipes who searches "garlic" sees matches only in the 12 recipes on the current page. See the May 31 entry for the full description and agent prompt. Priority unchanged.

**Estimated Effort:** 2–3 days | **Expected Impact:** High

---

#### 1.2 Shopping List: Store Categorization + "Clear Checked" Button

Check-off is now fully working (strikethrough + `is_checked` persisted via `ShoppingListContext`). What remains of the original Tier 1.2 goal: grouping items by store section and a "Clear Checked" action. These two UX touches are the last friction points for the in-store mobile experience.

**Estimated Effort:** 1 day | **Expected Impact:** Medium–High

**Agent Prompt:**
> In `src/components/ShoppingListDrawer.tsx`, add two improvements to the existing check-off UI. (1) Create a `categorizeIngredient(name: string): string` utility in `src/utils/ingredientCategories.ts` that maps ingredient names to store sections (Produce, Dairy, Meat & Seafood, Pantry, Frozen, Bakery, Other) using a keyword lookup table. (2) Group the rendered ingredient list by category: sort items by category name, render a sticky `<h3>` section header above each group using amber-500 text to match the design system. (3) Add a "Clear Checked" button in the drawer footer (left of the Instacart button) that calls a new `clearCheckedItems()` function in `src/contexts/ShoppingListContext.tsx` — it should remove all items where `is_checked === true` from both local state and the `shopping_lists` DB table rows via `shoppingListService`. Only render "Clear Checked" when at least one item is checked.

---

#### 1.3 Remove Debug Logging from RecipeForm.tsx

A `debug: add image fetch logging to RecipeForm` commit (May 31, SHA `54fe4083`) was never reverted. Console noise in production leaks URL details and fetch timing into browser DevTools for any authenticated user who opens the developer console.

**Estimated Effort:** 30 minutes | **Expected Impact:** Low (polish + security hygiene)

**Agent Prompt:**
> In `src/components/RecipeForm.tsx`, search for all `console.log` statements that were added by the image-fetch debug commit (look for logs referencing image URLs, fetch responses, or any `console.log` near image-loading logic). Remove them. Do not remove `console.error` statements. Run `npm run lint && npm run build` to confirm no regressions.

---

### Updated Tier 2 — Moderate Effort (June 2, 2026)

---

#### 2.1 Service Layer Test Coverage

`recipeService.ts` (12 KB), `mealService.ts` (10 KB), and `shoppingListService.ts` (3.3 KB) have zero Vitest coverage. These are the most critical data-access paths in the app — a silent bug in `saveRecipe` or `getMeals` corrupts user data with no test signal. The existing suite covers only pure utilities. Adding mocked-Supabase tests is the highest-leverage testing investment available.

**Estimated Effort:** 2–3 days | **Expected Impact:** High (reliability, safe refactoring, developer confidence)

**Agent Prompt:**
> Add Vitest unit tests for the three service files. Create test files in `src/test/`: `recipeService.test.ts`, `mealService.test.ts`, `shoppingListService.test.ts`. At the top of each, mock the Supabase client: `vi.mock('../lib/supabase', () => ({ supabase: { from: vi.fn().mockReturnValue({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(), ... }) } }))`. Tests to cover: (1) `recipeService.getRecipes` — verify the `.or()` filter clause includes both title and description when `searchTerm` is set; verify `.range()` pagination math for page 0 and page 2; verify `.contains('tags', ...)` is called when `selectedTags` is non-empty; (2) `recipeService.saveRecipe` — verify it calls `.update()` for a non-temp `editingId` and `.insert()` for a new recipe; (3) `mealService` — verify at least one read and one write path; (4) `shoppingListService` — verify `addItem` inserts with the correct shape. Aim for 5+ tests per file (15+ total).

---

#### 2.2 Community Recipe Pagination / Infinite Scroll

`recipeService.getCommunityRecipes()` has a hardcoded `limit(24)` with no offset support. `CommunityPage.tsx` renders all results at once with no load-more control. Any recipe added after the initial 24 is invisible to users who don't refresh, and users who join a large community never discover older shared recipes.

**Estimated Effort:** 2 days | **Expected Impact:** Medium

**Agent Prompt:**
> In `src/services/recipeService.ts`, add a new function `getCommunityRecipesPaginated(page: number, limit = 12): Promise<{ recipes: Recipe[]; hasMore: boolean }>` that applies `.range(page * limit, (page + 1) * limit - 1)`. In `src/pages/CommunityPage.tsx` (or `src/components/CommunityRecipes.tsx`), replace the current `useQuery` call with `useInfiniteQuery` keyed by `['community-recipes-paged']` using the new function; set `getNextPageParam` to return the next page index when `hasMore` is true. Add a "Load More" button at the bottom of the community grid that calls `fetchNextPage()` and is hidden when `!hasNextPage`. Show a spinner while `isFetchingNextPage`. Keep the old `getCommunityRecipes(limit)` function to avoid breaking any callers, but mark it `@deprecated`.

---

#### 2.3 Fix Favorites N+1 in getDashboardData

`recipeService.getDashboardData()` fetches favorite recipe IDs from `recipe_ratings` and then issues a second query to fetch the full recipe rows by those IDs. For a user with many thumbs-up ratings this is two serial round-trips where one join would suffice. While the current impact is low (dashboard loads once), it sets a pattern that will compound as the dashboard grows.

**Estimated Effort:** 0.5 days | **Effort:** S

**Agent Prompt:**
> In `src/services/recipeService.ts`, in the `getDashboardData` function, replace the two-step favorites fetch (first fetch `recipe_id` from `recipe_ratings`, then fetch recipes `in(uniqueFavIds)`) with a single Supabase join query: `supabase.from('recipe_ratings').select('recipe_id, recipes(*)')` filtered by `user_id` and `rating = 'thumbs_up'`. Map the nested `recipes` object directly. This eliminates the serial round-trip and the extra `const uniqueFavIds` dedup step. Verify the dashboard still renders favorites correctly.

---

#### 2.4 Special Occasion Event Planning (Phase 3 MVP) *(Carried Forward)*

See the May 31 entry above for full description and agent prompt.

**Estimated Effort:** 5–7 days | **Expected Impact:** Medium-High

---

### Updated Tier 3 — Strategic (June 2, 2026)

Carried forward from previous assessments — no change in status or priority:

- **3.1 Progressive Web App (PWA)** — see May 31 entry. **Effort:** L | **Impact:** High long-term
- **3.2 Nutrition Information Tracking** — see May 31 entry. **Effort:** XL | **Impact:** High long-term
- **3.3 Print-Friendly Recipe PDF Export** — see May 31 entry. **Effort:** S | **Impact:** Medium
