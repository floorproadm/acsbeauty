-- Fix permissive RLS policy for bookings insert
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Clients can create bookings" ON public.bookings;

-- Create a more secure policy that allows anyone to create bookings (for guest booking)
-- but ensures proper validation through the application layer
CREATE POLICY "Anyone can create bookings with valid data" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  client_email IS NOT NULL 
  AND client_name IS NOT NULL 
  AND start_time IS NOT NULL 
  AND end_time IS NOT NULL
);