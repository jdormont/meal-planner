/*
  # Create recipe ratings table

  1. New Tables
    - `recipe_ratings`
      - `id` (uuid, primary key) - Unique identifier for the rating
      - `recipe_id` (uuid, foreign key) - References the recipe being rated
      - `user_id` (uuid, foreign key) - References the user who rated
      - `rating` (text) - Either 'thumbs_up' or 'thumbs_down'
      - `feedback` (text, optional) - User's explanation for their rating
      - `created_at` (timestamptz) - When the rating was created
      - `updated_at` (timestamptz) - When the rating was last updated

  2. Security
    - Enable RLS on `recipe_ratings` table
    - Add policy for authenticated users to create their own ratings
    - Add policy for authenticated users to read their own ratings
    - Add policy for authenticated users to update their own ratings
    - Add policy for authenticated users to delete their own ratings

  3. Indexes
    - Add index on recipe_id for faster lookups
    - Add index on user_id for faster user-specific queries
    - Add unique constraint to prevent duplicate ratings per user per recipe
*/

CREATE TABLE IF NOT EXISTS recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating text NOT NULL CHECK (rating IN ('thumbs_up', 'thumbs_down')),
  feedback text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS recipe_ratings_recipe_id_idx ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_ratings_user_id_idx ON recipe_ratings(user_id);

-- Enable RLS
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own ratings
CREATE POLICY "Users can create own ratings"
  ON recipe_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own ratings
CREATE POLICY "Users can read own ratings"
  ON recipe_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON recipe_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON recipe_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);