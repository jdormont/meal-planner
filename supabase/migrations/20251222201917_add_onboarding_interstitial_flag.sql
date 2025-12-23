/*
  # Add Onboarding Interstitial Flag

  1. Changes
    - Add `has_seen_onboarding` column to `user_profiles` table
    - Defaults to false for new users
    - Tracks whether user has seen the first-time onboarding message

  2. Purpose
    - Show one-time interstitial after first meaningful action
    - Meaningful actions: saving a recipe, rating a recipe, or chatting about recipes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_seen_onboarding'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_seen_onboarding boolean DEFAULT false;
  END IF;
END $$;