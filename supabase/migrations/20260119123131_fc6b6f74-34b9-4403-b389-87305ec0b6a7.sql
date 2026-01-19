-- Add lead capture fields to whatsapp_clicks
ALTER TABLE public.whatsapp_clicks 
ADD COLUMN client_name text,
ADD COLUMN service_interest text,
ADD COLUMN urgency text,
ADD COLUMN status public.lead_status DEFAULT 'novo';

-- Create index for status filtering
CREATE INDEX idx_whatsapp_clicks_status ON public.whatsapp_clicks(status);

-- Update RLS to allow updates by admins
CREATE POLICY "Admins can update whatsapp clicks" 
ON public.whatsapp_clicks 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can delete whatsapp clicks" 
ON public.whatsapp_clicks 
FOR DELETE 
USING (has_role(auth.uid(), 'admin_owner'::app_role));