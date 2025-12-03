/*
  # Create Recipes Table

  ## Summary
  Creates the core recipes table for storing user recipes with full metadata including ingredients, instructions, timing, and categorization.

  ## New Tables
  
  ### `recipes`
  - `id` (uuid, primary key) - Unique identifier for each recipe
  - `user_id` (uuid, foreign key) - References auth.users, owner of the recipe
  - `title` (text) - Recipe name
  - `description` (text) - Brief description of the recipe
  - `ingredients` (jsonb) - Array of ingredient objects with name, quantity, and unit
  - `instructions` (jsonb) - Array of step-by-step instruction strings
  - `prep_time_minutes` (integer) - Preparation time in minutes
  - `cook_time_minutes` (integer) - Cooking time in minutes
  - `servings` (integer) - Number of servings the recipe makes
  - `tags` (text array) - Categories, cuisine types, dietary restrictions, etc.
  - `image_url` (text, optional) - URL to recipe image
  - `source_url` (text, optional) - Original source URL if imported
  - `notes` (text, optional) - Personal notes about the recipe
  - `created_at` (timestamptz) - When the recipe was created
  - `updated_at` (timestamptz) - When the recipe was last updated

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the recipes table
  - Users can only view their own recipes
  - Users can insert their own recipes
  - Users can update their own recipes
  - Users can delete their own recipes
  
  ### Policies
  1. **"Users can view own recipes"** - SELECT policy for authenticated users
  2. **"Users can insert own recipes"** - INSERT policy for authenticated users
  3. **"Users can update own recipes"** - UPDATE policy for authenticated users
  4. **"Users can delete own recipes"** - DELETE policy for authenticated users

  ## Important Notes
  - All recipes are private by default (RLS ensures isolation)
  - The ingredients and instructions are stored as JSONB for flexible structure
  - Tags array allows for multiple categorizations per recipe
  - Timestamps auto-update for audit trail
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  ingredients jsonb DEFAULT '[]'::jsonb,
  instructions jsonb DEFAULT '[]'::jsonb,
  prep_time_minutes integer DEFAULT 0,
  cook_time_minutes integer DEFAULT 0,
  servings integer DEFAULT 4,
  tags text[] DEFAULT ARRAY[]::text[],
  image_url text,
  source_url text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes table
CREATE POLICY "Users can view own recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
