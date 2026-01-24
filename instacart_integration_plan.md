# Instacart Integration Implementation Plan

## Goal Description

Integrate Instacart into the Meal Planner application to allow users to turn their recipes into grocery orders. This involves creating a persistent shopping list feature and connecting it to the Instacart Connect API.

## User Review Required

> [!IMPORTANT]
> **API Credentials**: You will need an API Key for **Instacart Connect** (`INSTACART_CONNECT_API_KEY`).
>
> **Token Scope**: Ensure your API token has the `products_link:write` scope.

## Proposed Changes

### Database Config

#### [NEW] `supabase/migrations/20240124_create_shopping_lists.sql`

Create tables for persistent shopping lists.

```sql
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  status text check (status in ('active', 'archived')) default 'active',
  title text default 'My Shopping List',
  created_at timestamptz default now()
);

create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references shopping_lists not null,
  name text not null, -- used for Instacart search
  quantity numeric not null default 1.0,
  unit text not null default 'each', -- e.g. 'lbs', 'pkg'
  display_text text, -- Optional display name
  is_checked boolean default false,
  recipe_id uuid references recipes(id),
  meta_data jsonb default '{}'::jsonb -- For filters, brand info
);
```

### Shared Types

#### [MODIFY] `src/lib/supabase.ts`

- Add `ShoppingList` and `ShoppingListItem` type definitions matching the DB schema.

### Backend (Edge Functions)

#### [NEW] `supabase/functions/instacart-integration/index.ts`

- **Purpose**: specific endpoint to generate the Instacart link.
- **Endpoint**: `POST https://connect.instacart.com/idp/v1/products/products_link`
- **Logic**:
    1. Authenticated user request.
    2. Map `shopping_list_items` to Instacart `LineItem` objects.
    3. Send to Instacart Connect API.
    4. Return `products_link_url`.

### Frontend Components

#### [NEW] `src/contexts/ShoppingListContext.tsx`

- **State**: `currentList`, `items`, `isLoading`.
- **Actions**: `addItem`, `updateItem`, `removeItem`, `clearList`, `createInstacartLink`.
- **Logic**: Auto-fetch active list on load; create one if missing.

#### [NEW] `src/components/ShoppingListDrawer.tsx`

- Slide-out drawer showing current items.
- Checkbox to toggle `is_checked`.
- "Shop with Instacart" button calling the context action.

#### [MODIFY] `src/components/Layout.tsx`

- Add `ShoppingCart` icon to navbar.
- Clicking opens the `ShoppingListDrawer`.
- Display badge with item count.

#### [MODIFY] `src/components/RecipeDetail.tsx`

- Add "Add to Shopping List" button near "Add to Meal".
- **Logic**: Parse ingredients and call `addItem` from context.

#### [MODIFY] `src/App.tsx`

- Wrap app with `ShoppingListProvider`.
- Include `ShoppingListDrawer` in the component tree.

## Verification Plan

### Automated Tests
- None planned for this iteration.

### Manual Verification

1. **Database Persistence**:
    - Check Supabase dashboard to verify tables are created.
    - Confirm RLS policies are applied (users see only their own lists).

2. **UI Implementation**:
    - **Add Item**: Open a Recipe, click "Add to Shopping List". Verify items appear in Drawer.
    - **Modify**: Check off an item in the Drawer. Reload page to ensure state persists.
    - **Remove**: Delete an item and verify it's gone from DB.

3. **Instacart Integration**:
    - Click "Shop with Instacart".
    - Watch Network tab for call to `instacart-integration`.
    - Confirm response contains `products_link_url`.
    - Confirm browser redirects to Instacart and pre-fills the cart.

