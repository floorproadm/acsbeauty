-- Create table for WhatsApp click tracking
CREATE TABLE public.whatsapp_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_path TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  client_id UUID REFERENCES public.clients(id),
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert clicks (anonymous tracking)
CREATE POLICY "Anyone can insert whatsapp clicks"
ON public.whatsapp_clicks
FOR INSERT
WITH CHECK (true);

-- Only admins can view clicks for analysis
CREATE POLICY "Admins can view whatsapp clicks"
ON public.whatsapp_clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- Marketing can also view clicks
CREATE POLICY "Marketing can view whatsapp clicks"
ON public.whatsapp_clicks
FOR SELECT
USING (has_role(auth.uid(), 'marketing'::app_role));