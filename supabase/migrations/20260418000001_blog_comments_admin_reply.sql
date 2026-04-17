-- Add admin reply fields to blog_comments
ALTER TABLE blog_comments
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Allow authenticated users (admin) to update comments (for replying)
CREATE POLICY "Authenticated users can update comments"
  ON blog_comments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
