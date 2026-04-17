-- Create service-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view service images
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Admins can upload service images
CREATE POLICY "Admins can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' 
  AND has_role(auth.uid(), 'admin_owner'::app_role)
);

-- Admins can update service images
CREATE POLICY "Admins can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images' 
  AND has_role(auth.uid(), 'admin_owner'::app_role)
);

-- Admins can delete service images
CREATE POLICY "Admins can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' 
  AND has_role(auth.uid(), 'admin_owner'::app_role)
);