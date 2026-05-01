-- Adiciona campos para rastrear origem do booking e referência ao hold
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'web';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hold_id uuid;

CREATE INDEX IF NOT EXISTS idx_bookings_status_source
  ON public.bookings(status, source);

COMMENT ON COLUMN public.bookings.source IS 'Origem do booking: web, whatsapp, admin_manual, portal';
COMMENT ON COLUMN public.bookings.hold_id IS 'Referência ao booking_holds.id para limpeza/validação';