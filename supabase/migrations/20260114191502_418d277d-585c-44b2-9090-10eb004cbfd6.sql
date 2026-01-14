-- Create storage bucket for quiz images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view quiz images (public bucket)
CREATE POLICY "Quiz images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-images');

-- Allow authenticated admins to upload quiz images
CREATE POLICY "Admins can upload quiz images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quiz-images' 
  AND has_role(auth.uid(), 'admin_owner'::app_role)
);

-- Allow authenticated admins to update quiz images
CREATE POLICY "Admins can update quiz images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'quiz-images' 
  AND has_role(auth.uid(), 'admin_owner'::app_role)
);

-- Allow authenticated admins to delete quiz images
CREATE POLICY "Admins can delete quiz images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'quiz-images' 
  AND has_role(auth.uid(), 'admin_owner'::app_role)
);