-- =====================================================
-- Road Patrol - Database Migration 005
-- Create Storage Buckets
-- =====================================================

-- =====================================================
-- 1. CREATE REPORT PHOTOS BUCKET
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. STORAGE POLICIES FOR REPORT PHOTOS
-- =====================================================

-- Allow anyone to view report photos (bucket is public)
CREATE POLICY "report_photos_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-photos');

-- Allow anyone to upload report photos
CREATE POLICY "report_photos_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "report_photos_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'report-photos' AND
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to delete photos
CREATE POLICY "report_photos_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'report-photos' AND
    auth.uid() IS NOT NULL
  );
