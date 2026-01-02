import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  prep_time_minutes: number;
  cook_time_minutes: number;
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
