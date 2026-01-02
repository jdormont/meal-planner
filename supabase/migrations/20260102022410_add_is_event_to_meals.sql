/*
  # Add is_event column to meals table

  1. Changes
    - Add `is_event` column to `meals` table
      - Type: boolean
      - Default: false
      - Not null constraint
    
  2. Notes
    - This allows meals to be marked as special events
    - Existing meals will default to false (regular meals)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'is_event'
  ) THEN
    ALTER TABLE meals ADD COLUMN is_event boolean DEFAULT false NOT NULL;
  END IF;
END $$;