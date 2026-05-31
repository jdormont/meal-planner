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

### 1.3 Service Layer Extraction (Data Access Consolidation)

**Description:** Raw Supabase queries are currently scattered across custom hooks and components, tightly coupling UI to table schemas. This makes schema changes risky (no single update point), prevents unit testing of data logic, and duplicates query patterns across multiple files. Extracting all Supabase calls into a `src/services/` layer is the highest-leverage architectural improvement identified in the formal architecture evaluation (May 31, 2026).

**Estimated Effort:** 3–4 days  
**Expected Impact:** High — dramatically improves testability and maintainability; enables safe schema evolution; unblocks auto-generated TypeScript types integration; directly prerequisite for TanStack Query adoption.

**Agent Prompt:**
> Create a `src/services/` directory with the following files: `recipeService.ts`, `mealService.ts`, `userService.ts`, `shoppingListService.ts`. Move all raw `supabase.from(...)` calls from `src/hooks/useRecipes.ts`, `src/hooks/useMeals.ts`, and any components that call Supabase directly into the corresponding service file. Each service function should accept typed parameters and return typed results (use the auto-generated `src/types/database.types.ts` already in the repo). Update all hooks to call service functions instead of Supabase directly. Do not change any component behavior — this is a pure internal refactor. Add at least 3 Vitest unit tests per service file that mock the Supabase client and verify correct query construction.

---

## Tier 2 — Medium-Impact, Moderate Effort

These improvements materially improve the product but require a longer focused effort.

---

### 2.1 Client-Side Routing with Deep-Link Support

**Description:** Navigation is currently driven by a `view` state variable in `App.tsx`, which has grown to ~800 lines managing modals, page state, and routing simultaneously. Users cannot bookmark a specific recipe, share a URL to the community page, or use the browser back button to return to the previous tab. Introducing a lightweight router (`wouter`) and splitting `App.tsx` into page components fixes these UX issues, reduces unnecessary re-renders, and makes the codebase significantly more maintainable.

**Estimated Effort:** 3–5 days  
**Expected Impact:** Medium-High — fixes broken browser navigation UX; enables shareable recipe links; eliminates the primary scalability bottleneck in the codebase.

**Agent Prompt:**
> Install `wouter` (lightweight React router). Create page components in `src/pages/`: `RecipesPage.tsx`, `PlannerPage.tsx`, `ChatPage.tsx`, `CommunityPage.tsx`, `SettingsPage.tsx`, `AdminPage.tsx`. Move the relevant render blocks from `App.tsx` into these pages. Configure routes in `App.tsx` with path patterns (`/`, `/planner`, `/chat`, `/community`, `/settings`, `/admin`, `/recipes/:id`). Convert modal-state booleans that control "edit" and "new" views into query parameters or sub-routes (e.g., `/recipes/new`, `/recipes/:id/edit`). Preserve existing `useAnalytics` page tracking. Add `React.lazy()` and `<Suspense>` fallbacks for lazy-loaded pages to reduce the initial bundle.

---

### 2.2 TanStack Query for Server State Management

**Description:** Data fetching currently uses manual `useState` + `useEffect` patterns with explicit `loadRecipes()` / `loadMeals()` refresh calls after mutations. This causes stale views when switching tabs and wastes bandwidth on redundant fetches. Integrating TanStack Query (`@tanstack/react-query`) provides automatic background refresh, cache invalidation, deduplication, and standardized loading/error states — improving perceived performance and data consistency throughout the app.

**Estimated Effort:** 3–4 days  
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
