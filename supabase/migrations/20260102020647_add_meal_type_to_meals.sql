/*
  # Add meal type to meals table

  1. Changes
    - Add `meal_type` column to `meals` table
      - Type: text with check constraint for valid values
      - Allowed values: 'breakfast', 'lunch', 'dinner'
      - Default: 'dinner'
    
  2. Notes
    - Existing meals will default to 'dinner'
    - The meal_type allows users to organize meals into specific time slots
    - Combined with date, this creates unique meal planning slots
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE meals ADD COLUMN meal_type text DEFAULT 'dinner' NOT NULL;
    
    ALTER TABLE meals ADD CONSTRAINT meals_meal_type_check 
      CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'));
  END IF;
END $$;