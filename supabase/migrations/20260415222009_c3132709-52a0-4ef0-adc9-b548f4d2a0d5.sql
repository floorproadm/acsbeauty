
CREATE TABLE public.booking_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT '24h_before',
  channel TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reminder_type, channel)
);

ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminders"
ON public.booking_reminders
FOR ALL
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

CREATE INDEX idx_booking_reminders_booking ON public.booking_reminders(booking_id);
