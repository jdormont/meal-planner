/*
  # Update Weekly Planner for Global Sets

  1. Changes
    - Modify `weekly_meal_sets` to allow NULL `user_id` (for global/system sets).
    - Create partial unique index for global sets (one per week).
    - Update RLS to allow everyone to read global sets.

  2. Security
    - Public (authenticated) read access to global sets.
    - Write access remains restricted (owner or service role).
*/

-- Make user_id nullable
ALTER TABLE weekly_meal_sets ALTER COLUMN user_id DROP NOT NULL;

-- Create index for unique global set per week
CREATE UNIQUE INDEX IF NOT EXISTS weekly_meal_sets_global_date_idx 
    ON weekly_meal_sets (week_start_date) 
    WHERE user_id IS NULL;

-- Add RLS policy for reading global sets
CREATE POLICY "Everyone can view global weekly meal sets"
    ON weekly_meal_sets FOR SELECT
    USING (user_id IS NULL);
