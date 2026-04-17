-- Add media_type column to gallery_images to support videos alongside images
ALTER TABLE public.gallery_images
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

-- Constraint to keep values clean
ALTER TABLE public.gallery_images
DROP CONSTRAINT IF EXISTS gallery_images_media_type_check;

ALTER TABLE public.gallery_images
ADD CONSTRAINT gallery_images_media_type_check
CHECK (media_type IN ('image', 'video'));