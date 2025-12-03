/*
  # Update RLS policies to require approved status

  1. Changes to Existing Tables
    - `recipes` - Add approval check to all policies
    - `recipe_ratings` - Add approval check to all policies
    - `chats` - Add approval check to all policies
    - `chat_messages` - Add approval check to all policies
    - `user_preferences` - Add approval check to all policies
    - `meals` - Add approval check to all policies
    - `meal_recipes` - Add approval check to all policies

  2. Security Updates
    - Only APPROVED users can access app data
    - PENDING and REJECTED users cannot create or view data
    - Admins are exempt and can access regardless of status
    - All existing policies are updated with approval checks

  3. Important Notes
    - Policies are dropped and recreated with new conditions
    - Uses is_user_approved() helper function
    - Maintains existing ownership checks
*/

-- RECIPES TABLE
DROP POLICY IF EXISTS "Users can read own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

CREATE POLICY "Approved users can read own recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can insert own recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- RECIPE_RATINGS TABLE
DROP POLICY IF EXISTS "Users can view own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON recipe_ratings;

CREATE POLICY "Approved users can view own ratings"
  ON recipe_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can insert own ratings"
  ON recipe_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update own ratings"
  ON recipe_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete own ratings"
  ON recipe_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- CHATS TABLE
DROP POLICY IF EXISTS "Users can read own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;

CREATE POLICY "Approved users can read own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can insert own chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update own chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete own chats"
  ON chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- CHAT_MESSAGES TABLE
DROP POLICY IF EXISTS "Users can view messages from own chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to own chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

CREATE POLICY "Approved users can view messages from own chats"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
    AND is_user_approved(auth.uid())
  );

CREATE POLICY "Approved users can insert messages to own chats"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
    AND is_user_approved(auth.uid())
  );

CREATE POLICY "Approved users can update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
    AND is_user_approved(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
    AND is_user_approved(auth.uid())
  );

CREATE POLICY "Approved users can delete own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
    AND is_user_approved(auth.uid())
  );

-- USER_PREFERENCES TABLE
DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

CREATE POLICY "Approved users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- MEALS TABLE
DROP POLICY IF EXISTS "Users can read own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
DROP POLICY IF EXISTS "Users can update own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON meals;

CREATE POLICY "Approved users can read own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- MEAL_RECIPES TABLE
DROP POLICY IF EXISTS "Users can view own meal recipes" ON meal_recipes;
DROP POLICY IF EXISTS "Users can insert own meal recipes" ON meal_recipes;
DROP POLICY IF EXISTS "Users can update own meal recipes" ON meal_recipes;
DROP POLICY IF EXISTS "Users can delete own meal recipes" ON meal_recipes;

CREATE POLICY "Approved users can view own meal recipes"
  ON meal_recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can insert own meal recipes"
  ON meal_recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update own meal recipes"
  ON meal_recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete own meal recipes"
  ON meal_recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));