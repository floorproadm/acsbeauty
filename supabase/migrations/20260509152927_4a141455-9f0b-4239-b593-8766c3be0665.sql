DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Admin can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin_owner'));