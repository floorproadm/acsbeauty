ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY[
    'requested'::text,
    'confirmed'::text,
    'completed'::text,
    'cancelled'::text,
    'no_show'::text,
    'whatsapp_pending'::text,
    'expired'::text
  ]));