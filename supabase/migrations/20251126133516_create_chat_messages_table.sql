/*
  # Create chat_messages table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `chat_id` (uuid, foreign key) - References chats table
      - `role` (text) - Either 'user' or 'assistant'
      - `content` (text) - The message content
      - `created_at` (timestamptz) - When the message was created
  
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for authenticated users to read messages from their chats
    - Add policy for authenticated users to create messages in their chats
    - Add policy for authenticated users to delete messages from their chats
  
  3. Notes
    - Messages are automatically deleted when the parent chat is deleted (CASCADE)
    - Messages are ordered by created_at to maintain conversation flow
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own chats"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own chats"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from own chats"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS chat_messages_chat_id_idx ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);