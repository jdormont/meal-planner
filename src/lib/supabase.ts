import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
};
