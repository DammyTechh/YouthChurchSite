/*
  # Create Upcoming Events Table

  1. New Tables
    - `upcoming_events`
      - `id` (uuid, primary key) - Unique identifier for each event
      - `title` (text, required) - Event title
      - `description` (text, required) - Event description
      - `date` (date, required) - Event date
      - `time` (time, required) - Event time
      - `location` (text, required) - Event location
      - `flier_url` (text, optional) - URL to event flier image
      - `is_active` (boolean, default true) - Whether event is visible/active
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `upcoming_events` table
    - Add policy for public read access (anyone can view active events)
    - Add policies for authenticated users to insert, update, and delete events
*/

CREATE TABLE IF NOT EXISTS upcoming_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  flier_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE upcoming_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upcoming events"
  ON upcoming_events
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert upcoming events"
  ON upcoming_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update upcoming events"
  ON upcoming_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete upcoming events"
  ON upcoming_events
  FOR DELETE
  TO authenticated
  USING (true);