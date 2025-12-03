/*
  # Create meals table

  1. New Tables
    - `meals`
      - `id` (uuid, primary key) - Unique identifier for each meal
      - `user_id` (uuid) - Reference to auth.users
      - `name` (text) - Name of the meal event (e.g., "Passover Seder 2025")
      - `date` (date) - Date when the meal is planned
      - `description` (text) - Optional description of the meal
      - `notes` (text) - Additional notes or planning details
      - `is_archived` (boolean) - Whether the meal is archived
      - `created_at` (timestamptz) - When the meal was created
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `meals` table
    - Add policy for authenticated users to read their own meals
    - Add policy for authenticated users to insert their own meals
    - Add policy for authenticated users to update their own meals
    - Add policy for authenticated users to delete their own meals
*/

CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text DEFAULT '',
  notes text DEFAULT '',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meals_user_id_idx ON meals(user_id);
CREATE INDEX IF NOT EXISTS meals_date_idx ON meals(date);