-- ============================================================
--  RuggedYouth — Supabase DB & Storage Fix Script
--  Run this ONCE in your Supabase SQL Editor
--  Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── FIX 1: Make thumbnail optional (prevents insert crash) ──
ALTER TABLE social_media_posts
  ALTER COLUMN thumbnail SET DEFAULT '',
  ALTER COLUMN thumbnail DROP NOT NULL;

-- ── FIX 2: Expand blog media_type to include 'flyer' & 'link' ──
-- (The old CHECK only allowed image/video/audio/text)
ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_media_type_check;

ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_media_type_check
  CHECK (media_type IN ('image', 'video', 'audio', 'text', 'flyer', 'link'));

-- ── FIX 3: Expand storage bucket to allow video & audio ──
-- (Was images-only, blocked blog video/audio uploads)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/avi',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'
],
file_size_limit = 52428800  -- raise to 50MB for video/audio
WHERE id = 'event-fliers';

-- ── FIX 4: Ensure storage upload policy works for all paths ──
DROP POLICY IF EXISTS "Authenticated users can upload event fliers" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-fliers');

DROP POLICY IF EXISTS "Authenticated users can update event fliers" ON storage.objects;
CREATE POLICY "Authenticated users can update files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-fliers')
  WITH CHECK (bucket_id = 'event-fliers');

-- ── FIX 5: Ensure blog UPDATE policy is clean (no conflicts) ──
DROP POLICY IF EXISTS "anyone_can_update_blog_posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can update like count" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;

CREATE POLICY "anyone_can_update_blog_posts"
  ON blog_posts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── Done! ──────────────────────────────────────────────────
SELECT 'RuggedYouth DB fixes applied successfully ✓' as result;
