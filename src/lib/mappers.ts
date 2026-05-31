import { 
  Recipe, 
  MealWithRecipes, 
  UserProfile, 
  ShoppingList, 
  ShoppingListItem, 
  CocktailMetadata,
  DbRecipe,
  DbMeal,
  DbMealRecipe,
  DbUserProfile,
  DbShoppingList,
  DbShoppingListItem
} from './supabase';

// Helper to parse ingredients JSON array
const parseIngredients = (ingredientsJson: any): Recipe['ingredients'] => {
  if (Array.isArray(ingredientsJson)) {
    return ingredientsJson.map((ing: any) => ({
      name: String(ing?.name || ''),
      quantity: String(ing?.quantity !== undefined && ing?.quantity !== null ? ing.quantity : ''),
      unit: String(ing?.unit || '')
    }));
  }
  return [];
};

// Helper to parse instructions JSON array
const parseInstructions = (instructionsJson: any): string[] => {
  if (Array.isArray(instructionsJson)) {
    return instructionsJson.map((inst: any) => String(inst || ''));
  }
  return [];
};

// Helper to parse cocktail metadata
const parseCocktailMetadata = (metadataJson: any): CocktailMetadata | null => {
  if (metadataJson && typeof metadataJson === 'object' && !Array.isArray(metadataJson)) {
    return {
      spiritBase: metadataJson.spiritBase ? String(metadataJson.spiritBase) : undefined,
      glassType: metadataJson.glassType ? String(metadataJson.glassType) : undefined,
      garnish: metadataJson.garnish ? String(metadataJson.garnish) : undefined,
      method: metadataJson.method ? String(metadataJson.method) : undefined,
      ice: metadataJson.ice ? String(metadataJson.ice) : undefined
    };
  }
  return null;
};

// Helper to parse metadata for shopping list items
const parseShoppingItemMetadata = (metaJson: any): ShoppingListItem['meta_data'] => {
  if (metaJson && typeof metaJson === 'object' && !Array.isArray(metaJson)) {
    return {
      filters: metaJson.filters ? {
        brand_filters: Array.isArray(metaJson.filters.brand_filters) ? metaJson.filters.brand_filters.map(String) : undefined,
        health_filters: Array.isArray(metaJson.filters.health_filters) ? metaJson.filters.health_filters.map(String) : undefined,
      } : undefined,
      line_item_measurements: Array.isArray(metaJson.line_item_measurements) ? metaJson.line_item_measurements : undefined,
    };
  }
  return {};
};

/**
 * Maps a database recipe row to the frontend Recipe type.
 */
export function mapRecipe(row: DbRecipe): Recipe {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || '',
    description: row.description || '',
    ingredients: parseIngredients(row.ingredients),
    instructions: parseInstructions(row.instructions),
    total_time: row.total_time || 0,
    servings: row.servings || 0,
    tags: row.tags || [],
    image_url: row.image_url || undefined,
    source_url: row.source_url || undefined,
    notes: row.notes || '',
    is_shared: row.is_shared || false,
    recipe_type: row.recipe_type === 'cocktail' ? 'cocktail' : 'food',
    cocktail_metadata: parseCocktailMetadata(row.cocktail_metadata),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    // rating will be attached separately after fetching rating history
    rating: null
  };
}

/**
 * Maps a database user profile row to the frontend UserProfile type.
 */
export function mapUserProfile(row: DbUserProfile): UserProfile {
  const rowAsAny = row as any;
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name || '',
    status: (row.status === 'APPROVED' || row.status === 'REJECTED') ? row.status : 'PENDING',
    is_admin: row.is_admin || false,
    assigned_model_id: row.assigned_model_id,
    has_seen_onboarding: row.has_seen_onboarding || false,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    login_count: rowAsAny.login_count || 0,
    recipe_count: rowAsAny.recipe_count || 0,
    chat_count: rowAsAny.chat_count || 0,
    meal_count: rowAsAny.meal_count || 0
  };
}

/**
 * Maps database meal and meal_recipe rows into the MealWithRecipes type.
 */
export type DbMealWithRecipeRows = DbMeal & {
  meal_recipes: (DbMealRecipe & { recipe: DbRecipe | null })[];
};

export function mapMeal(mealRow: DbMeal, mealRecipes: (DbMealRecipe & { recipe: DbRecipe | null })[] = []): MealWithRecipes {
  return {
    id: mealRow.id,
    user_id: mealRow.user_id,
    name: mealRow.name || '',
    date: mealRow.date || new Date().toISOString().split('T')[0],
    meal_type: (mealRow.meal_type === 'breakfast' || mealRow.meal_type === 'lunch') ? mealRow.meal_type : 'dinner',
    is_event: mealRow.is_event || false,
    description: mealRow.description || '',
    notes: mealRow.notes || '',
    is_archived: mealRow.is_archived || false,
    created_at: mealRow.created_at || new Date().toISOString(),
    updated_at: mealRow.updated_at || new Date().toISOString(),
    recipes: mealRecipes
      .filter((mr): mr is DbMealRecipe & { recipe: DbRecipe } => mr.recipe !== null)
      .map((mr) => ({
        id: mr.id,
        meal_id: mr.meal_id,
        recipe_id: mr.recipe_id,
        user_id: mr.user_id,
        sort_order: mr.sort_order || 0,
        is_completed: mr.is_completed || false,
        created_at: mr.created_at || new Date().toISOString(),
        updated_at: mr.updated_at || new Date().toISOString(),
        recipe: mapRecipe(mr.recipe)
      }))
  };
}

/**
 * Maps database shopping list items.
 */
export function mapShoppingListItem(row: DbShoppingListItem): ShoppingListItem {
  return {
    id: row.id,
    list_id: row.list_id,
    name: row.name,
    quantity: typeof row.quantity === 'number' ? row.quantity : parseFloat(row.quantity) || 1,
    unit: row.unit || 'each',
    display_text: row.display_text || undefined,
    is_checked: row.is_checked || false,
    recipe_id: row.recipe_id || undefined,
    product_id: row.product_id || undefined,
    upc: row.upc || undefined,
    meta_data: parseShoppingItemMetadata(row.meta_data),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

/**
 * Maps database shopping list and nested items.
 */
export function mapShoppingList(listRow: DbShoppingList, itemsRows: DbShoppingListItem[] = []): ShoppingList {
  return {
    id: listRow.id,
    user_id: listRow.user_id,
    title: listRow.title || 'My Shopping List',
    status: listRow.status === 'archived' ? 'archived' : 'active',
    created_at: listRow.created_at || new Date().toISOString(),
    updated_at: listRow.updated_at || new Date().toISOString(),
    items: itemsRows.map(mapShoppingListItem)
  };
}
