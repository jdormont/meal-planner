/*
  # Create user preferences table

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `favorite_cuisines` (text array) - List of preferred cuisines
      - `favorite_dishes` (text array) - List of favorite dishes
      - `food_restrictions` (text array) - Dietary restrictions/allergies
      - `time_preference` (text) - Preferred cooking time (quick, moderate, relaxed)
      - `skill_level` (text) - Cooking skill level (beginner, intermediate, advanced)
      - `household_size` (integer) - Number of people cooking for
      - `spice_preference` (text) - Spice tolerance (mild, medium, hot)
      - `cooking_equipment` (text array) - Available cooking equipment
      - `dietary_style` (text) - Overall dietary style (omnivore, vegetarian, vegan, pescatarian, etc.)
      - `additional_notes` (text) - Any other preferences or notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_preferences` table
    - Add policy for users to read their own preferences
    - Add policy for users to insert their own preferences
    - Add policy for users to update their own preferences
    - Add policy for users to delete their own preferences
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  favorite_cuisines text[] DEFAULT '{}',
  favorite_dishes text[] DEFAULT '{}',
  food_restrictions text[] DEFAULT '{}',
  time_preference text DEFAULT 'moderate',
  skill_level text DEFAULT 'intermediate',
  household_size integer DEFAULT 2,
  spice_preference text DEFAULT 'medium',
  cooking_equipment text[] DEFAULT '{}',
  dietary_style text DEFAULT 'omnivore',
  additional_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);