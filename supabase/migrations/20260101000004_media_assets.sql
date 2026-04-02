-- Media Assets library (for persistent content storage)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('image','video','audio','document','flyer','program')) NOT NULL,
  file_size INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Public can view non-archived assets
CREATE POLICY "Anyone can view media assets"
  ON media_assets FOR SELECT
  USING (is_archived = false);

CREATE POLICY "Authenticated users can view all media assets"
  ON media_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert media assets"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media assets"
  ON media_assets FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- IMPORTANT: No DELETE policy - assets are archived, never deleted
-- This ensures all uploaded content is permanently maintained
