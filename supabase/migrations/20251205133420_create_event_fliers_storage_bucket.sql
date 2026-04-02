/*
  # Create Event Fliers Storage Bucket

  1. Storage Buckets
    - `event-fliers` - Public bucket for storing event flier images

  2. Security
    - Enable public access for viewing (SELECT)
    - Restrict uploads (INSERT) to authenticated users only
    - Restrict updates and deletes to authenticated users only
    - Set reasonable file size limits and allowed file types
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-fliers',
  'event-fliers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view event fliers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-fliers');

CREATE POLICY "Authenticated users can upload event fliers"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-fliers');

CREATE POLICY "Authenticated users can update event fliers"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-fliers')
  WITH CHECK (bucket_id = 'event-fliers');

CREATE POLICY "Authenticated users can delete event fliers"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-fliers');