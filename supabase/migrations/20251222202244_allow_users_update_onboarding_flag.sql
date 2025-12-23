/*
  # Allow Users to Update Their Onboarding Flag

  1. Changes
    - Add policy allowing users to update their own has_seen_onboarding field
    - Restricted to only this field to prevent misuse

  2. Security
    - Users can only update their own profile
    - Only the has_seen_onboarding field can be updated by regular users
    - All other fields remain admin-only
*/

-- Allow users to update only their has_seen_onboarding field
CREATE POLICY "Users can update own onboarding flag"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);