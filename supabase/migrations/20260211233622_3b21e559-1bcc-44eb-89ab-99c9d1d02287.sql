
-- Performance indices (P1)
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings (start_time);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_created_at ON public.whatsapp_clicks (created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_status ON public.quiz_responses (status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions (status);

-- Clients phone index (P2)
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);

-- UNIQUE(phone) already exists as clients_phone_unique, skip
