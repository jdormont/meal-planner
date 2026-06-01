# Architectural Evaluation & Refactoring Recommendations
**AI Recipe & Meal Planning App**  
*Date: May 31, 2026*

This document provides a comprehensive evaluation of the current codebase architecture, identifies technical debt and structural bottlenecks, and outlines a prioritized roadmap of improvements to optimize, modularize, and streamline the application.

---

## Executive Summary

The application is built on a solid modern foundation: **Vite + React 18 + TypeScript + Supabase (Postgres, RLS, Edge Functions)**. By utilizing Supabase, the app offloads backend server complexity, relying on client-side hooks and serverless Edge Functions for core business logic.

However, as features have grown (including complex scaling, Instacart integration, and onboarding flows), several architectural pain points have emerged:
1. **Ad-Hoc Routing and State Bloat:** `App.tsx` acts as the router, modal coordinator, and global state sync, leading to a massive component that causes unnecessary re-renders.
2. **Coupled Data-Access:** Raw Supabase queries are scattered directly inside React hooks and UI components, making schema evolution difficult and testing nearly impossible.
3. **Imperfect Local Caching:** State synchronization depends on manual re-fetches after mutations, risking out-of-sync states and redundant network requests.
4. **Zero Test Coverage:** Critical core systems like the portion scaler, recipe parser, and allergy safety filters are completely untested.

---

## Detailed Architectural Analysis & Recommendations

### 1. Frontend Architecture: Routing, State, & Modal Coordination

#### 🔍 Current State
- The application does not use a routing library. Page switching is driven by a `view` state variable in `App.tsx` (`'recipes' | 'community' | 'meals' | 'chat' | 'settings' | 'admin'`).
- Modals, page inputs, and editing modes (over 10 boolean flags) are managed at the root in `App.tsx`.
- Analytics events (`pageView`) are mapped programmatically based on state changes.

#### ⚠️ Key Issues
- **App.tsx Bloat:** The file has grown to nearly 800 lines. It violates the Single Responsibility Principle, acting as a router, view controller, state initializer, and UI template.
- **No Shareable URLs/Deep Linking:** Users cannot bookmark a specific recipe page (`/recipes/123`), share a community view, or navigate directly to the weekly calendar. Refreshing the page wipes out the current view state and returns the user to the default recipes tab.
- **Broken Browser History:** Clicking the browser "Back" button does not return the user to the previous tab/modal; it navigates them out of the application entirely.
- **Wasted Re-renders:** Because state for every modal (import modal, photo scanning modal, edit form, etc.) is housed in `App.tsx`, updating any of these flags forces a re-render of the entire layout.

#### 💡 Recommendations
1. **Introduce a Lightweight Router:** Install a lightweight router like `wouter` or `react-router-dom` to support clean URLs (`/recipes`, `/recipes/:id`, `/planner`, `/community`, `/chat`).
2. **Move Layout Views into Page Components:** Split `App.tsx` into decoupled pages (e.g., `src/pages/RecipesPage.tsx`, `src/pages/PlannerPage.tsx`, `src/pages/ChatPage.tsx`) which are lazy-loaded.
3. **Route-Driven Modals:** Instead of local boolean states, drive modal visibility using route paths or URL query parameters (e.g., `/recipes/new`, `/recipes/:id/edit`, `/planner?import=true`). This keeps the state cleanly in the URL, enabling deep-linking.

> [!NOTE]
> **Status: Completed**
> - **Lightweight Routing:** Integrated `wouter` for URL-driven client-side routing.
> - **Page Components:** Split the monolithic rendering of `App.tsx` into decoupled page components in `src/pages/` (`RecipesPage`, `PlannerPage`, `ChatPage`, `CommunityPage`, `SettingsPage`, `AdminPage`).
> - **Deep-Link Support:** Modal views and page sub-tabs are now driven by routes and URL parameters, supporting the browser back button and direct link sharing.

---

### 2. Data Access & Services Layer

#### 🔍 Current State
- Custom hooks (`useRecipes.ts`, `useMeals.ts`) and components (like `RecipeDetail.tsx` and `useRecipeDashboard.ts`) instantiate queries using the global `supabase` client directly.
- The DB schema types are manually declared in `src/lib/supabase.ts`.

#### ⚠️ Key Issues
- **Tight Coupling:** Components are directly aware of table names, columns, and relational structures. If a table column changes, developers must update queries across multiple hooks and component files.
- **Client-Side Filtering Overhead:** In `useRecipes.ts` (lines 127–140), search term matching on ingredients is performed *client-side* by parsing the JSON structure. Because pagination happens *database-side* (`.range()`), searching only filters the active page set rather than the entire cookbook. This can cause recipes containing the searched ingredient to be missing from the results.
- **Untracked Schema Changes:** Manual type overrides in `src/lib/supabase.ts` create risk. If a migration alters a table, the UI typing is not automatically updated, risking runtime exceptions.

#### 💡 Recommendations
1. **Establish a Service Layer:** Move all raw Supabase DB calls out of UI hooks and into a dedicated service layer (e.g., `src/services/recipeService.ts`, `src/services/mealService.ts`). Hooks should only call these service functions.
2. **Auto-Generate Supabase TypeScript Types:** Leverage Supabase CLI to generate TS declarations from the database schema:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
   ```
3. **Database-Side Ingredient Indexing:** Create a Postgres RPC function or utilize a materialized view to search recipe ingredients on the database side, ensuring that search queries return paginated items matching any ingredient.

> [!NOTE]
> **Status: Partially Completed**
> - **Centralized Service Layer (Completed):** Created `src/services/` modules containing `recipeService.ts`, `mealService.ts`, `profileService.ts`, and `shoppingListService.ts` to abstract database interactions away from component lifecycles.
> - **Compile-time Typing (Completed):** Configured automated database typing mapping in `src/types/database.types.ts` for clean schemas and compile-time verification.
> - **Database-Side Search Indexing (Pending):** Ingredient search is still waiting for database-side indexing implementation.

---

### 3. Server-State Caching & Realtime Subscriptions

#### 🔍 Current State
- State changes (inserting/updating/deleting recipes or meals) are manually resolved. The UI invokes the mutation and calls a manual refresh (`await loadRecipes()`, `await loadMeals()`).
- In `useRecipeDashboard.ts`, a daily recipe selection is cached in `localStorage`, and updates are synchronized across components via custom DOM events (`dashboard-recipes-updated`).

#### ⚠️ Key Issues
- **State Inconsistencies:** If a recipe is modified in one view, another view (such as the meal calendar or dashboard carousel) will show outdated information until a page reload or a manual trigger occurs.
- **Redundant Network Calls:** Without a caching layer, clicking back and forth between tabs triggers repetitive, full database fetches for meals, recipes, and preferences.

#### 💡 Recommendations
1. **Adopt TanStack Query (React Query):** Integrate `@tanstack/react-query` to manage server state:
   - Eliminates boilerplate variables (`loading`, `error`, `data`) from hooks.
   - Implements declarative cache invalidation (e.g., mutating a recipe invalidates `['recipes']` query, auto-refetching relevant lists).
   - Standardizes optimistic updates for operations like dragging-and-dropping meals.
2. **Utilize Supabase Realtime Sync:** For collaborative or cross-device coordination, listen to realtime database changes. Set up a hook `useRealtimeSync()` that updates the local TanStack cache when Supabase broadcasts changes to `recipes` or `meals`.

> [!NOTE]
> **Status: Partially Completed**
> - **TanStack Query Integration (Completed):** Configured `@tanstack/react-query` wrapper and cache providers. Hooks `useRecipes` and `useMeals` are refactored to fetch via service methods and invalidate query keys upon mutation, establishing reliable server-state synchronization.
> - **Realtime Sync Subscription (Pending):** Realtime database syncing has not yet been implemented.

---

### 4. Code Modularity & Component Clean-Up

#### 🔍 Current State
- A few component files contain deep nested blocks of logic and markup.
- `RecipeForm.tsx` is over 1,000 lines long and handles validation, ingredient line parsing, image uploading, tag selectors, and cocktail-specific metadata form blocks.
- `RecipeDetail.tsx` (over 690 lines) implements scaling logic, allergen warnings, rating dialogs, shopping list aggregation, and inline Markdown rendering.

#### ⚠️ Key Issues
- **High Cognitive Load:** Giant files increase developer friction, make code-reviews tedious, and invite merge conflicts.
- **Duplicated Layouts:** `RecipeDetail.tsx` and `RecipeDetailsModal.tsx` share almost identical markup for displaying instructions and ingredients but were built separately to accommodate different JSON formats from AI recommendations vs DB records.

#### 💡 Recommendations
1. **Normalize Recipe Structures:** Adapt the AI recommendation payload structure to match the standard DB `Recipe` structure so a single component (`RecipeDetail.tsx`) can render both.
2. **Break Down `RecipeForm.tsx`:** Extract components into logical parts:
   - `IngredientSelector.tsx` (for managing name, quantity, unit arrays).
   - `CocktailMetadataFields.tsx` (for spirit, glass, garnish, method inputs).
   - `ImageUploadManager.tsx` (handling Supabase storage upload and preview).
3. **Extract Component UI Primitives:** Create reusable design system tokens and layout primitives in `/src/components/ui/` (e.g., `Modal.tsx`, `Button.tsx`, `Card.tsx`, `Badge.tsx`) to replace repetitive Tailwind styles.

> [!NOTE]
> **Status: Partially Completed**
> - **RecipeForm Modularization (Completed):** Extracted modular subcomponents from the monolithic `RecipeForm.tsx` (such as `ImageUpload.tsx`, `SearchSuggestions.tsx`, `RecipeTypeToggle.tsx`, and specific input fields) to reduce cognitive load and form bloat.
> - **Normalization & UI Primitives (Pending):** Unifying AI models with database records and extracting clean `/src/components/ui/` primitive design components are planned for later stages.

---

### 5. Supabase Edge Functions Refactoring

#### 🔍 Current State
- The serverless edge functions are written in TypeScript running on Deno.
- `ai-chat` handles parsing prompts, user profile checking, allergen blocklisting, rating context compilation, and scaling calculations.

#### ⚠️ Key Issues
- **Monolithic `ai-chat` Function:** At several hundred lines, `ai-chat/index.ts` is overly complex. Mixing prompt templates, database checks, safety filters, and OpenAI/Anthropic SDK configurations in a single file makes the edge function brittle.
- **Implicit Dependency Loading:** Sub-functions (like `detectCuisineFromMessages`) parse raw chat messages inline, which increases runtime costs and memory consumption.

#### 💡 Recommendations
1. **Modularize the `ai-chat` Edge Function:** Break down the folder into:
   - `ai-chat/prompts/allergyPrompt.ts` (safety context).
   - `ai-chat/prompts/weeklyPlannerPrompt.ts` (calendar planning constraints).
   - `ai-chat/providers/openai.ts` & `ai-chat/providers/anthropic.ts` (API call abstraction).
2. **Structured Outputs with Zod Schema Validation:** Strictly enforce Zod validation on incoming payloads and AI responses (especially for ingredient formatting, to avoid parsing bugs on the client).

---

### 6. Developer Experience: Testing Strategy

#### 🔍 Current State
- The repository has no test configuration.
- Scratch scripts (`test_*.ts`, `test_*.py`) are present at the root, but no automated testing suite executes on PRs or builds.

#### ⚠️ Critical Risk
- The application relies heavily on complex text parsing (`recipeParser.ts` regex rules), math utilities (`recipeScaler.ts` fraction conversions and scaling multipliers), and sensitive allergy safety systems. Without unit tests, any update to these files could introduce silent regressions that bypass manual QA.

#### 💡 Recommendations
1. **Configure Vitest:** Set up Vitest as it integrates seamlessly with Vite projects, sharing configurations and running tests quickly in watch mode.
2. **Add Unit Tests for Parsers and Scalers:** Write unit tests for:
   - Portions and unit conversion math (`recipeScaler.test.ts`).
   - Markdown parsing and ingredient extraction (`recipeParser.test.ts`).
   - Allergen blocklist generation (to guarantee safety).
3. **Component Testing:** Add Vitest + React Testing Library to write basic integration tests for core screens (e.g., checking if clicking "Add to Meal" triggers the correct modal popup).

> [!NOTE]
> **Status: Completed**
> - **Testing Infrastructure:** Vitest is configured with `src/test/setup.ts`, complete coverage settings, and is fully integrated into the GitHub Actions CI pipeline.
> - **Comprehensive Unit Tests:** Implemented unit tests for `recipeParser.ts`, `recipeScaler.ts`, `allergenUtils.ts`, and db mapping layers, verifying 56 distinct logic scenarios on code updates.

---

## Action Plan: Priority Roadmap

We recommend implementing these changes in three phases:

| Priority | Task | Description | Status / Effort |
| :--- | :--- | :--- | :--- |
| **High** | **1. Setup Test Suite** | Install Vitest and add unit tests for `recipeScaler.ts` and `recipeParser.ts` to secure core utilities. | **Completed** (feat/p0) |
| **High** | **2. Create Service Layer** | Move database operations from hooks and components into `src/services/`. Auto-generate types. | **Completed** (PR #27) |
| **Medium** | **3. Add Client-Side Router** | Integrated `wouter`. Break `App.tsx` down into `/src/pages` and convert modal views to routes. | **Completed** (PR #29) |
| **Medium** | **4. Modularize RecipeForm** | Refactor `RecipeForm.tsx` into sub-components (`IngredientInput`, `CocktailForm`) for legibility. | **Completed** (PR #29) |
| **Medium** | **5. Integrate TanStack Query** | Add caching layer to manage network queries, refetches, and standard loading states. | **Completed** (PR #29) |
| **Low** | **6. Edge Function Split** | Refactor `ai-chat` Edge Function into separate prompt builders and provider modules. | Pending (2 days) |
