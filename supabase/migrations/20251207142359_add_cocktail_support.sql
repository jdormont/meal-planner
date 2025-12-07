/*
  # Add Cocktail Support to Recipes

  ## Summary
  Extends the recipes table to support both food recipes and cocktails by adding a type discriminator and cocktail-specific metadata.

  ## Changes
  
  ### Modified Tables
  - `recipes`
    - Added `recipe_type` (text) - Discriminator field with values 'food' or 'cocktail', defaults to 'food'
    - Added `cocktail_metadata` (jsonb) - Optional metadata for cocktails including:
      - spiritBase: Primary spirit used (e.g., vodka, gin, rum, whiskey, tequila)
      - glassType: Type of glass to serve in (e.g., rocks, highball, martini, coupe)
      - garnish: Garnish instructions (e.g., lemon twist, cherry, mint)
      - method: Preparation method (e.g., shaken, stirred, built, blended)
      - ice: Ice specification (e.g., cubed, crushed, neat, rocks)

  ## Indexes
  - Added index on recipe_type for efficient filtering between food and cocktails

  ## Important Notes
  - All existing recipes default to 'food' type
  - cocktail_metadata is optional and only relevant for cocktails
  - Maintains backward compatibility with existing recipe structure
  - cook_time_minutes for cocktails represents chill/mix time
*/

-- Add recipe_type column with default value 'food'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'recipe_type'
  ) THEN
    ALTER TABLE recipes ADD COLUMN recipe_type text DEFAULT 'food' NOT NULL;
  END IF;
END $$;

-- Add cocktail_metadata column for cocktail-specific information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cocktail_metadata'
  ) THEN
    ALTER TABLE recipes ADD COLUMN cocktail_metadata jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add check constraint to ensure recipe_type is either 'food' or 'cocktail'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'recipes_recipe_type_check'
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_recipe_type_check 
      CHECK (recipe_type IN ('food', 'cocktail'));
  END IF;
END $$;

-- Create index for efficient filtering by recipe type
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_type ON recipes(recipe_type);

-- Create composite index for user_id and recipe_type for faster queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_id_recipe_type ON recipes(user_id, recipe_type);