/*
  # Create meal_recipes junction table

  1. New Tables
    - `meal_recipes`
      - `id` (uuid, primary key) - Unique identifier
      - `meal_id` (uuid) - Reference to meals table
      - `recipe_id` (uuid) - Reference to recipes table
      - `user_id` (uuid) - Reference to auth.users for RLS
      - `sort_order` (integer) - Order of recipe in the meal
      - `is_completed` (boolean) - Whether recipe has been made
      - `created_at` (timestamptz) - When recipe was added to meal
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `meal_recipes` table
    - Add policy for authenticated users to read their own meal recipes
    - Add policy for authenticated users to insert their own meal recipes
    - Add policy for authenticated users to update their own meal recipes
    - Add policy for authenticated users to delete their own meal recipes
  
  3. Important Notes
    - Uses composite unique constraint to prevent duplicate recipe assignments
    - Cascading deletes ensure cleanup when meals or recipes are deleted
    - sort_order allows recipes to be ordered within a meal
*/

CREATE TABLE IF NOT EXISTS meal_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sort_order integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(meal_id, recipe_id)
);

ALTER TABLE meal_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal recipes"
  ON meal_recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal recipes"
  ON meal_recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal recipes"
  ON meal_recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal recipes"
  ON meal_recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meal_recipes_meal_id_idx ON meal_recipes(meal_id);
CREATE INDEX IF NOT EXISTS meal_recipes_recipe_id_idx ON meal_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS meal_recipes_user_id_idx ON meal_recipes(user_id);