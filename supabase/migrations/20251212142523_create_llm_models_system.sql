/*
  # Create LLM Models Management System

  1. New Tables
    - `llm_models`
      - `id` (uuid, primary key) - Unique identifier for the model
      - `model_name` (text) - Display name (e.g., "ChatGPT 4o-mini")
      - `model_identifier` (text) - API model identifier (e.g., "gpt-4o-mini")
      - `provider` (text) - Provider name: openai, anthropic, or google
      - `is_active` (boolean) - Whether model is available for assignment
      - `is_default` (boolean) - Whether this is the default model for all users
      - `display_order` (integer) - Sort order for admin UI
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Table Updates
    - Add `assigned_model_id` to `user_profiles`
      - References `llm_models` table
      - Nullable (null = use default model)
      - Add index for performance

  3. Security
    - Enable RLS on `llm_models` table
    - All authenticated users can read active models
    - Only admins can insert/update/delete models
    - Add policies for user_profiles model assignment column

  4. Important Notes
    - Only ONE model can be set as default at a time
    - Pre-populates with three models: ChatGPT 4o-mini (default), Claude 3.5, Gemini 1.5 Pro
    - Existing users will automatically use the default model (null assignment)
*/

-- Create llm_models table
CREATE TABLE IF NOT EXISTS llm_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_identifier text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google')),
  is_active boolean DEFAULT true NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active models
CREATE POLICY "Authenticated users can read active models"
  ON llm_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can read all models
CREATE POLICY "Admins can read all models"
  ON llm_models FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can insert models
CREATE POLICY "Admins can insert models"
  ON llm_models FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can update models
CREATE POLICY "Admins can update models"
  ON llm_models FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can delete models
CREATE POLICY "Admins can delete models"
  ON llm_models FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_llm_models_provider ON llm_models(provider);
CREATE INDEX IF NOT EXISTS idx_llm_models_is_active ON llm_models(is_active);
CREATE INDEX IF NOT EXISTS idx_llm_models_is_default ON llm_models(is_default);
CREATE INDEX IF NOT EXISTS idx_llm_models_display_order ON llm_models(display_order);

-- Add assigned_model_id to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'assigned_model_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN assigned_model_id uuid REFERENCES llm_models(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for model assignment lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_model ON user_profiles(assigned_model_id);

-- Insert default models
INSERT INTO llm_models (model_name, model_identifier, provider, is_active, is_default, display_order)
VALUES
  ('ChatGPT 4o-mini', 'gpt-4o-mini', 'openai', true, true, 1),
  ('Claude 3.5 Sonnet', 'claude-3-5-sonnet-20241022', 'anthropic', true, false, 2),
  ('Gemini 1.5 Pro', 'gemini-1.5-pro', 'google', true, false, 3)
ON CONFLICT (model_identifier) DO NOTHING;

-- Function to ensure only one default model
CREATE OR REPLACE FUNCTION ensure_single_default_model()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE llm_models
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single default
DROP TRIGGER IF EXISTS trigger_ensure_single_default_model ON llm_models;
CREATE TRIGGER trigger_ensure_single_default_model
  BEFORE INSERT OR UPDATE ON llm_models
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_model();

-- Function to track model usage in chat messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN model_used text;
  END IF;
END $$;
