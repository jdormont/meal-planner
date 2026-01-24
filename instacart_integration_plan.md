# Instacart Integration Plan

## Goal Description

Integrate Instacart into the Meal Planner application to allow users to seamlessy turn their meal plans into grocery orders. This involves creating a persistent shopping list feature and connecting it to the Instacart API using the **Instacart Connect (Merchant Platform)** "Create shopping list page" endpoint.

## User Review Required

> [!IMPORTANT]
> **API Credentials**: You will need an API Key for **Instacart Connect**. The endpoint used is `https://connect.instacart.com/idp/v1/products/products_link`.
>
> **Token Scope**: Ensure your API token has the `products_link:write` (or equivalent) scope to create shopping lists.

## Proposed Architecture

### 1. Database Schema (Supabase)

We need to store the user's shopping list persistently and structured in a way that maps easily to the Instacart API `LineItem` object.

#### [NEW] Table: `shopping_lists`

- `id`: uuid (primary key)
- `user_id`: uuid (references auth.users)
- `status`: string ('active', 'archived')
- `title`: string (default "Meal Planner Shopping List")
- `created_at`: timestamp

#### [NEW] Table: `shopping_list_items`

- `id`: uuid
- `list_id`: uuid (references shopping_lists.id)
- `name`: string (Required: Instacart uses this for search)
- `quantity`: numeric (Required: default 1.0)
- `unit`: string (Required: default 'each'; e.g., 'package', 'tablespoon', 'ounce')
- `display_text`: string (Optional: Title displayed in search results)
- `is_checked`: boolean
- `recipe_id`: uuid (optional, for reference)
- `product_id`: string (Optional: Specific Instacart Product ID)
- `upc`: string (Optional: Specific UPC)
- `meta_data`: jsonb (Stores optional filters or extra measurements)
    - `brand_filters`: string[]
    - `health_filters`: string[] (e.g., 'ORGANIC', 'GLUTEN_FREE')
    - `line_item_measurements`: object[]

### 2. Backend (Edge Functions)

#### [NEW] `supabase/functions/instacart-integration/index.ts`

- **Purpose**: specific endpoint to generating the Instacart link.
- **Endpoint**: `POST https://connect.instacart.com/idp/v1/products/products_link`
- **Inputs**: 
    - `items`: Array of objects matching `shopping_list_items` schema.
    - `config`: Object containing `partner_linkback_url` (optional).
- **Process**:
    1. Validate User Auth.
    2. Map `items` to Instacart `LineItem[]` structure.
    3. Construct payload with `landing_page_configuration`.
    4. Call Instacart API.
    - **Payload Example**:
      ```json
      {
        "title": "My Weekly Meal Plan",
        "link_type": "recipe", 
        "line_items": [
          {
            "name": "Tomatoes",
            "quantity": 3,
            "unit": "each",
            "filters": { "health_filters": ["ORGANIC"] }
          }
        ],
        "landing_page_configuration": {
          "enable_pantry_items": true
        }
      }
      ```
- **Outputs**: `{ products_link_url: "https://..." }` - The URL to redirect the user to.
- **Secrets**: `INSTACART_CONNECT_API_KEY`.

### 3. Frontend Components

#### [NEW] `src/contexts/ShoppingListContext.tsx`

- Manages the state of the active shopping list.
- Provides methods: `addItem`, `removeItem`, `toggleItem`, `clearList`.
- Syncs with Supabase `shopping_lists` table.

#### [NEW] `src/components/ShoppingListDrawer.tsx`

- A slide-out drawer (using `FilterDrawer` style) to view current items.
- Group items by category (Produce, Dairy, etc.) if possible [Future Enhancement].
- **"Shop with Instacart"** sticky button at the bottom.

#### [MODIFY] `src/App.tsx`

- Add `ShoppingListProvider`.
- Add global `ShoppingListDrawer` accessible via the navigation bar.

#### [MODIFY] `src/components/RecipeDetail.tsx`

- Add UI Element: "Add Ingredients to Shopping List" button.
- Logic to parse current recipe ingredients and add them to the context.

#### [MODIFY] `src/components/Layout.tsx`

- Add a "Shopping Cart" icon to the top navigation bar with a badge counting items.

## Implementation Steps

1. **Database Setup**: Create migration files for the new tables (`shopping_lists`, `shopping_list_items`).
2. **Context & Service**: Implement `ShoppingListContext` and helpers in `src/lib/supabase.ts`.
3. **UI Implementation**:
    - Create `ShoppingListDrawer`.
    - Update `Layout` to include the toggle button.
    - Update `RecipeDetail` to allow adding items.
4. **API Integration**:
    - Develop the Edge Function handling the Instacart Connect handshake.
    - Connect the "Shop" button to the Edge Function.

## Verification Plan

### Manual Verification

1. **Add to List**:
    - Open a Recipe.
    - Click "Add to Shopping List".
    - Verify badge count increases in the nav bar.
2. **Manage List**:
    - Open the Shopping List Drawer.
    - Verify all ingredients are listed with correct `name`, `quantity`, and `unit`.
    - Toggle functionality (check/uncheck items).
    - Remove an item and verify it disappears.
3. **Persistence**:
    - Refresh the page.
    - Verify items represent in the list.
4. **Instacart Handoff**:
    - Click "Shop with Instacart".
    - Verify the Edge Function is called (check browser network tab).
    - **Success Criteria**: Receive a `products_link_url` and successfully redirect to the Instacart landing page populated with items.
