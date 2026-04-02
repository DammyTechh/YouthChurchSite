-- Blog Comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON blog_comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert comments"
  ON blog_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete comments"
  ON blog_comments FOR DELETE
  TO authenticated
  USING (true);
