/*
  # Create chats table

  1. New Tables
    - `chats`
      - `id` (uuid, primary key) - Unique identifier for each chat
      - `user_id` (uuid, foreign key) - References auth.users
      - `title` (text) - Chat title (generated from first message)
      - `created_at` (timestamptz) - When the chat was created
      - `updated_at` (timestamptz) - Last message timestamp
  
  2. Security
    - Enable RLS on `chats` table
    - Add policy for authenticated users to read their own chats
    - Add policy for authenticated users to create their own chats
    - Add policy for authenticated users to update their own chats
    - Add policy for authenticated users to delete their own chats
*/

CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON chats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(user_id);
CREATE INDEX IF NOT EXISTS chats_updated_at_idx ON chats(updated_at DESC);