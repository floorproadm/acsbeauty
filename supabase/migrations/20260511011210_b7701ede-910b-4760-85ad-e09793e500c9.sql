-- ============================================
-- 1. Revoke EXECUTE on internal SECURITY DEFINER functions
-- ============================================
-- These are only invoked by triggers (which run as table owner) or by other
-- definer functions. They should never be callable directly by clients.

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_conversation_on_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.rate_limit_quiz_responses() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.expire_old_invites() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_gift_card_purchase() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_contact_submission() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_holds() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.rate_limit_whatsapp_clicks() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.rate_limit_contact_submissions() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_booking_event() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.award_acs_points() FROM anon, authenticated, public;

-- Keep these callable (intentionally exposed):
-- - public.has_role(uuid, app_role)  -> used inside RLS policies
-- - public.check_rate_limit(text, int, int) -> called by edge functions

-- ============================================
-- 2. Restrict listing of public storage buckets
-- ============================================
-- Public file URLs (getPublicUrl) keep working because the storage CDN serves
-- files directly without checking storage.objects RLS. But the LIST API and
-- direct table SELECT will no longer leak the full file list.

-- Drop common broad SELECT policies if present (best-effort by name)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        qual ILIKE '%bucket_id = ''gallery''%'
        OR qual ILIKE '%bucket_id = ''service-images''%'
        OR qual ILIKE '%bucket_id = ''team-photos''%'
        OR qual ILIKE '%bucket_id = ''client-avatars''%'
        OR qual ILIKE '%bucket_id = ''quiz-images''%'
        OR policyname ILIKE '%public%read%'
        OR policyname ILIKE '%anyone%view%'
        OR policyname ILIKE '%public%access%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
  END LOOP;
END $$;

-- Re-create owner-only SELECT for client-avatars (so portal users can list their own)
CREATE POLICY "Clients can list own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-avatars' AND owner = auth.uid());

-- Admins/staff can list any of the managed buckets (for admin UI)
CREATE POLICY "Admins can list managed buckets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('gallery','service-images','team-photos','client-avatars','quiz-images')
  AND (
    public.has_role(auth.uid(), 'admin_owner'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
  )
);

-- Note: public file delivery via getPublicUrl() still works for these buckets
-- because they remain marked as `public = true` on storage.buckets, and the
-- public CDN endpoint bypasses RLS for object download.
