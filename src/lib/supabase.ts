import { createClient } from '@supabase/supabase-js';

import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type DbRecipe = Database['public']['Tables']['recipes']['Row'];
export type DbRecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type DbRecipeUpdate = Database['public']['Tables']['recipes']['Update'];

export type DbMeal = Database['public']['Tables']['meals']['Row'];
export type DbMealInsert = Database['public']['Tables']['meals']['Insert'];
export type DbMealUpdate = Database['public']['Tables']['meals']['Update'];

export type DbMealRecipe = Database['public']['Tables']['meal_recipes']['Row'];
export type DbMealRecipeInsert = Database['public']['Tables']['meal_recipes']['Insert'];
export type DbMealRecipeUpdate = Database['public']['Tables']['meal_recipes']['Update'];

export type DbRecipeRating = Database['public']['Tables']['recipe_ratings']['Row'];
export type DbRecipeRatingInsert = Database['public']['Tables']['recipe_ratings']['Insert'];
export type DbRecipeRatingUpdate = Database['public']['Tables']['recipe_ratings']['Update'];

export type DbUserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type DbUserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type DbUserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type DbUserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type DbUserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type DbUserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export type DbShoppingList = Database['public']['Tables']['shopping_lists']['Row'];
export type DbShoppingListItem = Database['public']['Tables']['shopping_list_items']['Row'];

export type CocktailMetadata = {
  spiritBase?: string;
  glassType?: string;
  garnish?: string;
  method?: string;
  ice?: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions: string[];
  total_time: number;
  servings: number;
  tags: string[];
  image_url?: string;
  source_url?: string;
  notes: string;
  is_shared: boolean;
  recipe_type: 'food' | 'cocktail';
  cocktail_metadata?: CocktailMetadata | null;
  created_at: string;
  updated_at: string;
  rating?: 'thumbs_up' | 'thumbs_down' | null;
};

export type RecipeRating = {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: 'thumbs_up' | 'thumbs_down';
  feedback: string;
  created_at: string;
  updated_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  name: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  is_event: boolean;
  description: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type MealRecipe = {
  id: string;
  meal_id: string;
  recipe_id: string;
  user_id: string;
  sort_order: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type MealWithRecipes = Meal & {
  recipes: (MealRecipe & { recipe: Recipe })[];
};

export type ShoppingListItem = {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  display_text?: string;
  is_checked: boolean;
  recipe_id?: string;
  product_id?: string;
  upc?: string;
  meta_data?: {
    filters?: {
      brand_filters?: string[];
      health_filters?: string[];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    line_item_measurements?: any[];
  };
  created_at: string;
  updated_at: string;
};

export type ShoppingList = {
  id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  items?: ShoppingListItem[];
};

export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_admin: boolean;
  assigned_model_id?: string | null;
  has_seen_onboarding?: boolean;
  created_at: string;
  updated_at: string;
  login_count?: number;
  recipe_count?: number;
  chat_count?: number;
  meal_count?: number;
};

export type UserPreferences = {
  favorite_cuisines: string[];
  favorite_dishes: string[];
  food_restrictions: string[];
  time_preference: string;
  skill_level: string;
  household_size: number;
  spice_preference: string;
  cooking_equipment: string[];
  dietary_style: string;
  additional_notes: string;
};

export type LLMModel = {
  id: string;
  model_name: string;
  model_identifier: string;
  provider: 'openai' | 'anthropic' | 'google';
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyMealSet = {
  id: string;
  recipes: unknown[];
  week_start_date: string;
};
