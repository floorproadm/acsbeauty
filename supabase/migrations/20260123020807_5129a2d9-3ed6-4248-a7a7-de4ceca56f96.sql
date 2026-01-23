-- Fix 1: Remove overly permissive SELECT policy on booking_holds
-- The Edge Function uses service role key which bypasses RLS, so public SELECT is not needed

DROP POLICY IF EXISTS "Anyone can view own booking holds" ON public.booking_holds;

-- Create a restrictive policy that only allows users to view their own session's holds
-- Since we don't track session ownership, only admins should view holds directly
-- The Edge Function already handles availability checks with service role