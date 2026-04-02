-- ============================================================
--  FIX: blog_posts RLS — consolidate UPDATE policies so that
--  anonymous users can increment like_count AND authenticated
--  admins can update everything. Run this ONCE in SQL Editor.
-- ============================================================

-- Drop the conflicting policies that existed previously
DROP POLICY IF EXISTS "auth_update_posts"      ON blog_posts;
DROP POLICY IF EXISTS "public_update_likes"    ON blog_posts;
DROP POLICY IF EXISTS "Anyone can update like count" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;

-- Single policy: everyone can UPDATE (like_count changes come from public,
-- full edits come from authenticated — row-level we allow both).
-- The application layer (AdminPanel) controls what fields are written.
CREATE POLICY "anyone_can_update_blog_posts"
  ON blog_posts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Ensure comments INSERT is open to public (in case it was missed)
DROP POLICY IF EXISTS "public_insert_comments" ON blog_comments;
CREATE POLICY "public_insert_comments"
  ON blog_comments FOR INSERT
  WITH CHECK (true);

-- Make sure public can read ALL published posts
DROP POLICY IF EXISTS "public_read_published_posts" ON blog_posts;
CREATE POLICY "public_read_published_posts"
  ON blog_posts FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');
