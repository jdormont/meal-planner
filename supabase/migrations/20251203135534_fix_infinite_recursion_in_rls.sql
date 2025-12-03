/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - The admin policies were querying user_profiles to check if user is admin
    - This created infinite recursion when reading from user_profiles

  2. Solution
    - Drop the problematic admin policies that query the same table
    - Keep only the basic "users can read own profile" policy
    - Admin operations should be done through service role or backend functions

  3. Changes
    - Drop "Admins can read all profiles" policy
    - Drop "Admins can update profiles" policy
    - Add "Users can update own profile" policy for regular updates
*/

-- Drop the problematic admin policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- Add policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
