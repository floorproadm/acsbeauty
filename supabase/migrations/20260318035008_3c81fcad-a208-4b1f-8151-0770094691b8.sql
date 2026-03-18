
-- Add avatar_url to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for client avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to client-avatars bucket
CREATE POLICY "Anyone can upload client avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-avatars');

-- Allow anyone to view client avatars
CREATE POLICY "Anyone can view client avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-avatars');

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-avatars');

-- Allow authenticated users to delete own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-avatars');
