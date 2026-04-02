/*
  # Create Programs Table

  1. New Tables
    - `programs`
      - `id` (uuid, primary key) - Unique identifier for each program
      - `title` (text, required) - Program title
      - `description` (text, required) - Program description
      - `schedule` (text, required) - Program schedule information
      - `location` (text, required) - Program location
      - `icon` (text, required) - Icon identifier for the program
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `programs` table
    - Add policy for public read access (anyone can view programs)
    - Add policies for authenticated users to insert, update, and delete programs
*/

CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  schedule TEXT NOT NULL,
  location TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view programs"
  ON programs
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert programs"
  ON programs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update programs"
  ON programs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete programs"
  ON programs
  FOR DELETE
  TO authenticated
  USING (true);