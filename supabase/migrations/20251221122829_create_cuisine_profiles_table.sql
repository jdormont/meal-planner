/*
  # Create Cuisine Profiles System

  1. New Tables
    - `cuisine_profiles`
      - `id` (uuid, primary key) - Unique identifier
      - `cuisine_name` (text, unique) - Name of the cuisine (e.g., "Chinese", "Italian")
      - `style_focus` (text) - Description of the style focus
      - `profile_data` (jsonb) - Complete cuisine profile schema as JSON
      - `is_active` (boolean) - Whether this profile is available for use
      - `keywords` (text array) - Keywords for detecting this cuisine in user queries
      - `display_order` (integer) - Sort order for admin UI
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `cuisine_profiles` table
    - All authenticated users can read active profiles
    - Only admins can insert, update, or delete profiles

  3. Important Notes
    - Profile data stored as JSONB for flexible schema storage
    - Keywords array enables efficient cuisine detection from user messages
    - Indexes on cuisine_name, keywords (GIN), and is_active for performance
*/

-- Create cuisine_profiles table
CREATE TABLE IF NOT EXISTS cuisine_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuisine_name text NOT NULL UNIQUE,
  style_focus text NOT NULL,
  profile_data jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE cuisine_profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active profiles
CREATE POLICY "Authenticated users can read active profiles"
  ON cuisine_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON cuisine_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON cuisine_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON cuisine_profiles FOR UPDATE
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

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON cuisine_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cuisine_profiles_cuisine_name ON cuisine_profiles(cuisine_name);
CREATE INDEX IF NOT EXISTS idx_cuisine_profiles_is_active ON cuisine_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_cuisine_profiles_display_order ON cuisine_profiles(display_order);
CREATE INDEX IF NOT EXISTS idx_cuisine_profiles_keywords ON cuisine_profiles USING GIN(keywords);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cuisine_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_cuisine_profiles_updated_at ON cuisine_profiles;
CREATE TRIGGER trigger_update_cuisine_profiles_updated_at
  BEFORE UPDATE ON cuisine_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_cuisine_profiles_updated_at();
