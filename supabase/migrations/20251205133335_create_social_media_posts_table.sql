/*
  # Create Social Media Posts Table

  1. New Tables
    - `social_media_posts`
      - `id` (uuid, primary key) - Unique identifier for each post
      - `title` (text, required) - Post title
      - `description` (text, required) - Post description
      - `platform` (text, required) - Social media platform (youtube, instagram, tiktok, facebook)
      - `url` (text, required) - Link to the actual post
      - `thumbnail` (text, required) - Thumbnail image URL
      - `date` (date, required) - Post date
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `social_media_posts` table
    - Add policy for public read access (anyone can view posts)
    - Add policies for authenticated users to insert, update, and delete posts
*/

CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'facebook')) NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social media posts"
  ON social_media_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert social media posts"
  ON social_media_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update social media posts"
  ON social_media_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete social media posts"
  ON social_media_posts
  FOR DELETE
  TO authenticated
  USING (true);