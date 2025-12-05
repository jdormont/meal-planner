/*
  # Add Recipe Sharing Feature

  1. Changes
    - Add `is_shared` boolean column to recipes table (defaults to false)
    - Update RLS policies to allow users to view shared recipes from other users
    - Users can only edit/delete their own recipes
    - Users can view all shared recipes plus their own recipes

  2. Security
    - SELECT: Users can view their own recipes + all shared recipes
    - INSERT: Users can only insert their own recipes
    - UPDATE: Users can only update their own recipes
    - DELETE: Users can only delete their own recipes
*/

-- Add is_shared column to recipes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE recipes ADD COLUMN is_shared boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

-- Create new policies that support shared recipes
CREATE POLICY "Users can view own recipes and shared recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

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
